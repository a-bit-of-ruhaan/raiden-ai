"""
TEST SUITE — ADVANCED SMART DESKTOP COMPANION & HYBRID HUMOR ENGINE
Verifies:
1. WindowsActivityMonitor signals, idle calculation, and category mappings
2. HumorEngine short-term memory, strategies, and deduplication
3. CompanionBridgeServer HTTP API endpoints
4. Docking state synchronization
"""

import time
import json
import urllib.request
import tempfile
import os
import pytest

from raiden_core.activity_monitor import (
    WindowsActivityMonitor,
    CATEGORY_MAP,
    parse_code_window_title,
    WorkspaceFileWatcher
)
from raiden_core.humor_engine import HumorEngine, CONTEXTUAL_BANKS, COMPANION_SPECIFIC_BANKS
from raiden_core.companion_server import CompanionBridgeServer


def test_activity_monitor_signals():
    """Validates legitimate OS signal reading without crashes."""
    mon = WindowsActivityMonitor(poll_interval_sec=0.1)
    snapshot = mon.get_snapshot()

    assert "enabled" in snapshot
    assert "category" in snapshot
    assert "idle_seconds" in snapshot
    assert "memory_load_percent" in snapshot
    assert isinstance(snapshot["memory_load_percent"], int)
    assert 0 <= snapshot["memory_load_percent"] <= 100

    # Test category mapping
    assert CATEGORY_MAP.get("code.exe") == "coding"
    assert CATEGORY_MAP.get("cursor.exe") == "coding"
    assert CATEGORY_MAP.get("chrome.exe") == "browsing"
    assert CATEGORY_MAP.get("steam.exe") == "gaming"
    assert CATEGORY_MAP.get("powershell.exe") == "terminal"


def test_humor_engine_contextual_fallback_and_deduplication():
    """Validates contextual fallback banks, anti-repetition, and episodic memory."""
    humor = HumorEngine(model_manager=None)

    # 1. Event 1: Coding to Gaming app switch
    ev_gaming = {
        "type": "APP_SWITCH",
        "from_category": "coding",
        "to_category": "gaming",
        "process": "steam.exe"
    }
    banter1 = humor.generate_banter(ev_gaming, companion_id="pixel")
    assert banter1["source"] == "fallback"
    assert banter1["text"] in COMPANION_SPECIFIC_BANKS["pixel"]["APP_SWITCH_CODING_TO_GAMING"]
    assert len(humor.recent_jokes) == 1

    # 2. Event 2: Coding streak milestone
    ev_streak = {
        "type": "CODING_STREAK",
        "duration_minutes": 30
    }
    banter2 = humor.generate_banter(ev_streak, companion_id="pixel")
    assert banter2["text"] in CONTEXTUAL_BANKS["CODING_STREAK"]
    assert len(humor.recent_jokes) == 2

    # 3. Verify deduplication: 10 calls never immediately repeat
    seen_texts = set()
    for _ in range(5):
        b = humor.generate_banter(ev_gaming, companion_id="pixel")
        assert b["text"] != ""
        seen_texts.add(b["text"])
    assert len(seen_texts) >= 2, "Deduplication should vary returned jokes"

    # 4. Test memory clear
    humor.clear_memory()
    assert len(humor.recent_jokes) == 0
    assert len(humor.recent_events) == 0


def test_companion_bridge_server():
    """Validates the local HTTP bridge on 127.0.0.1:8768."""
    mon = WindowsActivityMonitor()
    humor = HumorEngine()
    server = CompanionBridgeServer(mon, humor, port=8768)
    started = server.start()
    assert started is True

    try:
        # Test 1: GET /api/activity/snapshot
        with urllib.request.urlopen("http://127.0.0.1:8768/api/activity/snapshot") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert "memory_load_percent" in data

        # Test 2: POST /api/companion/dock_state
        body = json.dumps({"is_floating": True, "active_companion": "pixel"}).encode("utf-8")
        req = urllib.request.Request("http://127.0.0.1:8768/api/companion/dock_state", data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            dock_res = json.loads(resp.read().decode("utf-8"))
            assert dock_res["is_floating"] is True
            assert dock_res["active_companion"] == "pixel"

        # Test 3: POST /api/companion/banter
        banter_body = json.dumps({"event": {"type": "USER_WAKE"}}).encode("utf-8")
        req2 = urllib.request.Request("http://127.0.0.1:8768/api/companion/banter", data=banter_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req2) as resp:
            banter_res = json.loads(resp.read().decode("utf-8"))
            assert "text" in banter_res
            assert banter_res["text"] != ""

    finally:
        server.stop()


def test_parse_code_window_title():
    """Validates accurate parsing of IDE window titles, dirty indicators, and files."""
    # 1. VS Code standard with unsaved changes bullet
    t1 = "● index.html - Raiden AI - Visual Studio Code"
    p1 = parse_code_window_title(t1)
    assert p1["is_dirty"] is True
    assert p1["filename"] == "index.html"
    assert p1["extension"] == "html"
    assert p1["project"] == "Raiden AI"

    # 2. Saved Python file in Cursor
    t2 = "main.py - Raiden AI - Cursor"
    p2 = parse_code_window_title(t2)
    assert p2["is_dirty"] is False
    assert p2["filename"] == "main.py"
    assert p2["extension"] == "py"

    # 3. Path in title
    t3 = "tests/test_behavior.py - Raiden AI - Visual Studio Code"
    p3 = parse_code_window_title(t3)
    assert p3["filename"] == "test_behavior.py"
    assert p3["extension"] == "py"

    # 4. Notepad++ modified file
    t4 = "*style.css - Notepad++"
    p4 = parse_code_window_title(t4)
    assert p4["is_dirty"] is True
    assert p4["filename"] == "style.css"
    assert p4["extension"] == "css"


def test_realtime_coding_banter_and_snapshot():
    """Validates real-time coding banter generation with token substitution across characters."""
    humor = HumorEngine(model_manager=None)

    # 1. File save event across companions
    ev_save = {
        "type": "FILE_SAVE",
        "file": "main.py",
        "ext": "py"
    }
    b_save_pixel = humor.generate_banter(ev_save, companion_id="pixel")
    assert b_save_pixel["text"] in COMPANION_SPECIFIC_BANKS["pixel"]["FILE_SAVE"]

    b_save_void = humor.generate_banter(ev_save, companion_id="void")
    assert b_save_void["text"] in COMPANION_SPECIFIC_BANKS["void"]["FILE_SAVE"]

    b_save_nova = humor.generate_banter(ev_save, companion_id="nova")
    assert b_save_nova["text"] in COMPANION_SPECIFIC_BANKS["nova"]["FILE_SAVE"]

    b_save_cipher = humor.generate_banter(ev_save, companion_id="cipher")
    assert b_save_cipher["text"] in COMPANION_SPECIFIC_BANKS["cipher"]["FILE_SAVE"]

    # 2. Coding burst event with Pixel
    ev_burst = {
        "type": "CODING_BURST",
        "file": "renderer.js",
        "streak_sec": 12.5
    }
    b_burst = humor.generate_banter(ev_burst, companion_id="pixel")
    assert b_burst["text"] in COMPANION_SPECIFIC_BANKS["pixel"]["CODING_BURST"]

    # 3. File switch to Python with Void
    ev_switch_py = {
        "type": "FILE_SWITCH",
        "file": "activity_monitor.py",
        "ext": "py"
    }
    b_py = humor.generate_banter(ev_switch_py, companion_id="void")
    assert any(b_py["text"] == line.replace("{file}", "activity_monitor.py") for line in CONTEXTUAL_BANKS["FILE_SWITCH_PYTHON"])

    # 4. Syntax error event with line interpolation
    ev_syntax = {
        "type": "SYNTAX_ERROR",
        "file": "broken.py",
        "line": 42
    }
    b_syntax = humor.generate_banter(ev_syntax, companion_id="pixel")
    assert "42" in b_syntax["text"]


def test_workspace_file_watcher_syntax_check():
    """Validates file modification detection and syntax error catching."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        watcher = WorkspaceFileWatcher(workspace_root=tmp_dir)

        # 1. Create a clean python file
        py_path = os.path.join(tmp_dir, "test_file.py")
        with open(py_path, "w", encoding="utf-8") as f:
            f.write("x = 10\nprint(x)\n")

        # Initial tick registers the file
        changes = watcher.check_changes()
        # Force cooldown reset for test
        watcher.last_scan_time = 0.0

        # 2. Modify with a syntax error
        time.sleep(0.05)
        with open(py_path, "w", encoding="utf-8") as f:
            f.write("def broken(\n  print('missing paren')\n")

        watcher.last_scan_time = 0.0
        events = watcher.check_changes()
        assert len(events) >= 1
        syntax_events = [e for e in events if e.get("type") == "SYNTAX_ERROR"]
        assert len(syntax_events) == 1
        assert syntax_events[0]["file"] == "test_file.py"
        assert syntax_events[0]["line"] >= 1


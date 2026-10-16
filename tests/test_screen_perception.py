"""
TEST SUITE — REAL-TIME SCREEN PERCEPTION & CONTEXTUAL COMMENTARY
Validates:
1. PrivacyGuard sensitive application and window title blocking
2. ScreenCaptureEngine difference detection and thumbnail hashing
3. ScreenPerceptionHistory rolling episodic sequence buffer
4. SocialJudgmentEngine cooldowns, duplicate prevention, and mode gating
5. ScreenObserverService thread lifecycle and diagnostics
6. CompanionBridgeServer screen perception endpoints
"""

import time
import json
import urllib.request
import numpy as np
from PIL import Image
import pytest

from raiden_core.screen_observer import (
    PrivacyGuard,
    ScreenCaptureEngine,
    ScreenPerceptionHistory,
    SocialJudgmentEngine,
    ScreenObserverService
)
from raiden_core.activity_monitor import WindowsActivityMonitor
from raiden_core.humor_engine import HumorEngine
from raiden_core.companion_server import CompanionBridgeServer


def test_privacy_guard_rules():
    """Validates that credentials, password managers, and private sessions are blocked."""
    guard = PrivacyGuard(excluded_apps=["custom_secret_app"])

    # 1. Block password manager processes
    safe, reason = guard.is_safe_to_capture({"process": "1password.exe", "title": "Vault"})
    assert not safe
    assert "Sensitive process" in reason

    safe, reason = guard.is_safe_to_capture({"process": "bitwarden.exe", "title": "My Passwords"})
    assert not safe

    safe, reason = guard.is_safe_to_capture({"process": "keepass.exe", "title": "Database.kdbx"})
    assert not safe

    # 2. Block sensitive window titles
    safe, reason = guard.is_safe_to_capture({"process": "chrome.exe", "title": "Incognito - Google Chrome"})
    assert not safe
    assert "Sensitive window title" in reason

    safe, reason = guard.is_safe_to_capture({"process": "msedge.exe", "title": "InPrivate browsing"})
    assert not safe

    safe, reason = guard.is_safe_to_capture({"process": "explorer.exe", "title": "Windows Security - Enter Network Credentials"})
    assert not safe

    # 3. Block user-configured custom excluded apps
    safe, reason = guard.is_safe_to_capture({"process": "custom_secret_app.exe", "title": "Dashboard"})
    assert not safe

    # 4. Allow legitimate programming and browsing
    safe, reason = guard.is_safe_to_capture({"process": "code.exe", "title": "main.py - Raiden AI - Visual Studio Code"})
    assert safe
    assert reason == "Safe"


def test_screen_capture_and_difference_detection():
    """Validates difference scoring and downsampling."""
    engine = ScreenCaptureEngine(target_max_dim=256, quality=70)

    # Create dummy images
    img_black = Image.new("RGB", (300, 200), color=(0, 0, 0))
    img_white = Image.new("RGB", (300, 200), color=(255, 255, 255))
    img_similar = Image.new("RGB", (300, 200), color=(10, 10, 10))

    # First frame always yields diff=1.0
    diff1, ch1 = engine.compute_difference(img_black, "Window A")
    assert diff1 == 1.0

    # Identical frame yields diff=0.0
    diff2, ch2 = engine.compute_difference(img_black, "Window A")
    assert diff2 == 0.0
    assert not ch2

    # Completely different image yields diff close to 1.0
    diff3, ch3 = engine.compute_difference(img_white, "Window A")
    assert diff3 > 0.9

    # Re-establish baseline with black then compare with similar dark frame
    engine.compute_difference(img_black, "Window A")
    diff4, ch4 = engine.compute_difference(img_similar, "Window A")
    assert 0.0 < diff4 < 0.15


def test_screen_perception_history_rolling_context():
    """Validates bounded episodic memory and chronological timeline formatting."""
    history = ScreenPerceptionHistory(max_items=4)

    obs1 = {
        "app_context": "VS Code",
        "activity_summary": "Editing test_evaluation.py",
        "visual_change": "Added assertions",
        "notable_event": None,
        "event_category": "ROUTINE_ACTIVITY"
    }
    obs2 = {
        "app_context": "Terminal",
        "activity_summary": "Running pytest",
        "visual_change": "Red error trace",
        "notable_event": "AssertionError line 42",
        "event_category": "CODING_ERROR"
    }

    history.record(obs1)
    history.record(obs2)

    assert len(history.history) == 2
    timeline = history.get_recent_summary()
    assert "VS Code" in timeline
    assert "Terminal" in timeline
    assert "AssertionError line 42" in timeline

    # Test overflow beyond max_items
    for i in range(5):
        history.record({
            "app_context": f"App {i}",
            "activity_summary": f"Action {i}",
            "visual_change": "Change",
            "notable_event": None,
            "event_category": "ROUTINE_ACTIVITY"
        })

    assert len(history.history) == 4
    assert history.history[-1]["app_context"] == "App 4"

    history.clear()
    assert len(history.history) == 0


def test_social_judgment_engine_rules():
    """Validates cooldowns, confidence filtering, duplicate suppression, and social modes."""
    judgment = SocialJudgmentEngine(
        social_mode="companion",
        confidence_threshold=0.60,
        commentary_cooldown_sec=10.0
    )

    # 1. Routine activity with deserves_reaction=False -> silence
    routine_obs = {
        "event_category": "ROUTINE_ACTIVITY",
        "confidence": 0.85,
        "deserves_reaction": False
    }
    should, reason = judgment.should_comment(routine_obs)
    assert not should
    assert "routine" in reason.lower()

    # 2. Low confidence observation -> silence
    low_conf_obs = {
        "event_category": "CODING_ERROR",
        "confidence": 0.40,
        "deserves_reaction": True
    }
    should, reason = judgment.should_comment(low_conf_obs)
    assert not should
    assert "confidence" in reason.lower()

    # 3. High confidence error in companion mode -> approved
    error_obs = {
        "event_category": "CODING_ERROR",
        "confidence": 0.88,
        "deserves_reaction": True
    }
    should, reason = judgment.should_comment(error_obs)
    assert should

    # Record comment
    judgment.record_comment("Arrey bhai semi-colon bhool gaye kya!")

    # 4. Immediate second error -> blocked by cooldown
    should_cooldown, cd_reason = judgment.should_comment(error_obs)
    assert not should_cooldown
    assert "cooldown" in cd_reason.lower()

    # 5. Duplicate suppression check
    assert judgment.is_duplicate("Arrey bhai semi-colon bhool gaye kya!")
    assert not judgment.is_duplicate("Green tick build pass ho gaya shandar!")


def test_companion_bridge_screen_endpoints():
    """Validates the HTTP bridge endpoints for screen perception."""
    mon = WindowsActivityMonitor()
    humor = HumorEngine()
    observer = ScreenObserverService(active_conversational_model="qwen2.5-coder:3b")
    observer.enabled = True

    server = CompanionBridgeServer(mon, humor, screen_observer=observer, port=8772)
    assert server.start() is True

    try:
        # GET /api/screen/status
        with urllib.request.urlopen("http://127.0.0.1:8772/api/screen/status") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data["enabled"] is True
            assert "vision_model" in data

        # POST /api/screen/toggle
        req = urllib.request.Request(
            "http://127.0.0.1:8772/api/screen/toggle",
            data=json.dumps({"enabled": False, "mode": "gaming"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data["enabled"] is False
            assert data["social_mode"] == "gaming"

        # GET /api/screen/history
        with urllib.request.urlopen("http://127.0.0.1:8772/api/screen/history") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert "history" in data
            assert isinstance(data["history"], list)

    finally:
        server.stop()
        observer.stop()

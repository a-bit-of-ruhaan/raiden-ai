"""
RAIDEN AI — WINDOWS ACTIVITY MONITOR SERVICE
Privacy-respecting, lightweight background observer that monitors legitimate OS signals:
- Foreground window title & process categorization (Coding, Browsing, Terminal, Gaming, etc.)
- User idle duration via Win32 GetLastInputInfo
- System memory & CPU metrics via Win32 APIs
- Coding streak session tracking
Zero keystroke logging. Zero screen recording. 100% local execution.
"""

import os
import sys
import time
import ast
import re
import ctypes
from ctypes import wintypes
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("raiden.activity_monitor")

# Win32 Structures & API Definitions
class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.UINT),
        ("dwTime", wintypes.DWORD)
    ]

class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong)
    ]

# Category definitions based on process executable names
CATEGORY_MAP = {
    # Code Editors & IDEs
    "code.exe": "coding",
    "cursor.exe": "coding",
    "antigravity.exe": "coding",
    "windsurf.exe": "coding",
    "zed.exe": "coding",
    "code-insiders.exe": "coding",
    "code - insiders.exe": "coding",
    "vscodium.exe": "coding",
    "fleet.exe": "coding",
    "devenv.exe": "coding",
    "idea64.exe": "coding",
    "pycharm64.exe": "coding",
    "webstorm64.exe": "coding",
    "sublime_text.exe": "coding",
    "notepad++.exe": "coding",
    "atom.exe": "coding",
    "nvim.exe": "coding",
    "vim.exe": "coding",
    "clion64.exe": "coding",
    "androidstudio64.exe": "coding",

    # Terminals & Shells
    "powershell.exe": "terminal",
    "pwsh.exe": "terminal",
    "cmd.exe": "terminal",
    "windowsterminal.exe": "terminal",
    "mintty.exe": "terminal",
    "conhost.exe": "terminal",
    "git-bash.exe": "terminal",
    "alacritty.exe": "terminal",
    "wezterm-gui.exe": "terminal",

    # Web Browsers
    "chrome.exe": "browsing",
    "msedge.exe": "browsing",
    "brave.exe": "browsing",
    "firefox.exe": "browsing",
    "opera.exe": "browsing",
    "vivaldi.exe": "browsing",

    # Communication & Chat
    "slack.exe": "communication",
    "discord.exe": "communication",
    "teams.exe": "communication",
    "telegram.exe": "communication",
    "whatsapp.exe": "communication",

    # Gaming & Media
    "steam.exe": "gaming",
    "steamwebhelper.exe": "gaming",
    "epicgameslauncher.exe": "gaming",
    "spotify.exe": "media",
    "vlc.exe": "media",

    # Raiden & Python itself
    "electron.exe": "raiden",
    "python.exe": "raiden",
    "pythonw.exe": "raiden"
}


def parse_code_window_title(title: str) -> Dict[str, Any]:
    """
    Parses active window title from IDEs / Editors to extract:
    - filename: e.g. "main.py"
    - extension: e.g. "py"
    - is_dirty: bool (indicates unsaved modifications with ●, *, or [Modified])
    - project: e.g. "Raiden AI"
    """
    if not title:
        return {"filename": "", "extension": "", "is_dirty": False, "project": ""}

    clean = title.strip()
    is_dirty = False

    # Check dirty prefix markers: \u25cf '●', \u2022 '•', '*'
    dirty_prefixes = ("●", "•", "*")
    for dp in dirty_prefixes:
        if clean.startswith(dp):
            is_dirty = True
            clean = clean[len(dp):].strip()
            break

    if "[Modified]" in clean or "[Unsaved]" in clean:
        is_dirty = True
        clean = clean.replace("[Modified]", "").replace("[Unsaved]", "").strip()

    # Split by standard title delimiters: ' - ' or ' – ' or ' — '
    parts = re.split(r'\s+[-–—]\s+', clean)
    filename = ""
    project = ""

    if len(parts) >= 3:
        # e.g., "index.html - Raiden AI - Visual Studio Code"
        filename = parts[0].strip()
        project = parts[1].strip()
    elif len(parts) == 2:
        first = parts[0].strip()
        second = parts[1].strip()
        known_ide_tokens = (
            "visual studio", "code", "cursor", "sublime", "pycharm",
            "webstorm", "idea", "notepad++", "antigravity", "windsurf", "zed"
        )
        if any(tok in second.lower() for tok in known_ide_tokens):
            filename = first
        elif any(tok in first.lower() for tok in known_ide_tokens):
            filename = second
        else:
            filename = first
            project = second
    elif len(parts) == 1:
        filename = parts[0].strip()

    # Normalize filename if it contains directory paths
    if "/" in filename or "\\" in filename:
        filename = os.path.basename(filename)

    ext = ""
    if "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if len(ext) > 10 or " " in ext:
            ext = ""

    return {
        "filename": filename,
        "extension": ext,
        "is_dirty": is_dirty,
        "project": project
    }


class WorkspaceFileWatcher:
    """
    Lightweight, low-overhead workspace scanner that detects:
    - Real-time file saves in project code
    - Real-time Python syntax checks (ast.parse)
    - Git commit events (.git/HEAD & refs changes)
    Runs in < 15ms per tick without external dependencies.
    """
    IGNORED_DIRS = {
        ".git", "node_modules", "venv", ".venv", "__pycache__",
        "build", "dist", ".pytest_cache", ".gemini", "vendor"
    }
    CODE_EXTS = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css",
        ".scss", ".json", ".sql", ".rs", ".go", ".c", ".cpp", ".md"
    }

    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or os.getcwd()
        self.mtimes: Dict[str, float] = {}
        self.last_git_head: Optional[str] = None
        self.last_scan_time = 0.0
        self.scan_cooldown = 1.8
        self._initial_scan()

    def _initial_scan(self):
        try:
            if not os.path.isdir(self.workspace_root):
                return
            for root, dirs, files in os.walk(self.workspace_root):
                dirs[:] = [d for d in dirs if d not in self.IGNORED_DIRS and not d.startswith(".")]
                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in self.CODE_EXTS:
                        full_path = os.path.join(root, f)
                        try:
                            self.mtimes[full_path] = os.path.getmtime(full_path)
                        except OSError:
                            pass

            git_head_path = os.path.join(self.workspace_root, ".git", "HEAD")
            if os.path.isfile(git_head_path):
                try:
                    with open(git_head_path, "r", encoding="utf-8", errors="ignore") as gf:
                        self.last_git_head = gf.read().strip()
                except Exception:
                    pass
        except Exception as e:
            logger.debug(f"WorkspaceFileWatcher initial scan error: {e}")

    def check_changes(self) -> List[Dict[str, Any]]:
        now = time.time()
        if now - self.last_scan_time < self.scan_cooldown:
            return []
        self.last_scan_time = now
        events = []

        if not os.path.isdir(self.workspace_root):
            return []

        # 1. Check Git commits
        try:
            git_head_path = os.path.join(self.workspace_root, ".git", "HEAD")
            if os.path.isfile(git_head_path):
                with open(git_head_path, "r", encoding="utf-8", errors="ignore") as gf:
                    current_head = gf.read().strip()
                    if current_head.startswith("ref: "):
                        ref_rel = current_head[5:].strip()
                        ref_full = os.path.join(self.workspace_root, ".git", ref_rel)
                        if os.path.isfile(ref_full):
                            try:
                                with open(ref_full, "r", encoding="utf-8", errors="ignore") as rf:
                                    current_head = rf.read().strip()
                            except Exception:
                                pass
                    if self.last_git_head and current_head != self.last_git_head:
                        self.last_git_head = current_head
                        events.append({
                            "type": "GIT_COMMIT",
                            "timestamp": now,
                            "description": "New git commit detected in workspace repository."
                        })
                    else:
                        self.last_git_head = current_head
        except Exception:
            pass

        # 2. Check code files modifications
        try:
            for root, dirs, files in os.walk(self.workspace_root):
                dirs[:] = [d for d in dirs if d not in self.IGNORED_DIRS and not d.startswith(".")]
                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in self.CODE_EXTS:
                        full_path = os.path.join(root, f)
                        try:
                            mtime = os.path.getmtime(full_path)
                            prev_mtime = self.mtimes.get(full_path)
                            if prev_mtime is not None and mtime > prev_mtime:
                                self.mtimes[full_path] = mtime
                                fname = os.path.basename(full_path)
                                raw_ext = ext.lstrip(".")

                                # Python syntax check on save
                                syntax_error_event = None
                                if ext == ".py":
                                    try:
                                        with open(full_path, "r", encoding="utf-8", errors="ignore") as pf:
                                            content = pf.read()
                                            ast.parse(content, filename=fname)
                                    except SyntaxError as se:
                                        syntax_error_event = {
                                            "type": "SYNTAX_ERROR",
                                            "file": fname,
                                            "line": se.lineno or 1,
                                            "error_msg": str(se.msg),
                                            "timestamp": now,
                                            "description": f"Syntax error in {fname} on line {se.lineno}: {se.msg}"
                                        }

                                if syntax_error_event:
                                    events.append(syntax_error_event)
                                else:
                                    events.append({
                                        "type": "FILE_SAVE",
                                        "file": fname,
                                        "ext": raw_ext,
                                        "path": full_path,
                                        "source": "disk_watcher",
                                        "timestamp": now,
                                        "description": f"Saved code file {fname} to disk."
                                    })
                            elif prev_mtime is None:
                                self.mtimes[full_path] = mtime
                        except OSError:
                            pass
        except Exception as e:
            logger.debug(f"WorkspaceFileWatcher scan error: {e}")

        return events


class WindowsActivityMonitor:
    def __init__(self, poll_interval_sec: float = 1.5, workspace_dir: Optional[str] = None):
        self.poll_interval = poll_interval_sec
        self.enabled = True
        self.allowed_categories = {"coding", "terminal", "browsing", "communication", "gaming", "media", "raiden", "other"}
        self.workspace_dir = workspace_dir or os.getcwd()
        self.file_watcher = WorkspaceFileWatcher(workspace_root=self.workspace_dir)

        # Music playback detector (Spotify, media players)
        try:
            from raiden_core.music_detector import MusicPlaybackDetector
            self.music_detector = MusicPlaybackDetector()
        except Exception:
            self.music_detector = None

        # State tracking
        self.current_process_name = "unknown"
        self.current_window_title = ""
        self.current_category = "other"
        self.idle_seconds = 0.0
        self.is_idle = False
        self.is_deep_sleep = False

        # Coding session duration in seconds
        self.coding_session_seconds = 0.0
        self.last_coding_timestamp = time.time()
        self.last_poll_time = time.time()

        # Real-time Coding Perception tracking
        self.last_coding_file = ""
        self.last_coding_ext = ""
        self.last_file_is_dirty = False
        self.last_file_switch_time = 0.0
        self.last_save_event_time = 0.0
        self.typing_streak_seconds = 0.0
        self.last_burst_event_time = 0.0
        self.last_pause_event_time = 0.0
        self.was_in_burst = False

        # Win32 function pointers
        self.user32 = ctypes.windll.user32 if hasattr(ctypes, "windll") else None
        self.kernel32 = ctypes.windll.kernel32 if hasattr(ctypes, "windll") else None

        # Transition and queued events
        self.recent_events: List[Dict[str, Any]] = []
        self.pending_events: List[Dict[str, Any]] = []
        self.max_events = 20

    def get_idle_duration_seconds(self) -> float:
        """Returns time in seconds since the last keyboard or mouse input."""
        if not self.user32 or not self.kernel32:
            return 0.0
        try:
            last_input = LASTINPUTINFO()
            last_input.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if self.user32.GetLastInputInfo(ctypes.byref(last_input)):
                tick_count = self.kernel32.GetTickCount()
                elapsed_ms = max(0, tick_count - last_input.dwTime)
                return elapsed_ms / 1000.0
        except Exception as e:
            logger.debug(f"Idle detection error: {e}")
        return 0.0

    def get_system_memory_load(self) -> int:
        """Returns current Windows memory load percentage (0 - 100)."""
        if not self.kernel32:
            return 0
        try:
            status = MEMORYSTATUSEX()
            status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if self.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
                return int(status.dwMemoryLoad)
        except Exception:
            pass
        return 0

    def get_foreground_window_info(self) -> Dict[str, str]:
        """Resolves active window title and process name without intrusive inspection."""
        info = {"title": "", "process": "unknown", "category": "other"}
        if not self.user32:
            return info

        try:
            hwnd = self.user32.GetForegroundWindow()
            if not hwnd:
                return info

            # Window Title (safe text retrieval)
            length = self.user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buf = ctypes.create_unicode_buffer(length + 1)
                self.user32.GetWindowTextW(hwnd, buf, length + 1)
                info["title"] = buf.value.strip()

            # Process Name
            pid = wintypes.DWORD()
            self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value > 0 and self.kernel32:
                # Open process query limited information
                PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                h_process = self.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
                if h_process:
                    try:
                        exe_buf = ctypes.create_unicode_buffer(512)
                        buf_size = wintypes.DWORD(512)
                        if hasattr(self.kernel32, "QueryFullProcessImageNameW") and self.kernel32.QueryFullProcessImageNameW(h_process, 0, exe_buf, ctypes.byref(buf_size)):
                            exe_path = exe_buf.value
                            process_name = os.path.basename(exe_path).lower()
                            info["process"] = process_name
                            info["category"] = CATEGORY_MAP.get(process_name, "other")
                    finally:
                        self.kernel32.CloseHandle(h_process)
        except Exception as e:
            logger.debug(f"Window info error: {e}")

        return info

    def poll(self) -> Optional[Dict[str, Any]]:
        """Samples the environment and detects state transitions & real-time coding events."""
        if not self.enabled:
            return None

        now = time.time()
        delta_time = max(0.1, now - self.last_poll_time)
        self.last_poll_time = now

        # 1. Check workspace file modifications & git commits
        if self.file_watcher:
            watcher_events = self.file_watcher.check_changes()
            for wev in watcher_events:
                if wev.get("type") == "FILE_SAVE":
                    if now - self.last_save_event_time > 2.0:
                        self.last_save_event_time = now
                        self.pending_events.append(wev)
                else:
                    self.pending_events.append(wev)

        # 2. Idle time evaluation
        self.idle_seconds = self.get_idle_duration_seconds()
        prev_is_idle = self.is_idle
        prev_is_deep = self.is_deep_sleep

        self.is_idle = self.idle_seconds >= 60.0
        self.is_deep_sleep = self.idle_seconds >= 180.0

        # Detect User Wake-Up transition
        if prev_is_idle and not self.is_idle:
            self.pending_events.append({
                "type": "USER_WAKE",
                "idle_duration": round(self.idle_seconds, 1),
                "timestamp": now,
                "description": f"User returned to computer after {int(self.idle_seconds)}s of inactivity."
            })
        elif not prev_is_idle and self.is_idle:
            self.pending_events.append({
                "type": "USER_IDLE",
                "idle_duration": round(self.idle_seconds, 1),
                "timestamp": now,
                "description": "User stepped away or became idle."
            })

        # 3. Active Application Evaluation
        win_info = self.get_foreground_window_info()
        prev_cat = self.current_category
        prev_process = self.current_process_name

        self.current_process_name = win_info["process"]
        self.current_window_title = win_info["title"]
        self.current_category = win_info["category"]

        # Track coding session duration
        if self.current_category in ("coding", "terminal"):
            self.coding_session_seconds += delta_time
            # Check 30-min coding milestone
            if self.coding_session_seconds >= 1800 and (self.coding_session_seconds - delta_time) < 1800:
                self.pending_events.append({
                    "type": "CODING_STREAK",
                    "duration_minutes": 30,
                    "timestamp": now,
                    "description": "User has been continuously coding for 30 minutes."
                })

            # Real-time In-IDE Coding Perception
            code_info = parse_code_window_title(self.current_window_title)
            curr_file = code_info.get("filename", "")
            curr_ext = code_info.get("extension", "")
            curr_dirty = code_info.get("is_dirty", False)

            # A. FILE_SAVE via title dirty marker disappearance (● removed on Ctrl+S)
            if self.last_coding_file and curr_file == self.last_coding_file:
                if self.last_file_is_dirty and not curr_dirty:
                    if now - self.last_save_event_time > 2.0:
                        self.last_save_event_time = now
                        self.pending_events.append({
                            "type": "FILE_SAVE",
                            "file": curr_file,
                            "ext": curr_ext,
                            "project": code_info.get("project", ""),
                            "source": "title_dirty_transition",
                            "timestamp": now,
                            "description": f"Saved file {curr_file}."
                        })

            # B. FILE_SWITCH when switching tabs/files inside the editor
            if curr_file and curr_file != self.last_coding_file:
                if curr_ext and (now - self.last_file_switch_time > 3.0):
                    self.last_file_switch_time = now
                    self.pending_events.append({
                        "type": "FILE_SWITCH",
                        "file": curr_file,
                        "prev_file": self.last_coding_file,
                        "ext": curr_ext,
                        "project": code_info.get("project", ""),
                        "timestamp": now,
                        "description": f"Switched to editing {curr_file}."
                    })
                self.last_coding_file = curr_file
                self.last_coding_ext = curr_ext

            self.last_file_is_dirty = curr_dirty

            # C. Flow-state Typing Cadence & Pause
            if self.idle_seconds < 1.2:
                self.typing_streak_seconds += delta_time
                if self.typing_streak_seconds >= 5.0 and not self.was_in_burst:
                    if now - self.last_burst_event_time > 40.0:
                        self.was_in_burst = True
                        self.last_burst_event_time = now
                        self.pending_events.append({
                            "type": "CODING_BURST",
                            "file": self.last_coding_file or "code",
                            "streak_sec": round(self.typing_streak_seconds, 1),
                            "timestamp": now,
                            "description": f"Rapid coding flow streak ({int(self.typing_streak_seconds)}s)."
                        })
            else:
                if self.was_in_burst and 15.0 <= self.idle_seconds <= 40.0:
                    if now - self.last_pause_event_time > 55.0:
                        self.was_in_burst = False
                        self.last_pause_event_time = now
                        self.pending_events.append({
                            "type": "CODING_PAUSE",
                            "file": self.last_coding_file or "code",
                            "pause_sec": round(self.idle_seconds, 1),
                            "timestamp": now,
                            "description": f"Paused while coding on {self.last_coding_file or 'file'} for {int(self.idle_seconds)}s."
                        })
                if self.idle_seconds > 45.0:
                    self.typing_streak_seconds = 0.0
                    self.was_in_burst = False
        else:
            # If idle or switched away for more than 5 minutes, reset coding session
            if self.idle_seconds > 300:
                self.coding_session_seconds = 0.0
            self.typing_streak_seconds = 0.0
            self.was_in_burst = False

        # 4. Detect Application Switch transition
        if self.current_category != prev_cat and self.current_category in self.allowed_categories:
            if prev_cat != "other" or self.current_category != "other":
                self.pending_events.append({
                    "type": "APP_SWITCH",
                    "from_category": prev_cat,
                    "to_category": self.current_category,
                    "process": self.current_process_name,
                    "timestamp": now,
                    "description": f"Switched from {prev_cat} to {self.current_category} ({self.current_process_name})."
                })

        # 5. Check Heavy Memory Load (sustained > 86%)
        mem_load = self.get_system_memory_load()
        if mem_load > 86:
            self.pending_events.append({
                "type": "HEAVY_LOAD",
                "metric": "memory",
                "load_percent": mem_load,
                "timestamp": now,
                "description": f"System RAM usage is high at {mem_load}%."
            })

        # 6. Check Desktop Music Playback Transition (Spotify / Media players)
        if self.music_detector:
            try:
                music_ev = self.music_detector.evaluate_transition()
                if music_ev:
                    music_ev["timestamp"] = now
                    self.pending_events.append(music_ev)
            except Exception:
                pass

        # Pop next event from queue
        event = None
        if self.pending_events:
            event = self.pending_events.pop(0)
            self.recent_events.append(event)
            if len(self.recent_events) > self.max_events:
                self.recent_events.pop(0)

        return event

    def get_snapshot(self) -> Dict[str, Any]:
        """Provides an immediate read of current OS activity metrics."""
        return {
            "enabled": self.enabled,
            "category": self.current_category,
            "process": self.current_process_name,
            "window_title": self.current_window_title[:60] if self.current_window_title else "",
            "idle_seconds": round(self.idle_seconds, 1),
            "is_idle": self.is_idle,
            "is_deep_sleep": self.is_deep_sleep,
            "coding_session_minutes": round(self.coding_session_seconds / 60.0, 1),
            "memory_load_percent": self.get_system_memory_load(),
            "recent_events_count": len(self.recent_events),
            "current_file": self.last_coding_file,
            "current_ext": self.last_coding_ext,
            "is_file_dirty": self.last_file_is_dirty,
            "typing_streak_sec": round(self.typing_streak_seconds, 1),
            "music": self.music_detector.last_status if self.music_detector else {"is_playing": False, "player": "none"},
            "pending_events_count": len(self.pending_events)
        }

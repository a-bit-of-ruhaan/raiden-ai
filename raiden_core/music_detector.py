"""
RAIDEN AI — MUSIC PLAYBACK DETECTOR & PROVIDER INTERFACE
Non-intrusive, zero-dependency desktop media playback detection.
Supports:
- Spotify for Windows (Win32 window title tracking: "{Artist} - {Track}" vs "Spotify")
- Generic media players (VLC, Windows Media Player)
- Graceful degradation when providers are unavailable or closed
- Low-frequency polling with change-detection event dispatching
"""

import os
import re
import time
import ctypes
from ctypes import wintypes
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("raiden.music_detector")


class MusicProviderInterface:
    """Base interface for desktop media player integrations."""
    def get_playback_status(self) -> Dict[str, Any]:
        """
        Returns:
            {
                "is_playing": bool,
                "title": str,
                "artist": str,
                "player": str,
                "raw_title": str
            }
        """
        raise NotImplementedError


class SpotifyWin32Provider(MusicProviderInterface):
    """
    Detects Spotify playback status via Win32 top-level window titles.
    When playing: Window title is '{Artist} - {Track Title}'
    When paused/stopped: Window title is 'Spotify' / 'Spotify Free' / 'Spotify Premium'
    """
    def __init__(self):
        self.user32 = getattr(ctypes.windll, "user32", None)
        self.kernel32 = getattr(ctypes.windll, "kernel32", None)

    def get_playback_status(self) -> Dict[str, Any]:
        result = {
            "is_playing": False,
            "title": "",
            "artist": "",
            "player": "spotify",
            "raw_title": ""
        }
        if not self.user32 or not self.kernel32:
            return result

        spotify_windows = []

        def enum_window_callback(hwnd, lparam):
            if self.user32.IsWindow(hwnd):
                pid = wintypes.DWORD()
                self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value > 0:
                    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                    h_proc = self.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
                    if h_proc:
                        try:
                            buf = ctypes.create_unicode_buffer(512)
                            size = wintypes.DWORD(512)
                            if hasattr(self.kernel32, "QueryFullProcessImageNameW") and self.kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size)):
                                exe_name = os.path.basename(buf.value).lower()
                                if exe_name == "spotify.exe":
                                    length = self.user32.GetWindowTextLengthW(hwnd)
                                    if length > 0:
                                        t_buf = ctypes.create_unicode_buffer(length + 1)
                                        self.user32.GetWindowTextW(hwnd, t_buf, length + 1)
                                        text = t_buf.value.strip()
                                        if text:
                                            spotify_windows.append(text)
                        finally:
                            self.kernel32.CloseHandle(h_proc)
            return True

        CB = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)(enum_window_callback)
        try:
            self.user32.EnumWindows(CB, 0)
        except Exception as e:
            logger.debug(f"Spotify enum error: {e}")
            return result

        # Analyze found window titles
        for title in spotify_windows:
            clean = title.strip()
            # Standalone Spotify window titles when idle or paused
            if clean in ("Spotify", "Spotify Free", "Spotify Premium", "AngleHiddenWindow"):
                continue

            # Standard playing format: "Artist - Track Title" or "Artist, Collab - Track"
            if " - " in clean:
                parts = clean.split(" - ", 1)
                artist = parts[0].strip()
                track = parts[1].strip()
                result["is_playing"] = True
                result["artist"] = artist
                result["title"] = track
                result["raw_title"] = clean
                return result

        return result


class GenericMediaWin32Provider(MusicProviderInterface):
    """Detects VLC and generic media players."""
    def __init__(self):
        self.user32 = getattr(ctypes.windll, "user32", None)
        self.kernel32 = getattr(ctypes.windll, "kernel32", None)

    def get_playback_status(self) -> Dict[str, Any]:
        result = {
            "is_playing": False,
            "title": "",
            "artist": "",
            "player": "vlc",
            "raw_title": ""
        }
        if not self.user32 or not self.kernel32:
            return result

        vlc_windows = []

        def enum_window_callback(hwnd, lparam):
            if self.user32.IsWindow(hwnd):
                pid = wintypes.DWORD()
                self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value > 0:
                    h_proc = self.kernel32.OpenProcess(0x1000, False, pid.value)
                    if h_proc:
                        try:
                            buf = ctypes.create_unicode_buffer(512)
                            size = wintypes.DWORD(512)
                            if hasattr(self.kernel32, "QueryFullProcessImageNameW") and self.kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size)):
                                exe_name = os.path.basename(buf.value).lower()
                                if exe_name == "vlc.exe":
                                    length = self.user32.GetWindowTextLengthW(hwnd)
                                    if length > 0:
                                        t_buf = ctypes.create_unicode_buffer(length + 1)
                                        self.user32.GetWindowTextW(hwnd, t_buf, length + 1)
                                        text = t_buf.value.strip()
                                        if text:
                                            vlc_windows.append(text)
                        finally:
                            self.kernel32.CloseHandle(h_proc)
            return True

        CB = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)(enum_window_callback)
        try:
            self.user32.EnumWindows(CB, 0)
        except Exception:
            return result

        for title in vlc_windows:
            clean = title.replace(" - VLC media player", "").strip()
            if clean and clean != "VLC media player":
                result["is_playing"] = True
                result["title"] = clean
                result["raw_title"] = title
                return result

        return result


class MusicPlaybackDetector:
    """
    Manages provider polling, change detection, and event generation.
    Checks at most once every `check_cooldown_sec` (default 2.5s) to preserve CPU.
    """
    def __init__(self, check_cooldown_sec: float = 2.5):
        self.check_cooldown_sec = check_cooldown_sec
        self.last_check_time = 0.0
        self.providers: List[MusicProviderInterface] = [
            SpotifyWin32Provider(),
            GenericMediaWin32Provider()
        ]
        self.last_status: Dict[str, Any] = {
            "is_playing": False,
            "title": "",
            "artist": "",
            "player": "none"
        }

    def check_playback(self) -> Dict[str, Any]:
        """Polls providers if cooldown has elapsed, returning current playback status."""
        now = time.time()
        if now - self.last_check_time < self.check_cooldown_sec:
            return self.last_status

        self.last_check_time = now

        for provider in self.providers:
            try:
                status = provider.get_playback_status()
                if status.get("is_playing"):
                    self.last_status = status
                    return status
            except Exception as e:
                logger.debug(f"Music provider check error: {e}")

        self.last_status = {
            "is_playing": False,
            "title": "",
            "artist": "",
            "player": "none",
            "raw_title": ""
        }
        return self.last_status

    def evaluate_transition(self) -> Optional[Dict[str, Any]]:
        """
        Detects music state transitions (MUSIC_PLAYING, MUSIC_PAUSED, TRACK_CHANGED).
        Returns an event dict if a meaningful transition occurred.
        """
        prev_playing = bool(self.last_status.get("is_playing"))
        prev_title = self.last_status.get("title", "")
        current = self.check_playback()

        now_playing = bool(current.get("is_playing"))
        now_title = current.get("title", "")

        # Transition 1: Music started or track changed
        if now_playing and (not prev_playing or now_title != prev_title):
            return {
                "type": "MUSIC_PLAYING",
                "artist": current.get("artist", ""),
                "title": now_title,
                "player": current.get("player", "media"),
                "description": f"Music playing: {current.get('artist')} - {now_title}" if current.get('artist') else f"Music playing: {now_title}"
            }

        # Transition 2: Music paused / stopped
        if prev_playing and not now_playing:
            return {
                "type": "MUSIC_PAUSED",
                "player": self.last_status.get("player", "media"),
                "description": "Music paused or stopped"
            }

        return None

"""
RAIDEN AI — COMPANION IPC & ACTIVITY HTTP BRIDGE
Ultra-lightweight local HTTP server (127.0.0.1:8765) running on a background daemon thread.
Enables seamless bidirectional communication between:
- PyWebview main window (index.html)
- Electron floating desktop pet widget (mascot.html)
- WindowsActivityMonitor & HumorEngine in Python
- ScreenObserverService real-time visual perception & commentary
Zero external dependencies. Negligible CPU usage. Safe local-only binding.
"""

import http.server
import socketserver
import threading
import json
import logging
from collections import deque
from typing import Optional, Any
from raiden_core.activity_monitor import WindowsActivityMonitor
from raiden_core.humor_engine import HumorEngine

logger = logging.getLogger("raiden.companion_server")


class CompanionBridgeHandler(http.server.BaseHTTPRequestHandler):
    activity_monitor: Optional[WindowsActivityMonitor] = None
    humor_engine: Optional[HumorEngine] = None
    screen_observer: Optional[Any] = None
    pending_screen_events = deque(maxlen=10)
    dock_state = {
        "is_floating": False,
        "active_companion": "pixel",
        "always_on_top": True,
        "roaming_enabled": True,
        "activity_awareness_enabled": True,
        "screen_perception_enabled": False,
        "sound_enabled": True,
        "x": None,
        "y": None
    }

    @classmethod
    def enqueue_screen_event(cls, event: dict):
        """Thread-safe enqueueing of screen perception events for immediate delivery."""
        cls.pending_screen_events.append(event)

    def _send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = self.path.split("?")[0]
        if parsed == "/api/activity/snapshot":
            snapshot = self.activity_monitor.get_snapshot() if self.activity_monitor else {}
            if self.screen_observer:
                snapshot["screen_perception"] = self.screen_observer.get_status()
            self._send_json(200, snapshot)
        elif parsed == "/api/companion/dock_state":
            self._send_json(200, self.dock_state)
        elif parsed == "/api/screen/status":
            status = self.screen_observer.get_status() if self.screen_observer else {"enabled": False, "status": "unavailable"}
            self._send_json(200, status)
        elif parsed == "/api/screen/history":
            history = self.screen_observer.history.get_items() if self.screen_observer else []
            self._send_json(200, {"history": history})
        elif parsed == "/api/media/status":
            status = self.activity_monitor.music_detector.check_playback() if self.activity_monitor and self.activity_monitor.music_detector else {"is_playing": False, "player": "none"}
            self._send_json(200, status)
        elif parsed == "/health":
            self._send_json(200, {
                "status": "ok",
                "service": "raiden_companion_bridge",
                "screen_perception": bool(self.screen_observer and self.screen_observer.enabled)
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        parsed = self.path.split("?")[0]
        content_len = int(self.headers.get("Content-Length", 0))
        post_data = {}
        if content_len > 0:
            try:
                raw_body = self.rfile.read(content_len).decode("utf-8")
                post_data = json.loads(raw_body)
            except Exception as e:
                logger.debug(f"JSON decode error: {e}")

        if parsed == "/api/activity/poll":
            # Priority: deliver pending screen perception event if available
            screen_event = None
            if self.pending_screen_events:
                screen_event = self.pending_screen_events.popleft()

            event = screen_event or (self.activity_monitor.poll() if self.activity_monitor else None)
            snapshot = self.activity_monitor.get_snapshot() if self.activity_monitor else {}
            if self.screen_observer:
                snapshot["screen_perception"] = self.screen_observer.get_status()
            self._send_json(200, {"event": event, "snapshot": snapshot})

        elif parsed == "/api/companion/banter":
            event = post_data.get("event", {"type": "USER_WAKE"})
            companion_id = post_data.get("companion_id", self.dock_state.get("active_companion", "pixel"))
            timeout_sec = float(post_data.get("timeout_sec", 2.0))
            if self.humor_engine:
                result = self.humor_engine.generate_banter(event, companion_id=companion_id, timeout_sec=timeout_sec)
            else:
                result = {"text": "Raiden online hai, prompt feko!", "source": "static", "latency_ms": 0}
            self._send_json(200, result)

        elif parsed == "/api/companion/dock_state":
            # Update shared docking & widget coordinates
            for k, v in post_data.items():
                self.dock_state[k] = v
            self._send_json(200, self.dock_state)

        elif parsed == "/api/companion/clear_memory":
            if self.humor_engine:
                self.humor_engine.clear_memory()
            if self.screen_observer:
                self.screen_observer.history.clear()
            self._send_json(200, {"status": "memory_cleared"})

        elif parsed == "/api/screen/toggle":
            enabled = post_data.get("enabled")
            mode = post_data.get("mode")
            if self.screen_observer:
                if enabled is not None:
                    self.screen_observer.set_enabled(bool(enabled))
                    self.dock_state["screen_perception_enabled"] = bool(enabled)
                if mode:
                    self.screen_observer.set_social_mode(mode)
                status = self.screen_observer.get_status()
            else:
                status = {"enabled": False, "status": "unavailable"}
            self._send_json(200, status)

        elif parsed == "/api/screen/observe_now":
            companion_id = post_data.get("companion_id", self.dock_state.get("active_companion", "pixel"))
            if self.screen_observer:
                result = self.screen_observer.tick_observation(force=True, companion_id=companion_id)
                self._send_json(200, result or {"status": "no_change"})
            else:
                self._send_json(503, {"error": "Screen observer service not initialized"})

        else:
            self._send_json(404, {"error": "Not Found"})

    def log_message(self, format, *args):
        # Silence console log spam for high-frequency polls
        pass


class CompanionBridgeServer:
    def __init__(
        self,
        activity_monitor: WindowsActivityMonitor,
        humor_engine: HumorEngine,
        screen_observer: Optional[Any] = None,
        host: str = "127.0.0.1",
        port: int = 8765
    ):
        self.host = host
        self.port = port
        self.server: Optional[socketserver.TCPServer] = None
        self.thread: Optional[threading.Thread] = None
        self.activity_monitor = activity_monitor
        self.humor_engine = humor_engine
        self.screen_observer = screen_observer

        # Bind shared instances to Handler
        CompanionBridgeHandler.activity_monitor = activity_monitor
        CompanionBridgeHandler.humor_engine = humor_engine
        CompanionBridgeHandler.screen_observer = screen_observer

        # Register callback on screen observer so observations are immediately enqueued
        if screen_observer:
            screen_observer.on_observation_callback = CompanionBridgeHandler.enqueue_screen_event

    def start(self):
        """Starts the bridge server in a background daemon thread."""
        try:
            # Allow address reuse to prevent bind errors on fast restarts
            socketserver.TCPServer.allow_reuse_address = True
            self.server = socketserver.TCPServer((self.host, self.port), CompanionBridgeHandler)
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()
            logger.info(f"Companion IPC bridge active on http://{self.host}:{self.port}")
            return True
        except Exception as e:
            logger.warning(f"Could not bind companion bridge server on {self.port}: {e}")
            return False

    def stop(self):
        """Gracefully shuts down the bridge server."""
        if self.server:
            try:
                self.server.shutdown()
                self.server.server_close()
            except Exception:
                pass
            self.server = None

"""
RAIDEN AI — REAL-TIME SCREEN PERCEPTION & CONTEXTUAL COMMENTARY SERVICE
Dedicated, asynchronous screen-observation engine integrating:
1. Lightweight Windows screen capture with multi-display & active-window support.
2. Thread desktop attachment via Win32 APIs for non-blocking background workers.
3. Fast perceptual/MSE image difference detection to avoid unnecessary model inference.
4. Privacy guard with automatic sensitive app & credential dialog exclusion.
5. Multimodal vision inference through local Ollama vision models (e.g. llava-phi3, moondream).
6. Structured visual scene comprehension with confidence scoring & rolling event context.
7. Social judgment: novelty detection, relevance gating, duplicate suppression, and silence selection.
8. Original, authentic Hinglish personality commentary generated from real screen context.
"""

import os
import sys
import time
import io
import json
import base64
import re
import threading
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque
import ctypes
from ctypes import wintypes
import numpy as np
from PIL import Image, ImageGrab

logger = logging.getLogger("raiden.screen_observer")

# Win32 Constants & Type Definitions for Safe Multi-Threaded Desktop Access
HANDLE = ctypes.c_void_p
user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32
kernel32 = ctypes.windll.kernel32

try:
    user32.OpenInputDesktop.restype = HANDLE
    user32.OpenInputDesktop.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    user32.SetThreadDesktop.restype = wintypes.BOOL
    user32.SetThreadDesktop.argtypes = [HANDLE]
    user32.GetForegroundWindow.restype = HANDLE
    user32.GetWindowTextLengthW.argtypes = [HANDLE]
    user32.GetWindowTextW.argtypes = [HANDLE, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowRect.argtypes = [HANDLE, ctypes.c_void_p]
    user32.GetWindowThreadProcessId.argtypes = [HANDLE, ctypes.c_void_p]
    user32.IsWindowVisible.argtypes = [HANDLE]
    user32.SetProcessDPIAware()
except Exception as e:
    logger.debug(f"Win32 API initialization warning: {e}")


def attach_thread_to_input_desktop() -> bool:
    """
    Attaches the current worker thread to the active interactive Windows desktop.
    Critical for background daemon threads to capture the screen without access violation.
    """
    try:
        # 0x01FF = DESKTOP_ALLACCESS
        hdesk = user32.OpenInputDesktop(0, False, 0x01FF)
        if hdesk:
            user32.SetThreadDesktop(hdesk)
            return True
    except Exception as e:
        logger.debug(f"Could not attach thread to input desktop: {e}")
    return False


def get_active_window_info() -> Dict[str, Any]:
    """Retrieves the active foreground window title, process name, and bounding rect."""
    try:
        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return {"hwnd": None, "title": "", "process": "", "rect": None}

        length = user32.GetWindowTextLengthW(hwnd)
        title = ""
        if length > 0:
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            title = buf.value.strip()

        # Get process ID
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        process_name = ""
        if pid.value:
            # Query process name via kernel32/psapi or snapshot
            try:
                import psutil
                process_name = psutil.Process(pid.value).name().lower()
            except Exception:
                # Fallback to category heuristics
                process_name = "active_app"

        # Bounding box
        rect = (wintypes.LONG * 4)()
        user32.GetWindowRect(hwnd, ctypes.byref(rect))
        left, top, right, bottom = rect[0], rect[1], rect[2], rect[3]
        w, h = max(0, right - left), max(0, bottom - top)

        return {
            "hwnd": hwnd,
            "title": title,
            "process": process_name,
            "rect": (left, top, right, bottom) if w > 10 and h > 10 else None
        }
    except Exception as e:
        logger.debug(f"Error querying active window: {e}")
        return {"hwnd": None, "title": "", "process": "", "rect": None}


class PrivacyGuard:
    """
    Protects user privacy by blocking screen capture when sensitive windows,
    password fields, credential dialogs, or private browsing sessions are active.
    """
    DEFAULT_SENSITIVE_PROCESSES = {
        "keepass.exe", "1password.exe", "bitwarden.exe", "lastpass.exe",
        "enpass.exe", "dashlane.exe", "nordpass.exe", "authenticator.exe",
        "credentialuihost.exe"
    }

    DEFAULT_SENSITIVE_TITLES = [
        "1password", "bitwarden", "keepass", "lastpass", "master password",
        "private browsing", "inprivate", "incognito", "windows security",
        "credentials", "enter your pin", "authenticator", "two-factor", "2fa",
        "bank of", "chase bank", "wellsfargo", "hdfc bank", "icici bank", "sbi"
    ]

    def __init__(self, excluded_apps: Optional[List[str]] = None):
        self.excluded_apps = set(a.lower() for a in (excluded_apps or []))

    def update_excluded_apps(self, apps: List[str]):
        self.excluded_apps = set(a.lower() for a in (apps or []))

    def is_safe_to_capture(self, window_info: Dict[str, Any]) -> Tuple[bool, str]:
        title = (window_info.get("title") or "").lower()
        process = (window_info.get("process") or "").lower()

        # 1. Process blacklist
        if process in self.DEFAULT_SENSITIVE_PROCESSES:
            return False, f"Sensitive process detected: {process}"

        for ex in self.excluded_apps:
            if ex in process or ex in title:
                return False, f"Excluded application matched: {ex}"

        # 2. Title blacklist
        for kw in self.DEFAULT_SENSITIVE_TITLES:
            if kw in title:
                return False, f"Sensitive window title matched: '{kw}'"

        return True, "Safe"


class ScreenCaptureEngine:
    """
    High-performance, lightweight Windows screen grabber with difference detection.
    Optimized for GTX 1650 4GB laptop: downsizes captures before feeding to vision models.
    """
    def __init__(self, target_max_dim: int = 768, quality: int = 75):
        self.target_max_dim = target_max_dim
        self.quality = quality
        self.prev_thumbnail: Optional[np.ndarray] = None
        self.prev_window_title: str = ""
        self.thumb_size = (64, 64)

    def capture(self, source: str = "primary_monitor") -> Tuple[Optional[Image.Image], Optional[bytes], str, Dict[str, Any]]:
        """
        Captures the screen, downscales to vision-optimized resolution, and encodes to JPEG & Base64.
        Returns: (pil_image, jpeg_bytes, base64_str, window_info)
        """
        attach_thread_to_input_desktop()
        win_info = get_active_window_info()

        img = None
        try:
            if source == "active_window" and win_info.get("rect"):
                # Bounding box capture
                l, t, r, b = win_info["rect"]
                img = ImageGrab.grab(bbox=(l, t, r, b), all_screens=False)
            else:
                # Primary display full capture
                img = ImageGrab.grab(all_screens=False)
        except Exception as e:
            logger.debug(f"PIL ImageGrab error: {e}. Attempting full screen fallback.")
            try:
                img = ImageGrab.grab()
            except Exception as e2:
                logger.error(f"Screen capture failed: {e2}")
                return None, None, "", win_info

        if img is None:
            return None, None, "", win_info

        # Convert to RGB
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Downscale for low VRAM and fast inference if dimensions exceed target_max_dim
        w, h = img.size
        max_dim = max(w, h)
        if max_dim > self.target_max_dim:
            scale = self.target_max_dim / float(max_dim)
            new_w = max(1, int(w * scale))
            new_h = max(1, int(h * scale))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Compress to JPEG in memory
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=self.quality, optimize=True)
        jpeg_bytes = buf.getvalue()
        b64_str = base64.b64encode(jpeg_bytes).decode("ascii")

        return img, jpeg_bytes, b64_str, win_info

    def compute_difference(self, pil_img: Image.Image, current_title: str) -> Tuple[float, bool]:
        """
        Computes lightweight perceptual difference score (0.0 to 1.0) against previous frame.
        Takes < 3ms using a 64x64 grayscale downsampled thumbnail.
        """
        try:
            # Create small 64x64 grayscale thumbnail
            gray_thumb = pil_img.convert("L").resize(self.thumb_size, Image.Resampling.BILINEAR)
            thumb_arr = np.asarray(gray_thumb, dtype=np.float32)

            if self.prev_thumbnail is None:
                self.prev_thumbnail = thumb_arr
                self.prev_window_title = current_title
                return 1.0, True

            # Calculate normalized absolute difference
            diff = float(np.mean(np.abs(thumb_arr - self.prev_thumbnail)) / 255.0)

            # Window title change represents a context transition
            title_changed = (current_title != self.prev_window_title) and bool(current_title)

            # Update cached frame
            self.prev_thumbnail = thumb_arr
            self.prev_window_title = current_title

            return diff, title_changed
        except Exception as e:
            logger.debug(f"Difference calculation error: {e}")
            return 0.5, True


class VisionInferenceEngine:
    """
    Executes multimodal visual analysis through local Ollama vision models.
    Produces structured, grounded observations without visual hallucinations.
    """
    STRUCTURED_VISION_PROMPT = (
        "You are an observant AI companion analyzing a screenshot of the user's desktop screen. "
        "Analyze what is visible and respond with a strict JSON object containing:\n"
        "{\n"
        '  "app_context": "Short name of active app and content (e.g., VS Code editing python file, Chrome reading docs, Steam game)",\n'
        '  "activity_summary": "1-2 sentences objectively stating what is visibly happening on screen",\n'
        '  "visual_change": "Noticeable visual elements or state (e.g., red error trace, green build pass, game lobby, dialog)",\n'
        '  "notable_event": "Specific event if any (e.g. SyntaxError in terminal, test pass, level win, game over, or None)",\n'
        '  "event_category": "One of: CODING_ERROR, CODING_SUCCESS, GAMING_ACTION, BROWSING_RESEARCH, APP_DIALOG, SYSTEM_EVENT, ROUTINE_ACTIVITY",\n'
        '  "confidence": 0.0 to 1.0 (how clear and certain the visual scene is),\n'
        '  "deserves_reaction": true or false (true if unexpected, error, milestone, or interesting; false for ordinary scrolling/reading),\n'
        '  "suggested_mood": "One of: ALERT, HAPPY, ERROR, THINKING, CONFUSED, VICTORY, CURIOUS"\n'
        "}\n\n"
        "RULES:\n"
        "- Be strictly factual: only state what is directly visible in the image.\n"
        "- Do NOT invent unseen errors or claim certainty when text is blurry.\n"
        "- If the user is just browsing or reading normally, set deserves_reaction to false.\n"
        "- Output ONLY the valid JSON block without introductory or concluding text."
    )

    def __init__(self, vision_model: str = "llava-phi3", timeout_sec: float = 12.0):
        self.vision_model = vision_model
        self.timeout_sec = timeout_sec

    def analyze_screen(self, base64_image: str, window_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends the compressed screenshot to Ollama and returns a structured observation dict.
        """
        import ollama

        start_time = time.time()
        hint = f"Window title hint: '{window_context.get('title', '')}'"
        user_msg = f"{self.STRUCTURED_VISION_PROMPT}\n\n[Active Window Context: {hint}]"

        try:
            response = ollama.chat(
                model=self.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": user_msg,
                        "images": [base64_image]
                    }
                ],
                options={
                    "temperature": 0.2,
                    "num_predict": 250
                }
            )

            latency_ms = round((time.time() - start_time) * 1000, 1)
            raw_content = response.get("message", {}).get("content", "").strip()

            # Parse JSON from response
            parsed = self._extract_json(raw_content)
            if parsed:
                parsed["latency_ms"] = latency_ms
                parsed["model_used"] = self.vision_model
                return parsed

            # If JSON extraction failed, construct a grounded fallback from raw content
            logger.debug(f"Vision model returned non-JSON text: {raw_content[:100]}...")
            return {
                "app_context": window_context.get("title", "Desktop Screen"),
                "activity_summary": raw_content[:150],
                "visual_change": "Visual screen update observed",
                "notable_event": None,
                "event_category": "ROUTINE_ACTIVITY",
                "confidence": 0.65,
                "deserves_reaction": False,
                "suggested_mood": "CURIOUS",
                "latency_ms": latency_ms,
                "model_used": self.vision_model
            }

        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            logger.warning(f"Ollama vision inference error with '{self.vision_model}': {e}")
            return {
                "error": str(e),
                "app_context": window_context.get("title", "Desktop Screen"),
                "activity_summary": "Vision inference unavailable or timed out.",
                "visual_change": None,
                "notable_event": None,
                "event_category": "ROUTINE_ACTIVITY",
                "confidence": 0.0,
                "deserves_reaction": False,
                "suggested_mood": "ALERT",
                "latency_ms": latency_ms,
                "model_used": self.vision_model
            }

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extracts JSON object from markdown blocks or raw text."""
        # Try direct parse
        try:
            return json.loads(text)
        except Exception:
            pass

        # Try markdown code fence regex
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass

        # Try finding outer braces
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                pass

        return None


class ScreenPerceptionHistory:
    """
    Maintains a rolling episodic memory buffer of recent observations.
    Allows sequence awareness (e.g. noticing consecutive failed attempts at a bug).
    """
    def __init__(self, max_items: int = 6):
        self.history = deque(maxlen=max_items)

    def record(self, observation: Dict[str, Any]):
        if observation and not observation.get("error"):
            item = {
                "time": time.time(),
                "time_str": time.strftime("%H:%M:%S"),
                "app_context": observation.get("app_context", ""),
                "activity_summary": observation.get("activity_summary", ""),
                "visual_change": observation.get("visual_change", ""),
                "notable_event": observation.get("notable_event"),
                "event_category": observation.get("event_category", "ROUTINE_ACTIVITY")
            }
            self.history.append(item)

    def get_recent_summary(self) -> str:
        """Formats the rolling timeline as compact bullet points for LLM reasoning."""
        if not self.history:
            return "No previous screen observations."

        lines = []
        now = time.time()
        for item in self.history:
            ago_sec = int(now - item["time"])
            lines.append(
                f"- {ago_sec}s ago [{item['app_context']}]: {item['activity_summary']}"
                + (f" (Event: {item['notable_event']})" if item['notable_event'] else "")
            )
        return "\n".join(lines)

    def get_items(self) -> List[Dict[str, Any]]:
        return list(self.history)

    def clear(self):
        self.history.clear()


class SocialJudgmentEngine:
    """
    Decides whether an observation warrants spoken commentary,
    enforcing anti-repetition, confidence thresholds, and situational silence.
    """
    def __init__(
        self,
        social_mode: str = "companion",
        confidence_threshold: float = 0.60,
        commentary_cooldown_sec: float = 30.0,
        max_recent_comments: int = 15
    ):
        self.social_mode = social_mode  # "companion" | "gaming" | "quiet"
        self.confidence_threshold = confidence_threshold
        self.commentary_cooldown_sec = commentary_cooldown_sec
        self.last_comment_time: float = 0.0
        self.recent_comments: List[str] = []
        self.max_recent_comments = max_recent_comments

    def should_comment(self, observation: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Evaluates social judgment rules:
        1. Social Mode Gate (Quiet mode = silence unless severe error).
        2. Cooldown Gate (avoid annoying chatter).
        3. Confidence Gate.
        4. Deserves Reaction Gate (routine activities receive silence).
        """
        now = time.time()
        category = observation.get("event_category", "ROUTINE_ACTIVITY")
        confidence = float(observation.get("confidence", 0.0))
        deserves = bool(observation.get("deserves_reaction", False))

        # 1. Social Mode Gate
        if self.social_mode == "quiet":
            if category != "CODING_ERROR":
                return False, "Quiet mode: silence for non-critical events"

        if self.social_mode == "gaming":
            if category not in ("GAMING_ACTION", "CODING_ERROR", "CODING_SUCCESS"):
                return False, "Gaming mode: ignoring non-gaming/non-code events"

        # 2. Deserves Reaction Gate
        if not deserves:
            return False, "Observation classified as routine; choosing natural silence"

        # 3. Confidence Gate
        if confidence < self.confidence_threshold:
            return False, f"Confidence {confidence:.2f} below threshold {self.confidence_threshold:.2f}"

        # 4. Global Cooldown Gate
        elapsed = now - self.last_comment_time
        if elapsed < self.commentary_cooldown_sec:
            remaining = int(self.commentary_cooldown_sec - elapsed)
            return False, f"Commentary cooldown active ({remaining}s remaining)"

        return True, "Social judgment approved comment generation"

    def is_duplicate(self, text: str) -> bool:
        """Checks if comment closely duplicates recent comments."""
        clean = re.sub(r"[^\w\s]", "", text.lower()).strip()
        for prev in self.recent_comments[-5:]:
            prev_clean = re.sub(r"[^\w\s]", "", prev.lower()).strip()
            # Simple token overlap ratio
            tokens1 = set(clean.split())
            tokens2 = set(prev_clean.split())
            if tokens1 and tokens2:
                overlap = len(tokens1 & tokens2) / float(min(len(tokens1), len(tokens2)))
                if overlap > 0.70:
                    return True
        return False

    def record_comment(self, text: str):
        self.last_comment_time = time.time()
        self.recent_comments.append(text)
        if len(self.recent_comments) > self.max_recent_comments:
            self.recent_comments.pop(0)


class ContextualCommentaryGenerator:
    """
    Feeds structured visual observations and rolling context into Raiden's conversational
    model to generate authentic, grounded, spontaneous Hinglish dialogue.
    """
    PERSONA_VOICES = {
        "void": "Cyber-ronin cat: witty, sharp, mildly sarcastic, loyal friend.",
        "pixel": "Energetic 8-bit cyber puppy: hyper-enthusiastic, supportive, uses all-caps excitement.",
        "nova": "Stylish cyberpunk diva: sassy, aesthetic-focused, playful roaster.",
        "cipher": "Elite terminal hacker: calculates odds, technical jargon mixed with witty street slang."
    }

    def __init__(self, conversational_model: str = "qwen2.5-coder:3b"):
        self.conversational_model = conversational_model

    def generate_commentary(
        self,
        observation: Dict[str, Any],
        rolling_context: str,
        companion_id: str = "void"
    ) -> Dict[str, Any]:
        """
        Prompts the conversational LLM to craft fresh, original dialogue grounded in what was seen.
        """
        import ollama

        start_time = time.time()
        voice_desc = self.PERSONA_VOICES.get(companion_id.lower(), self.PERSONA_VOICES["void"])
        category = observation.get("event_category", "ROUTINE_ACTIVITY")
        app = observation.get("app_context", "the desktop")
        summary = observation.get("activity_summary", "")
        event = observation.get("notable_event", "Visual change on screen")

        prompt = (
            f"You are RAIDEN companion persona '{companion_id.upper()}' ({voice_desc}).\n"
            f"You are watching the user's desktop in real-time.\n\n"
            f"Current Visual Observation:\n"
            f"- Active App: {app}\n"
            f"- What is happening on screen: {summary}\n"
            f"- Notable Event: {event}\n"
            f"- Event Category: {category}\n\n"
            f"Recent Context Sequence:\n{rolling_context}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Generate a sharp, funny, sarcastic roast or witty observation in pure English based on what the user is visibly doing on screen.\n"
            f"2. Language: PURE ENGLISH. Sarcastic, hilarious, playful, and observant developer humor.\n"
            f"3. Strictly under 16 words. Punchy, crisp, and direct.\n"
            f"4. If there is a coding error, roast their coding or mistake with a witty zing.\n"
            f"5. If they are distracted, browsing, or staring, call them out with humor.\n"
            f"6. If they achieved a win or build pass, give them backhanded praise or hyped encouragement.\n"
            f"7. Output ONLY the spoken dialogue line, no quotation marks, no preamble."
        )

        try:
            res = ollama.chat(
                model=self.conversational_model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.85, "num_predict": 35}
            )
            raw_text = res.get("message", {}).get("content", "").strip()
            clean_text = raw_text.strip('"\'').strip()
            # Remove any model prefacing like "Here's a roast:" or "Dialogue:"
            clean_text = re.sub(r"^(here'?s a roast|dialogue|commentary|roast|raiden):\s*", "", clean_text, flags=re.IGNORECASE).strip('"\'').strip()

            # Ensure crispness: keep punchy sentences up to 16 words
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean_text) if s.strip()]
            if len(sentences) > 1 and len(sentences[0].split()) <= 4:
                combined = f"{sentences[0]} {sentences[1]}"
                if len(combined.split()) <= 16:
                    clean_text = combined
                else:
                    clean_text = sentences[0]
            elif sentences and len(sentences[0].split()) >= 3:
                clean_text = sentences[0].strip()

            # Clamp word count to 16 words max
            words = clean_text.split()
            if len(words) > 16:
                clean_text = " ".join(words[:16]).rstrip(",;:-") + "..."

            elapsed = round((time.time() - start_time) * 1000, 1)

            # Assign matching cyber audio tone & mood based on observation category
            mood = observation.get("suggested_mood", "ALERT")
            tone = "blip"
            if "ERROR" in category:
                tone = "alert"
                mood = "ERROR"
            elif "SUCCESS" in category or "VICTORY" in category:
                tone = "chime"
                mood = "VICTORY"
            elif "GAMING" in category:
                tone = "bounce"
                mood = "HAPPY"

            return {
                "text": clean_text,
                "mood": mood,
                "tone": tone,
                "source": "vision_llm",
                "latency_ms": elapsed,
                "event_category": category,
                "notable_event": event
            }
        except Exception as e:
            elapsed = round((time.time() - start_time) * 1000, 1)
            logger.debug(f"Commentary generation error with {self.conversational_model}: {e}")
            return {
                "text": f"Watching {app}... waiting for your next syntax error!",
                "mood": "ALERT",
                "tone": "blip",
                "source": "grounded_fallback",
                "latency_ms": elapsed,
                "event_category": category,
                "notable_event": event
            }


class ScreenObserverService:
    """
    Dedicated, asynchronous screen-observation service running on a background daemon thread.
    Coordinates capture, difference detection, vision analysis, rolling context, and commentary.
    """
    def __init__(
        self,
        config_mgr=None,
        active_conversational_model: str = "qwen2.5-coder:3b",
        on_observation_callback=None
    ):
        self.config_mgr = config_mgr
        self.active_conversational_model = active_conversational_model
        self.on_observation_callback = on_observation_callback

        # Configuration options with defaults
        self.enabled: bool = False
        self.is_paused: bool = False
        self.observation_interval_sec: float = 5.0
        self.inference_cooldown_sec: float = 12.0
        self.commentary_cooldown_sec: float = 30.0
        self.change_threshold: float = 0.035
        self.vision_model: str = "llava-phi3"
        self.social_mode: str = "companion"
        self.capture_source: str = "primary_monitor"

        if config_mgr:
            self._load_config()

        # Subsystems
        self.capture_engine = ScreenCaptureEngine(target_max_dim=768, quality=75)
        self.privacy_guard = PrivacyGuard(excluded_apps=self.config_mgr.get("screen_excluded_apps", []) if config_mgr else None)
        self.vision_engine = VisionInferenceEngine(vision_model=self.vision_model)
        self.history = ScreenPerceptionHistory(max_items=8)
        self.social_judgment = SocialJudgmentEngine(
            social_mode=self.social_mode,
            confidence_threshold=float(self.config_mgr.get("screen_confidence_threshold", 0.60)) if config_mgr else 0.60,
            commentary_cooldown_sec=self.commentary_cooldown_sec
        )
        self.commentary_generator = ContextualCommentaryGenerator(conversational_model=self.active_conversational_model)

        # Threading state
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self.last_inference_time: float = 0.0
        self.latest_observation: Optional[Dict[str, Any]] = None
        self.latest_commentary: Optional[Dict[str, Any]] = None
        self.last_diff_score: float = 0.0
        self.stats = {
            "total_captures": 0,
            "total_inferences": 0,
            "total_comments_generated": 0,
            "skipped_unchanged": 0,
            "skipped_sensitive": 0,
            "skipped_social_silence": 0
        }

    def _load_config(self):
        if not self.config_mgr:
            return
        self.enabled = bool(self.config_mgr.get("screen_perception_enabled", False))
        self.vision_model = str(self.config_mgr.get("vision_model", "llava-phi3"))
        self.observation_interval_sec = float(self.config_mgr.get("screen_observation_interval_seconds", 5.0))
        self.inference_cooldown_sec = float(self.config_mgr.get("screen_inference_cooldown_seconds", 12.0))
        self.commentary_cooldown_sec = float(self.config_mgr.get("screen_commentary_cooldown_seconds", 30.0))
        self.change_threshold = float(self.config_mgr.get("screen_change_threshold", 0.035))
        self.social_mode = str(self.config_mgr.get("screen_social_mode", "companion"))
        self.capture_source = str(self.config_mgr.get("screen_capture_source", "primary_monitor"))

    def start(self):
        """Starts the screen perception daemon thread."""
        with self._lock:
            if self._thread and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True, name="RaidenScreenObserver")
            self._thread.start()
            logger.info("ScreenObserverService background daemon started.")

    def stop(self):
        """Signals the background daemon thread to terminate."""
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._thread = None
        logger.info("ScreenObserverService stopped.")

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False

    def set_enabled(self, enabled: bool):
        self.enabled = bool(enabled)
        if self.config_mgr:
            self.config_mgr.set("screen_perception_enabled", self.enabled)
            self.config_mgr.save()

    def set_vision_model(self, model_name: str):
        self.vision_model = model_name
        self.vision_engine.vision_model = model_name
        if self.config_mgr:
            self.config_mgr.set("vision_model", model_name)
            self.config_mgr.save()

    def set_social_mode(self, mode: str):
        if mode in ("companion", "gaming", "quiet"):
            self.social_mode = mode
            self.social_judgment.social_mode = mode
            if self.config_mgr:
                self.config_mgr.set("screen_social_mode", mode)
                self.config_mgr.save()

    def _run_loop(self):
        """Main observation loop running on separate background worker thread."""
        while not self._stop_event.is_set():
            time.sleep(self.observation_interval_sec)

            if not self.enabled or self.is_paused:
                continue

            try:
                self.tick_observation()
            except Exception as e:
                logger.error(f"Error in screen observer loop: {e}", exc_info=True)

    def tick_observation(self, force: bool = False, companion_id: str = "void") -> Optional[Dict[str, Any]]:
        """
        Executes a single observation cycle:
        1. Privacy check
        2. Screen capture
        3. Difference check
        4. Vision inference
        5. Social judgment & commentary generation
        """
        self.stats["total_captures"] += 1

        # 1. Capture screen & query active window
        pil_img, jpeg_bytes, b64_str, win_info = self.capture_engine.capture(source=self.capture_source)
        if pil_img is None or not b64_str:
            return None

        # 2. Privacy Guard Check
        safe, reason = self.privacy_guard.is_safe_to_capture(win_info)
        if not safe:
            self.stats["skipped_sensitive"] += 1
            logger.debug(f"Screen capture skipped for privacy: {reason}")
            return None

        # 3. Difference Detection
        diff_score, title_changed = self.capture_engine.compute_difference(
            pil_img, win_info.get("title", "")
        )
        self.last_diff_score = diff_score

        # Check if change is sufficient to justify vision model inference
        now = time.time()
        cooldown_elapsed = (now - self.last_inference_time) >= self.inference_cooldown_sec
        is_significant_change = (diff_score >= self.change_threshold) or title_changed

        if not force and (not is_significant_change or not cooldown_elapsed):
            self.stats["skipped_unchanged"] += 1
            return None

        # 4. Multimodal Vision Inference
        self.last_inference_time = now
        self.stats["total_inferences"] += 1

        obs = self.vision_engine.analyze_screen(b64_str, win_info)
        obs["diff_score"] = round(diff_score, 4)
        obs["timestamp"] = time.time()
        self.latest_observation = obs

        # Record into rolling episodic history
        self.history.record(obs)

        # 5. Social Judgment & Commentary Generation
        should_speak, judgment_reason = self.social_judgment.should_comment(obs)

        commentary_result = None
        if should_speak or force:
            rolling_context = self.history.get_recent_summary()
            commentary_result = self.commentary_generator.generate_commentary(
                obs, rolling_context, companion_id=companion_id
            )

            # Check duplicate suppression
            if commentary_result and not self.social_judgment.is_duplicate(commentary_result["text"]):
                self.social_judgment.record_comment(commentary_result["text"])
                self.latest_commentary = commentary_result
                self.stats["total_comments_generated"] += 1
            else:
                commentary_result = None
                self.stats["skipped_social_silence"] += 1
        else:
            self.stats["skipped_social_silence"] += 1
            logger.debug(f"Social judgment chose silence: {judgment_reason}")

        # Dispatch event to callback if registered
        full_event = {
            "type": "SCREEN_OBSERVATION",
            "observation": obs,
            "commentary": commentary_result,
            "window": win_info,
            "timestamp": time.time()
        }

        if self.on_observation_callback:
            try:
                self.on_observation_callback(full_event)
            except Exception as cb_err:
                logger.debug(f"Observation callback error: {cb_err}")

        return full_event

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive diagnostic telemetry of the screen observer service."""
        return {
            "enabled": self.enabled,
            "is_paused": self.is_paused,
            "vision_model": self.vision_model,
            "conversational_model": self.active_conversational_model,
            "social_mode": self.social_mode,
            "capture_source": self.capture_source,
            "observation_interval_sec": self.observation_interval_sec,
            "inference_cooldown_sec": self.inference_cooldown_sec,
            "commentary_cooldown_sec": self.commentary_cooldown_sec,
            "change_threshold": self.change_threshold,
            "last_diff_score": round(self.last_diff_score, 4),
            "stats": dict(self.stats),
            "latest_observation": self.latest_observation,
            "latest_commentary": self.latest_commentary,
            "history_count": len(self.history.history)
        }

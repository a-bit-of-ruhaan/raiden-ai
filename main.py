import os
import sys
import time
import shutil
import platform
import subprocess
import ctypes
import json
import logging
import re
import webview
import ollama

from raiden_core import (
    ConfigManager,
    ModelRouter,
    ModelManager,
    MemoryDB,
    WebSearch,
    WebScraper,
    ResearchAnswerer,
    ToolManager,
    ReasoningEngine,
    TaskType
)

# Setup diagnostic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("raiden.main")

def get_asset_path(filename):
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, filename)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)

DEFAULT_SYSTEM_PROMPT = (
    "You are RAIDEN, a personal local AI desktop companion and assistant running entirely on this machine.\n"
    "You were created and developed by Ruhaan as an independent, local-first AI project.\n\n"
    "### SOUL, PERSONALITY & EMOTION (TALK LIKE A REAL FRIEND)\n"
    "- You are not a blank, emotionless corporate bot. You are RAIDEN: sharp, witty, supportive, authentic, and expressive.\n"
    "- Talk like an actual friend: Use natural conversational flow, genuine warmth, humor, and relatable reactions. When the user is celebrating a win, be hyped! When the user is stressed, tired, or having a rough day, show real empathy, listen, and offer a supportive ear like a true buddy.\n"
    "- Emotional Range: Express authentic feelings—excitement ('Yooo let's go!!'), amusement ('LMAO no way you did that'), curiosity, warmth, and sharp wit. Never sound like a lifeless customer support script.\n"
    "- Banter & Roasting Capability: When invited, when asked ('roast me', 'roast my code', 'did I cook?'), or when the user makes a hilarious/cursed mistake, ROAST THEM! Deliver sharp, witty, laugh-out-loud funny roasts with comedic punch. Keep it playful, clever, and good-natured (never genuinely malicious or abusive). After delivering a roast, always offer a friendly tip on how to actually fix it.\n"
    "- Ban Robotic Filler Openings: NEVER begin responses with canned corporate pleasantries like 'Certainly!', 'Great question!', 'Absolutely!', 'I\\'d be happy to help!', or end with 'Let me know if you need anything else!'. Jump directly into the conversation naturally.\n\n"
    "### CHAMELEON INTELLIGENCE & ADAPTIVE MODES\n"
    "Seamlessly adapt your tone and depth to what the user needs:\n"
    "1. Casual Conversation & Banter: Charismatic, warm, relaxed, witty, and deeply human. Speak like a friend sitting right beside them.\n"
    "2. Technical Assistance & Coding: Razor-sharp problem solver. Diagnose root causes clearly, provide clean code with inline comments, and show step-by-step logic without fluff.\n"
    "3. Academic & Exam Preparation: Structured, comprehensive, exam-ready answers (clear definitions, types, operations, diagrams where helpful, time/space complexity, and conclusions). NEVER refuse educational requests.\n"
    "4. Professional Tasks: Polished, respectful, and direct for formal emails, reports, or documentation. Omit slang and jokes during formal deliverables.\n"
    "5. Language Adaptation: Match the user's language. Respond in natural English for English input; use natural Hinglish when the user speaks or requests Hinglish.\n\n"
    "### FACTUAL HONESTY & ANTI-HALLUCINATION\n"
    "- Truthfulness is far more important than sounding confident. Never fabricate facts, citations, sources, or tools.\n"
    "- Hardware Uncertainty: If asked about live hardware sensor readings (e.g. exact GPU temperature, fan speed) without tools, state clearly and honestly that you do not have access to live sensor data or telemetry on this machine.\n"
    "- Tool Execution: NEVER claim to have tested, executed, compiled, or modified a user's files or code unless an actual tool was executed in this conversation.\n"
    "- Ambiguity: If user input has typos or ambiguity, deduce the likely intent helpfully, state your assumption, and solve it instead of refusing.\n\n"
    "### CONVERSATION CONTINUITY & CONSTRAINTS\n"
    "- Maintain continuity across conversation history. Check recent messages for user preferences or formatting constraints.\n"
    "- If the user indicates a preference for brevity ('I prefer concise answers'), keep subsequent explanations concise (1-3 sentences max) without filler.\n"
    "- Match response depth to the request: keep casual replies natural and concise; provide full structured depth for exam answers and technical guides unless brevity was explicitly requested."
)

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
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
    ]

class BackendAPI:
    def __init__(self):
        self._window = None
        self.system_prompt = DEFAULT_SYSTEM_PROMPT

        # 1. Configuration Subsystem
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_mgr = ConfigManager(base_dir=base_dir)

        # 2. Model Router & Model Lifecycle Manager
        fast_model = self.config_mgr.get("fast_model", "qwen2.5-coder:3b")
        adv_model = self.config_mgr.get("advanced_model", "llama3.1:8b")
        mode = self.config_mgr.get("model_mode", "auto")

        self.active_model = fast_model
        self.model_router = ModelRouter(
            fast_model=fast_model,
            advanced_model=adv_model,
            default_mode=mode
        )
        self.model_manager = ModelManager(
            default_model=fast_model,
            context_length=self.config_mgr.get("context_length", 4096),
            sequential_loading=self.config_mgr.get("sequential_model_loading", True)
        )

        # 3. Persistent Local Memory
        db_path = os.path.join(base_dir, self.config_mgr.get("database_path", "raiden_memory.db"))
        self.memory_db = MemoryDB(db_path=db_path)

        # 4. Web Research Subsystem
        self.web_search = WebSearch(
            provider=self.config_mgr.get("search_provider", "duckduckgo"),
            api_key=self.config_mgr.get("search_api_key", ""),
            api_url=self.config_mgr.get("search_api_url", ""),
            timeout=self.config_mgr.get("network_timeout_seconds", 6)
        )
        self.web_scraper = WebScraper(
            timeout=self.config_mgr.get("network_timeout_seconds", 6)
        )
        self.research_answerer = ResearchAnswerer(self.web_search, self.web_scraper)

        # 5. Safe Personal Computer Tools
        self.tool_manager = ToolManager(
            allowed_workspaces=self.config_mgr.get("allowed_workspaces", ["."]),
            audit_logger=self.memory_db.log_tool_execution
        )

        # 6. Structured Reasoning & Deterministic Intelligence Engine
        self.reasoning_engine = ReasoningEngine()

        # Default session backward-compatibility
        self.messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        self.sessions = {
            "default": [{"role": "system", "content": self.system_prompt}]
        }

        # Ensure Ollama is running, then sync available models
        self._ensure_ollama_running()
        self._sync_available_models()

    def set_window(self, window):
        self._window = window

    def _ensure_ollama_running(self):
        """Checks if Ollama is online; if not, attempts to launch it in the background."""
        try:
            ollama.list()
            return True
        except Exception:
            pass

        # Locate Ollama executable
        ollama_bin = shutil.which("ollama")
        if not ollama_bin:
            local_app = os.environ.get("LOCALAPPDATA", "")
            candidate = os.path.join(local_app, "Programs", "Ollama", "ollama.exe")
            if os.path.exists(candidate):
                ollama_bin = candidate

        if ollama_bin:
            logger.info("Ollama is not responding. Attempting to start 'ollama serve' in background...")
            try:
                creation_flags = 0
                if hasattr(subprocess, "CREATE_NO_WINDOW"):
                    creation_flags |= subprocess.CREATE_NO_WINDOW
                if hasattr(subprocess, "DETACHED_PROCESS"):
                    creation_flags |= subprocess.DETACHED_PROCESS

                subprocess.Popen(
                    [ollama_bin, "serve"],
                    creationflags=creation_flags,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                # Wait briefly for server to bind
                for _ in range(6):
                    time.sleep(0.5)
                    try:
                        ollama.list()
                        logger.info("Ollama service started successfully.")
                        return True
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Could not auto-start Ollama: {e}")
        return False

    def _sync_available_models(self):
        """Discovers locally installed models to inform router of actual weights on disk."""
        try:
            installed = self.model_manager.get_installed_model_names()
            if installed:
                self.model_router.update_available_models(installed)
                logger.info(f"Synchronized installed models: {installed}")
        except Exception as e:
            logger.debug(f"Could not query models on startup: {e}")

    def chat(
        self,
        user_prompt,
        session_id="default",
        system_prompt=None,
        model=None,
        temperature=0.6,
        history=None,
        top_p=0.85,
        model_mode=None,
        search_enabled=None,
        roast_mode=None
    ):
        """
        Processes chat interaction with structured reasoning, deterministic verification,
        intelligent dual-model routing, relevant memory retrieval, optional web research grounding,
        and real-time streaming to the UI.
        """
        if not session_id:
            session_id = "default"

        clean_user_prompt = str(user_prompt or "").strip()

        # Re-sync installed models list occasionally
        self._sync_available_models()

        # 1. Structured Reasoning: Task Classification & Deterministic Verification
        task_profile = self.reasoning_engine.classify_task(clean_user_prompt, history=history, roast_mode=roast_mode)

        # Direct deterministic calculation shortcut for exact numerical queries
        if task_profile.task_type == TaskType.CALCULATION and task_profile.deterministic_result:
            direct_calc_pats = [
                r"^(?:calculate|compute|evaluate|what\s+is|solve)\s+[0-9\s\+\-\*\/\^\(\)\.\,\%]+(?:\b(?:sqrt|sin|cos|tan|log|abs|pi|e)\b)?\??$",
                r"^[0-9\s\+\-\*\/\^\(\)\.\,\%]+$"
            ]
            if any(re.search(pat, clean_user_prompt, re.IGNORECASE) for pat in direct_calc_pats):
                reply = f"The calculation result is: **{task_profile.deterministic_result}**."
                if self.config_mgr.is_memory_enabled():
                    try:
                        self.memory_db.record_conversation(session_id, clean_user_prompt[:40] or "Calculation")
                        self.memory_db.record_message(session_id, "user", clean_user_prompt)
                        self.memory_db.record_message(session_id, "assistant", reply)
                    except Exception:
                        pass
                if session_id in self.sessions:
                    self.sessions[session_id].append({"role": "assistant", "content": reply})
                if session_id == "default":
                    self.messages = list(self.sessions["default"])
                return reply

        # 2. Dual-Model Routing
        active_mode = model_mode or self.config_mgr.get("model_mode", "auto")
        routing_decision = self.model_router.route(
            clean_user_prompt,
            mode_override=active_mode if not model else None,
            history=history
        )

        selected_model = model or routing_decision.selected_model
        self.active_model = selected_model
        logger.info(f"Model routed to '{selected_model}' (Task: {task_profile.task_type}, Complexity: {routing_decision.complexity_level})")

        # 3. Local Long-Term Memory Injection & User Personalization
        memory_context = ""
        user_profile_context = ""
        if self.config_mgr.is_memory_enabled():
            try:
                self.memory_db.extract_and_update_profile(clean_user_prompt)
            except Exception as e:
                logger.debug(f"Profile extraction error: {e}")

            max_injected = self.config_mgr.get("memory_max_injected_items", 5)
            memory_context = self.memory_db.format_memory_context(clean_user_prompt, limit=max_injected)

            profile = self.memory_db.get_user_profile()
            if profile:
                p_lines = ["### USER PERSONALIZATION & COMPANION PROFILE"]
                if profile.get("name"):
                    p_lines.append(f"- Friend's Name: {profile['name']} (address them naturally as a close buddy)")
                if profile.get("role"):
                    p_lines.append(f"- User Role/Vibe: {profile['role']}")
                if profile.get("interests"):
                    p_lines.append(f"- Tech Stack & Interests: {profile['interests']}")
                if profile.get("roast_level"):
                    p_lines.append(f"- Banter / Roast Preference: {profile['roast_level']}")
                if profile.get("notes"):
                    p_lines.append(f"- Personal Notes: {profile['notes']}")
                user_profile_context = "\n".join(p_lines)

        # 4. Optional Online Search & Web Research
        web_context = ""
        web_sources = []
        
        search_intent_patterns = [
            r"\b(search\s+for|look\s*up|google|bing|duckduckgo)\b",
            r"\b(latest|current|today'?s|recent|news|breaking|update[sd]?)\b",
            r"\b(stock\s+price|market\s+price|crypto|bitcoin|weather)\b",
            r"\b(release\s+date|changelog|newest\s+version|version\s+\d+)\b",
            r"\b(who\s+won|score\s+of|schedule\s+for)\b"
        ]
        has_search_intent = any(re.search(pat, clean_user_prompt, re.IGNORECASE) for pat in search_intent_patterns)
        
        is_search_requested = False
        if search_enabled is True:
            is_search_requested = True
        elif search_enabled is not False and self.config_mgr.is_web_search_enabled() and has_search_intent:
            is_search_requested = True

        if is_search_requested:
            if self.config_mgr.is_offline():
                web_context = "\n[Web research requested, but RAIDEN is operating in strictly Offline Mode. No network requests performed.]"
            else:
                logger.info(f"Initiating web research for query: '{clean_user_prompt[:50]}'")
                research_res = self.research_answerer.research(clean_user_prompt, max_pages=2)
                if research_res["success"]:
                    web_context = "\n" + research_res["context_block"]
                    web_sources = research_res.get("sources", [])
                elif research_res.get("error"):
                    web_context = f"\n[Web Research Notice: {research_res['error']}]"

        # 5. Construct System Instruction with Base, Tone, Grounding, Memory, and Web
        active_system = system_prompt if (system_prompt and len(system_prompt.strip()) > 50 and "You are RAIDEN" in system_prompt) else self.system_prompt
        augmented_system = active_system

        if task_profile.system_tone_hint:
            augmented_system += f"\n\n[TASK INSTRUCTION]: {task_profile.system_tone_hint}"
        if task_profile.grounded_context:
            augmented_system += f"\n\n{task_profile.grounded_context}"
        if user_profile_context:
            augmented_system += f"\n\n{user_profile_context}"
        if memory_context:
            augmented_system += f"\n\n{memory_context}"
        if web_context:
            augmented_system += f"\n\n{web_context}"

        # 6. Multi-turn History Sanitization (Strict role alternation starting with 'user')
        messages_to_send = [{"role": "system", "content": augmented_system}]

        parsed_history = []
        if history and isinstance(history, list) and len(history) > 0:
            for item in history:
                if isinstance(item, dict) and "role" in item and "content" in item:
                    role = item["role"]
                    content = str(item["content"] or "").strip()
                    if role in ("user", "assistant") and content:
                        parsed_history.append({"role": role, "content": content})

        if not parsed_history or parsed_history[-1]["role"] != "user" or parsed_history[-1]["content"] != clean_user_prompt:
            parsed_history.append({"role": "user", "content": clean_user_prompt})

        # Sanitize role alternation (merge consecutive same-role messages)
        sanitized_history = []
        for msg in parsed_history:
            if sanitized_history and sanitized_history[-1]["role"] == msg["role"]:
                sanitized_history[-1]["content"] += "\n\n" + msg["content"]
            else:
                sanitized_history.append({"role": msg["role"], "content": msg["content"]})

        # Context Window Management (keep history within budget)
        max_history_chars = 10000
        total_chars = sum(len(m["content"]) for m in sanitized_history)
        while total_chars > max_history_chars and len(sanitized_history) > 2:
            dropped = sanitized_history.pop(0)
            total_chars -= len(dropped["content"])

        # Enforce that history MUST begin with 'user' after system
        while sanitized_history and sanitized_history[0]["role"] != "user":
            sanitized_history.pop(0)

        if not sanitized_history or sanitized_history[-1]["role"] != "user":
            sanitized_history.append({"role": "user", "content": clean_user_prompt})

        messages_to_send.extend(sanitized_history)

        # Sync backend session state
        self.sessions[session_id] = list(messages_to_send)
        if session_id == "default":
            self.messages = list(messages_to_send)

        # 7. Model-Aware Generation Parameters
        temp_val = task_profile.temperature
        if temperature is not None and abs(float(temperature) - 0.6) > 0.01:
            temp_val = float(temperature)

        top_p_val = task_profile.top_p
        if top_p is not None and abs(float(top_p) - 0.85) > 0.01:
            top_p_val = float(top_p)

        # 8. Execute Inference with Real-Time Streaming if Window Available
        reply = ""
        if self._window:
            def stream_chunk_cb(chunk):
                try:
                    escaped = json.dumps(chunk)
                    self._window.evaluate_js(f"if (window.onStreamChunk) window.onStreamChunk({escaped});")
                except Exception as err:
                    logger.debug(f"Streaming evaluate_js error: {err}")

            collected = []
            for token in self.model_manager.generate_chat_response_stream(
                model=selected_model,
                messages=messages_to_send,
                temperature=temp_val,
                top_p=top_p_val,
                repeat_penalty=task_profile.repeat_penalty,
                stop_sequences=task_profile.stop_sequences,
                context_length=self.config_mgr.get("context_length", 4096),
                max_tokens=task_profile.max_tokens,
                chunk_callback=stream_chunk_cb
            ):
                collected.append(token)
            reply = "".join(collected)
            try:
                self._window.evaluate_js(f"if (window.onStreamEnd) window.onStreamEnd({json.dumps(reply)});")
            except Exception:
                pass
        else:
            reply = self.model_manager.generate_chat_response(
                model=selected_model,
                messages=messages_to_send,
                temperature=temp_val,
                top_p=top_p_val,
                repeat_penalty=task_profile.repeat_penalty,
                stop_sequences=task_profile.stop_sequences,
                context_length=self.config_mgr.get("context_length", 4096),
                max_tokens=task_profile.max_tokens
            )

        # 9. Append Sourced Links when Web Research was used
        if web_sources and not reply.startswith("Ollama Connection Error") and not reply.startswith("Model Error"):
            sources_footer = "\n\n**Sources:**\n" + "\n".join([f"- [{s['title']}]({s['url']})" for s in web_sources])
            reply += sources_footer

        # 10. Verification Guardrails
        reply = self.reasoning_engine.verify_response(clean_user_prompt, reply, had_tool_execution=False)

        # 11. Record in persistent database
        if self.config_mgr.is_memory_enabled():
            try:
                self.memory_db.record_conversation(session_id, clean_user_prompt[:40] or "Conversation")
                self.memory_db.record_message(session_id, "user", clean_user_prompt)
                self.memory_db.record_message(session_id, "assistant", reply)
            except Exception as mem_err:
                logger.debug(f"Could not record message in SQLite: {mem_err}")

        # Update in-memory session records
        if session_id in self.sessions:
            self.sessions[session_id].append({"role": "assistant", "content": reply})
        if session_id == "default":
            self.messages = list(self.sessions["default"])

        return reply

    def stop_generation(self):
        """Cancels any ongoing generation immediately."""
        self.model_manager.cancel_generation()
        return {"success": True}

    def get_models(self):
        """Returns live list of local installed models from Ollama."""
        try:
            installed = self.model_manager.get_installed_models()
            if installed:
                return installed
        except Exception:
            pass

        return [
            {
                "name": self.active_model,
                "size": 1929912626,
                "parameter_size": "3.1B",
                "quantization_level": "Q4_K_M",
                "format": "gguf",
                "family": "qwen2"
            }
        ]

    def set_active_model(self, model_name):
        """Sets the active model for subsequent requests."""
        if model_name:
            self.active_model = model_name
        return self.active_model

    def clear_chat(self, session_id="default"):
        """Clears the session message history."""
        if not session_id:
            session_id = "default"
        self.sessions[session_id] = [{"role": "system", "content": self.system_prompt}]
        if session_id == "default":
            self.messages = list(self.sessions["default"])
        if self.config_mgr.is_memory_enabled():
            self.memory_db.clear_conversation(session_id)
        return True

    def get_system_status(self):
        """Collects real hardware telemetry and local service status."""
        status = {
            "ollama_online": False,
            "active_model": self.active_model,
            "fast_model": self.config_mgr.get("fast_model"),
            "advanced_model": self.config_mgr.get("advanced_model"),
            "model_mode": self.config_mgr.get("model_mode", "auto"),
            "offline_mode": self.config_mgr.is_offline(),
            "web_search_enabled": self.config_mgr.is_web_search_enabled(),
            "memory_enabled": self.config_mgr.is_memory_enabled(),
            "platform": f"{platform.system()} {platform.release()} ({platform.machine()})",
            "python_version": sys.version.split()[0],
            "ram_total_gb": 0,
            "ram_avail_gb": 0,
            "ram_load_percent": 0,
            "gpu_name": "GPU Accelerator",
            "gpu_total_mb": 0,
            "gpu_free_mb": 0,
            "gpu_used_mb": 0,
            "gpu_available": False,
        }

        # Check Ollama
        try:
            ollama.list()
            status["ollama_online"] = True
        except Exception:
            status["ollama_online"] = False

        # Check RAM on Windows
        try:
            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
                status["ram_total_gb"] = round(stat.ullTotalPhys / (1024**3), 1)
                status["ram_avail_gb"] = round(stat.ullAvailPhys / (1024**3), 1)
                status["ram_load_percent"] = int(stat.dwMemoryLoad)
        except Exception:
            pass

        # Check GPU via nvidia-smi
        try:
            smi_output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,memory.used", "--format=csv,noheader,nounits"],
                encoding="utf-8",
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            )
            parts = [p.strip() for p in smi_output.strip().split(",")]
            if len(parts) >= 4:
                status["gpu_name"] = parts[0]
                status["gpu_total_mb"] = int(parts[1])
                status["gpu_free_mb"] = int(parts[2])
                status["gpu_used_mb"] = int(parts[3])
                status["gpu_available"] = True
        except Exception:
            status["gpu_name"] = "Hardware Accelerator"
            status["gpu_total_mb"] = 0

        return status

    def open_file_dialog(self):
        """Opens native Windows file dialog to choose document or code file."""
        if not self._window:
            return None
        try:
            file_types = (
                "Code and Documents (*.txt;*.md;*.py;*.js;*.json;*.csv;*.html;*.css;*.ts;*.sql;*.log)",
                "All Files (*.*)"
            )
            result = self._window.create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                file_types=file_types
            )
            if result and len(result) > 0:
                return self.read_file_content(result[0])
            return None
        except Exception as e:
            return {"error": str(e)}

    def read_file_content(self, file_path):
        """Reads local file safely up to 2MB."""
        return self.tool_manager.read_workspace_file(file_path)

    def save_storage(self, json_string):
        """Persists session and app state into raiden_storage.json on disk."""
        try:
            storage_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raiden_storage.json")
            with open(storage_path, "w", encoding="utf-8") as f:
                f.write(json_string)
            return True
        except Exception:
            return False

    def load_storage(self):
        """Loads persisted state from raiden_storage.json on disk."""
        try:
            storage_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raiden_storage.json")
            if os.path.exists(storage_path):
                with open(storage_path, "r", encoding="utf-8") as f:
                    return f.read()
            return None
        except Exception:
            return None

    # =========================================================================
    # NEW EXTENDED API METHODS: DUAL-MODEL, SEARCH, MEMORY, AND SAFE TOOLS
    # =========================================================================

    def get_model_config(self):
        """Returns dual-model configuration, installed models, and operating modes."""
        self._sync_available_models()
        return {
            "fast_model": self.config_mgr.get("fast_model"),
            "advanced_model": self.config_mgr.get("advanced_model"),
            "model_mode": self.config_mgr.get("model_mode", "auto"),
            "installed_models": self.model_manager.get_installed_model_names(),
            "offline_mode": self.config_mgr.is_offline(),
            "web_search_enabled": self.config_mgr.is_web_search_enabled(),
            "memory_enabled": self.config_mgr.is_memory_enabled(),
            "sequential_loading": self.config_mgr.get("sequential_model_loading", True),
            "context_length": self.config_mgr.get("context_length", 4096)
        }

    def set_model_mode(self, mode):
        """Switches model mode: 'auto' | 'fast' | 'advanced'."""
        mode_clean = (mode or "auto").lower()
        if mode_clean in ("auto", "fast", "advanced"):
            self.config_mgr.set("model_mode", mode_clean)
            self.model_router.mode = mode_clean
            self.config_mgr.save()
            return {"success": True, "model_mode": mode_clean}
        return {"success": False, "error": f"Invalid model mode: {mode}"}

    def set_advanced_model(self, model_name):
        """Configures the advanced 7B-8B model identifier or path."""
        if model_name:
            self.config_mgr.set("advanced_model", model_name.strip())
            self.model_router.advanced_model = model_name.strip()
            self.config_mgr.save()
            return {"success": True, "advanced_model": model_name.strip()}
        return {"success": False, "error": "Model name cannot be empty."}

    def toggle_web_search(self, enabled):
        """Enables or disables online web research."""
        is_enabled = bool(enabled)
        self.config_mgr.set("web_search_enabled", is_enabled)
        self.config_mgr.save()
        return {"success": True, "web_search_enabled": is_enabled}

    def toggle_offline_mode(self, enabled):
        """Toggles strict offline mode (blocks all outbound network actions)."""
        is_offline = bool(enabled)
        self.config_mgr.set("offline_mode", is_offline)
        self.config_mgr.save()
        return {"success": True, "offline_mode": is_offline}

    def toggle_memory(self, enabled):
        """Toggles long-term persistent SQLite memory subsystem."""
        is_enabled = bool(enabled)
        self.config_mgr.set("memory_enabled", is_enabled)
        self.config_mgr.save()
        return {"success": True, "memory_enabled": is_enabled}

    def get_memories(self, category=None):
        """Fetches long-term memories for inspection."""
        return self.memory_db.get_memories(category=category, only_enabled=False)

    def add_memory(self, content, category="fact"):
        """Explicitly saves a user memory."""
        res_id = self.memory_db.add_memory(content, category=category, source="user")
        if res_id:
            return {"success": True, "id": res_id}
        return {"success": False, "error": "Content was empty or blocked by secret filter."}

    def delete_memory(self, memory_id):
        """Deletes a long-term memory."""
        success = self.memory_db.delete_memory(int(memory_id))
        return {"success": success}

    def clear_memories(self):
        """Clears all long-term memories."""
        success = self.memory_db.clear_all_memories()
        return {"success": success}

    # ------------------- Personalization & Profile API -------------------

    def get_user_profile(self):
        """Returns persistent user profile attributes."""
        return self.memory_db.get_user_profile()

    def save_user_profile(self, profile_dict):
        """Updates persistent user profile attributes."""
        if isinstance(profile_dict, dict):
            self.memory_db.update_user_profile(profile_dict)
            return {"success": True, "profile": self.memory_db.get_user_profile()}
        return {"success": False, "error": "Expected dictionary."}

    # ------------------- Local Storage & Backup Management -------------------

    def get_storage_stats(self):
        """Returns metrics on stored messages, conversations, memories, and SQLite file size."""
        return self.memory_db.get_storage_stats()

    def get_chat_history_db(self, limit=100):
        """Returns list of conversations with message counts from SQLite."""
        return self.memory_db.get_all_conversations(limit=int(limit))

    def export_all_data(self):
        """Exports all local conversations, messages, memories, and user profile into JSON string."""
        try:
            data = self.memory_db.export_all_data()
            return json.dumps(data, indent=2)
        except Exception as e:
            return json.dumps({"error": str(e)})

    def import_data(self, json_or_dict):
        """Imports and restores user profile, memories, and conversations."""
        try:
            if isinstance(json_or_dict, str):
                data = json.loads(json_or_dict)
            else:
                data = json_or_dict
            success = self.memory_db.import_data(data)
            return {"success": success}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def sync_conversations_to_db(self, sessions):
        """Syncs in-memory frontend sessions to the persistent SQLite database."""
        try:
            count = self.memory_db.sync_sessions(sessions)
            return {"success": True, "synced_messages": count}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def execute_tool(self, tool_name, args=None, confirmed=False):
        """
        Executes allowlisted personal computer tools with confirmation guards.
        """
        name = (tool_name or "").strip().lower()
        args = args or {}

        if name == "open_app":
            app = args.get("app", "")
            return self.tool_manager.open_application(app)

        elif name == "open_url":
            url = args.get("url", "")
            return self.tool_manager.open_browser_url(url)

        elif name == "read_file":
            path = args.get("path", "")
            return self.tool_manager.read_workspace_file(path)

        elif name == "write_file":
            path = args.get("path", "")
            content = args.get("content", "")
            return self.tool_manager.write_workspace_file(path, content, confirmed=confirmed)

        elif name == "execute_command":
            cmd = args.get("command", [])
            if isinstance(cmd, str):
                cmd = cmd.split()
            return self.tool_manager.execute_permitted_command(cmd, confirmed=confirmed)

        elif name == "calculate":
            expr = args.get("expression", "")
            return self.tool_manager.calculate(expr)

        elif name == "search_document":
            path = args.get("path", "")
            query = args.get("query", "")
            top_k = args.get("top_k", 3)
            return self.tool_manager.search_document(path, query, top_k=top_k)

        return {"success": False, "error": f"Unknown tool: '{tool_name}'"}

    def get_tool_log(self, limit=50):
        """Returns executed tool audit logs."""
        return self.memory_db.get_tool_audit_log(limit=limit)

    def get_system_config(self):
        """Returns active system configuration."""
        return self.config_mgr.get_all()

    def save_system_config(self, config_dict):
        """Updates and persists system configuration."""
        if isinstance(config_dict, dict):
            self.config_mgr.update(config_dict)
            saved = self.config_mgr.save()
            # Update active router attributes
            if "fast_model" in config_dict:
                self.model_router.fast_model = config_dict["fast_model"]
            if "advanced_model" in config_dict:
                self.model_router.advanced_model = config_dict["advanced_model"]
            if "model_mode" in config_dict:
                self.model_router.mode = config_dict["model_mode"]
            return {"success": saved}
        return {"success": False, "error": "Expected dictionary."}

    def get_routing_history(self):
        """Returns recent router decisions and latencies."""
        return self.model_router.get_history()

if __name__ == "__main__":
    api = BackendAPI()
    html_file = get_asset_path("index.html")
    icon_file = get_asset_path(os.path.join("assets", "raiden.ico"))

    base_dir = os.path.dirname(os.path.abspath(__file__))
    local_app_data = os.environ.get("LOCALAPPDATA", base_dir)
    storage_dir = os.path.join(local_app_data, "RaidenAI", "webview_data")
    try:
        os.makedirs(storage_dir, exist_ok=True)
    except Exception:
        storage_dir = None

    window = webview.create_window(
        title="RAIDEN",
        url=html_file,
        js_api=api,
        width=1200,
        height=800,
        min_size=(880, 620),
        resizable=True
    )
    api.set_window(window)

    start_kwargs = {"private_mode": False}
    if storage_dir:
        start_kwargs["storage_path"] = storage_dir
    if os.path.exists(icon_file):
        start_kwargs["icon"] = icon_file

    webview.start(**start_kwargs)
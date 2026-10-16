# ⚡ RAIDEN AI — Local-First Desktop AI Companion & Assistant

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg?logo=windows)](https://microsoft.com)
[![Engine: Ollama](https://img.shields.io/badge/Engine-Ollama%20Local%20LLM-black.svg?logo=ollama)](https://ollama.com)
[![Frontend: Electron%20%2B%20HTML5%20Canvas](https://img.shields.io/badge/Frontend-Electron%20%7C%20HTML5%20Canvas-cyan.svg)](https://electronjs.org)
[![Python: 3.10%2B](https://img.shields.io/badge/Python-3.10%2B-yellow.svg?logo=python)](https://python.org)
[![Privacy: 100%20Local](https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Private-green.svg)](#-privacy--security-architecture)
[![Zero Cloud API Keys](https://img.shields.io/badge/API%20Keys-Zero%20Required-success.svg)](#-zero-api-key-web-research--scraping)

> **RAIDEN AI** is a state-of-the-art, local-first desktop AI companion and developer assistant running entirely on your Windows PC. It combines a **private dual-model local LLM brain** (via Ollama) with a **reactive 16-bit retro pixel-art desktop mascot**, **Win32 OS activity perception**, **autonomous web research**, **persistent SQLite memory**, and **allowlist-guarded PC tools**.
>
> **Zero cloud subscriptions. Zero tracking. Zero data leaving your machine.**

---

## 📑 Table of Contents

- [⚡ Key Features Overview](#-key-features-overview)
- [🧠 Dual-Model Local AI Brain & Intelligent Router](#-dual-model-local-ai-brain--intelligent-router)
- [🔥 Real-Time Witty English Persona & Code Roaster](#-real-time-witty-english-persona--code-roaster)
- [🐾 Advanced Living Mascot & Animation Engine](#-advanced-living-mascot--animation-engine)
  - [4 Distinct Companion Personalities](#4-distinct-companion-personalities)
  - [15 Behavior States & Procedural Micro-Kinetics](#15-behavior-states--procedural-micro-kinetics)
  - [Privacy-Preserving Typing Reaction](#privacy-preserving-typing-reaction)
  - [Genuine Win32 Spotify & Media Playback Detection](#genuine-win32-spotify--media-playback-detection)
  - [AI Lifecycle Synchronization & Stateful Restoration](#ai-lifecycle-synchronization--stateful-restoration)
- [🇮🇳 Massive 600+ Situational Hinglish Dialogue Repository](#-massive-600-situational-hinglish-dialogue-repository)
- [👁️ Screen Perception & Visual Context Awareness](#️-screen-perception--visual-context-awareness)
- [🌐 Zero-API-Key Web Research & Live Scraping](#-zero-api-key-web-research--live-scraping)
- [💾 Persistent Local Memory (SQLite)](#-persistent-local-memory-sqlite)
- [🛡️ Allowlist-Guarded Safe PC Tools](#️-allowlist-guarded-safe-pc-tools)
- [🛠️ Configuration Guide (`raiden_config.json`)](#️-configuration-guide-raiden_configjson)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [📦 Compiling into a Standalone Native Executable (`.exe`)](#-compiling-into-a-standalone-native-executable-exe)
- [🧪 Running Automated Test Suites](#-running-automated-test-suites)
- [🔒 Privacy & Security Architecture](#-privacy--security-architecture)

---

## ⚡ Key Features Overview

| Feature | Capability | Technology / Architecture |
| :--- | :--- | :--- |
| **Local LLM Inference** | 100% on-device text generation with zero cloud latency or cost | [Ollama](https://ollama.com) (`qwen2.5-coder:3b`, `llama3.1:8b`) |
| **Dual-Model Router** | Microsecond query classification into Fast vs. Advanced tiers | Deterministic sub-millisecond rule classifier |
| **VRAM Safe Loading** | Flushes VRAM before swapping models; 4GB GPU friendly (GTX 1650) | `keep_alive=0` sequential model eviction |
| **Real-Time Witty Persona** | Funny, sarcastic English developer banter & playful code roasts | Comedic prompt pipeline with "Redemption Fix" |
| **Situational Hinglish Bank** | 629 curated situational one-liners with zero runtime LLM latency | Rich JSON repository across 20 desktop situations |
| **Living Pixel Mascot** | 16-bit retro desktop companion with procedural kinematics | HTML5 Canvas 2D + Electron transparent overlay |
| **Music Mode & Headphones** | Rhythmic 120-BPM dance, glowing DJ equalizer headphones, notes | Win32 window title tracking (Spotify, VLC, etc.) |
| **Typing Reactions** | Glances at composer and types on mini holographic keyboard HUD | Pure activity signals, 1800ms debounce, zero text logging |
| **Screen Perception** | Understands active IDE, terminal errors, or browser context | Background screen observer service with local OCR |
| **Free Web Research** | Real-time live web search and scraping without API keys | DuckDuckGo lite provider + HTML scraper |
| **Persistent Memory** | Remembers facts, preferences, and project context across sessions | SQLite (`raiden_memory.db`) with secret sanitizer |
| **Safe PC Tools** | Launches approved apps & reads/writes isolated project files | Allowlist sandbox with sensitive action confirmations |

---

## 🧠 Dual-Model Local AI Brain & Intelligent Router

RAIDEN employs a **dual-model architecture** designed to balance rapid responsiveness with deep analytical intelligence:

```
                          ┌──────────────────────────┐
                          │    Incoming User Prompt  │
                          └─────────────┬────────────┘
                                        │
                         ▼ Sub-millisecond Analysis ▼
                    ┌──────────────────────────────────────┐
                    │      Deterministic ModelRouter       │
                    │   (Syntax, stack traces, logic, math)│
                    └───────┬──────────────────────┬───────┘
                            │                      │
           [Complex: Proofs, Arch, Bugs]    [Routine: Chat, Definitions, Lookups]
                            │                      │
                            ▼                      ▼
               ┌────────────────────────┐  ┌────────────────────────┐
               │ Advanced Model (7B-8B) │  │    Fast Model (3B)     │
               │    e.g. llama3.1:8b    │  │  e.g. qwen2.5-coder:3b │
               └────────────────────────┘  └────────────────────────┘
```

1. **Fast Model (`qwen2.5-coder:3b`)**: Optimized for immediate sub-second answers, short Q&A, syntax lookups, quick explanations, and daily banter.
2. **Advanced Model (`llama3.1:8b` or `qwen2.5:7b`)**: Activated for complex multi-file architectural reasoning, formal mathematical algorithms, intricate stack trace debugging, and comprehensive code generation.
3. **Hardware Safety for 4GB VRAM (GTX 1650 & AMD Ryzen Laptops)**:
   - **Concurrency Locking**: Guarantees only one model generation runs at any moment.
   - **Sequential Memory Flushing**: Before loading a new model into VRAM, RAIDEN unloads the active model from GPU memory (`keep_alive=0`) and executes garbage collection, completely eliminating out-of-memory crashes on entry-level GPUs.
4. **Three User Modes**:
   - `Auto`: Dynamic intelligent routing based on prompt intent and complexity.
   - `Fast`: Enforces 100% 3B inference for minimum battery and resource consumption.
   - `Advanced`: Prioritizes the larger model for deep, thorough engineering tasks.

---

## 🔥 Real-Time Witty English Persona & Code Roaster

In real-time conversations, RAIDEN acts like a sharp, witty, supportive senior software engineer sitting right beside you:

* **No Corporate Filler**: Never opens with robotic pleasantries like *"Certainly! I'd be happy to assist you with that today!"* — it jumps directly into the solution.
* **Playful & Sarcastic Roasts**: When you ask RAIDEN to roast your code, choice of variable names (`data_final_really_v2`), or late-night debugging habits, it delivers razor-sharp comedic burns in crisp English.
* **The "Redemption Fix"**: Immediately following a roast, RAIDEN provides clean, elegant, production-ready, beautifully formatted refactored code with explanatory comments.

---

## 🐾 Advanced Living Mascot & Animation Engine

RAIDEN's mascot is an interactive retro pixel-art desktop companion designed with an arcade visual aesthetic. It can live docked right beside your chat composer or float freely across your Windows desktop.

### 4 Distinct Companion Personalities

You can switch companions at any time via the companion roster modal:

```
  [VOID] 🐱                 [PIXEL] 🐶               [NOVA] 🌟                 [CIPHER] ⚡
Cyber-Ronin Ninja Cat      Hyper Cyber-Puppy        Cyberpunk Diva           Terminal Daemon
Electric-cyan plasma tail  Floppy ears, 500 RPM wag Starlight twin-tails     Matrix scope & HUD
Sarcastic & razor-sharp    Playful & enthusiastic   Dramatic & aesthetic     Stoic & analytical
```

### 15 Behavior States & Procedural Micro-Kinetics

The mascot is driven by procedural mathematics and kinetic calculations, ensuring natural movement without static sprite freezing:

* **Ambient Idle Life**: Natural sinusoidal breathing (0.8Hz), natural eye blinking (2.8s intervals), ear twitches, and gentle tail physics.
* **Sleep & Wake Cycle**: After 45 seconds of complete inactivity, the companion curls up into low-power sleep with floating cyan `zZz` particles. When you move your cursor or return to the editor, it stretches and wakes up with an alert blip.
* **Emotional Expressions**: Supports `neutral`, `happy`, `confident`, `annoyed`, and `thinking` facial expressions mapped to state transitions.

### Privacy-Preserving Typing Reaction

When you type into RAIDEN's composer:
* The mascot turns its eyes toward your input (`glanceX: -0.7`, `glanceY: 0.4`), perks its cyber-ears, and rapidly taps along with alternating paws over an animated **neon holographic keyboard matrix HUD** with `typing_sparks`.
* **Smooth 1800ms Debounce**: Bridges natural typing pauses so the character never flickers between typing and idle.
* **100% Privacy-Preserving**: Only receives a pure boolean typing activity signal. **Never inspects, parses, stores, or transmits your typed keystroke content.**

### Genuine Win32 Spotify & Media Playback Detection

RAIDEN includes a non-intrusive Windows media detector ([`music_detector.py`](file:///c:/Users/kmkdg/OneDrive/Desktop/Raiden%20AI/raiden_core/music_detector.py)):
* **Zero Fake Timers**: Queries native Win32 window titles (`ctypes.windll.user32`) to detect Spotify track titles (`{Artist} - {Track}`) as well as media players (VLC, Media Player).
* **Music Mode Groove**: When music starts, the mascot puts on **glowing cyber-headphones with animated 3-band LED equalizer bars** pulsing at a 120-BPM rhythm (`Math.sin(now * 0.0125)`), sways back and forth, and emits floating musical note particles (`♪`, `♫`).
* **Live Status Badge**: Displays `● VIBING: {Track Title} 🎵` in the companion HUD.

### AI Lifecycle Synchronization & Stateful Restoration

* **Thinking**: Mascot concentrates on an animated holographic terminal window (`NEURAL_ROUTER`) with moving scanlines.
* **Streaming**: Visor and waveform rings pulse dynamically in sync with incoming token chunks.
* **Celebration & Stateful Restoration**: When an AI task completes or you commit code, RAIDEN plays an acrobatic victory flip and an 8-bit chime. Crucially, the **behavior state machine remembers your persistent baseline** (`persistentState`): when the victory animation ends, it smoothly returns to music groove or typing rather than blindly resetting to idle.

---

## 🇮🇳 Massive 600+ Situational Hinglish Dialogue Repository

To prevent small local LLMs from generating awkward or broken Romanized Hindi, RAIDEN completely separates real-time generation from situational triggers:

* **Real-time LLM inference** operates strictly in **witty English**.
* **Pre-authored situational reactions** draw from a repository of **629 authentic Hinglish dialogues** in [`hinglish_data.json`](file:///c:/Users/kmkdg/OneDrive/Desktop/Raiden%20AI/raiden_core/hinglish_data.json) covering 20 desktop situations with **0ms latency**:

| Situation Category | Situational Context | Example Hinglish Reaction |
| :--- | :--- | :--- |
| `CODING_SYNTAX_ERROR` | Syntax error caught on line | *"Arrey deva! Syntax error ne aukaat dikha di! Check line {line}."* |
| `CODING_LOGIC_BLOCK` | Cursor stationary for >20s | *"Bhai soch raha hai ya cursor ke saath stare contest chal raha hai? 😂"* |
| `CODING_BUILD_SUCCESS`| Clean build / tests passed | *"OHHO! Developer sahab cooked today! Build ekdum green! 🚀"* |
| `GIT_COMMIT_PUSH` | Git commit staged | *"Commit locked and loaded! Push maar do bindaas! 🌿"* |
| `CODING_BURST_FLOW` | Sustained typing >100 WPM | *"120 WPM speed! Ungliyan aag ugal rahi hain keyboard pe! ⚡"* |
| `APP_SWITCH_CODING_TO_GAMING` | Switched from IDE to Steam | *"Code gaya tel lene, direct clutch mode on! 🎮 Production phata pada hai aur lobby mein!"* |
| `APP_SWITCH_CODING_TO_BROWSING` | Switched from IDE to Chrome | *"Code se sidha browser? Lagta hai CSS ne aukaat dikha di! Tabs 50 mat khol lena."* |
| `FILE_SAVE` | Saved file (Ctrl+S) | *"File save locked! Muscle memory OP! Ab light chali jaye toh tension nahi."* |
| `MUSIC_PLAYING` | Spotify playback started | *"Vibe check passed! DJ Raiden in the house! Drop the bass, fix the bug! 🎧🎵"* |
| `LATE_NIGHT_GRIND` | Coding between 11 PM – 5 AM | *"Raat ke 2 baje production debug? Bhai kal subah standup mein rona mat!"* |
| `SYSTEM_HIGH_RAM` | RAM load cross 85% | *"Bhai Chrome ke 80 tabs band kar de, RAM rone wali hai! 🔥"* |

---

## 👁️ Screen Perception & Visual Context Awareness

RAIDEN includes an autonomous background visual perception service ([`screen_observer.py`](file:///c:/Users/kmkdg/OneDrive/Desktop/Raiden%20AI/raiden_core/screen_observer.py)):
* **Contextual Desktop Awareness**: Non-intrusively captures and analyzes screen frames locally to detect active IDEs, open documentation, terminal error traces, or video playback.
* **Proactive Commentary**: When a terminal error or notable event appears on screen, RAIDEN alerts you with visual badge updates (`● VIS: VS CODE 👀`) and speech commentary.
* **User-Controllable**: Runs 100% locally on your device and can be toggled on or off with a single click in the settings menu.

---

## 🌐 Zero-API-Key Web Research & Live Scraping

* **Free Web Research**: Uses DuckDuckGo lite search, requiring **zero API keys, zero Google tokens, and zero external subscriptions**.
* **Automatic Query Intent**: Activates automatically whenever you inquire about live facts, current library releases, weather, financial prices, or breaking news.
* **Safe Content Scraper**: Extracts page content with strict 6-second timeouts, 1MB size limits, and tag stripping (`<script>`, `<nav>`, `<footer>`, `<style>`).
* **Prompt Injection Defense**: Scraped web text is strictly quarantined as untrusted reference context in system prompts; external web content is barred from issuing tool commands or overriding instructions.
* **Clickable Markdown Citations**: Responses citing web sources include clickable URLs `[Source Title](url)`.
* **Air-Gapped Offline Mode**: An explicit toggle in settings blocks all outbound HTTP/HTTPS requests.

---

## 💾 Persistent Local Memory (SQLite)

RAIDEN remembers details about you and your workflow across sessions using an embedded SQLite database (`raiden_memory.db`):

* **Automatic Context Retention**: Remembers your preferred programming languages, libraries, framework conventions, personal preferences, and project names.
* **Credential & Secret Sanitizer**: Intercepts and rejects storing passwords, API keys, bearer tokens, or sensitive credentials before writing to disk.
* **Token-Matched Prompt Injection**: Relevant memories are injected dynamically into chat context within configurable bounds (default: top 5 items, max 800 characters).
* **Memory Management Modal**: Built-in UI to view, search, add, or delete individual memories, or wipe history completely.

---

## 🛡️ Allowlist-Guarded Safe PC Tools

RAIDEN can interact with your Windows environment under strict security constraints:

1. **Approved Application Launcher**: Safely launches vetted Windows productivity utilities (`notepad`, `calc`, `explorer`, `code`, `cmd`, `powershell`). Arbitrary binary paths are rejected.
2. **Workspace Isolation**: File reading and writing operations are restricted to approved workspace folders (`.`). Path traversal (`../`) outside permitted boundaries is blocked.
3. **Sensitive Action Confirmations**: Modifying existing files or executing permitted shell inspection commands (`git status`, `python --version`) requires explicit user confirmation via dialog.
4. **Audit Logging**: Every tool invocation, argument, and execution outcome is permanently logged in the SQLite `tool_audit_log` table.

---

## 🛠️ Configuration Guide (`raiden_config.json`)

All configuration options are stored locally in `raiden_config.json`:

```json
{
  "fast_model": "qwen2.5-coder:3b",
  "advanced_model": "llama3.1:8b",
  "model_mode": "auto",
  "context_length": 4096,
  "temperature": 0.6,
  "top_p": 0.85,
  "sequential_model_loading": true,
  "max_concurrent_inference": 1,
  "web_search_enabled": false,
  "search_provider": "duckduckgo",
  "search_api_url": "",
  "search_api_key": "",
  "search_max_results": 3,
  "network_timeout_seconds": 6,
  "offline_mode": false,
  "memory_enabled": true,
  "memory_max_injected_items": 5,
  "database_path": "raiden_memory.db",
  "allowed_workspaces": [
    "."
  ],
  "tool_confirm_sensitive": true,
  "screen_perception_enabled": false,
  "log_level": "INFO"
}
```

### Environment Variable Overrides
Any setting can be overridden using environment variables:
* `RAIDEN_FAST_MODEL` (e.g. `qwen2.5-coder:3b`)
* `RAIDEN_ADVANCED_MODEL` (e.g. `llama3.1:8b`)
* `RAIDEN_MODEL_MODE` (`auto`, `fast`, or `advanced`)
* `RAIDEN_OFFLINE_MODE` (`1` or `true`)
* `RAIDEN_SEARCH_API_KEY` (Custom search API key if used)

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
* **Windows 10 or 11** (64-bit)
* **Python 3.10+** (Tested up to Python 3.14)
* **[Ollama](https://ollama.com)** (Download and install)

### 2. Setup Ollama Models
Open your terminal and pull the local models:
```bash
ollama pull qwen2.5-coder:3b
ollama pull llama3.1:8b
```

### 3. Install Dependencies
Clone the repository and install the Python dependencies:
```bash
cd "Raiden AI"
pip install -r requirements.txt
```

### 4. Launch RAIDEN
You have three options for starting RAIDEN:

* **Standard Launch (Python)**:
  ```bash
  python main.py
  ```
* **Silent Native Launch (No Command Prompt Window)**:
  Double-click `launch_raiden.vbs` or run:
  ```cmd
  wscript launch_raiden.vbs
  ```
* **Create a 1-Click Desktop Shortcut**:
  ```bash
  python create_desktop_shortcut.py
  ```
  Creates a native Windows desktop shortcut (`Raiden AI.lnk`) with the official custom icon.

* **Launch the Floating Electron Mascot Widget**:
  ```bash
  npx electron .
  ```

---

## 📦 Compiling into a Standalone Native Executable (`.exe`)

You can compile RAIDEN into a standalone native Windows executable (`Raiden.exe`) using PyInstaller:

```bash
python build_desktop_app.py
```

* **Output**: `dist/Raiden/Raiden.exe`
* Bundles all HTML, CSS, JavaScript, icons, and backend runtime files.
* **Target Machine Requirement**: Requires **only Ollama** installed on the destination computer. Python is not required.

---

## 🧪 Running Automated Test Suites

RAIDEN comes with comprehensive test coverage verifying all subsystems:

```bash
# 1. Full Python Backend Test Suite (53 tests)
python -m pytest

# 2. Advanced Living Mascot & Animation Engine Suite
node tests/test_living_mascot_engine.js

# 3. Companion Acceptance Criteria & Streaming Latency Suite
node tests/test_companion_system.js

# 4. Mascot Controller Core Suite
node tests/test_mascot_engine.js

# 5. Live Comprehensive 12-Category AI Evaluation
python test_evaluation.py
```

---

## 🔒 Privacy & Security Architecture

1. **Zero Cloud Telemetry**: Conversations, screen observations, and activity snapshots never leave your local machine.
2. **Strict Web Isolation**: Scraped web text is strictly delimited in prompt blocks to prevent prompt injection exploits.
3. **Electron Security Standards**:
   - `contextIsolation: true`
   - `nodeIntegration: false`
   - Restrictive IPC bridge with narrow preload validation.
4. **Air-Gapped Operation**: Turn on `offline_mode` in settings to block all outbound network traffic while keeping full AI chat and mascot features active.
5. **Secret Sanitization**: Memory engine prevents accidental persistence of passwords, tokens, and keys.

---

## 📄 License & Credits

* **Built & Designed by**: Ruhaan
* **Core Technologies**: Ollama, PyWebView, Electron, HTML5 Canvas Web Audio API, SQLite3
* **License**: MIT License — open, local, and private.

# RAIDEN AI — Local-First Desktop Assistant

> **Version 2.0 — Dual-Model Intelligence & Local Autonomy Upgrade**  
> Running on-device with zero required cloud dependencies, intelligent dual-model routing, SQLite-backed persistent memory, optional web research grounding, and allowlist-guarded desktop tools.

---

## ⚡ Key Upgrades in Version 2.0

### 1. Dual-Model Architecture & Intelligent Router
- **Fast Model (3B)**: Default `qwen2.5-coder:3b` optimized for rapid chit-chat, syntax lookups, quick summaries, and routine questions.
- **Advanced Model (7B–8B)**: Optional support for compatible local models (e.g., `llama3.1:8b` or `qwen2.5:7b`).
- **Deterministic `ModelRouter`**: Classifies query complexity in sub-millisecond time using transparent rules (algorithms, architecture, stack traces, proofs -> Advanced model; greetings, definitions, short Q&A -> Fast model).
- **Graceful Fallback**: If an advanced model is requested or auto-routed but not installed locally, RAIDEN transparently falls back to the fast model with zero application interruption.
- **Three User Modes**:
  - `Auto`: Dynamic complexity routing.
  - `Fast`: 100% 3B execution for minimal resource consumption.
  - `Advanced`: Prioritizes the larger model for deep analysis.

### 2. Hardware Safety & Sequential Model Loading
- **Tailored for 4 GB VRAM / 16 GB RAM (GTX 1650 & AMD Ryzen 7 3750H)**:
  - Strict concurrency locking prevents simultaneous generations.
  - Sequential model switching: When switching between models, Ollama explicitly unloads the previously active model from VRAM (`keep_alive=0`) and runs garbage collection before loading the next model.
  - Zero auto-downloads: Large models are never downloaded without user initiation.

### 3. Persistent Local Memory (SQLite)
- **Database**: `raiden_memory.db` stores conversation turns, user-approved facts, and preferences across application restarts.
- **Privacy & Secret Filter**: Automatically rejects storing passwords, API keys, bearer tokens, or credentials in memory.
- **Context Injection**: Relevant memories are retrieved via token matching and injected with configurable limits (max 5 items, max 800 characters) into prompt context.
- **Management UI**: Full inspection modal to view, add, or delete individual memories, or clear history.

### 4. Optional Online Web Research & Scraping
- **Search Provider**: Configurable. Defaults to DuckDuckGo lite search (requiring **zero API keys** and zero external subscription costs). Also supports custom search API endpoints.
- **Lightweight Scraper**: Uses `requests` and `BeautifulSoup` with finite timeouts (6s), 1MB size caps, and tag stripping (`<script>`, `<nav>`, `<footer>`).
- **Untrusted Data Boundary**: Web content is explicitly delimited as untrusted reference material; system prompts forbid web content from executing commands or overriding rules.
- **Clickable Citations**: Sourced responses cleanly cite clickable URLs `[Title](url)`.
- **Strict Offline Mode**: Toggleable offline mode blocks all outbound network requests.

### 5. Allowlist-Guarded Personal Computer Tools
- **Approved Applications**: Launches approved utilities (`notepad`, `calc`, `explorer`, `code`, `cmd`, `powershell`). Arbitrary binaries are rejected.
- **Isolated Workspace File Access**: Strictly isolated to approved workspaces (`.`). Path traversal (`..`) outside the workspace is denied.
- **Permission Confirmation**: Modifying files or executing permitted inspection commands (`git status`, `python --version`, etc.) requires explicit confirmation.
- **Audit Logging**: Every tool request and outcome is logged to `tool_audit_log` in SQLite.

---

## 🛠️ Configuration (`raiden_config.json`)

Configuration is managed centrally in `raiden_config.json`:

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
  "log_level": "INFO"
}
```

### Environment Variable Overrides
- `RAIDEN_FAST_MODEL` (e.g. `qwen2.5-coder:3b`)
- `RAIDEN_ADVANCED_MODEL` (e.g. `llama3.1:8b`)
- `RAIDEN_MODEL_MODE` (`auto`, `fast`, or `advanced`)
- `RAIDEN_SEARCH_API_KEY` (Optional custom search key)
- `RAIDEN_OFFLINE_MODE` (`1` or `true`)

---

## 🚀 Getting Started

### 1. Requirements
- Python 3.10+ (Tested on Python 3.14)
- [Ollama](https://ollama.ai) installed and running locally
- Fast Model pulled:
  ```bash
  ollama pull qwen2.5-coder:3b
  ```
- (Optional) Advanced 7B-8B Model pulled:
  ```bash
  ollama pull llama3.1:8b
  ```

### 2. Launching RAIDEN
```bash
python main.py
```

### 3. Running Automated Tests
- **Core Subsystem & Integration Test Suite (27 tests, <5s execution)**:
  ```bash
  pytest
  ```
- **Live 12-Category Comprehensive Evaluation Suite (Deterministic checks & live inference)**:
  ```bash
  python test_evaluation.py
  ```
- **Personality & Tone Validation Suite**:
  ```bash
  python test_behavior.py
  ```

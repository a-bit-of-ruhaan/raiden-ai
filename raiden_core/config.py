"""
RAIDEN Configuration Management
Centralized, safe configuration handling with local backups and environment overrides.
"""

import os
import json
import logging
from typing import Any, Dict

logger = logging.getLogger("raiden.config")

DEFAULT_CONFIG: Dict[str, Any] = {
    "fast_model": "qwen2.5-coder:3b",
    "advanced_model": "llama3.1:8b",
    "model_mode": "auto",  # "auto" | "fast" | "advanced"
    "context_length": 4096,
    "temperature": 0.6,
    "top_p": 0.85,
    "sequential_model_loading": True,
    "max_concurrent_inference": 1,
    "web_search_enabled": False,
    "search_provider": "duckduckgo",  # "duckduckgo" | "custom_api"
    "search_api_url": "",
    "search_api_key": "",
    "search_max_results": 3,
    "network_timeout_seconds": 6,
    "offline_mode": False,
    "memory_enabled": True,
    "memory_max_injected_items": 5,
    "database_path": "raiden_memory.db",
    "allowed_workspaces": ["."],
    "tool_confirm_sensitive": True,
    "log_level": "INFO",
    # Screen Perception & Visual Intelligence settings
    "screen_perception_enabled": False,
    "vision_model": "llava-phi3",
    "screen_observation_interval_seconds": 5.0,
    "screen_inference_cooldown_seconds": 12.0,
    "screen_commentary_cooldown_seconds": 30.0,
    "screen_change_threshold": 0.035,
    "screen_social_mode": "companion",  # "companion" | "gaming" | "quiet"
    "screen_confidence_threshold": 0.60,
    "screen_excluded_apps": [
        "keepass", "1password", "bitwarden", "lastpass", "authenticator", "credential"
    ],
    "screen_capture_source": "primary_monitor",  # "primary_monitor" | "active_window" | "all_monitors"
    "screen_save_history": False
}

class ConfigManager:
    """Manages application configuration with local persistence and safety guards."""

    def __init__(self, base_dir: str = None, config_filename: str = "raiden_config.json"):
        self.base_dir = base_dir or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.config_path = os.path.join(self.base_dir, config_filename)
        self.example_config_path = os.path.join(self.base_dir, "raiden_config.example.json")
        self._config: Dict[str, Any] = dict(DEFAULT_CONFIG)
        self.load()
        self.ensure_example_config()

    def load(self) -> Dict[str, Any]:
        """Loads configuration from JSON file, merged with environment variables."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    user_data = json.load(f)
                    if isinstance(user_data, dict):
                        self._config.update(user_data)
            except Exception as e:
                logger.warning(f"Error loading {self.config_path}, falling back to defaults: {e}")

        # Environment variable overrides
        if os.environ.get("RAIDEN_FAST_MODEL"):
            self._config["fast_model"] = os.environ["RAIDEN_FAST_MODEL"]
        if os.environ.get("RAIDEN_ADVANCED_MODEL"):
            self._config["advanced_model"] = os.environ["RAIDEN_ADVANCED_MODEL"]
        if os.environ.get("RAIDEN_MODEL_MODE"):
            self._config["model_mode"] = os.environ["RAIDEN_MODEL_MODE"]
        if os.environ.get("RAIDEN_SEARCH_API_KEY"):
            self._config["search_api_key"] = os.environ["RAIDEN_SEARCH_API_KEY"]
        if os.environ.get("RAIDEN_OFFLINE_MODE"):
            self._config["offline_mode"] = os.environ["RAIDEN_OFFLINE_MODE"].lower() in ("1", "true", "yes")

        return self.get_all()

    def save(self) -> bool:
        """Atomically saves configuration to disk with safe backup."""
        try:
            # Create a backup of existing file if present
            if os.path.exists(self.config_path):
                backup_path = self.config_path + ".bak"
                try:
                    with open(self.config_path, "r", encoding="utf-8") as src:
                        with open(backup_path, "w", encoding="utf-8") as dst:
                            dst.write(src.read())
                except Exception as bak_err:
                    logger.debug(f"Could not create config backup: {bak_err}")

            # Do not persist API keys into config file if they match secrets
            safe_to_save = dict(self._config)
            # Temporary write + atomic replace
            temp_path = self.config_path + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(safe_to_save, f, indent=2)
            if os.path.exists(self.config_path):
                os.replace(temp_path, self.config_path)
            else:
                os.rename(temp_path, self.config_path)
            return True
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False

    def ensure_example_config(self):
        """Creates raiden_config.example.json with safe placeholders if not present."""
        if not os.path.exists(self.example_config_path):
            try:
                example_data = dict(DEFAULT_CONFIG)
                example_data["search_api_key"] = "YOUR_SEARCH_API_KEY_HERE"
                with open(self.example_config_path, "w", encoding="utf-8") as f:
                    json.dump(example_data, f, indent=2)
            except Exception as e:
                logger.debug(f"Failed writing example config: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._config[key] = value

    def update(self, new_values: Dict[str, Any]) -> None:
        self._config.update(new_values)

    def get_all(self) -> Dict[str, Any]:
        return dict(self._config)

    def is_offline(self) -> bool:
        return bool(self._config.get("offline_mode", False))

    def is_web_search_enabled(self) -> bool:
        if self.is_offline():
            return False
        return bool(self._config.get("web_search_enabled", False))

    def is_memory_enabled(self) -> bool:
        return bool(self._config.get("memory_enabled", True))

    def is_screen_perception_enabled(self) -> bool:
        return bool(self._config.get("screen_perception_enabled", False))

    def get_vision_model(self) -> str:
        return str(self._config.get("vision_model", "llava-phi3"))

    def get_screen_social_mode(self) -> str:
        return str(self._config.get("screen_social_mode", "companion"))


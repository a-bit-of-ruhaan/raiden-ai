import os
import shutil
import unittest
from unittest.mock import patch, MagicMock
from main import BackendAPI, DEFAULT_SYSTEM_PROMPT

class TestBackendAPI(unittest.TestCase):
    def setUp(self):
        # Back up existing config
        self.config_path = "raiden_config.json"
        self.bak_path = "raiden_config.json.testbak"
        if os.path.exists(self.config_path):
            shutil.copyfile(self.config_path, self.bak_path)
        self.api = BackendAPI()

    def tearDown(self):
        # Restore original config
        if os.path.exists(self.bak_path):
            shutil.copyfile(self.bak_path, self.config_path)
            os.remove(self.bak_path)

    def test_initialization(self):
        self.assertIsNotNone(self.api.model_router)
        self.assertIsNotNone(self.api.model_manager)
        self.assertIsNotNone(self.api.memory_db)
        self.assertIsNotNone(self.api.research_answerer)
        self.assertIsNotNone(self.api.tool_manager)
        self.assertEqual(self.api.active_model, "qwen2.5-coder:3b")

    def test_model_config_endpoints(self):
        config = self.api.get_model_config()
        self.assertIn("fast_model", config)
        self.assertIn("advanced_model", config)
        self.assertIn("model_mode", config)

        # Set mode
        res = self.api.set_model_mode("fast")
        self.assertTrue(res["success"])
        self.assertEqual(self.api.model_router.mode, "fast")

        # Set advanced model
        res = self.api.set_advanced_model("llama3.1:8b")
        self.assertTrue(res["success"])
        self.assertEqual(self.api.model_router.advanced_model, "llama3.1:8b")

    def test_toggles(self):
        res = self.api.toggle_web_search(True)
        self.assertTrue(res["success"])
        self.assertTrue(self.api.config_mgr.is_web_search_enabled())

        res = self.api.toggle_offline_mode(True)
        self.assertTrue(res["success"])
        self.assertTrue(self.api.config_mgr.is_offline())

        res = self.api.toggle_offline_mode(False)
        self.assertTrue(res["success"])
        self.assertFalse(self.api.config_mgr.is_offline())

        res = self.api.toggle_memory(True)
        self.assertTrue(res["success"])
        self.assertTrue(self.api.config_mgr.is_memory_enabled())

    def test_memory_crud_api(self):
        add_res = self.api.add_memory("User enjoys dark mode UI", category="preference")
        self.assertTrue(add_res["success"])
        mem_id = add_res["id"]

        mems = self.api.get_memories()
        self.assertTrue(any(m["id"] == mem_id for m in mems))

        del_res = self.api.delete_memory(mem_id)
        self.assertTrue(del_res["success"])

    def test_tool_execution_api(self):
        # Open app - allowlisted (mocked)
        with patch("subprocess.Popen") as mock_popen:
            res = self.api.execute_tool("open_app", {"app": "calc"})
            self.assertTrue(res["success"])
            mock_popen.assert_called_once()

        # Tool requiring confirmation
        res = self.api.execute_tool("execute_command", {"command": ["git", "status"]}, confirmed=False)
        self.assertFalse(res["success"])
        self.assertTrue(res.get("requires_confirmation"))

    @patch("ollama.chat")
    def test_chat_generation_with_memory_and_routing(self, mock_ollama_chat):
        mock_ollama_chat.return_value = {
            "message": {"content": "This is a routed test response."}
        }
        reply = self.api.chat(
            user_prompt="Who created you?",
            session_id="test_session"
        )
        self.assertEqual(reply, "This is a routed test response.")
        mock_ollama_chat.assert_called_once()

    def test_user_profile_api(self):
        profile_data = {
            "name": "Alex",
            "nickname": "Lex",
            "role": "Systems Programmer",
            "interests": "Rust, Python, Linux",
            "roast_level": "Playful"
        }
        res = self.api.save_user_profile(profile_data)
        self.assertTrue(res["success"])
        stored = self.api.get_user_profile()
        self.assertEqual(stored.get("name"), "Alex")
        self.assertEqual(stored.get("role"), "Systems Programmer")

        # Test clearing a field
        self.api.save_user_profile({"nickname": ""})
        cleared = self.api.get_user_profile()
        self.assertNotIn("nickname", cleared)

    def test_storage_and_sync_api(self):
        stats = self.api.get_storage_stats()
        self.assertIn("conversations_count", stats)
        self.assertIn("messages_count", stats)
        self.assertIn("db_size_kb", stats)

        # Sync sessions
        sessions = [
            {
                "id": "sync-test-session",
                "title": "Sync Test",
                "messages": [
                    {"role": "user", "content": "Hello RAIDEN"},
                    {"role": "assistant", "content": "Hello Alex!"}
                ]
            }
        ]
        sync_res = self.api.sync_conversations_to_db(sessions)
        self.assertTrue(sync_res["success"])
        self.assertEqual(sync_res["synced_messages"], 2)

        # Export and import
        export_json = self.api.export_all_data()
        self.assertTrue(export_json.startswith("{"))
        import_res = self.api.import_data(export_json)
        self.assertTrue(import_res["success"])

if __name__ == "__main__":
    unittest.main()


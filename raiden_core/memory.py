"""
RAIDEN Local Long-Term Memory Subsystem
SQLite-backed persistent memory, preference storage, privacy filtering,
and query-relevant context retrieval.
"""

import os
import re
import sqlite3
import datetime
import logging
import contextlib
from typing import List, Dict, Any, Optional

logger = logging.getLogger("raiden.memory")

# Secret patterns that must NEVER be stored in long-term memory
SECRET_PATTERNS = [
    r"bearer\s+[a-zA-Z0-9_\-\.]{15,}",
    r"api[_-]?key\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{16,}",
    r"password\s*[:=]\s*['\"]?\S+['\"]?",
    r"secret[_-]?key\s*[:=]\s*['\"]?\S+['\"]?",
    r"ghp_[a-zA-Z0-9]{36}",
    r"sk-[a-zA-Z0-9]{32,}",
    r"-----BEGIN (RSA|OPENSSH|PRIVATE) KEY-----"
]

class MemoryDB:
    """Persistent SQLite store for conversation history, user preferences, and facts."""

    def __init__(self, db_path: str = "raiden_memory.db"):
        self.db_path = db_path
        self._init_db()

    @contextlib.contextmanager
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        """Initializes database schema with safe migrations."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Long-term memories
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    content TEXT NOT NULL,
                    source TEXT DEFAULT 'user',
                    enabled INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_mem_category ON memories(category)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_mem_enabled ON memories(enabled)")

            # 2. Conversations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            # 3. Messages
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id)")

            # 4. Tool audit log
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tool_audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tool_name TEXT NOT NULL,
                    arguments TEXT,
                    status TEXT NOT NULL,
                    result TEXT,
                    timestamp TEXT NOT NULL
                )
            """)

            # 5. User Profile & Personalization Store
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_profile (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            conn.commit()

    def is_secret(self, text: str) -> bool:
        """Checks if text contains secrets or authentication credentials."""
        for pattern in SECRET_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def add_memory(self, content: str, category: str = "fact", source: str = "user") -> Optional[int]:
        """
        Adds a long-term memory entry if it passes privacy and secret filtering.
        """
        clean_content = content.strip()
        if not clean_content:
            return None

        # Privacy check: block storing secrets or sensitive credentials
        if self.is_secret(clean_content):
            logger.warning("Rejected memory storage: content contains suspected credentials or secrets.")
            return None

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Check for exact duplicates
            cursor.execute("SELECT id FROM memories WHERE content = ? AND category = ?", (clean_content, category))
            existing = cursor.fetchone()
            if existing:
                return existing["id"]

            cursor.execute(
                "INSERT INTO memories (category, content, source, enabled, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
                (category, clean_content, source, now, now)
            )
            conn.commit()
            return cursor.lastrowid

    def get_memories(self, category: Optional[str] = None, only_enabled: bool = True) -> List[Dict[str, Any]]:
        """Retrieves memories with optional filtering."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM memories WHERE 1=1"
            params = []
            if only_enabled:
                query += " AND enabled = 1"
            if category:
                query += " AND category = ?"
                params.append(category)
            query += " ORDER BY id DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def update_memory(self, memory_id: int, content: str, category: Optional[str] = None, enabled: Optional[bool] = None) -> bool:
        """Updates an existing memory item."""
        if content and self.is_secret(content):
            logger.warning("Rejected memory update: contains suspected secret.")
            return False

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            updates = ["updated_at = ?"]
            params = [now]
            if content is not None:
                updates.append("content = ?")
                params.append(content.strip())
            if category is not None:
                updates.append("category = ?")
                params.append(category.strip())
            if enabled is not None:
                updates.append("enabled = ?")
                params.append(1 if enabled else 0)

            params.append(memory_id)
            cursor.execute(f"UPDATE memories SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
            return cursor.rowcount > 0

    def delete_memory(self, memory_id: int) -> bool:
        """Deletes a memory item by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            conn.commit()
            return cursor.rowcount > 0

    def clear_all_memories(self) -> bool:
        """Clears all long-term memories."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories")
            conn.commit()
            return True

    def find_relevant_memories(self, query: str, limit: int = 5, max_chars: int = 800) -> List[Dict[str, Any]]:
        """
        Retrieves memories relevant to the query using token overlap and keyword matching.
        """
        all_mems = self.get_memories(only_enabled=True)
        if not all_mems or not query.strip():
            return []

        # Tokenize query into keywords (length >= 3, excluding common stop words)
        stop_words = {"the", "and", "for", "with", "that", "this", "from", "have", "what", "how", "why", "are", "you", "can"}
        tokens = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", query.lower())) - stop_words

        scored = []
        for mem in all_mems:
            content_lower = mem["content"].lower()
            score = 0
            for t in tokens:
                if t in content_lower:
                    score += 1
            # User preferences get a slight priority boost
            if mem["category"] == "preference":
                score += 0.5
            if score > 0:
                scored.append((score, mem))

        # Sort descending by score
        scored.sort(key=lambda x: x[0], reverse=True)

        selected = []
        total_len = 0
        for score, mem in scored[:limit]:
            if total_len + len(mem["content"]) > max_chars:
                break
            selected.append(mem)
            total_len += len(mem["content"])

        return selected

    def format_memory_context(self, query: str, limit: int = 5, max_chars: int = 800) -> str:
        """
        Formats relevant memories into a clean prompt context block.
        """
        relevant = self.find_relevant_memories(query, limit=limit, max_chars=max_chars)
        if not relevant:
            return ""

        lines = ["### RELEVANT LONG-TERM MEMORY"]
        for m in relevant:
            lines.append(f"- [{m['category'].upper()}] {m['content']}")
        lines.append("")
        return "\n".join(lines)

    # ------------------- Conversation History -------------------

    def record_conversation(self, conv_id: str, title: str):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at",
                (conv_id, title, now, now)
            )
            conn.commit()

    def record_message(self, conv_id: str, role: str, content: str):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO messages (conversation_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (conv_id, role, content, now)
            )
            conn.commit()

    def get_messages(self, conv_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT role, content, timestamp FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?",
                (conv_id, limit)
            )
            return [dict(r) for r in cursor.fetchall()]

    def clear_conversation(self, conv_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
            cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.commit()

    # ------------------- Tool Execution Audit Log -------------------

    def log_tool_execution(self, tool_name: str, arguments: str, status: str, result: str):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tool_audit_log (tool_name, arguments, status, result, timestamp) VALUES (?, ?, ?, ?, ?)",
                (tool_name, str(arguments), status, str(result)[:2000], now)
            )
            conn.commit()

    def get_tool_audit_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tool_audit_log ORDER BY id DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]

    # ------------------- User Personalization & Profile Store -------------------

    def set_user_profile_field(self, key: str, value: str):
        """Sets or updates a personal profile attribute (e.g. nickname, role, tech stack, roast level)."""
        clean_key = str(key).strip().lower()
        clean_val = str(value).strip() if value is not None else ""
        if not clean_key:
            return

        if not clean_val:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM user_profile WHERE key = ?", (clean_key,))
                conn.commit()
            return

        if self.is_secret(clean_val):
            logger.warning("Rejected profile storage: contains suspected secret.")
            return

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO user_profile (key, value, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                (clean_key, clean_val, now)
            )
            conn.commit()

    def get_user_profile(self) -> Dict[str, str]:
        """Retrieves user profile metadata dictionary."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT key, value FROM user_profile")
            rows = cursor.fetchall()
            return {r["key"]: r["value"] for r in rows}

    def update_user_profile(self, profile_dict: Dict[str, str]):
        """Bulk updates user profile attributes."""
        if not isinstance(profile_dict, dict):
            return
        for k, v in profile_dict.items():
            self.set_user_profile_field(k, str(v) if v is not None else "")

    def extract_and_update_profile(self, text: str) -> List[str]:
        """
        Auto-extracts personal facts, user name, role, or preferences from natural conversation
        and updates the persistent profile and memory store.
        """
        clean = (text or "").strip()
        if not clean or self.is_secret(clean):
            return []

        extracted = []
        lower = clean.lower()

        # 1. Name / Nickname patterns
        name_match = re.search(r"\b(?:call me|my name is|i am called|my nickname is)\s+([A-Za-z0-9_-]{2,20})\b", clean, re.IGNORECASE)
        if name_match:
            name = name_match.group(1).capitalize()
            self.set_user_profile_field("name", name)
            self.add_memory(f"User's name is {name}", category="profile")
            extracted.append(f"name: {name}")

        # 2. Role / Profession / Study patterns
        role_match = re.search(r"\b(?:i work as a?n?|i am a?n?|i'm a?n?|i study)\s+([a-zA-Z0-9_\-\s]{3,35})(?:\.|\,|$|\sand\b)", clean, re.IGNORECASE)
        if role_match:
            role = role_match.group(1).strip()
            # Avoid matching common filler phrases
            if not any(stop in role.lower() for stop in ["sure", "ready", "happy", "sorry", "tired", "busy", "fine"]):
                self.set_user_profile_field("role", role)
                self.add_memory(f"User is a {role}", category="profile")
                extracted.append(f"role: {role}")

        # 3. Programming language or stack preferences
        stack_match = re.search(r"\b(?:my main stack is|i primarily code in|i mostly use|my favorite language is)\s+([a-zA-Z0-9_\-\s\,]{2,40})(?:\.|\,|$)", clean, re.IGNORECASE)
        if stack_match:
            stack = stack_match.group(1).strip()
            self.set_user_profile_field("interests", stack)
            self.add_memory(f"User's tech stack / interests: {stack}", category="preference")
            extracted.append(f"interests: {stack}")

        # 4. Roast level preferences
        if re.search(r"\b(roast me|be savage|no mercy|go all out|destroy me)\b", lower):
            self.set_user_profile_field("roast_level", "Savage")
            extracted.append("roast_level: Savage")
        elif re.search(r"\b(don't roast me|be nice|no roasts|be gentle)\b", lower):
            self.set_user_profile_field("roast_level", "Gentle")
            extracted.append("roast_level: Gentle")

        return extracted

    # ------------------- Storage Statistics & Export/Import -------------------

    def get_storage_stats(self) -> Dict[str, Any]:
        """Calculates database metrics, message counts, and persistent data sizes."""
        stats = {
            "conversations_count": 0,
            "messages_count": 0,
            "memories_count": 0,
            "profile_fields_count": 0,
            "db_size_kb": 0,
            "db_path": self.db_path
        }
        try:
            if os.path.exists(self.db_path):
                stats["db_size_kb"] = round(os.path.getsize(self.db_path) / 1024, 1)

            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as c FROM conversations")
                stats["conversations_count"] = cursor.fetchone()["c"]

                cursor.execute("SELECT COUNT(*) as c FROM messages")
                stats["messages_count"] = cursor.fetchone()["c"]

                cursor.execute("SELECT COUNT(*) as c FROM memories")
                stats["memories_count"] = cursor.fetchone()["c"]

                cursor.execute("SELECT COUNT(*) as c FROM user_profile")
                stats["profile_fields_count"] = cursor.fetchone()["c"]
        except Exception as e:
            logger.debug(f"Error computing storage stats: {e}")

        return stats

    def get_all_conversations(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns recent conversations with their message counts."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.id, c.title, c.created_at, c.updated_at, COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                GROUP BY c.id
                ORDER BY c.updated_at DESC
                LIMIT ?
            """, (limit,))
            return [dict(r) for r in cursor.fetchall()]

    def export_all_data(self) -> Dict[str, Any]:
        """Exports all local SQLite data (profile, memories, conversations, messages)."""
        export = {
            "version": "2.0",
            "exported_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "profile": self.get_user_profile(),
            "memories": self.get_memories(only_enabled=False),
            "conversations": []
        }
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
            convs = [dict(c) for c in cursor.fetchall()]
            for conv in convs:
                cursor.execute("SELECT role, content, timestamp FROM messages WHERE conversation_id = ? ORDER BY id ASC", (conv["id"],))
                conv["messages"] = [dict(m) for m in cursor.fetchall()]
                export["conversations"].append(conv)

        return export

    def sync_sessions(self, sessions: List[Dict[str, Any]]) -> int:
        """Syncs frontend sessions and messages into SQLite database."""
        if not isinstance(sessions, list):
            return 0
        synced_count = 0
        for s in sessions:
            if not isinstance(s, dict):
                continue
            conv_id = str(s.get("id", ""))
            title = str(s.get("title", "Conversation"))
            if not conv_id:
                continue
            self.record_conversation(conv_id, title)
            messages = s.get("messages", [])
            if isinstance(messages, list):
                for m in messages:
                    if isinstance(m, dict):
                        role = m.get("role", "user")
                        content = m.get("content", "")
                        if content:
                            self.record_message(conv_id, role, content)
                            synced_count += 1
        return synced_count

    def import_data(self, data: Dict[str, Any]) -> bool:
        """Safely imports and merges external backup data into the SQLite database."""
        if not isinstance(data, dict):
            return False

        try:
            # 1. Restore Profile
            if "profile" in data and isinstance(data["profile"], dict):
                self.update_user_profile(data["profile"])

            # 2. Restore Memories
            if "memories" in data and isinstance(data["memories"], list):
                for mem in data["memories"]:
                    if isinstance(mem, dict) and "content" in mem:
                        self.add_memory(mem["content"], category=mem.get("category", "fact"))

            # 3. Restore Conversations and Messages
            if "conversations" in data and isinstance(data["conversations"], list):
                for conv in data["conversations"]:
                    if isinstance(conv, dict) and "id" in conv:
                        self.record_conversation(conv["id"], conv.get("title", "Imported Conversation"))
                        for msg in conv.get("messages", []):
                            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                                self.record_message(conv["id"], msg["role"], msg["content"])

            return True
        except Exception as e:
            logger.error(f"Failed to import backup data: {e}")
            return False


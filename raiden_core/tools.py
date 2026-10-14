"""
RAIDEN Safe Personal Computer Tools
Modular, allowlist-controlled desktop tools with strict path isolation,
permission confirmation, and execution audit logging.
"""

import os
import subprocess
import webbrowser
import logging
from typing import Dict, Any, List, Optional, Callable

logger = logging.getLogger("raiden.tools")

# Allowlisted applications that can be launched safely
APPROVED_APPLICATIONS = {
    "notepad": "notepad.exe",
    "calc": "calc.exe",
    "calculator": "calc.exe",
    "explorer": "explorer.exe",
    "code": "code",
    "cmd": "cmd.exe",
    "powershell": "powershell.exe"
}

# Allowlisted safe inspection commands
APPROVED_COMMANDS = [
    ["git", "status"],
    ["git", "branch"],
    ["git", "log", "-n", "5"],
    ["python", "--version"],
    ["ollama", "list"]
]

class ToolManager:
    """Manages secure PC tools with strict allowlists and permission confirmation."""

    def __init__(self, allowed_workspaces: Optional[List[str]] = None, audit_logger: Optional[Callable] = None):
        # Resolve canonical absolute paths for allowed workspaces
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.allowed_workspaces = [os.path.abspath(base_dir)]
        if allowed_workspaces:
            for ws in allowed_workspaces:
                resolved = os.path.abspath(os.path.join(base_dir, ws))
                if resolved not in self.allowed_workspaces:
                    self.allowed_workspaces.append(resolved)

        self.audit_logger = audit_logger

    def _log(self, tool_name: str, args: Any, status: str, result: str):
        if self.audit_logger:
            try:
                self.audit_logger(tool_name, str(args), status, result)
            except Exception as e:
                logger.warning(f"Failed to record tool audit: {e}")

    def is_path_in_allowed_workspaces(self, file_path: str) -> bool:
        """Verifies that the target file path resides strictly inside an approved workspace directory."""
        try:
            target_abs = os.path.abspath(file_path)
            for ws in self.allowed_workspaces:
                common = os.path.commonpath([target_abs, ws])
                if common == ws:
                    return True
            return False
        except Exception:
            return False

    def open_application(self, app_name: str) -> Dict[str, Any]:
        """Launches an approved desktop application from the allowlist."""
        app_clean = (app_name or "").strip().lower()
        executable = APPROVED_APPLICATIONS.get(app_clean)

        if not executable:
            msg = f"Application '{app_name}' is not in the approved applications allowlist."
            self._log("open_application", app_name, "rejected", msg)
            return {"success": False, "error": msg}

        try:
            subprocess.Popen([executable], shell=False)
            msg = f"Successfully launched {app_clean}."
            self._log("open_application", app_name, "executed", msg)
            return {"success": True, "message": msg}
        except Exception as e:
            err = f"Failed to launch application {app_clean}: {str(e)}"
            self._log("open_application", app_name, "failed", err)
            return {"success": False, "error": err}

    def open_browser_url(self, url: str) -> Dict[str, Any]:
        """Opens a valid HTTP or HTTPS URL in the system's default browser."""
        clean_url = (url or "").strip()
        if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
            msg = "Only valid http:// or https:// URLs can be opened in the browser."
            self._log("open_browser_url", url, "rejected", msg)
            return {"success": False, "error": msg}

        try:
            webbrowser.open(clean_url)
            msg = f"Opened URL in browser: {clean_url}"
            self._log("open_browser_url", url, "executed", msg)
            return {"success": True, "message": msg}
        except Exception as e:
            err = f"Failed to open browser: {str(e)}"
            self._log("open_browser_url", url, "failed", err)
            return {"success": False, "error": err}

    def read_workspace_file(self, file_path: str) -> Dict[str, Any]:
        """Safely reads a file within approved workspaces (max 2MB)."""
        clean_path = os.path.abspath(file_path)
        if not self.is_path_in_allowed_workspaces(clean_path):
            msg = f"Access denied: '{file_path}' is outside approved workspace directories."
            self._log("read_workspace_file", file_path, "rejected", msg)
            return {"success": False, "error": msg}

        if not os.path.exists(clean_path):
            return {"success": False, "error": "File does not exist."}

        if os.path.getsize(clean_path) > 2 * 1024 * 1024:
            return {"success": False, "error": "File exceeds 2MB limit."}

        try:
            with open(clean_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            self._log("read_workspace_file", file_path, "executed", f"Read {len(content)} chars")
            return {
                "success": True,
                "path": clean_path,
                "name": os.path.basename(clean_path),
                "content": content,
                "size": len(content)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def write_workspace_file(self, file_path: str, content: str, confirmed: bool = False) -> Dict[str, Any]:
        """
        Creates or modifies a file in the workspace.
        Requires explicit user confirmation before executing.
        """
        clean_path = os.path.abspath(file_path)
        if not self.is_path_in_allowed_workspaces(clean_path):
            msg = f"Access denied: '{file_path}' is outside approved workspace directories."
            self._log("write_workspace_file", file_path, "rejected", msg)
            return {"success": False, "error": msg}

        # Check file extension safety (avoid creating arbitrary executable binaries)
        ext = os.path.splitext(clean_path)[1].lower()
        if ext in [".exe", ".dll", ".bat", ".cmd", ".vbs", ".ps1"]:
            msg = f"Security restriction: Direct creation of executable file '{ext}' is prohibited."
            self._log("write_workspace_file", file_path, "rejected", msg)
            return {"success": False, "error": msg}

        if not confirmed:
            msg = f"Permission required: Modifying or creating '{os.path.basename(clean_path)}' requires explicit user confirmation."
            self._log("write_workspace_file", file_path, "awaiting_confirmation", msg)
            return {"success": False, "requires_confirmation": True, "prompt": msg}

        try:
            os.makedirs(os.path.dirname(clean_path), exist_ok=True)
            with open(clean_path, "w", encoding="utf-8") as f:
                f.write(content)
            msg = f"File successfully written: {os.path.basename(clean_path)}"
            self._log("write_workspace_file", file_path, "executed", msg)
            return {"success": True, "message": msg}
        except Exception as e:
            err = f"Failed to write file: {str(e)}"
            self._log("write_workspace_file", file_path, "failed", err)
            return {"success": False, "error": err}

    def execute_permitted_command(self, cmd_args: List[str], confirmed: bool = False) -> Dict[str, Any]:
        """
        Executes allowlisted inspection commands (e.g. git status, python --version).
        Requires explicit confirmation.
        """
        # Validate against command allowlist
        is_approved = False
        for allowed in APPROVED_COMMANDS:
            if len(cmd_args) == len(allowed) and [a.lower() for a in cmd_args] == [a.lower() for a in allowed]:
                is_approved = True
                break

        if not is_approved:
            msg = f"Command '{' '.join(cmd_args)}' is not in the approved command allowlist."
            self._log("execute_command", cmd_args, "rejected", msg)
            return {"success": False, "error": msg}

        if not confirmed:
            msg = f"Permission confirmation required to execute: {' '.join(cmd_args)}"
            self._log("execute_command", cmd_args, "awaiting_confirmation", msg)
            return {"success": False, "requires_confirmation": True, "prompt": msg}

        try:
            result = subprocess.run(
                cmd_args,
                cwd=self.allowed_workspaces[0],
                capture_output=True,
                text=True,
                timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            )
            output = (result.stdout + result.stderr).strip()
            self._log("execute_command", cmd_args, "executed", output[:200])
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "output": output
            }
        except subprocess.TimeoutExpired:
            msg = "Command execution timed out after 5 seconds."
            self._log("execute_command", cmd_args, "failed", msg)
            return {"success": False, "error": msg}
        except Exception as e:
            err = str(e)
            self._log("execute_command", cmd_args, "failed", err)
            return {"success": False, "error": err}

    def calculate(self, expression: str) -> Dict[str, Any]:
        """Evaluates mathematical expression safely using deterministic AST engine."""
        from .reasoning import DeterministicCalculator
        res = DeterministicCalculator.evaluate(expression)
        if res is not None:
            self._log("calculate", expression, "executed", str(res))
            return {"success": True, "result": res, "expression": expression}
        self._log("calculate", expression, "failed", "Invalid mathematical expression")
        return {"success": False, "error": f"Invalid or unsupported mathematical expression: '{expression}'"}

    def search_document(self, file_path: str, query: str, top_k: int = 3) -> Dict[str, Any]:
        """Retrieves top relevant passages from a workspace file."""
        read_res = self.read_workspace_file(file_path)
        if not read_res["success"]:
            return read_res

        from .reasoning import DocumentRetriever
        passages = DocumentRetriever.retrieve_relevant_passages(query, read_res["content"], top_k=top_k)
        self._log("search_document", {"path": file_path, "query": query}, "executed", f"Found {len(passages)} passages")
        return {
            "success": True,
            "path": file_path,
            "passages": passages
        }


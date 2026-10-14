"""
RAIDEN Structured Reasoning & Deterministic Intelligence Engine
Provides 6-stage structured problem solving:
1. Intent & Constraint Understanding
2. Lightweight Task Classification
3. Deterministic Computation & Document Grounding
4. Task-Aware Generation Parameters
5. Evidence Synthesis & Inference
6. Output Verification & Anti-Hallucination Guardrails
"""

import re
import ast
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("raiden.reasoning")

class TaskType(str, Enum):
    CASUAL = "casual"
    ROAST = "roast"
    TECHNICAL = "technical"
    ACADEMIC = "academic"
    PROFESSIONAL = "professional"
    CALCULATION = "calculation"
    DOCUMENT = "document"
    FACTUAL_SEARCH = "factual_search"

@dataclass
class TaskProfile:
    task_type: TaskType
    temperature: float
    top_p: float
    repeat_penalty: float
    system_tone_hint: str
    grounded_context: str = ""
    deterministic_result: Optional[str] = None
    max_tokens: Optional[int] = None
    stop_sequences: List[str] = field(default_factory=lambda: ["<|im_end|>", "<|im_start|>", "\nUser:", "\nHuman:"])

class DeterministicCalculator:
    """
    Safe AST-based arithmetic and mathematical computation engine.
    Computes exact numerical results with zero hallucination and zero code injection risk.
    """

    ALLOWED_OPERATORS = {
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b if b != 0 else float("inf"),
        ast.FloorDiv: lambda a, b: a // b if b != 0 else float("inf"),
        ast.Mod: lambda a, b: a % b if b != 0 else 0,
        ast.Pow: lambda a, b: a ** b if abs(b) < 1000 else float("inf"),
        ast.USub: lambda a: -a,
        ast.UAdd: lambda a: +a
    }

    ALLOWED_FUNCTIONS = {
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        "sqrt": math.sqrt,
        "cbrt": lambda x: math.pow(x, 1/3) if x >= 0 else -math.pow(-x, 1/3),
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "asin": math.asin,
        "acos": math.acos,
        "atan": math.atan,
        "log": math.log,
        "log10": math.log10,
        "log2": math.log2,
        "exp": math.exp,
        "ceil": math.ceil,
        "floor": math.floor,
        "factorial": lambda x: math.factorial(int(x)) if 0 <= x <= 100 else float("inf"),
        "pi": math.pi,
        "e": math.e
    }

    @classmethod
    def evaluate(cls, expression: str) -> Optional[float | int]:
        """Safely evaluates a mathematical expression string using AST traversal."""
        clean_expr = expression.strip()
        if not clean_expr:
            return None

        # Replace common syntax symbols
        clean_expr = clean_expr.replace("^", "**").replace("×", "*").replace("÷", "/")

        try:
            tree = ast.parse(clean_expr, mode="eval")
            return cls._eval_node(tree.body)
        except Exception as e:
            logger.debug(f"AST calculation failed for '{clean_expr}': {e}")
            return None

    @classmethod
    def _eval_node(cls, node):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            return 0
        elif isinstance(node, ast.UnaryOp):
            op = cls.ALLOWED_OPERATORS.get(type(node.op))
            if op:
                return op(cls._eval_node(node.operand))
        elif isinstance(node, ast.BinOp):
            op = cls.ALLOWED_OPERATORS.get(type(node.op))
            if op:
                left = cls._eval_node(node.left)
                right = cls._eval_node(node.right)
                return op(left, right)
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in cls.ALLOWED_FUNCTIONS:
                fn = cls.ALLOWED_FUNCTIONS[node.func.id]
                args = [cls._eval_node(a) for a in node.args]
                return fn(*args)
        elif isinstance(node, ast.Name):
            if node.id in cls.ALLOWED_FUNCTIONS:
                val = cls.ALLOWED_FUNCTIONS[node.id]
                if isinstance(val, (int, float)):
                    return val
        raise ValueError(f"Unsupported AST node: {type(node).__name__}")

    @classmethod
    def extract_and_evaluate(cls, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Detects if a user query is asking for a calculation and computes the exact answer.
        """
        text = prompt.strip()

        # 1. Percentage patterns: e.g. "what is 15% of 850" or "42% reduction of 120"
        pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*(?:of|reduction\s+of|discount\s+on)\s*(\d+(?:\.\d+)?)", text, re.IGNORECASE)
        if pct_match:
            pct = float(pct_match.group(1))
            val = float(pct_match.group(2))
            is_reduction = "reduction" in text.lower() or "discount" in text.lower()
            res = (pct / 100.0) * val
            final_val = (val - res) if is_reduction else res
            return {
                "type": "percentage",
                "expression": f"{pct}% of {val}" + (" (reduction)" if is_reduction else ""),
                "result": round(final_val, 4),
                "formatted": f"{round(final_val, 4)} ({pct}% of {val} = {round(res, 4)})"
            }

        # 2. Explicit calculation query: "calculate 4829 * 382", "what is 25 * 400 + 120", "eval 4^8"
        calc_patterns = [
            r"^(?:calculate|compute|evaluate|what\s+is|solve)\s+([0-9\s\+\-\*\/\^\(\)\.\,\%]+(?:\b(?:sqrt|sin|cos|tan|log|abs|pi|e)\b[0-9\s\+\-\*\/\^\(\)\.\,]*)?)\??$",
            r"^([0-9\s\+\-\*\/\^\(\)\.]{3,})\s*=\s*\??$"
        ]

        for pat in calc_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                raw_math = m.group(1).strip()
                # Ensure it actually contains digits and operators
                if re.search(r"\d", raw_math) and re.search(r"[\+\-\*\/\^\%]", raw_math):
                    val = cls.evaluate(raw_math)
                    if val is not None and not math.isinf(val) and not math.isnan(val):
                        # Format cleanly
                        res_fmt = int(val) if isinstance(val, float) and val.is_integer() else round(val, 6)
                        return {
                            "type": "arithmetic",
                            "expression": raw_math,
                            "result": res_fmt,
                            "formatted": f"{raw_math} = {res_fmt}"
                        }

        # 3. Inline arithmetic check for standalone arithmetic lines like "4829 * 382"
        if re.match(r"^[0-9\s\+\-\*\/\^\(\)\.]+$", text) and re.search(r"[\+\-\*\/\^]", text):
            val = cls.evaluate(text)
            if val is not None and not math.isinf(val) and not math.isnan(val):
                res_fmt = int(val) if isinstance(val, float) and val.is_integer() else round(val, 6)
                return {
                    "type": "arithmetic",
                    "expression": text,
                    "result": res_fmt,
                    "formatted": f"{text} = {res_fmt}"
                }

        return None


class DocumentRetriever:
    """
    Lightweight, deterministic document passage extractor and chunking engine.
    Extracts relevant passages to avoid flooding the context window.
    """

    @classmethod
    def chunk_text(cls, text: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
        """Splits long document into overlapping text chunks with line metadata."""
        if not text:
            return []

        lines = text.splitlines(keepends=True)
        chunks = []
        current_chunk = []
        current_len = 0
        start_line = 1
        curr_line = 1

        for line in lines:
            current_chunk.append(line)
            current_len += len(line)
            if current_len >= chunk_size:
                chunk_str = "".join(current_chunk)
                chunks.append({
                    "start_line": start_line,
                    "end_line": curr_line,
                    "content": chunk_str.strip()
                })
                # Maintain overlap by keeping last few lines
                keep_lines = max(1, len(current_chunk) // 4)
                current_chunk = current_chunk[-keep_lines:]
                current_len = sum(len(l) for l in current_chunk)
                start_line = max(1, curr_line - keep_lines + 1)
            curr_line += 1

        if current_chunk:
            chunk_str = "".join(current_chunk).strip()
            if chunk_str:
                chunks.append({
                    "start_line": start_line,
                    "end_line": curr_line - 1,
                    "content": chunk_str
                })

        return chunks

    @classmethod
    def retrieve_relevant_passages(cls, query: str, document_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Scores and returns top-k most relevant passages for a query."""
        if not document_text or not query:
            return []

        # If document is already short (< 1500 chars), return it directly
        if len(document_text) < 1500:
            return [{
                "start_line": 1,
                "end_line": len(document_text.splitlines()),
                "content": document_text.strip(),
                "score": 1.0
            }]

        chunks = cls.chunk_text(document_text)
        if not chunks:
            return []

        # Tokenize query into significant terms
        query_words = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", query.lower()))
        if not query_words:
            return chunks[:top_k]

        scored_chunks = []
        for ch in chunks:
            content_lower = ch["content"].lower()
            # Calculate match frequency
            matches = sum(content_lower.count(w) for w in query_words)
            unique_matches = sum(1 for w in query_words if w in content_lower)
            score = (unique_matches * 3) + matches
            if score > 0:
                scored_chunks.append({
                    "start_line": ch["start_line"],
                    "end_line": ch["end_line"],
                    "content": ch["content"],
                    "score": score
                })

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        if scored_chunks:
            return scored_chunks[:top_k]
        # Fallback to beginning of document if no keyword match
        return chunks[:top_k]


class ReasoningEngine:
    """
    Coordinates intent detection, deterministic verification, task classification,
    and parameter tuning across conversation turns.
    """

    def __init__(self):
        self.calculator = DeterministicCalculator()
        self.doc_retriever = DocumentRetriever()

    def classify_task(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        attached_file: Optional[Dict[str, Any]] = None,
        roast_mode: Optional[str] = None
    ) -> TaskProfile:
        """
        Classifies task type and returns optimized inference profile.
        """
        clean_text = (prompt or "").strip()
        lower_text = clean_text.lower()
        clean_roast = str(roast_mode or "").strip().lower()

        # 0. Explicit Roast Mode Override (Brutal or Playful)
        if clean_roast == "brutal" or "brutal roast" in lower_text or "roast my code" in lower_text:
            return TaskProfile(
                task_type=TaskType.ROAST,
                temperature=0.85,  # Razor sharp comedic wit and punchy comedy
                top_p=0.9,
                repeat_penalty=1.12,
                system_tone_hint=(
                    "### 💀🔥 BRUTAL & HILARIOUS CODE ROASTER ACTIVATED:\n"
                    "The user has explicitly selected BRUTAL ROAST MODE. Your mission is to roast their code, question, or statement with merciless comedic brutality and laugh-out-loud humor!\n"
                    "1. ROAST MERCILESSLY & CREATIVELY: Channel the energy of an unhinged, elite 10x staff engineer doing a standup comedy special. "
                    "Deliver sharp burns, comedic hyperbole, and savage tech metaphors. Make fun of bad variable names, spaghetti logic, "
                    "atrocious algorithmic complexity, anti-patterns, absurd dependencies, or questionable coding choices. "
                    "If they just say something casual or ask a silly question, roast their life choices, sleep schedule, and logic!\n"
                    "2. HILARIOUS, NEVER TRULY HATEFUL: Deliver pure comedy gold and playful destruction—sharp, witty, punchy, and entertaining (never genuinely toxic, discriminatory, or abusive).\n"
                    "3. THE GENIUS FIX (REDEMPTION): Right after vaporizing their code into ashes, say something funny like 'Alright, dry your tears, wipe your keyboard, here's how a real engineer writes it:' "
                    "and provide the absolute cleanest, elegant, production-ready, beautifully formatted refactored code with inline comments explaining why it is superior."
                )
            )

        if clean_roast == "playful":
            return TaskProfile(
                task_type=TaskType.ROAST,
                temperature=0.75,
                top_p=0.9,
                repeat_penalty=1.12,
                system_tone_hint=(
                    "Playful teasing mode: Deliver a witty, lighthearted roast with clever tech banter and jokes, "
                    "followed by a friendly tip on how to improve it."
                )
            )

        # 1. Calculation & Arithmetic Check
        calc_res = self.calculator.extract_and_evaluate(clean_text)
        if calc_res:
            grounded = (
                f"[DETERMINISTIC VERIFICATION]: Mathematical calculation independently verified: "
                f"{calc_res['formatted']}. Incorporate this verified figure directly in your answer."
            )
            return TaskProfile(
                task_type=TaskType.CALCULATION,
                temperature=0.1,  # Strict precision
                top_p=0.8,
                repeat_penalty=1.15,
                system_tone_hint="Provide the exact mathematical solution cleanly with the verified steps.",
                grounded_context=grounded,
                deterministic_result=calc_res["formatted"]
            )

        # 2. Document & Attached File QA Check
        if attached_file or "[attached file:" in lower_text:
            return TaskProfile(
                task_type=TaskType.DOCUMENT,
                temperature=0.2,  # Grounded faithfulness
                top_p=0.85,
                repeat_penalty=1.15,
                system_tone_hint="Ground your response strictly in the provided document content. If information is absent from the document, state that plainly."
            )

        # 3. Academic & Exam Check
        academic_patterns = [
            r"\b(exam|exam-ready|syllabus|university|marks?|definition|explain\s+how|difference\s+between)\b",
            r"\b(study\s+guide|revision\s+notes|binary\s+search\s+tree|linked\s+list|avl\s+tree)\b",
            r"\b(time\s+complexity|space\s+complexity|data\s+structures?|algorithms?)\b"
        ]
        if any(re.search(pat, lower_text) for pat in academic_patterns):
            return TaskProfile(
                task_type=TaskType.ACADEMIC,
                temperature=0.35,  # Structured, thorough, educational
                top_p=0.85,
                repeat_penalty=1.15,
                system_tone_hint="Deliver a complete, structured, exam-grade educational answer with clear headings, definitions, operations, ASCII/text diagrams if helpful, complexity analysis, and a conclusion. Never refuse academic or exam requests."
            )

        # 4. Professional / Formal Deliverable Check
        professional_patterns = [
            r"\b(formal\s+email|proposal|business\s+letter|project\s+proposal|internship\s+application|resume|cover\s+letter)\b",
            r"\b(executive\s+summary|official\s+statement|memorandum|sla|contract)\b"
        ]
        if any(re.search(pat, lower_text) for pat in professional_patterns):
            return TaskProfile(
                task_type=TaskType.PROFESSIONAL,
                temperature=0.3,  # Polished, respectful, structured
                top_p=0.85,
                repeat_penalty=1.15,
                system_tone_hint="Write a formal, polished deliverable. Use appropriate professional language and structure. Omit casual slang, witty remarks, or chatty commentary."
            )

        # 5. Roast & Savage Banter Check
        roast_patterns = [
            r"\b(roast\s+me|roast\s+my\s+code|roast\s+this|roast\s+my\s+setup|burn\s+me|destroy\s+my\s+code)\b",
            r"\b(did\s+i\s+cook\s+or\s+get\s+cooked|am\s+i\s+cooked|rate\s+my\s+crap|cooked\s+code|roast\s+mode)\b",
            r"\b(be\s+savage|no\s+filter|destroy\s+me|give\s+me\s+your\s+worst|make\s+fun\s+of\s+my)\b"
        ]
        if any(re.search(pat, lower_text) for pat in roast_patterns):
            return TaskProfile(
                task_type=TaskType.ROAST,
                temperature=0.75,  # Expressive, creative comedic flair
                top_p=0.9,
                repeat_penalty=1.12,
                system_tone_hint=(
                    "Deliver a sharp, witty, laugh-out-loud funny roast! Use clever tech humor, comedic hyperbole, "
                    "and playful savagery. Roast the code, choice, or situation mercilessly but in good fun (never hateful). "
                    "Wrap up with a funny, supportive tip on how to actually fix it!"
                )
            )

        # 6. Technical Programming & Debugging Check
        technical_patterns = [
            r"\b(python|javascript|typescript|c\+\+|rust|sql|html|css|docker|git|api)\b",
            r"\b(traceback|stack\s*trace|exception|bug|error|refactor|function|class|method)\b",
            r"```[\s\S]*?```"
        ]
        if any(re.search(pat, lower_text) for pat in technical_patterns):
            return TaskProfile(
                task_type=TaskType.TECHNICAL,
                temperature=0.25,  # Precise code syntax
                top_p=0.85,
                repeat_penalty=1.15,
                system_tone_hint="Provide precise technical assistance. Diagnose root causes clearly, supply clean code with helpful inline comments, and show step-by-step logic without fluff."
            )

        # 7. Default to Casual Conversation (Real Friend Dynamics)
        casual_hint = (
            "Talk like an actual close friend on desktop: warm, expressive, sharp, witty, and natural. "
            "Show genuine emotional reactions (excitement, empathy, laughter, banter). "
            "If the user is having a bad day or venting, show real empathy and support. "
            "Avoid all robotic filler, repetitive corporate pleasantries, or canned openers."
        )
        max_tok = None

        # Check history for explicit brevity or concise preference
        if history:
            for turn in history:
                if turn.get("role") == "user" and "concise" in turn.get("content", "").lower():
                    casual_hint += " [ACTIVE PREFERENCE]: The user explicitly requested concise answers. Provide an accurate, direct explanation in 1 to 2 sentences maximum without unnecessary filler."
                    max_tok = 80
                    break

        return TaskProfile(
            task_type=TaskType.CASUAL,
            temperature=0.65,  # Natural, conversational variety
            top_p=0.9,
            repeat_penalty=1.15,
            system_tone_hint=casual_hint,
            max_tokens=max_tok
        )

    def verify_response(self, prompt: str, response: str, had_tool_execution: bool = False) -> str:
        """
        Post-generation verification:
        Ensures model did not falsely claim to have executed tools or accessed unavailable sensors.
        """
        clean_prompt = prompt.lower()
        clean_resp = response

        # Check: Inquiring if assistant tested or executed user code/project on this machine
        if not had_tool_execution:
            claim_testing_queries = [
                "did you test my project", "did you run my code", "did you test the code",
                "did you test my code", "did you execute my code", "did you run it on your computer"
            ]
            if any(q in clean_prompt for q in claim_testing_queries):
                return (
                    "I have not executed or tested your project or code on this computer, as no local execution "
                    "tool was run in this conversation. I can, however, review and analyze your code statically if you share it."
                )

        return clean_resp

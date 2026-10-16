"""
RAIDEN Model Router
Lightweight, deterministic routing architecture for local dual-model operation.
Routes between Fast (3B) and Advanced (7B-8B) models without calling an LLM classifier.
"""

import re
import time
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger("raiden.router")

@dataclass
class RoutingDecision:
    selected_model: str
    complexity_level: str  # "LOW", "MEDIUM", "HIGH"
    mode: str              # "auto", "fast", "advanced"
    reason: str
    short_reason: str = "" # e.g. "3B: simple chat", "8B: complex debugging"
    fallback_used: bool = False
    fallback_reason: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    duration_ms: float = 0.0

class ModelRouter:
    """Classifies prompt complexity using transparent rules and selects the right model."""

    # Patterns indicating high complexity (algorithms, deep debugging, architecture, formal proofs)
    HIGH_COMPLEXITY_PATTERNS = [
        r"\b(architecture|architectural|microservices?|distributed\s+systems?)\b",
        r"\b(refactor(?:ing)?\s+entire|redesign|system\s+design|design\s+patterns?)\b",
        r"\b(race\s+condition|deadlock|memory\s+leak|seg(?:mentation)?\s+fault|buffer\s+overflow)\b",
        r"\b(multi-?threading|concurrency|asyncio\s+event\s+loop|goroutines?)\b",
        r"\b(time\s+complexity|space\s+complexity|big[\s\-_]o|dynamic\s+programming)\b",
        r"\b(traceback|stack\s*trace|core\s*dump|valgrind|profiling)\b",
        r"\b(deep\s+analysis|deep\s+dive|rigorous\s+proof|mathematical\s+derivation)\b",
        r"\b(security\s+audit|vulnerability\s+assessment|penetration\s+test)\b",
        r"\b(compile\s+flags|llvm|assembly|ast\s+nodes?|bytecode)\b",
        r"\b(riddle|logic\s+puzzle|puzzle|all\s+but\s+\d+|how\s+many\s+left|probability\s+of|game\s+theory|step[\s\-_]by[\s\-_]step\s+reasoning)\b"
    ]

    # Patterns indicating simple/routine queries (greetings, simple definition, short chit-chat)
    LOW_COMPLEXITY_PATTERNS = [
        r"^(hi|hello|hey|greetings|good\s+(morning|evening|afternoon)|sup|yo)\b",
        r"^(who\s+are\s+you|who\s+made\s+you|what\s+is\s+your\s+name|describe\s+yourself)\b",
        r"^(thank\s*you|thanks|ok|okay|cool|nice|got\s+it|bye|goodbye)\b",
        r"^(what\s+is|define|meaning\s+of)\s+([a-zA-Z\s]{1,25})\??$",
        r"^(how\s+do\s+i\s+print|syntax\s+for|how\s+to\s+reverse\s+a\s+string)\b"
    ]

    def __init__(self, fast_model: str = "qwen2.5-coder:3b", advanced_model: str = "llama3.1:8b", default_mode: str = "auto"):
        self.fast_model = fast_model
        self.advanced_model = advanced_model
        self.mode = default_mode  # "auto", "fast", "advanced"
        self.history: List[Dict[str, Any]] = []
        self._available_models: List[str] = [fast_model]

    def update_available_models(self, models: List[str]):
        """Updates the list of verified locally available models."""
        self._available_models = [m.lower() for m in models]

    def is_model_available(self, model_name: str) -> bool:
        """Checks if a model is installed in the local runtime."""
        if not self._available_models:
            return True
        model_clean = (model_name or "").strip().lower()
        for avail in self._available_models:
            if model_clean == avail or model_clean.split(":")[0] == avail.split(":")[0]:
                return True
        return False

    def classify_complexity(self, prompt: str, history: Optional[List[Dict[str, str]]] = None) -> (str, str):
        """
        Classifies complexity of prompt deterministically.
        Returns: (complexity_level, reason)
        """
        text = (prompt or "").strip()
        lower_text = text.lower()

        # Check explicit length or multiple code blocks
        code_blocks = re.findall(r"```[\s\S]*?```", text)
        code_lines = sum(b.count("\n") for b in code_blocks)

        # 1. Check quick low-complexity matches
        for pat in self.LOW_COMPLEXITY_PATTERNS:
            if re.search(pat, lower_text):
                return "LOW", "Matched routine / conversational greeting pattern"

        # 2. Check for explicit deep complexity indicators
        matched_high = []
        for pat in self.HIGH_COMPLEXITY_PATTERNS:
            m = re.search(pat, lower_text)
            if m:
                matched_high.append(m.group(0))

        if matched_high:
            return "HIGH", f"Technical complexity cues detected: {', '.join(matched_high[:3])}"

        # 3. Check for substantial code presence (> 35 lines of code)
        if code_lines > 35:
            return "HIGH", f"Multi-line code context ({code_lines} lines) requires deep analysis"

        # 4. Multi-turn context depth: if multi-step debugging across turns
        if history and len(history) >= 12:
            return "MEDIUM", "Extended multi-turn dialogue with continuous context"

        # 5. Default to fast model for standard conversational and everyday queries
        return "LOW", "Standard inquiry within fast model measured competence"

    def route(self, prompt: str, mode_override: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None, escalate: bool = False) -> RoutingDecision:
        """
        Determines the appropriate model to invoke.
        """
        start_time = time.perf_counter()
        active_mode = (mode_override or self.mode or "auto").lower()
        if active_mode not in ("auto", "fast", "advanced"):
            active_mode = "auto"

        complexity, reason = self.classify_complexity(prompt, history)

        # 0. Escalation trigger (regenerate / code execution error)
        if escalate and active_mode != "fast":
            if self.is_model_available(self.advanced_model):
                decision = RoutingDecision(
                    selected_model=self.advanced_model,
                    complexity_level="HIGH",
                    mode=active_mode,
                    reason="Escalated to 8B: user regeneration or code retry",
                    short_reason="8B: escalated retry"
                )
            else:
                decision = RoutingDecision(
                    selected_model=self.fast_model,
                    complexity_level="HIGH",
                    mode=active_mode,
                    reason=f"Escalation requested, but advanced model '{self.advanced_model}' is not installed",
                    short_reason="3B: 8B unavailable",
                    fallback_used=True,
                    fallback_reason=f"Advanced model '{self.advanced_model}' not found in local runtime"
                )

        # 1. User Override: FAST MODE
        elif active_mode == "fast":
            decision = RoutingDecision(
                selected_model=self.fast_model,
                complexity_level=complexity,
                mode="fast",
                reason=f"Fast mode forced by user setting (complexity: {complexity})",
                short_reason="3B: fast mode"
            )

        # 2. User Override: ADVANCED MODE
        elif active_mode == "advanced":
            # Check availability
            if self.is_model_available(self.advanced_model):
                decision = RoutingDecision(
                    selected_model=self.advanced_model,
                    complexity_level=complexity,
                    mode="advanced",
                    reason="Advanced mode selected by user",
                    short_reason="8B: advanced mode"
                )
            else:
                # Graceful fallback to fast model
                decision = RoutingDecision(
                    selected_model=self.fast_model,
                    complexity_level=complexity,
                    mode="advanced",
                    reason="Advanced mode requested, but advanced model is not installed locally",
                    short_reason="3B: fallback (8B missing)",
                    fallback_used=True,
                    fallback_reason=f"Model '{self.advanced_model}' not found in local runtime"
                )

        # 3. AUTO MODE
        else:
            if complexity == "HIGH":
                is_debug = any(k in reason.lower() for k in ["traceback", "debug", "error", "leak", "race", "fault", "bug"])
                is_arch = "architecture" in reason.lower() or "design" in reason.lower()
                high_short = "8B: complex debugging" if is_debug else ("8B: system architecture" if is_arch else "8B: deep reasoning")
                if self.is_model_available(self.advanced_model):
                    decision = RoutingDecision(
                        selected_model=self.advanced_model,
                        complexity_level="HIGH",
                        mode="auto",
                        reason=f"High complexity detected: {reason}",
                        short_reason=high_short
                    )
                else:
                    decision = RoutingDecision(
                        selected_model=self.fast_model,
                        complexity_level="HIGH",
                        mode="auto",
                        reason=f"High complexity detected, but advanced model '{self.advanced_model}' is not installed",
                        short_reason="3B: fallback (8B missing)",
                        fallback_used=True,
                        fallback_reason=f"Advanced model '{self.advanced_model}' unavailable; routed to fast model"
                    )
            else:
                short_low = "3B: simple chat" if complexity == "LOW" else "3B: routine task"
                decision = RoutingDecision(
                    selected_model=self.fast_model,
                    complexity_level=complexity,
                    mode="auto",
                    reason=f"Routed to fast model ({reason})",
                    short_reason=short_low
                )

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        decision.duration_ms = round(elapsed_ms, 2)

        # Record decision telemetry (limit to last 100 entries)
        self.history.append({
            "timestamp": decision.timestamp,
            "mode": decision.mode,
            "selected_model": decision.selected_model,
            "complexity": decision.complexity_level,
            "reason": decision.reason,
            "short_reason": decision.short_reason,
            "fallback_used": decision.fallback_used,
            "duration_ms": decision.duration_ms,
            "prompt_snippet": (prompt[:60] + "...") if len(prompt) > 60 else prompt
        })
        if len(self.history) > 100:
            self.history.pop(0)

        return decision

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self.history)

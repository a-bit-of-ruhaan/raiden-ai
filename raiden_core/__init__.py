"""
RAIDEN Core Package
Modular AI architecture: Model Routing, Model Management,
Local Long-Term Memory, Safe PC Tools, and Web Research.
"""

from .config import ConfigManager
from .model_router import ModelRouter, RoutingDecision
from .model_manager import ModelManager
from .memory import MemoryDB
from .web_research import WebSearch, WebScraper, ResearchAnswerer
from .tools import ToolManager
from .reasoning import ReasoningEngine, TaskType, DeterministicCalculator, DocumentRetriever
from .hinglish import HinglishEngine, get_hinglish_engine
from .activity_monitor import WindowsActivityMonitor
from .humor_engine import HumorEngine
from .companion_server import CompanionBridgeServer
from .screen_observer import (
    ScreenObserverService,
    ScreenCaptureEngine,
    VisionInferenceEngine,
    ScreenPerceptionHistory,
    SocialJudgmentEngine,
    ContextualCommentaryGenerator,
    PrivacyGuard
)

__all__ = [
    "ConfigManager",
    "ModelRouter",
    "RoutingDecision",
    "ModelManager",
    "MemoryDB",
    "WebSearch",
    "WebScraper",
    "ResearchAnswerer",
    "ToolManager",
    "ReasoningEngine",
    "TaskType",
    "DeterministicCalculator",
    "DocumentRetriever",
    "HinglishEngine",
    "get_hinglish_engine",
    "WindowsActivityMonitor",
    "HumorEngine",
    "CompanionBridgeServer",
    "ScreenObserverService",
    "ScreenCaptureEngine",
    "VisionInferenceEngine",
    "ScreenPerceptionHistory",
    "SocialJudgmentEngine",
    "ContextualCommentaryGenerator",
    "PrivacyGuard"
]

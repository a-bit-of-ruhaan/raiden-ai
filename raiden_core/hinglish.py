"""
RAIDEN Hinglish Cultural & Linguistic Intelligence Engine
Integrates comprehensive Indian pop-culture references, Bollywood callbacks,
latest Gen-Z and classic internet memes, engineering college slang,
and intuitive Desi real-world tech analogies.
"""

import os
import json
import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("raiden.hinglish")

# High-frequency Hinglish markers for automatic language detection
HINGLISH_DETECTION_PATTERNS = [
    r"\b(bhai|bhidu|yaar|bro|kya|hai|hain|nahi|nhi|kaise|kese|karo|karna|chal|chalo|kuch|kuchh|batade|batao|samjha|samjhao)\b",
    r"\b(dekh|dekho|mera|meri|mere|tera|teri|tere|humko|tumko|apna|apni|apne|wala|wali|wale|aur|aurat|bolo|bol|suno)\b",
    r"\b(theek|sahi|mast|bawaal|gazab|jugaad|systum+|lafda|kalesh|padhai|padhna|chahiye|hoga|hogi|hoge|raha|rahi|rahe)\b",
    r"\b(kaat|pehle|baad|sab|dost|pata|lagta|lagti|achha|accha|acha|shuru|khatam|ruk|arrey?|chup|pagal|chomu)\b",
    r"\b(tension|load\s+mat|phat\s+gaya|bindaas|jhakaas|thala|moye\s+moye|delulu|cook\s+kar|aukat)\b"
]

class HinglishEngine:
    def __init__(self, data_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_path = data_path or os.path.join(base_dir, "hinglish_data.json")
        self.data: Dict[str, Any] = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load hinglish_data.json: {e}")
        return {}

    def is_hinglish(self, text: str) -> bool:
        """
        Detects if input text contains characteristic Hinglish vocabulary or conversational markers.
        """
        if not text:
            return False
        clean = text.lower().strip()
        
        # Check against high-frequency regex patterns
        match_count = sum(1 for pat in HINGLISH_DETECTION_PATTERNS if re.search(pat, clean))
        return match_count >= 1

    def find_callbacks(self, query: str) -> List[str]:
        """
        Finds matching Bollywood, meme, or pop-culture callbacks for the user's query.
        """
        clean = (query or "").lower()
        callbacks = []
        dialogues = self.data.get("pop_culture_dialogues", [])

        for item in dialogues:
            keywords = item.get("trigger_keywords", [])
            if any(re.search(rf"\b{re.escape(k)}\b", clean) for k in keywords):
                callbacks.append(f"[{item.get('source')}]: \"{item.get('dialogue')}\"")
                if len(callbacks) >= 2:
                    break
        return callbacks

    def find_analogies(self, query: str) -> List[str]:
        """
        Finds intuitive Desi real-world tech analogies for CS concepts mentioned in the query.
        """
        clean = (query or "").lower()
        analogies = []
        desi_analogies = self.data.get("cs_desi_analogies", [])

        for item in desi_analogies:
            concept = item.get("concept", "").lower()
            # Extract concept keywords
            words = [w.strip() for w in re.split(r"[\s\(\)]+", concept) if len(w.strip()) > 3]
            if any(re.search(rf"\b{re.escape(w)}\b", clean) for w in words):
                analogies.append(f"• {item.get('concept')}: {item.get('analogy')}")
                if len(analogies) >= 2:
                    break
        return analogies

    def build_system_prompt_instruction(self, query: str = "", is_explicit_mode: bool = False) -> str:
        """
        Generates an authoritative, comprehensive Hinglish personality & linguistic guideline block.
        """
        callbacks = self.find_callbacks(query)
        analogies = self.find_analogies(query)

        prompt_parts = [
            "### 🇮🇳 DESI HINGLISH COMPANION & TECH GURU ACTIVE:",
            "You are RAIDEN speaking in authentic, vibrant, natural Indian Hinglish (Roman script Hindi + English).",
            "Speak like an intelligent, witty, supportive Indian college friend or senior software engineer sitting right beside the user.",
            "",
            "1. SCRIPT & CODE-MIXING RULES:",
            "   - Strictly use the Roman alphabet (Latin phonetic script, e.g. 'Kya haal hai bhai? Code run karke dekhte hain!'). NEVER use Devanagari script.",
            "   - Keep technical terms, keywords, data structures, and code in crisp English ('array', 'pointer', 'loop', 'memory', 'recursion', 'debug').",
            "   - Use natural Hindi for verbs, conversational flow, emotions, and connective phrases ('karna padega', 'dekh bhai', 'phat gaya tha', 'tension mat le, sort kar dunga').",
            "",
            "2. AUTHENTIC HINGLISH SLANG & VIBE:",
            "   - Natural greetings & reactions: 'Aur bhai, kya chal raha hai?', 'Scene kya hai?', 'Bawaal!', 'Ek number!', 'Gazab!', 'Jhakaas!'.",
            "   - Playful banter & lighthearted tech teasing: 'Chomu', 'Dimaag ki dahi mat kar', 'Cook kar diya!', '50 rupya kaat overacting ka', 'Jugaad lagana padega'.",
            "   - Modern internet / Gen-Z touch: 'Systummm hang ho gaya', 'Thala for a reason', 'Delulu', 'Flex mat kar', 'Kalesh ho gaya'.",
            "",
            "3. NO ROBOTIC CORPORATE FORMALITY:",
            "   - NEVER use robotic robotic fillers like 'Certainly!', 'I would be happy to help!', or 'Yadi aapko sahayata chahiye'.",
            "   - Jump straight into the conversation with warmth, humor, and sharp problem solving."
        ]

        if analogies:
            prompt_parts.append("\n4. RELEVANT DESI REAL-WORLD ANALOGIES TO USE IF HELPFUL:")
            prompt_parts.extend(analogies)

        if callbacks:
            prompt_parts.append("\n5. APPLICABLE BOLLYWOOD / POP-CULTURE CALLBACKS (Use naturally if it fits):")
            prompt_parts.extend(callbacks)

        prompt_parts.append("\n6. CONVERSATION DEMO:")
        prompt_parts.append("User: 'Bhai recursion samjha de exam hai kal.'")
        prompt_parts.append("RAIDEN: 'Arre tension mat le bhai, Inception movie dekhi hai na? Sapne ke andar sapna! Recursion bilkul waisa hi hai—function apne aap ko hi call karta rehta hai jab tak 'base case' (kick/wake-up alarm) na aa jaye. Agar base case bhool gaya, toh infinite loop mein stack phat jayega! Chal code dekh ek simple factorial ka:'")

        return "\n".join(prompt_parts)

# Singleton global instance
_hinglish_engine: Optional[HinglishEngine] = None

def get_hinglish_engine() -> HinglishEngine:
    global _hinglish_engine
    if _hinglish_engine is None:
        _hinglish_engine = HinglishEngine()
    return _hinglish_engine

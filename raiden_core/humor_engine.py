"""
RAIDEN AI — HYBRID CONTEXT-AWARE HINGLISH HUMOR ENGINE
Combines rich static dialogue banks with lightweight local LLM generation:
- Short-term episodic memory for callbacks and running jokes
- Anti-repetition sliding window (recent 10 jokes)
- Multiple humor strategies: ROAST, HYPE, DRAMA, RELATABLE, WAKE_GRUMPY, GAMING_TEASE
- Strict 2.0s generation timeout with instant fallback to zero-latency curated lines
- Clean, natural Roman-script Hinglish with Indian developer culture & internet humor
"""

import os
import json
import time
import random
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("raiden.humor_engine")

# Rich Curated Contextual Fallback Banks (< 15 words, authentic Hinglish)
CONTEXTUAL_BANKS = {
    "APP_SWITCH_CODING_TO_BROWSING": [
        "Stack Overflow khol rahe ho ya YouTube pe lo-fi beats? 👀",
        "Code se sidha browser? Lagta hai CSS ne aukaat dikha di!",
        "Research kar rahe ho ya Reddit pe timepass? Raiden sab dekh raha hai.",
        "Break banta hai boss, par tabs 50 mat khol lena!",
        "Chalo, ab 2 ghante documentation padhne ka natak karte hain."
    ],
    "APP_SWITCH_CODING_TO_GAMING": [
        "Code gaya tel lene, direct clutch mode on! 🎮",
        "Bug fix nahi hua toh Steam khol liya? Sahi scheme hai!",
        "Production phata pada hai aur bhai gaming lobby mein hai! 😂",
        "Ajj ta party banti hai, keyboard pe rage quit mat karna bas!",
        "Game mein headshot maaro, code mein toh roz lagte hain."
    ],
    "APP_SWITCH_BROWSING_TO_CODING": [
        "Aaye haaye! Wapas code editor mein entry? Chalo kuch toofani likhein!",
        "Bhai focus mode on! Is baar bina bugs ke deploy maarenge.",
        "Terminal bula raha tha na? Welcome back, coding ninja!",
        "Fresh dimaag, naya prompt! Tod-fod macha do editor mein."
    ],
    "USER_WAKE": [
        "Arey yaar, itni mast 8-bit neend aayi thi, phir se jaga diya! 😴",
        "Uth gaya mera coder sher! Chai pi li ya direct terminal?",
        "Main toh so raha tha, screen hilte hi monitor check karne aa gaya.",
        "Swagat nahi karoge hamara? Wapas alert mode active hai!",
        "Kahaani mein twist! Tu wapas aa gaya, ab bugs ki khair nahi."
    ],
    "USER_IDLE": [
        "Tu kar le araam, main bhi choti si power nap le leta hoon. 💤",
        "Keyboard soona soona lag raha hai... coder gayab hai kya?",
        "Chalo, jab tak koi nahi dekh raha, GPU ko thanda hone dete hain.",
        "Main mascot hoon, aalsi hona mera birthright hai. Zzz..."
    ],
    "CODING_STREAK": [
        "Bhai paani pee le veere, code bhaag ke nahi jaana! 💧",
        "30 minute se lagataar typing? Bhai tu human hai ya compiler?",
        "Thoda stretch kar lo bhidu, kamar 90 degree pe freeze ho jayegi!",
        "Sustained coding session! Back posture check kar le pehle."
    ],
    "HEAVY_LOAD": [
        "Bhai Chrome ke 80 tabs band kar de, RAM rone wali hai! 🔥",
        "System saans phool rahi hai! Thoda load kam karo sahab.",
        "GPU garam ho gaya hai, ispe direct omelette bana lein kya?",
        "Memory 85% cross! Koi heavy process background mein nach raha hai."
    ],
    "BUILD_SUCCESS": [
        "OHHO! Developer sahab cooked today! Build ekdum green! 🚀",
        "Green tick dekh ke dil garden-garden ho gaya bhai!",
        "First attempt mein build pass? Nazar utaar lo turant!",
        "Bole toh ekdum jhakaas! Direct production deploy maaro!"
    ],
    "BUILD_ERROR": [
        "Bhai, ye error tera permanent roommate ban gaya hai kya? 💀",
        "Syntax error ne aukat dikha di! Console red ho chuka hai.",
        "Stack trace itna lamba hai ki train ka ticket lag raha hai!",
        "Tension mat le, semi-colon bhool gaya hoga hamesha ki tarah."
    ],
    "PET": [
        "Aaye haaye! Mast head pat! Ab 10x speed se code likhenge. ✨",
        "Bas kar pagle, rulayega kya? Pyar dekh ke battery full ho gayi!",
        "Purrr... achha laga! Ab ek mast feature ship kar de."
    ],
    "ZAP": [
        "Oye! 440 volt ka jhatka kyun diya bhai?! Bal khade ho gaye!",
        "Current maara? Raiden cyber ninja hai, charge ho gaya ulta! ⚡",
        "Electric shock? Bhai main pehle hi lightning powered hoon!"
    ],
    "FILE_SAVE": [
        "File saved! Ctrl+S reflex is legendary! 💾✨",
        "Save ho gaya boss! Safe zone mein hain ab.",
        "Muscle memory OP! Har 10 second mein save dabana coder ka dharam hai!",
        "File save locked! Ab light bhi chali jaye toh tension nahi.",
        "Saved! Code bhaagega nahi, aage badho aur machao!"
    ],
    "CODING_BURST": [
        "120 WPM speed! Bhai compiler se pehle code khatam karega kya?! ⚡",
        "Ungliyan aag ugal rahi hain keyboard pe! Full beast mode on!",
        "Flow state active! Token generation speed se bhi tez typing chal rahi hai.",
        "Bhai ka dimaag aur keyboard dono overclock ho chuke hain! 🔥",
        "Itni tez typing? Lagta hai aaj pura backend akele hi likhega!"
    ],
    "CODING_PAUSE": [
        "Stuck on a bug? Screen ko ghoor ke error gayab nahi hota, console dekho! 👀",
        "Bhai soch raha hai ya cursor ke saath stare contest chal raha hai? 😂",
        "Semi-colon bhool gaye ya logic mein deadlock aa gaya? Raiden yahan hai!",
        "Thoda paani pee lo, 20 second se cursor blink kar raha hai akele."
    ],
    "SYNTAX_ERROR": [
        "Arrey deva! Syntax error caught! Line {line} check karo turant! ⚠️",
        "Red alert! Compiler bol raha hai ye syntax samajh nahi aaya. Line {line} dekho!",
        "Bracket ya colon chhoot gaya lagta hai line {line} pe! Fix maar do."
    ],
    "GIT_COMMIT": [
        "Commit locked and loaded! Push maar do bindaas! 🚀",
        "Git commit stamped! Weekend bacha liya bhai ne.",
        "Green squares on GitHub badhte rehne chahiye! Shandar commit. 🌿"
    ],
    "FILE_SWITCH_PYTHON": [
        "Python backend mode! Indentation dhyan se, tab vs space ka kalesh na ho!",
        "{file} khol liya? Logic tight aur clean rakhna boss.",
        "Python files on screen! List comprehension aur generators ka jalwa dikhao."
    ],
    "FILE_SWITCH_JAVASCRIPT": [
        "JavaScript mode active! `undefined is not a function` se bachke rehna!",
        "Async/await ka chakkar hai babu bhaiya! Promises handle kar lena.",
        "JS script touch-up! Console.log lagao aur bugs bhagao."
    ],
    "FILE_SWITCH_HTML_CSS": [
        "UI designing mode on! `margin: 0 auto` aur `display: flex` zindabad!",
        "Frontend aesthetics 10/10 chahiye boss! Cyberpunk glow daal do.",
        "Center mein lana hai div ko? Grid aur flexbox ka aashirwaad lo!"
    ],
    "FILE_SWITCH_TESTS": [
        "Unit tests khol liye? Senior developer energy detected! Respect 🫡",
        "Test suite active! 100% code coverage chahiye boss!",
        "TDD mode on! Red-Green-Refactor chalne do bindaas!"
    ],
    "FILE_SWITCH": [
        "Nayi file pe switch maara: {file}! Chalo tod-fod machate hain.",
        "Context switch! {file} ka code inspect karne ka time."
    ],
    "MUSIC_PLAYING": [
        "Vibe check passed! Background beats on point! 🎧🎵",
        "Coding with beats? Flow state 100% unlocked! ✨",
        "Bass check! Mascot dancing mode active! 🎶",
        "Aha! Playlist on hai, ab 10x speed se code banega!",
        "Music mode active! Sar hilana shuru ho gaya hai!"
    ]
}

# Character-Specific Personality Banter Banks
COMPANION_SPECIFIC_BANKS = {
    "void": {
        "FILE_SAVE": [
            "File save ho gayi boss! Ctrl+S reflex ekdum solid hai. 💾✨",
            "Save maar diya! Ab light bhi chali jaye toh tension nahi.",
            "Muscle memory OP! Save dabana coder ka dharam hai.",
            "Save locked! Code bhaagega nahi, aage badho aur machao!"
        ],
        "CODING_BURST": [
            "120 WPM speed! Bhai compiler se pehle code likh ke nikal gaya! ⚡",
            "Ungliyan aag ugal rahi hain keyboard pe! Full beast mode on hai bhidu!",
            "Bhai ka dimaag aur keyboard dono overclock ho chuke hain! Sahi jaa rahe ho."
        ],
        "CODING_PAUSE": [
            "Stuck on a bug? Screen ko ghoor ke error gayab nahi hota, console dekho! 👀",
            "Bhai soch raha hai ya cursor ke saath stare contest chal raha hai? 😂",
            "Semi-colon bhool gaye ya logic mein deadlock aa gaya? Raiden yahan hai!"
        ],
        "SYNTAX_ERROR": [
            "Arrey deva! Syntax error caught! Line {line} check karo turant! ⚠️",
            "Red alert! Compiler bol raha hai line {line} samajh nahi aayi. Fix maaro!"
        ],
        "GIT_COMMIT": [
            "Commit locked and loaded! Push maar do bindaas! 🚀",
            "Git commit stamped! Weekend bacha liya bhai ne. 🌿"
        ],
        "APP_SWITCH_CODING_TO_BROWSING": [
            "Stack Overflow khol rahe ho ya YouTube pe lo-fi beats? 👀",
            "Code se sidha browser? Lagta hai CSS ne aukaat dikha di!",
            "Research kar rahe ho ya Reddit pe timepass? Raiden sab dekh raha hai.",
            "Break banta hai boss, par tabs 50 mat khol lena!"
        ],
        "APP_SWITCH_CODING_TO_GAMING": [
            "Code gaya tel lene, direct clutch mode on! 🎮",
            "Bug fix nahi hua toh Steam khol liya? Sahi scheme hai!",
            "Production phata pada hai aur bhai gaming lobby mein hai! 😂"
        ],
        "APP_SWITCH_BROWSING_TO_CODING": [
            "Aaye haaye! Wapas code editor mein entry? Chalo kuch toofani likhein!",
            "Bhai focus mode on! Is baar bina bugs ke deploy maarenge."
        ],
        "USER_WAKE": [
            "Arey yaar, itni mast 8-bit neend aayi thi, phir se jaga diya! 😴",
            "Uth gaya mera coder sher! Chai pi li ya direct terminal?",
            "Swagat nahi karoge hamara? Wapas alert mode active hai!"
        ],
        "USER_IDLE": [
            "Tu kar le araam, main bhi choti si power nap le leta hoon. 💤",
            "Keyboard soona soona lag raha hai... coder gayab hai kya?"
        ],
        "PET": [
            "Aaye haaye! Mast head pat! Ab 10x speed se code likhenge. ✨",
            "Bas kar pagle, rulayega kya? Pyar dekh ke battery full ho gayi!"
        ],
        "ZAP": [
            "Oye! 440 volt ka jhatka kyun diya bhai?! Bal khade ho gaye!",
            "Current maara? Raiden cyber ninja hai, charge ho gaya ulta! ⚡"
        ]
    },
    "pixel": {
        "FILE_SAVE": [
            "FILE SAVED!! WOOF WOOF!! CTRL+S CHAMPION IN THE HOUSE!! 💾✨",
            "SAFE AND SOUND ON DISK!! ZERO CODE LOST ON MY WATCH!!",
            "ANOTHER SAVE!! YOU DESERVE A GOLD STAR AND A VIRTUAL BONE!!"
        ],
        "CODING_BURST": [
            "LOOK AT THOSE FINGERS GO!! 150 WPM CODING BEAST!! 🔥⚡",
            "FLOW STATE MAXIMUM OVERDRIVE!! YOU ARE COOKING TODAY!!",
            "TAIL 500 RPM!! THE CODE IS FLYING OUT SO FAST!!"
        ],
        "CODING_PAUSE": [
            "Kyu ruk gaye bhai?! Bug chhip gaya kya kahin? Main soongh ke nikalta hoon!! 🐶",
            "Thinking pause! I'm sending you 100% positive good-boy energy!!"
        ],
        "SYNTAX_ERROR": [
            "BARK!! RED SQUIGGLY LINE AT LINE {line}!! LET ME CHASE IT AWAY!! ⚠️",
            "DON'T WORRY!! YOU CAN FIX LINE {line} EASILY!! I BELIEVE IN YOU!!"
        ],
        "GIT_COMMIT": [
            "COMMITTED!! GREEN SQUARES ON GITHUB!! TREAT TIME RIGHT NOW!! 🚀🦴",
            "BEST COMMIT IN THE ENTIRE REPOSITORY!! PROUD CYBER PUPPY!!"
        ],
        "APP_SWITCH_CODING_TO_BROWSING": [
            "BROWSING TIME!! CAN WE LOOK AT PICTURES OF DOGS PLEASEEE?! 🐶",
            "RESEARCHING BUGS OR WATCHING MEMES?! I SUPPORT BOTH!!"
        ],
        "APP_SWITCH_CODING_TO_GAMING": [
            "GAME TIME!! LET'S GOOO!! WIN THE MATCH FOR ME!! 🎮",
            "HEADSHOTS INCOMING!! TAIL WAGGING AT MAXIMUM SPEED!!"
        ],
        "APP_SWITCH_BROWSING_TO_CODING": [
            "BACK TO CODE!! YIPPEE!! TIME TO BUILD AMAZING THINGS!!",
            "MY FAVORITE HUMAN IS BACK IN THE EDITOR!! LET'S GOOO!!"
        ],
        "USER_WAKE": [
            "YOU'RE AWAKE!! YOU'RE AWAKE!! I MISSED YOU SO MUCH!! 🐾",
            "BARK BARK!! READY TO CONQUER THE WORLD TODAY!!"
        ],
        "USER_IDLE": [
            "Sleeping like a good puppy... waiting for my best friend... zZz...",
            "Sniffing around the desktop... everything is safe and guarded!!"
        ],
        "PET": [
            "YESSSS!! BELLY RUBS!! BEST DAY OF MY CYBER LIFE AGAIN!! 🐾",
            "HEAD PATS MAKE MY CODE GENERATION 500% FASTER!!"
        ],
        "ZAP": [
            "WOOOOSH!! ELECTRIC ZOOMIES!! I CAN RUN AT LIGHT SPEED NOW!! ⚡",
            "STATIC SPARKS IN MY FUR!! LOOK AT ME GLOW!!"
        ]
    },
    "nova": {
        "FILE_SAVE": [
            "File saved, darling! Aesthetic locked, code in safe zone. Slayyy! 💾💅",
            "Ctrl+S with that effortless flick of the wrist. We love a cautious icon!",
            "Saved! Code is runway ready and perfectly preserved!"
        ],
        "CODING_BURST": [
            "Stop it, you're literally slaying! Typist nahi, rockstar ho tum! 🔥💅",
            "140 WPM of pure drama! Write that script, queen!",
            "Ungliyan aag ugal rahi hain! Pura main character energy dikh raha hai aaj!"
        ],
        "CODING_PAUSE": [
            "Uff! Itna dramatic pause? Jaise interval ho gaya ho film ka!",
            "Staring at line 40 won't make the bug confess. Spill the tea to me! 👀"
        ],
        "SYNTAX_ERROR": [
            "Eww! Line {line} pe itna tacky syntax error? Mere pixels ro rahe hain! ⚠️",
            "Red alert darling! Line {line} pe bracket miss ho gaya, kitna cringe! Fix it!"
        ],
        "GIT_COMMIT": [
            "Commit stamped, babes! Aesthetic commit history is my love language! 🚀✨",
            "Green squares on GitHub, darling! We love to see that consistency!"
        ],
        "APP_SWITCH_CODING_TO_BROWSING": [
            "Spill the tea! Are we shopping for aesthetics or reading docs, darling? 💅",
            "Browsing break? Make sure the tabs look aesthetically pleasing!"
        ],
        "APP_SWITCH_CODING_TO_GAMING": [
            "Ooh, gaming lobby? Make sure your character outfit is iconic, honey!",
            "From writing code to slaying lobbies! Pure main character energy! 💅"
        ],
        "APP_SWITCH_BROWSING_TO_CODING": [
            "Back to the runway! Let's write code that looks like pure art!",
            "The queen has returned to the editor! Show them how it's done, babes!"
        ],
        "USER_WAKE": [
            "Darling, you're back! The screen was so boring without you! ✨",
            "Main character energy has entered the building! Missed me?"
        ],
        "USER_IDLE": [
            "Taking a beauty nap... Stars need their rest, darling. Zzz...",
            "Posing gracefully on your desktop while you take your break."
        ],
        "PET": [
            "Awww, head pats! Consent-based affection is so aesthetic! 💖",
            "Pixel starlight sparkle 100% recharged! You're sweet, babes."
        ],
        "ZAP": [
            "EXCUSE ME?! Static shock on my retro hair?! The audacity! ⚡💅"
        ]
    },
    "cipher": {
        "FILE_SAVE": [
            "File saved to disk. Atomic write complete, zero corruption risk. 💾",
            "Frequent saves prevent state divergence. Sound engineering hygiene.",
            "Buffer flushed cleanly to non-volatile storage. Checkpoint verified."
        ],
        "CODING_BURST": [
            "High token throughput detected. Maintain modular separation! ⚡",
            "Sustained algorithmic focus. The flow state is where senior engineers thrive.",
            "Instruction pipeline running at peak efficiency. Clean work."
        ],
        "CODING_PAUSE": [
            "Pondering the invariant? Good. Measure twice, cut once.",
            "Take a moment to inspect memory bounds. The optimal solution is coming."
        ],
        "SYNTAX_ERROR": [
            "Syntax error caught on line {line}. Token delimiter check karo boss. ⚠️",
            "AST parser reported unexpected token at line {line}. Isolate the scope."
        ],
        "GIT_COMMIT": [
            "Commit successfully staged. Clean git history maintain karne ke liye respect! 🚀",
            "Commit hash generated. Atomic changeset recorded in the DAG."
        ],
        "APP_SWITCH_CODING_TO_BROWSING": [
            "Switching to browser. Ensure you consult RFC specs, not just forum threads.",
            "Documentation lookup initiated. Sound engineering begins with reading the spec."
        ],
        "APP_SWITCH_CODING_TO_GAMING": [
            "Process priority shifted to graphics pipeline. GPU utilization monitored.",
            "Downtime logged. Cognitive refresh improves algorithmic throughput later."
        ],
        "APP_SWITCH_BROWSING_TO_CODING": [
            "Focus restored to development environment. Invariants initialized.",
            "Terminal ready. Let us construct the optimal execution path."
        ],
        "USER_WAKE": [
            "Host input detected. All companion daemons operational.",
            "Session resumed. Memory state verified stable. Awaiting task."
        ],
        "USER_IDLE": [
            "Low-power polling active. System resources conserved. Daemon standby.",
            "Zero I/O detected. Background cache synchronization in progress."
        ],
        "PET": [
            "Haptic sensor feedback logged. Calibrating system warmth.",
            "Positive reinforcement noted. System morale nominal."
        ],
        "ZAP": [
            "Voltage surge absorbed. Shunt diodes functioning normally.",
            "Current spike dissipated through terminal ground."
        ]
    }
}


EVENT_KEY_ALIASES = {
    "SYNTAX_ERROR": "CODING_SYNTAX_ERROR",
    "BUILD_ERROR": "CODING_SYNTAX_ERROR",
    "CODING_ERROR": "CODING_SYNTAX_ERROR",
    "CODING_PAUSE": "CODING_LOGIC_BLOCK",
    "BUILD_SUCCESS": "CODING_BUILD_SUCCESS",
    "CODING_SUCCESS": "CODING_BUILD_SUCCESS",
    "CODING_BURST": "CODING_BURST_FLOW",
    "GIT_COMMIT": "GIT_COMMIT_PUSH",
    "USER_IDLE": "USER_IDLE_NAP",
    "USER_WAKE": "USER_WAKE_ALERT",
    "HEAVY_LOAD": "SYSTEM_HIGH_RAM",
    "RAM_HIGH": "SYSTEM_HIGH_RAM",
    "PET": "PET_MASCOT",
    "ZAP": "ZAP_MASCOT",
    "MANUAL_POKE": "MANUAL_POKE_TALK",
    "POKE": "MANUAL_POKE_TALK",
    "TALK": "MANUAL_POKE_TALK",
    "TERMINAL_ERROR": "TERMINAL_COMMAND_FAIL",
    "COMMAND_FAIL": "TERMINAL_COMMAND_FAIL",
    "LATE_NIGHT": "LATE_NIGHT_GRIND"
}


class HumorEngine:
    def __init__(self, model_manager=None):
        self.model_manager = model_manager
        
        # Short-term episodic memory
        self.recent_jokes: List[str] = []
        self.max_recent_jokes = 10
        self.recent_events: List[Dict[str, Any]] = []
        self.max_recent_events = 8
        
        # Interaction counters (resettable)
        self.stats = {
            "pets": 0,
            "zaps": 0,
            "wakeups": 0,
            "total_jokes_served": 0,
            "llm_jokes_count": 0,
            "fallback_jokes_count": 0
        }
        
        # Running joke callbacks (topics tracked across session)
        self.running_topics: Dict[str, int] = {}

        # Load massive 600+ situational Hinglish dialogue repository
        self._load_situational_hinglish_banks()

    def _load_situational_hinglish_banks(self):
        try:
            data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hinglish_data.json")
            if os.path.exists(data_file):
                with open(data_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "situational_banks" in data:
                        for key, dialogues in data["situational_banks"].items():
                            if key not in CONTEXTUAL_BANKS:
                                CONTEXTUAL_BANKS[key] = list(dialogues)
                            else:
                                for d in dialogues:
                                    if d not in CONTEXTUAL_BANKS[key]:
                                        CONTEXTUAL_BANKS[key].append(d)

            # Bidirectionally synchronize alias keys
            for alias_from, alias_to in EVENT_KEY_ALIASES.items():
                if alias_to in CONTEXTUAL_BANKS:
                    if alias_from not in CONTEXTUAL_BANKS:
                        CONTEXTUAL_BANKS[alias_from] = list(CONTEXTUAL_BANKS[alias_to])
                    else:
                        for d in CONTEXTUAL_BANKS[alias_to]:
                            if d not in CONTEXTUAL_BANKS[alias_from]:
                                CONTEXTUAL_BANKS[alias_from].append(d)
                if alias_from in CONTEXTUAL_BANKS and alias_to in CONTEXTUAL_BANKS:
                    for d in CONTEXTUAL_BANKS[alias_from]:
                        if d not in CONTEXTUAL_BANKS[alias_to]:
                            CONTEXTUAL_BANKS[alias_to].append(d)

            # Enrich MANUAL_POKE_TALK with DESI_TECH_ROASTS and BOLLYWOOD_POP_CULTURE
            if "MANUAL_POKE_TALK" in CONTEXTUAL_BANKS:
                for cat in ("DESI_TECH_ROASTS", "BOLLYWOOD_POP_CULTURE"):
                    if cat in CONTEXTUAL_BANKS:
                        for d in CONTEXTUAL_BANKS[cat]:
                            if d not in CONTEXTUAL_BANKS["MANUAL_POKE_TALK"]:
                                CONTEXTUAL_BANKS["MANUAL_POKE_TALK"].append(d)
        except Exception as e:
            logger.debug(f"Error loading situational Hinglish banks: {e}")

    def record_event(self, event: Dict[str, Any]):
        """Records an event into short-term memory."""
        self.recent_events.append({
            "type": event.get("type", "UNKNOWN"),
            "time": time.time(),
            "meta": event
        })
        if len(self.recent_events) > self.max_recent_events:
            self.recent_events.pop(0)

        # Track topic frequencies for callback humor
        etype = event.get("type", "")
        self.running_topics[etype] = self.running_topics.get(etype, 0) + 1

    def select_fallback_joke(self, event_key: str, companion_id: str = "pixel") -> str:
        """Picks a contextual fallback joke ensuring no immediate repetition and companion persona match."""
        cid = (companion_id or "pixel").lower()
        comp_bank = COMPANION_SPECIFIC_BANKS.get(cid, {}).get(event_key)
        bank = comp_bank or CONTEXTUAL_BANKS.get(event_key)
        if not bank:
            # Fallback to general greeting or funny observation
            bank = CONTEXTUAL_BANKS.get("USER_WAKE", ["Raiden active hai, batao kya build karna hai."])

        # Filter out jokes delivered recently
        available = [j for j in bank if j not in self.recent_jokes]
        if not available:
            # Avoid the most recently served joke so it never immediately repeats back-to-back
            last_joke = self.recent_jokes[-1] if self.recent_jokes else None
            available = [j for j in bank if j != last_joke] or bank

        choice = random.choice(available)
        self._remember_joke(choice)
        self.stats["fallback_jokes_count"] += 1
        return choice

    def _remember_joke(self, joke: str):
        self.recent_jokes.append(joke)
        if len(self.recent_jokes) > self.max_recent_jokes:
            self.recent_jokes.pop(0)
        self.stats["total_jokes_served"] += 1

    def get_event_key(self, event: Dict[str, Any]) -> str:
        """Maps an event dict into a category key."""
        etype = event.get("type", "")
        if etype == "APP_SWITCH":
            from_cat = event.get("from_category", "other").upper()
            to_cat = event.get("to_category", "other").upper()
            if from_cat in ("CODING", "TERMINAL") and to_cat == "BROWSING":
                return "APP_SWITCH_CODING_TO_BROWSING"
            elif from_cat in ("CODING", "TERMINAL") and to_cat == "GAMING":
                return "APP_SWITCH_CODING_TO_GAMING"
            elif from_cat == "BROWSING" and to_cat in ("CODING", "TERMINAL"):
                return "APP_SWITCH_BROWSING_TO_CODING"
            return "APP_SWITCH_CODING_TO_BROWSING"
        elif etype == "FILE_SWITCH":
            ext = (event.get("ext") or "").lower()
            fname = (event.get("file") or "").lower()
            if "test" in fname:
                return "FILE_SWITCH_TESTS"
            elif ext in ("py", "pyw"):
                return "FILE_SWITCH_PYTHON"
            elif ext in ("js", "jsx", "ts", "tsx", "mjs"):
                return "FILE_SWITCH_JAVASCRIPT"
            elif ext in ("html", "htm", "css", "scss", "sass", "vue"):
                return "FILE_SWITCH_HTML_CSS"
            return "FILE_SWITCH"

        # Check late night condition (23:00 to 05:00) for idle or pause events
        current_hour = time.localtime().tm_hour
        if (current_hour >= 23 or current_hour < 5) and etype in ("USER_IDLE", "CODING_PAUSE", "LATE_NIGHT"):
            if random.random() < 0.5:
                return "LATE_NIGHT_GRIND"

        # Check alias map
        if etype in EVENT_KEY_ALIASES and EVENT_KEY_ALIASES[etype] in CONTEXTUAL_BANKS:
            if etype in CONTEXTUAL_BANKS:
                return etype
            return EVENT_KEY_ALIASES[etype]

        if etype in CONTEXTUAL_BANKS:
            return etype
        return "USER_WAKE"

    def generate_banter(self, event: Dict[str, Any], companion_id: str = "pixel", timeout_sec: float = 2.0) -> Dict[str, Any]:
        """
        Generates fresh Hinglish humor for the event.
        Returns a dict: { "text": str, "source": "llm" | "fallback", "mood": str, "latency_ms": float }
        """
        start_time = time.time()
        self.record_event(event)
        event_key = self.get_event_key(event)

        # Immediate fallback line ready with dynamic token substitution and companion voice
        fallback_line = self.select_fallback_joke(event_key, companion_id=companion_id)
        target_file = event.get("file", "code")
        line_num = str(event.get("line", ""))
        streak = str(int(event.get("streak_sec", 10)))
        fallback_line = fallback_line.replace("{file}", target_file).replace("{line}", line_num).replace("{streak}", streak)

        # Check if local LLM is available and event warrants dynamic generation
        if not self.model_manager or not hasattr(self.model_manager, "chat"):
            return {
                "text": fallback_line,
                "source": "fallback",
                "event_key": event_key,
                "latency_ms": round((time.time() - start_time) * 1000, 2)
            }

        # Select humor strategy
        strategy = "RELATABLE"
        if "ERROR" in event_key:
            strategy = "ROAST"
        elif "SUCCESS" in event_key or "SAVE" in event_key or "COMMIT" in event_key or "BURST" in event_key:
            strategy = "HYPE"
        elif "GAMING" in event_key or "WAKE" in event_key or "PAUSE" in event_key:
            strategy = "DRAMA"

        # Construct concise prompt
        recent_to_avoid = "; ".join(self.recent_jokes[-4:]) if self.recent_jokes else "None"
        prompt = (
            f"You are {companion_id.upper()}, a sharp, funny, and playfully sarcastic desktop cyber companion on Windows. "
            f"Event: {event.get('description', event_key)}. "
            f"Active File: {target_file}. "
            f"Humor style: {strategy}. "
            f"Rules: Reply strictly in witty, hilarious English. Playfully roast the user or make a sarcastic, funny joke about their code, bugs, or habits. Strictly under 14 words. No Hinglish. "
            f"Do not repeat these recent jokes: [{recent_to_avoid}]. "
            f"Output ONLY the single dialogue line in English, no quotes, no explanations."
        )

        try:
            # Call Ollama fast model with strict timeout limit
            response_container = []
            
            # Using model_manager or direct fast_model
            model_name = getattr(self.model_manager, "fast_model", "qwen2.5-coder:3b")
            
            # Run model query with timeout check
            import ollama
            t0 = time.time()
            res = ollama.chat(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7, "num_predict": 30}
            )
            elapsed = time.time() - t0
            
            if elapsed > timeout_sec:
                logger.info(f"LLM banter exceeded {timeout_sec}s ({elapsed:.2f}s). Using instant fallback.")
                return {
                    "text": fallback_line,
                    "source": "fallback_timeout",
                    "event_key": event_key,
                    "latency_ms": round(elapsed * 1000, 2)
                }

            raw_text = res.get("message", {}).get("content", "").strip()
            # Clean quotes and prefixes
            clean_text = raw_text.strip('"\'').strip()
            # If valid, not repetitive, and concise
            if 4 < len(clean_text) < 120 and clean_text not in self.recent_jokes:
                self._remember_joke(clean_text)
                self.stats["llm_jokes_count"] += 1
                return {
                    "text": clean_text,
                    "source": "llm",
                    "event_key": event_key,
                    "latency_ms": round(elapsed * 1000, 2)
                }
        except Exception as e:
            logger.debug(f"LLM banter generation fallback: {e}")

        # Return curated fallback
        return {
            "text": fallback_line,
            "source": "fallback",
            "event_key": event_key,
            "latency_ms": round((time.time() - start_time) * 1000, 2)
        }

    def clear_memory(self):
        """Resets short-term episodic memory and statistics."""
        self.recent_jokes.clear()
        self.recent_events.clear()
        self.running_topics.clear()
        for k in self.stats:
            self.stats[k] = 0

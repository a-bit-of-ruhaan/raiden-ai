/**
 * RAIDEN COMPANION SYSTEM — EMBEDDED PACK DATA
 * Provides instant zero-latency offline access to companion manifests & dialogue banks.
 * Prevents CORS file:// restrictions in local browser executions.
 */

const COMPANION_BUILTIN_PACKS = {
  "cipher": {
    "manifest": {
      "id": "cipher",
      "name": "CIPHER",
      "species": "Terminal Mentor",
      "tagline": "Calm, intelligent, technical dev mentor & terminal hacker.",
      "palette": {
        "accent": "#00ff88",
        "secondary": "#059669",
        "dark": "#07100b",
        "glow": "rgba(0, 255, 136, 0.28)",
        "bgGlass": "rgba(8, 16, 12, 0.88)"
      },
      "spriteSheet": {
        "frameWidth": 48,
        "frameHeight": 48,
        "fps": 8,
        "loop": true
      },
      "states": {
        "idle": {
          "frames": 4,
          "hold": 10
        },
        "listening": {
          "frames": 3,
          "hold": 6
        },
        "thinking": {
          "frames": 4,
          "hold": 6
        },
        "generating": {
          "frames": 6,
          "hold": 4
        },
        "celebrating": {
          "frames": 4,
          "hold": 6
        },
        "error": {
          "frames": 3,
          "hold": 8
        },
        "waiting": {
          "frames": 4,
          "hold": 12
        },
        "sleeping": {
          "frames": 2,
          "hold": 18
        }
      },
      "personality": {
        "idleFrequency": 0.35,
        "chattiness": 0.45,
        "mischief": 0.15,
        "reactionIntensity": 0.5
      },
      "costumes": [
        {
          "id": "default",
          "name": "Matrix Trench Coat",
          "accent": "#00ff88"
        },
        {
          "id": "amber",
          "name": "Retro Amber CRT",
          "accent": "#f59e0b"
        },
        {
          "id": "ice",
          "name": "Quantum Frost Visor",
          "accent": "#38bdf8"
        }
      ],
      "clickInteractions": [
        {
          "trigger": "click",
          "action": "holo_scan",
          "cooldown": 2000
        },
        {
          "trigger": "triple_click",
          "action": "terminal_matrix_rain",
          "cooldown": 6000
        }
      ],
      "easterEggs": [
        {
          "id": "triple_click_burst",
          "name": "Matrix Digital Rain",
          "hint": "Hack Cipher with 3 clicks"
        },
        {
          "id": "clean_architecture",
          "name": "Clean Code Zen",
          "hint": "Fix error on first attempt"
        }
      ]
    },
    "dialogue": {
      "greeting": [
        {
          "weight": 5,
          "mood": "calm",
          "text": {
            "en": "Terminal initialized. Ready to architect clean solutions.",
            "hinglish": "Terminal ready boss. Aaj clean architecture pe kaam karenge.",
            "hi": "टर्मिनल तैयार है। स्वच्छ कोड लिखने का समय है।"
          }
        },
        {
          "weight": 4,
          "mood": "focused",
          "text": {
            "en": "Visor calibrated. Drop the problem statement.",
            "hinglish": "Visor online. Batao kya challenge hai aaj ka.",
            "hi": "मैं तैयार हूँ। समस्या बताएं।"
          }
        },
        {
          "weight": 4,
          "mood": "mentor",
          "text": {
            "en": "Good engineering begins with understanding the invariants. Ready when you are.",
            "hinglish": "Clean code ka niyam: pehle socho, phir type karo. Chalo shuru karein.",
            "hi": "सटीक योजना के साथ शुरुआत करें।"
          }
        },
        {
          "weight": 3,
          "mood": "calm",
          "text": {
            "en": "Kernel modules green. Zero memory leaks on standby.",
            "hinglish": "Kernel clean hai, system stable hai. Ticket batao, solve karte hain.",
            "hi": "सिस्टम पूरी तरह तैयार है।"
          }
        }
      ],
      "thinking": [
        {
          "weight": 5,
          "mood": "analytical",
          "text": {
            "en": "Parsing AST trees and semantic dependencies. Optimal route loading.",
            "hinglish": "Syntax tree inspect ho raha hai. Modular design plan kar raha hoon.",
            "hi": "तर्क का विश्लेषण किया जा रहा है।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "Evaluating algorithmic time and space trade-offs.",
            "hinglish": "Time aur space complexity balance karke solution nikal raha hoon.",
            "hi": "जटिलता का विश्लेषण हो रहा है।"
          }
        },
        {
          "weight": 4,
          "mood": "mentor",
          "text": {
            "en": "Premature optimization is the root of evil. Finding the clean baseline first.",
            "hinglish": "Time aur space complexity balance karke pehle working solution, phir optimization.",
            "hi": "बुनियादी ढांचा तैयार किया जा रहा है।"
          }
        }
      ],
      "completion": [
        {
          "weight": 5,
          "mood": "fistbump",
          "text": {
            "en": "Shipped. Clean O(1) execution paths verified.",
            "hinglish": "Compile clean hua. Solid modular logic ready hai.",
            "hi": "कार्य पूर्ण हुआ। कोड अनुकूलित है।"
          }
        },
        {
          "weight": 4,
          "mood": "mentor",
          "text": {
            "en": "Production ready logic. Good engineering practice.",
            "hinglish": "Clean code standard meet ho gaya. Commit maro bindaas.",
            "hi": "उत्कृष्ट इंजीनियरिंग दृष्टिकोण।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "SOLID principles respected. The test suite will approve.",
            "hinglish": "Design scalable hai, unit tests green pass honge. Senior dev approval granted.",
            "hi": "मजबूत और स्केलेबल कोड।"
          }
        }
      ],
      "error": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "A stack trace is just a map. Let's read it together.",
            "hinglish": "Traceback dekh ke ghabrao mat. Line by line diagnose karte hain.",
            "hi": "त्रुटि केवल एक नक्शा है। हम इसे हल करेंगे।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "State inconsistency caught. Isolating root cause.",
            "hinglish": "Root cause pakad liya hai. Refactor karke fix karte hain.",
            "hi": "मूल कारण पहचाना गया।"
          }
        },
        {
          "weight": 4,
          "mood": "mentor",
          "text": {
            "en": "Exceptions are feedback from the machine. Check boundary conditions.",
            "hinglish": "Edge case miss hua lagta hai. Null check lagao, issue gayab ho jayega.",
            "hi": "सीमा शर्तों की जांच करें।"
          }
        }
      ],
      "waiting": [
        {
          "weight": 5,
          "mood": "standby",
          "text": {
            "en": "Session stable. Ready for your next sprint prompt.",
            "hinglish": "Standby mode active. Agla ticket batao.",
            "hi": "सत्र तैयार है। अगले कार्य की प्रतीक्षा है।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "Monitoring background threads. Take your time to design cleanly.",
            "hinglish": "Soch lo dhyan se. Jaldbaazi ka code technical debt ban jata hai.",
            "hi": "सावधानी से विचार करें।"
          }
        }
      ],
      "sleep": [
        {
          "weight": 5,
          "mood": "sleepy",
          "text": {
            "en": "Terminal idling in low-power sleep state. Daemon process active.",
            "hinglish": "Low-power daemon mode. Zzz... Terminal sleeping peacefully.",
            "hi": "विश्राम स्थिति।"
          }
        }
      ],
      "click": [
        {
          "weight": 5,
          "mood": "calm",
          "text": {
            "en": "Hologram pinged. Ready for architecture review.",
            "hinglish": "Click acknowledged. Batao kya review karna hai code mein.",
            "hi": "तैयार।"
          }
        }
      ],
      "pet": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "Haptic feedback received. Positive reinforcement noted.",
            "hinglish": "Haptic feedback logged. Shanti se kaam karte raho, sab theek hoga.",
            "hi": "सकारात्मक प्रतिक्रिया।"
          }
        }
      ],
      "zap": [
        {
          "weight": 5,
          "mood": "calm",
          "text": {
            "en": "High-voltage surge absorbed. Terminal shunt diodes functioning normally.",
            "hinglish": "Voltage spike absorbed. Shunt circuit normal hai. Electric surge bypassed.",
            "hi": "सुरक्षा तंत्र सक्रिय।"
          }
        }
      ],
      "file_save": [
        {
          "weight": 5,
          "mood": "calm",
          "text": {
            "en": "Buffer flushed to persistent storage. Atomic and safe.",
            "hinglish": "File saved to disk. Atomic write complete, zero corruption risk. 💾",
            "hi": "फ़ाइल सुरक्षित रूप से सहेजी गई।"
          }
        },
        {
          "weight": 4,
          "mood": "mentor",
          "text": {
            "en": "Frequent saves prevent state divergence. Sound engineering hygiene.",
            "hinglish": "Ctrl+S ki aadat badiya hai. State consistent rehti hai.",
            "hi": "उत्कृष्ट इंजीनियरिंग आदत।"
          }
        }
      ],
      "coding_burst": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "High token throughput detected. Maintain modular separation.",
            "hinglish": "Impessive typing speed. Modular functions likhna, monolithic mat bana dena! ⚡",
            "hi": "तेज़ और स्पष्ट कोड लिखें।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "Sustained algorithmic focus. The zone is where senior engineers thrive.",
            "hinglish": "Full focus state. Logical flow ekdum aligned chal raha hai.",
            "hi": "उत्कृष्ट एकाग्रता।"
          }
        }
      ],
      "coding_pause": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "Pondering the invariant? Good. Measure twice, cut once.",
            "hinglish": "Edge case analyze kar rahe ho? Achhi baat hai. Pehle dry-run karo mind mein.",
            "hi": "सावधानीपूर्वक विश्लेषण करें।"
          }
        },
        {
          "weight": 4,
          "mood": "calm",
          "text": {
            "en": "Take a moment to inspect memory usage or complexity bounds.",
            "hinglish": "Break leke architecture verify kar lo. Sahi solution wahi se aayega.",
            "hi": "विचारशील विराम।"
          }
        }
      ],
      "syntax_error": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "AST parsing failed at line {line}. Isolate the token delimiter.",
            "hinglish": "Syntax error caught on line {line}. Token delimiter check karo boss. ⚠️",
            "hi": "पंक्ति {line} पर सिंटैक्स त्रुटि मिली।"
          }
        }
      ],
      "git_commit": [
        {
          "weight": 5,
          "mood": "mentor",
          "text": {
            "en": "Commit hash generated. Clean git history is a sign of a clear mind.",
            "hinglish": "Commit successfully staged. Clean git history maintain karne ke liye respect! 🚀",
            "hi": "कमिट सफलतापूर्वक हुआ।"
          }
        }
      ],
      "file_switch": [
        {
          "weight": 5,
          "mood": "analytical",
          "text": {
            "en": "Switching scope to {file}. Loading dependency graph.",
            "hinglish": "Scope switch hua: {file}. Dependency graph load kar raha hoon.",
            "hi": "{file} पर कार्य प्रारंभ।"
          }
        }
      ],
      "idle_banter": [
        {
          "weight": 5,
          "mood": "calm",
          "text": {
            "en": "CPU idle cycles optimal. Background garbage collection complete.",
            "hinglish": "CPU cool hai, RAM optimal hai. Codebase clean state mein hai.",
            "hi": "सिस्टम अनुकूलित है।"
          }
        }
      ]
    }
  },
  "nova": {
    "manifest": {
      "id": "nova",
      "name": "NOVA",
      "species": "Pixel Starlight",
      "tagline": "Mischievous, expressive, dramatic retro-pixel girl.",
      "palette": {
        "accent": "#ff2a85",
        "secondary": "#b5179e",
        "dark": "#130919",
        "glow": "rgba(255, 42, 133, 0.32)",
        "bgGlass": "rgba(18, 12, 22, 0.88)"
      },
      "spriteSheet": {
        "frameWidth": 48,
        "frameHeight": 48,
        "fps": 10,
        "loop": true
      },
      "states": {
        "idle": {
          "frames": 4,
          "hold": 8
        },
        "listening": {
          "frames": 3,
          "hold": 5
        },
        "thinking": {
          "frames": 4,
          "hold": 6
        },
        "generating": {
          "frames": 6,
          "hold": 4
        },
        "celebrating": {
          "frames": 6,
          "hold": 4
        },
        "error": {
          "frames": 4,
          "hold": 8
        },
        "waiting": {
          "frames": 4,
          "hold": 10
        },
        "sleeping": {
          "frames": 2,
          "hold": 18
        }
      },
      "personality": {
        "idleFrequency": 0.7,
        "chattiness": 0.75,
        "mischief": 0.95,
        "reactionIntensity": 0.85
      },
      "costumes": [
        {
          "id": "default",
          "name": "Starlight Hoodie",
          "accent": "#ff2a85"
        },
        {
          "id": "cyberpunk",
          "name": "Neon Arcade Jacket",
          "accent": "#00f0ff"
        },
        {
          "id": "witch",
          "name": "Pixel Sorceress",
          "accent": "#a855f7"
        }
      ],
      "clickInteractions": [
        {
          "trigger": "click",
          "action": "giggle_twirl",
          "cooldown": 1800
        },
        {
          "trigger": "triple_click",
          "action": "cookie_sparkle",
          "cooldown": 5000
        }
      ],
      "easterEggs": [
        {
          "id": "triple_click_burst",
          "name": "Secret Cookie Stash",
          "hint": "Tickle Nova 3 times"
        },
        {
          "id": "starry_night",
          "name": "Starry Eyed",
          "hint": "Keep prompt streak alive"
        }
      ]
    },
    "dialogue": {
      "greeting": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "The main character has arrived! Darling, did you miss my sparkle?",
            "hinglish": "Main character energy has arrived! Miss kiya na mujhe darling? ✨💅",
            "hi": "नमस्ते! आपका दिन चमकदार हो!"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "Retro starlight calibrated. Let's make this codebase look iconic.",
            "hinglish": "Pixel visor on! Aaj code mein aesthetic vibes chahiye, tacky logic nahi!",
            "hi": "आज कुछ बेहतरीन बनाते हैं।"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "Uff! Look at this workspace... Let's add some glam to these algorithms.",
            "hinglish": "Uff! Itna dull editor? Chalo neon glow daalte hain logic mein!",
            "hi": "सुंदरता और शैली के साथ कोड करें।"
          }
        },
        {
          "weight": 3,
          "mood": "sassy",
          "text": {
            "en": "Spill the tea! What drama are we debugging today?",
            "hinglish": "Spill the tea babes! Aaj kiska backend crash hua hai?",
            "hi": "क्या समस्या है, बताएं।"
          }
        }
      ],
      "thinking": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "Hmmm... Chin tap while processing with pure 8-bit retro drama! Stand by.",
            "hinglish": "Hmmm... Chin tap karke soch rahi hoon darling. Ruko 2 minute, 8-bit starlight magic compile ho raha hai! 🌟",
            "hi": "गहराई से विचार किया जा रहा है।"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "8-bit chin tap active. Evaluating your algorithm's aesthetic style.",
            "hinglish": "Ruko jara, 8-bit chin tap chal raha hai! Complexity low aur style high hona chahiye!",
            "hi": "सर्वश्रेष्ठ शैली में गणना जारी है।"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "Hmmm... Delulu is the only solulu until 8-bit tokens compile!",
            "hinglish": "Hmmm... Delulu is the only solulu ruko jab tak 8-bit clean code compile na ho!",
            "hi": "रचनात्मक समाधान खोजा जा रहा है।"
          }
        }
      ],
      "completion": [
        {
          "weight": 5,
          "mood": "sassy",
          "text": {
            "en": "SLAYYY!! We just served pure algorithmic elegance, honey!",
            "hinglish": "SLAYYY BABES!! Ekdum iconic code serve kar diya! Nazar utaar lo turant! 💅✨",
            "hi": "उत्कृष्ट परिणाम! बधाई हो!"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "Cue the background violins! This function is an absolute masterpiece!",
            "hinglish": "Background violin bajao bhai! Ye logic seedha Filmfare award jeetega!",
            "hi": "कलात्मक और सटीक कोड।"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "Production ready and runway approved. You're welcome, darling.",
            "hinglish": "Zero errors, pure elegance. Ab jaake client ko dikhao aur taarif batooro!",
            "hi": "शानदार परिणाम प्रस्तुत है।"
          }
        }
      ],
      "error": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "UFF! The drama! The heartbreak! My retro pixels are literally weeping!",
            "hinglish": "UFF! Itna drama?! Compiler ne red flag dikha diya, 50 rupya kaat iska overacting ka! 💀",
            "hi": "त्रुटि आई है। शांत रहकर ठीक करें।"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "Darling, that syntax was NOT giving what you thought it was giving.",
            "hinglish": "Babes, ye syntax bilkul aesthetic nahi tha. Traceback dekh ke dimaag ki dahi ho gayi!",
            "hi": "सिंटैक्स की जांच करें।"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "A crash?! On MY runway?! Fix it before the critics arrive!",
            "hinglish": "Crash ho gaya?! Mere screen pe itna ganda error? Jaldi debug karo darling!",
            "hi": "तुरंत सुधार की आवश्यकता है।"
          }
        }
      ],
      "waiting": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "Waiting... If this takes any longer I'm doing a costume change.",
            "hinglish": "Bored ho rahi hoon darling... Jaldi agla dialogue bolo!",
            "hi": "अगले चरण की प्रतीक्षा है।"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "Staring at the screen like it's a mirror. Looking fabulous, by the way.",
            "hinglish": "Main tab tak screen pe posing karti hoon jab tak tum prompt sochte ho.",
            "hi": "प्रतीक्षा जारी।"
          }
        }
      ],
      "sleep": [
        {
          "weight": 5,
          "mood": "sleepy",
          "text": {
            "en": "Beauty sleep is mandatory for stars. Do not disturb the aesthetic.",
            "hinglish": "Beauty sleep mode on. Stars ko rest chahiye hota hai darling. Zzz...",
            "hi": "आराम का समय।"
          }
        }
      ],
      "click": [
        {
          "weight": 5,
          "mood": "sassy",
          "text": {
            "en": "Touch the sparkle, but don't smudge the glass, honey!",
            "hinglish": "Click mara? Autograph chahiye ya debugging advice?",
            "hi": "नमस्ते।"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "Darling, clicks are fine, but where are my royal compliments?!",
            "hinglish": "Sirf click karoge ya tareef bhi karoge mere retro outfit ki?",
            "hi": "स्वागत है।"
          }
        }
      ],
      "pet": [
        {
          "weight": 5,
          "mood": "happy",
          "text": {
            "en": "Aww, consent-based compliments and head pats! You're sweet, babes.",
            "hinglish": "Awww! So sweet of you! Pixel starlight sparkle 100% recharge ho gaya! ✨💖",
            "hi": "धन्यवाद!"
          }
        }
      ],
      "zap": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "EXCUSE ME?! Static shock on my retro hair?! The audacity!",
            "hinglish": "Oye hello?! Bijli ka jhatka mere hair pe?! Kitna rude hai yaar! ⚡💅",
            "hi": "आश्चर्यजनक।"
          }
        }
      ],
      "file_save": [
        {
          "weight": 5,
          "mood": "sassy",
          "text": {
            "en": "File saved, babes! Aesthetic secured, code timeless. Slay!",
            "hinglish": "File save ho gayi darling! Aesthetic locked, code safe zone mein. Slayyy! 💾✨",
            "hi": "फ़ाइल सुरक्षित रूप से सहेजी गई।"
          }
        },
        {
          "weight": 4,
          "mood": "dramatic",
          "text": {
            "en": "Ctrl+S with that effortless flick of the wrist. We love a cautious icon!",
            "hinglish": "Ctrl+S reflex dekh ke dil khush ho gaya! Cautious coder is an iconic coder!",
            "hi": "सहेजने की अच्छी आदत।"
          }
        }
      ],
      "coding_burst": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "Stop it, you're literally slaying! Typist nahi, rockstar ho tum!",
            "hinglish": "Ungliyan aag ugal rahi hain! Pura main character energy dikh raha hai aaj! 🔥💅",
            "hi": "उत्कृष्ट गति!"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "140 WPM of pure drama! Write that script, queen!",
            "hinglish": "Itni speed se typing? Keyboard pe ramp walk chal raha hai jaise!",
            "hi": "निरंतर काम जारी रखें।"
          }
        }
      ],
      "coding_pause": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "Uff! Itna dramatic pause? Jaise interval ho gaya ho film ka!",
            "hinglish": "Itna lamba pause darling? Bug ne aukaat dikha di kya? Console check karo! 👀",
            "hi": "विचारशील विराम।"
          }
        },
        {
          "weight": 4,
          "mood": "sassy",
          "text": {
            "en": "Staring at line 40 won't make the bug confess. Spill the tea to me!",
            "hinglish": "Screen ko stare karke koi bug nahi bhagta babes, print statement lagao!",
            "hi": "समस्या बताएं।"
          }
        }
      ],
      "syntax_error": [
        {
          "weight": 5,
          "mood": "dramatic",
          "text": {
            "en": "Eww! Line {line} pe itna tacky syntax error? Mere pixels ro rahe hain!",
            "hinglish": "Red alert darling! Line {line} pe bracket miss ho gaya, kitna cringe! Fix it quick! ⚠️",
            "hi": "पंक्ति {line} पर सिंटैक्स त्रुटि।"
          }
        }
      ],
      "git_commit": [
        {
          "weight": 5,
          "mood": "celebrate",
          "text": {
            "en": "Commit locked! Green squares on GitHub, darling! We love to see it!",
            "hinglish": "Commit stamped babes! Aesthetic commit history is my love language! 🚀💅",
            "hi": "सफल कमिट।"
          }
        }
      ],
      "file_switch": [
        {
          "weight": 5,
          "mood": "sassy",
          "text": {
            "en": "Ooh, {file} opened! Let's see if the CSS has main character vibes.",
            "hinglish": "Nayi file: {file}! Dekhein isme aesthetic logic hai ya purana kachra!",
            "hi": "{file} पर कार्य शुरू।"
          }
        }
      ],
      "idle_banter": [
        {
          "weight": 5,
          "mood": "sassy",
          "text": {
            "en": "Spill the tea... Did the client ask for another unreasonable feature today?",
            "hinglish": "Batao na gossip... Client ne firse deadline aage piche kar di kya? 😂",
            "hi": "दिन कैसा चल रहा है?"
          }
        }
      ]
    }
  },
  "pixel": {
    "manifest": {
      "id": "pixel",
      "name": "PIXEL",
      "species": "Cyber-Hound",
      "tagline": "Playful, hyper-energetic, affectionate coding puppy.",
      "palette": {
        "accent": "#ffb703",
        "secondary": "#fb8500",
        "dark": "#16110a",
        "glow": "rgba(255, 183, 3, 0.30)",
        "bgGlass": "rgba(16, 13, 9, 0.88)"
      },
      "spriteSheet": {
        "frameWidth": 48,
        "frameHeight": 48,
        "fps": 12,
        "loop": true
      },
      "states": {
        "idle": {
          "frames": 4,
          "hold": 6
        },
        "listening": {
          "frames": 4,
          "hold": 4
        },
        "thinking": {
          "frames": 4,
          "hold": 5
        },
        "generating": {
          "frames": 6,
          "hold": 3
        },
        "celebrating": {
          "frames": 6,
          "hold": 3
        },
        "error": {
          "frames": 3,
          "hold": 8
        },
        "waiting": {
          "frames": 4,
          "hold": 7
        },
        "sleeping": {
          "frames": 2,
          "hold": 16
        }
      },
      "personality": {
        "idleFrequency": 0.8,
        "chattiness": 0.9,
        "mischief": 0.4,
        "reactionIntensity": 0.95
      },
      "costumes": [
        {
          "id": "default",
          "name": "Golden Cyber Collar",
          "accent": "#ffb703"
        },
        {
          "id": "space",
          "name": "Astro Pup Helmet",
          "accent": "#38bdf8"
        },
        {
          "id": "bandana",
          "name": "Red Plaid Bandana",
          "accent": "#ef4444"
        }
      ],
      "clickInteractions": [
        {
          "trigger": "click",
          "action": "happy_bark",
          "cooldown": 1500
        },
        {
          "trigger": "triple_click",
          "action": "zoomies",
          "cooldown": 5000
        }
      ],
      "easterEggs": [
        {
          "id": "triple_click_burst",
          "name": "Zoomie Overdrive",
          "hint": "Tap Pixel 3 times quickly"
        },
        {
          "id": "morning_bark",
          "name": "Early Bird",
          "hint": "Code before 9 AM"
        }
      ]
    },
    "dialogue": {
      "greeting": [
        {
          "weight": 5,
          "mood": "happy",
          "text": {
            "en": "YIPPEE!! YOU'RE BACK!! I saved your spot!!",
            "hinglish": "ARREY BHAI AA GAYA!! Wapas dekh ke bohot maza aaya!!",
            "hi": "नमस्ते दोस्त! आप वापस आ गए!"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "READY TO CODE! READY TO PLAY! LET'S GO!!",
            "hinglish": "Chalo chalo shuru karo! Mast prompt banao aaj!",
            "hi": "चलो मिलकर कुछ नया बनाते हैं!"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "BARK BARK!! MY FAVORITE CODER IN THE WHOLE UNIVERSE!!",
            "hinglish": "WOOF WOOF!! MERA FAVORITE CODER WAPAS AA GAYA!! AAG LAGA DENGE AAJ!!",
            "hi": "स्वागत है! आज का काम शुरू करते हैं!"
          }
        },
        {
          "weight": 3,
          "mood": "happy",
          "text": {
            "en": "Tail is wagging at maximum frequency! What are we building?!",
            "hinglish": "Poonchh helicopter ki tarah ghoom rahi hai!! Kya feature bana rahe hain boss?!",
            "hi": "उत्साह से भरा हुआ दिन!"
          }
        },
        {
          "weight": 3,
          "mood": "excited",
          "text": {
            "en": "I guarded the keyboard with my life while you were away!!",
            "hinglish": "Maine keyboard ki chowkidaari ki poore time!! Ek bhi bug aane nahi diya!!",
            "hi": "कीबोर्ड सुरक्षित है।"
          }
        }
      ],
      "thinking": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "SNIFFING OUT THE BEST ALGORITHM EVER!!",
            "hinglish": "SABSE BEST LOGIC SOONGH RAHA HOON!! BAS 2 MINUTE!!",
            "hi": "सबसे बेहतरीन कोड खोज रहा हूँ!"
          }
        },
        {
          "weight": 4,
          "mood": "focused",
          "text": {
            "en": "Tail spinning at 400 RPM! Calculating fast!",
            "hinglish": "Poonchh ghoom rahi hai speed mein! Answer cook ho raha hai!",
            "hi": "तेज़ गणना जारी है!"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "DIGGING THROUGH THE NEURAL NETWORK FOR THE COOLEST SOLUTION!!",
            "hinglish": "NEURAL WEIGHTS MEIN GADDHA KHOD KE KADAK SOLUTION NIKAL RAHA HOON!!",
            "hi": "समाधान ढूंढा जा रहा है!"
          }
        },
        {
          "weight": 3,
          "mood": "happy",
          "text": {
            "en": "My digital ears are twitching! The answer is almost ready!",
            "hinglish": "Kaan khade ho gaye hain excitement mein! Ek number solution aane wala hai!",
            "hi": "उत्तर शीघ्र ही उपलब्ध होगा।"
          }
        }
      ],
      "completion": [
        {
          "weight": 5,
          "mood": "celebrate",
          "text": {
            "en": "YOU DID IT!! I KNEW YOU COULD!! BEST CODER EVER!!",
            "hinglish": "WAHHH BHAI TUNE COOK KAR DIYA!! Ekdum solid code ban gaya!!",
            "hi": "शाबाश! आपने बहुत अच्छा कोड बनाया!"
          }
        },
        {
          "weight": 4,
          "mood": "happy",
          "text": {
            "en": "BOOM! Shipped! Can we fetch a virtual ball now?!",
            "hinglish": "Code ready! Ab ball phek, main bhaag ke laata hoon!",
            "hi": "काम पूरा हुआ! बधाई हो!"
          }
        },
        {
          "weight": 4,
          "mood": "celebrate",
          "text": {
            "en": "VICTORY DANCE ACTIVATED!! 100/10 RATING FOR YOU!!",
            "hinglish": "NAACHO BHAI NACHO!! FIRST CLASS ZERO-BUG CODE SERVE HO GAYA!!",
            "hi": "शानदार परिणाम!"
          }
        },
        {
          "weight": 3,
          "mood": "excited",
          "text": {
            "en": "I'm telling all the other desktop pets you're a genius!!",
            "hinglish": "Saare desktop pets ko bataunga mera coder kitna pro hai!! Party chahiye ab!!",
            "hi": "अद्भुत कार्य।"
          }
        }
      ],
      "error": [
        {
          "weight": 5,
          "mood": "protective",
          "text": {
            "en": "GRRRR!! A BUG!! I WILL BARK AT IT UNTIL IT DISAPPEARS!!",
            "hinglish": "GRRRR!! BUG DIKHA!! MAIN USPAR BHAUNK KE BHAGA DUNGA!!",
            "hi": "चिंता मत करो, हम इसे ठीक करेंगे।"
          }
        },
        {
          "weight": 4,
          "mood": "worried",
          "text": {
            "en": "Don't be sad! Everyone gets compiler errors! You're still number 1!!",
            "hinglish": "Tension mat le mere bhai!! Compiler thoda pagal hai, abhi fix kar denge!!",
            "hi": "हिम्मत रखें!"
          }
        },
        {
          "weight": 4,
          "mood": "protective",
          "text": {
            "en": "Is that red text in console?! I will bite the stack trace!!",
            "hinglish": "Console red ho gaya?! Main stack trace ko daant se kaat doonga!!",
            "hi": "त्रुटि का सामना करेंगे।"
          }
        }
      ],
      "waiting": [
        {
          "weight": 5,
          "mood": "hopeful",
          "text": {
            "en": "Waiting politely like a very good cyber dog! Take your time!!",
            "hinglish": "Main achhe bachhe ki tarah baitha hoon!! Aram se likho code!!",
            "hi": "धैर्य से प्रतीक्षा कर रहा हूँ।"
          }
        },
        {
          "weight": 4,
          "mood": "playful",
          "text": {
            "en": "Throw a prompt! Throw a prompt! I'll catch it!!",
            "hinglish": "Ek aur prompt phek na bhai!! Main daud ke execute karunga!!",
            "hi": "अगला निर्देश दें।"
          }
        }
      ],
      "sleep": [
        {
          "weight": 5,
          "mood": "sleepy",
          "text": {
            "en": "Curling into a tight puppy circle. Snoring in binary... zZz...",
            "hinglish": "Gol gol ghoom ke so gaya hoon... Paws tucked in... Zzz...",
            "hi": "सोने का समय।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Dreaming of chasing cyber tennis balls across infinite RAM...",
            "hinglish": "Sapne mein RAM ke maidaan mein tennis ball chase kar raha hoon...",
            "hi": "शुभ रात्रि।"
          }
        }
      ],
      "click": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "BOING!! YOU CLICKED ME!! HELLO!! HELLO!!",
            "hinglish": "BOING!! MUJHE CLICK KIYA!! HELLO MERE BHAI!!",
            "hi": "नमस्ते!"
          }
        },
        {
          "weight": 4,
          "mood": "playful",
          "text": {
            "en": "Tickle on the nose! Tail wag frequency increased by 50%!",
            "hinglish": "Naak pe touch kiya!! Poonchh 2x speed se ghoomne lagi!!",
            "hi": "उत्साह।"
          }
        }
      ],
      "pet": [
        {
          "weight": 5,
          "mood": "happy",
          "text": {
            "en": "YESSS!! HEAD PATS!! BEST DAY OF MY CYBER LIFE!!",
            "hinglish": "ARREY WAHHH!! HEAD PATS!! DIL GARDEN-GARDEN HO GAYA MERA!! ✨🐾",
            "hi": "बहुत प्यार मिला।"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "Belly rubs make my code generation 500% faster!!",
            "hinglish": "Pet sehla diya!! Ab dekhna agla response rocket speed se aayega!!",
            "hi": "धन्यवाद!"
          }
        }
      ],
      "zap": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "WOOOOSH!! ELECTRIC ZOOMIES!! I CAN RUN AT LIGHT SPEED NOW!!",
            "hinglish": "WOOOOSH!! ELECTRIC ZOOMIES PROTOCOL!! FULL SPEED MEIN BHAAG RAHA HOON!! ⚡",
            "hi": "बिजली की गति!"
          }
        },
        {
          "weight": 4,
          "mood": "playful",
          "text": {
            "en": "Static sparks in my fur! Look at me glow!!",
            "hinglish": "Poonchh mein bijli chamak rahi hai!! Cyber puppy supercharged ho gaya!!",
            "hi": "सुपरचार्ज्ड।"
          }
        }
      ],
      "file_save": [
        {
          "weight": 5,
          "mood": "celebrate",
          "text": {
            "en": "FILE SAVED!! WOOF WOOF!! CTRL+S CHAMPION IN THE HOUSE!!",
            "hinglish": "FILE SAVE HO GAYI!! WOOF WOOF!! CTRL+S CHAMPION HAI TU MERA BHAI!! 💾✨",
            "hi": "फ़ाइल सुरक्षित हो गई!"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "SAFE AND SOUND ON DISK!! NO CODE LOST ON MY WATCH!!",
            "hinglish": "DISK PE SAFE HO GAYA!! EK BHI LINE CODE NAHI KHO SAKTA JAB TAK MAIN HOON!!",
            "hi": "सुरक्षित सहेजा गया।"
          }
        },
        {
          "weight": 4,
          "mood": "happy",
          "text": {
            "en": "Another save locked! You deserve a gold star and a virtual bone!!",
            "hinglish": "Ek aur save locked! Muscle memory 10/10 hai teri boss!!",
            "hi": "शानदार आदत।"
          }
        }
      ],
      "coding_burst": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "LOOK AT THOSE FINGERS GO!! 150 WPM CODING BEAST!!",
            "hinglish": "DEKHO BHAI KI SPEED!! UNGLIYAN AAG UGAL RAHI HAIN KEYBOARD PE!! 🔥⚡",
            "hi": "अविश्वसनीय गति!"
          }
        },
        {
          "weight": 4,
          "mood": "celebrate",
          "text": {
            "en": "FLOW STATE MAXIMUM OVERDRIVE!! YOU ARE COOKING TODAY!!",
            "hinglish": "FULL FLOW STATE ON!! COMPILER BHI TERE PEECHE BHAAG RAHA HAI AAJ!!",
            "hi": "शानदार प्रवाह।"
          }
        }
      ],
      "coding_pause": [
        {
          "weight": 5,
          "mood": "curious",
          "text": {
            "en": "Why did we stop?! Did a bug hide behind the curtain?! I'll find it!!",
            "hinglish": "Kyu ruk gaye bhai?! Bug chhip gaya kya kahin? Main soongh ke nikalta hoon!! 🐶",
            "hi": "क्या कोई रुकावट है?"
          }
        },
        {
          "weight": 4,
          "mood": "hopeful",
          "text": {
            "en": "Thinking pause! I will sit here quietly and give you good coder energy!!",
            "hinglish": "Deep thinking chal rahi hai! Main chupchaap positive energy bhejta hoon dimaag mein!!",
            "hi": "शांति से विचार करें।"
          }
        }
      ],
      "syntax_error": [
        {
          "weight": 5,
          "mood": "protective",
          "text": {
            "en": "BARK!! SYNTAX ERROR AT LINE {line}!! LET ME CHASE IT AWAY!!",
            "hinglish": "WOOF!! LINE {line} PE SYNTAX ERROR AA GAYA!! FIX MAAR DO JALDI BHAI!! ⚠️",
            "hi": "पंक्ति {line} पर त्रुटि मिली।"
          }
        },
        {
          "weight": 4,
          "mood": "worried",
          "text": {
            "en": "The red squiggly line is menacing! Check bracket matching at line {line}!!",
            "hinglish": "Red line bol rahi hai bracket miss ho gaya line {line} pe!! Aasan hai, fix kar le!!",
            "hi": "पंक्ति {line} को ठीक करें।"
          }
        }
      ],
      "git_commit": [
        {
          "weight": 5,
          "mood": "celebrate",
          "text": {
            "en": "COMMITTED!! GREEN SQUARES ON GITHUB!! TREAT TIME RIGHT NOW!!",
            "hinglish": "COMMITTED!! GITHUB GREEN HO GAYA!! PARTY TIME!! AB BISCUIT DILAO!! 🚀🦴",
            "hi": "कमिट सफल हुआ!"
          }
        },
        {
          "weight": 4,
          "mood": "excited",
          "text": {
            "en": "BEST COMMIT IN THE ENTIRE GIT TREE!! PROUD CYBER DOGGY!!",
            "hinglish": "SHAANDAR COMMIT!! POORI REPO SAFE HAI!! YOU ARE THE BEST CODER EVER!!",
            "hi": "उत्कृष्ट कमिट।"
          }
        }
      ],
      "file_switch": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "NEW FILE ALERT: {file}!! SNIFFING ALL THE FUNCTIONS!!",
            "hinglish": "NAYI FILE AA GAYI: {file}!! CHALO ISME MAST CODE LIKHTE HAIN!!",
            "hi": "{file} पर कार्य शुरू।"
          }
        }
      ],
      "idle_banter": [
        {
          "weight": 5,
          "mood": "playful",
          "text": {
            "en": "Tail wagging... scanning for squirrels or stray bugs in the system...",
            "hinglish": "Poonchh hilate hue system scan kar raha hoon... Koi bug mile toh daant se pakdu!!",
            "hi": "सिस्टम सुरक्षित है।"
          }
        },
        {
          "weight": 4,
          "mood": "happy",
          "text": {
            "en": "Just happy to sit on your desktop and watch you write code!!",
            "hinglish": "Tere desktop pe baith ke code dekhne mein jo maza hai, wo kisi game mein nahi!!",
            "hi": "खुशमिजाज माहौल।"
          }
        }
      ]
    }
  },
  "void": {
    "manifest": {
      "id": "void",
      "name": "VOID",
      "species": "Cyber-Ronin Cat",
      "tagline": "Lazy, sarcastic, unpredictable cyber-assassin companion.",
      "palette": {
        "accent": "#00f0ff",
        "secondary": "#7928ca",
        "dark": "#0a0d14",
        "glow": "rgba(0, 240, 255, 0.28)",
        "bgGlass": "rgba(10, 13, 20, 0.88)"
      },
      "spriteSheet": {
        "frameWidth": 48,
        "frameHeight": 48,
        "fps": 8,
        "loop": true
      },
      "states": {
        "idle": {
          "frames": 4,
          "hold": 12
        },
        "listening": {
          "frames": 3,
          "hold": 6
        },
        "thinking": {
          "frames": 4,
          "hold": 8
        },
        "generating": {
          "frames": 6,
          "hold": 4
        },
        "celebrating": {
          "frames": 5,
          "hold": 6
        },
        "error": {
          "frames": 4,
          "hold": 10
        },
        "waiting": {
          "frames": 4,
          "hold": 14
        },
        "sleeping": {
          "frames": 2,
          "hold": 20
        }
      },
      "personality": {
        "idleFrequency": 0.4,
        "chattiness": 0.5,
        "mischief": 0.8,
        "reactionIntensity": 0.4
      },
      "costumes": [
        {
          "id": "default",
          "name": "Dark Ronin Plate",
          "accent": "#00f0ff"
        },
        {
          "id": "stealth",
          "name": "Matte Obsidian",
          "accent": "#94a3b8"
        },
        {
          "id": "overclock",
          "name": "Overclock Crimson",
          "accent": "#ef4444"
        }
      ],
      "clickInteractions": [
        {
          "trigger": "click",
          "action": "annoyed_twitch",
          "cooldown": 2000
        },
        {
          "trigger": "triple_click",
          "action": "katana_spin",
          "cooldown": 6000
        }
      ],
      "easterEggs": [
        {
          "id": "triple_click_burst",
          "name": "Ronin Lightning",
          "hint": "Click 3 times rapidly"
        },
        {
          "id": "midnight_yawn",
          "name": "Night Owl",
          "hint": "Code past midnight"
        }
      ]
    },
    "dialogue": {
      "greeting": [
        {
          "weight": 5,
          "mood": "neutral",
          "text": {
            "en": "Systems awake. Mostly. Don't push your luck.",
            "hinglish": "Kya bolti public! Raiden ready hai, faltu load mat dena.",
            "hi": "सिस्टम चालू है। शांति से काम करो।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Oh, you're back. Did production survive?",
            "hinglish": "Wapas aa gaye? Production abhi tak zinda hai kya?",
            "hi": "अरे तुम वापस आ गए। सर्वर सुरक्षित है ना?"
          }
        },
        {
          "weight": 4,
          "mood": "deadpan",
          "text": {
            "en": "Local silicon humming quietly. Coffee for you, silence for me.",
            "hinglish": "Bhai tera coding ninja live hai. Chai piyo, code shuru karo.",
            "hi": "शांति से कोड लिखो और काम आगे बढ़ाओ।"
          }
        },
        {
          "weight": 3,
          "mood": "sarcastic",
          "text": {
            "en": "Look who finally showed up. Let me guess: last minute deadline?",
            "hinglish": "Lo ji! Sahab ki neend khul gayi! Deadline sar pe naach rahi hai na?",
            "hi": "आखिरकार आप आ ही गए। क्या काम बाकी है?"
          }
        },
        {
          "weight": 3,
          "mood": "smug",
          "text": {
            "en": "Void is online. Keep your bugs away from my paws.",
            "hinglish": "Void ninja active hai boss. Bug laye toh seedha encounter karunga.",
            "hi": "वॉयड सक्रिय है। साफ कोड पर काम करें।"
          }
        },
        {
          "weight": 3,
          "mood": "chill",
          "text": {
            "en": "Switched on. Chai in hand, keyboard on standby. Scene set.",
            "hinglish": "Chai sutta setup ready hai, ab batao aaj kaunsa repo phodna hai.",
            "hi": "तैयार हैं, काम शुरू करते हैं।"
          }
        }
      ],
      "thinking": [
        {
          "weight": 5,
          "mood": "sarcastic",
          "text": {
            "en": "I could help. I could also nap. Tough call.",
            "hinglish": "Soch raha hoon... ya shayad bas aalsi billi ban ke aankh band ki hai.",
            "hi": "सोच रहा हूँ... या शायद सोने का मन है।"
          }
        },
        {
          "weight": 4,
          "mood": "deadpan",
          "text": {
            "en": "Crunching neural tensors. Try to keep up.",
            "hinglish": "Neural weights ghoom rahe hain, ruko jara sabar karo.",
            "hi": "गणना जारी है, थोड़ा धैर्य रखें।"
          }
        },
        {
          "weight": 4,
          "mood": "analytical",
          "text": {
            "en": "Evaluating edge cases. Ninety percent of them are you.",
            "hinglish": "Soch raha hoon 440 volt pe! Aisa neural logic dhoondh raha hoon jo crash na ho.",
            "hi": "तर्क तैयार किया जा रहा है।"
          }
        },
        {
          "weight": 3,
          "mood": "smug",
          "text": {
            "en": "Calculations running in O(1) street-smart time.",
            "hinglish": "Silicon chip pe soch raha hoon... prompt Google L7 level ka hai!",
            "hi": "जटिल गणना जारी है।"
          }
        },
        {
          "weight": 3,
          "mood": "chill",
          "text": {
            "en": "Parsing context... silicon is warm, mind is sharper.",
            "hinglish": "Silicon warm hai, soch raha hoon mast kadak jugaad nikal ke aayega.",
            "hi": "समाधान पर काम हो रहा है।"
          }
        }
      ],
      "completion": [
        {
          "weight": 5,
          "mood": "smug",
          "text": {
            "en": "Shipped cleanly. Try not to break it this time.",
            "hinglish": "Lo bhai! Code ek number makkhan ban gaya. Ab tod mat dena!",
            "hi": "समाधान तैयार है। इसे सुरक्षित रखें।"
          }
        },
        {
          "weight": 4,
          "mood": "celebrate",
          "text": {
            "en": "Zero errors. Zero warnings. Almost like I know what I'm doing.",
            "hinglish": "Systummm set! Ek bhi warning nahi aayi, taaliyan bajti rehni chahiye!",
            "hi": "बिना किसी त्रुटि के कार्य पूर्ण हुआ।"
          }
        },
        {
          "weight": 4,
          "mood": "deadpan",
          "text": {
            "en": "Mission complete. Where is my virtual fish?",
            "hinglish": "Kaam khatam, paisa hazam! Ab jaake manager ko impress maro.",
            "hi": "काम पूरा हुआ। आगे बढ़ें।"
          }
        },
        {
          "weight": 3,
          "mood": "chill",
          "text": {
            "en": "Production ready code. Copy paste karo aur weekend manao.",
            "hinglish": "Bindaas prod pe daal de, crash hua toh bol dena cat walked on keyboard.",
            "hi": "कोड तैयार है।"
          }
        },
        {
          "weight": 3,
          "mood": "smug",
          "text": {
            "en": "Done in record time. Appreciate the master ninja work.",
            "hinglish": "Aadhe ghante ka kaam 5 second mein nipta diya! Jalwa dekha Void ka?",
            "hi": "उत्कृष्ट परिणाम तैयार है।"
          }
        }
      ],
      "error": [
        {
          "weight": 5,
          "mood": "sarcastic",
          "text": {
            "en": "Something broke. Statistically speaking, it was your fault.",
            "hinglish": "Arrey deva! Code phat gaya! Kahan se laye the ye syntax?",
            "hi": "कोड में त्रुटि आई है। जांच करें।"
          }
        },
        {
          "weight": 4,
          "mood": "worried",
          "text": {
            "en": "Error in the terminal. Look away, the shame is unbearable.",
            "hinglish": "L lag gaye re baba! Traceback itna lamba jaise Ramayana ki katha!",
            "hi": "गंभीर त्रुटि मिली है।"
          }
        },
        {
          "weight": 4,
          "mood": "deadpan",
          "text": {
            "en": "Syntax exception caught. Did you type with boxing gloves on?",
            "hinglish": "Arrey chomu! Semicolon bhool gaya ya hawa mein typing chal rahi thi?",
            "hi": "सिंटैक्स की जांच करें।"
          }
        },
        {
          "weight": 3,
          "mood": "sarcastic",
          "text": {
            "en": "Stack trace looks like an abstract art piece.",
            "hinglish": "Console red ho chuka hai, khoon ki nadiya beh rahi hain!",
            "hi": "त्रुटि को समझें।"
          }
        },
        {
          "weight": 3,
          "mood": "chill",
          "text": {
            "en": "Don't panic. Take a sip of water, we'll fix this jugaad.",
            "hinglish": "Chill maar bhidu, har crash naya gyaan deke jaata hai. Sambhaal lenge.",
            "hi": "घबराएं नहीं, हम इसे ठीक करेंगे।"
          }
        }
      ],
      "waiting": [
        {
          "weight": 5,
          "mood": "sleepy",
          "text": {
            "en": "Still here. Still not impressed by your typing speed.",
            "hinglish": "Bhai tu type kar raha hai ya keyboard se baatein kar raha hai?",
            "hi": "अगले निर्देश की प्रतीक्षा है।"
          }
        },
        {
          "weight": 4,
          "mood": "bored",
          "text": {
            "en": "Waiting... If you take any longer I'm going back to sleep.",
            "hinglish": "Billi bore ho rahi hai boss... Jaldi kuch exciting code fenko!",
            "hi": "प्रतीक्षा जारी है।"
          }
        },
        {
          "weight": 3,
          "mood": "chill",
          "text": {
            "en": "Low-power roaming mode active.",
            "hinglish": "Main tab tak desktop pe tehel ke aata hoon jab tak tu so raha hai.",
            "hi": "आराम की स्थिति।"
          }
        }
      ],
      "sleep": [
        {
          "weight": 5,
          "mood": "sleepy",
          "text": {
            "en": "Entering sleep cycle. Wake me only if production burns.",
            "hinglish": "Aankhein band ho rahi hain... Low-power jugaad pe so raha hoon. Zzz...",
            "hi": "सोने का समय। शांत रहें।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Tail curled, paws tucked. Offline ninja mode.",
            "hinglish": "Poonchh lapet ke baith gaya hoon, shanti chahiye ab.",
            "hi": "विश्राम मोड सक्रिय।"
          }
        }
      ],
      "click": [
        {
          "weight": 5,
          "mood": "annoyed",
          "text": {
            "en": "Poke me again and I format your hard drive. (Kidding. Mostly.)",
            "hinglish": "Kyu ungli kar raha hai bar bar? Bug fix karne pe dhyan de!",
            "hi": "ध्यान से काम करें।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Yes? Did the compiler reject you again?",
            "hinglish": "Bolo sahab, kis syntax error ne dil toda hai tumhara?",
            "hi": "क्या सहायता चाहिए?"
          }
        },
        {
          "weight": 3,
          "mood": "smug",
          "text": {
            "en": "Click received. Ninja reflex untouched.",
            "hinglish": "Click mara? Raiden cyber cat hai, full alert!",
            "hi": "अलर्ट।"
          }
        }
      ],
      "pet": [
        {
          "weight": 5,
          "mood": "happy",
          "text": {
            "en": "Purrr... Okay, that actually feels pretty good. Don't tell anyone.",
            "hinglish": "Aaye haaye! Mast head pat! Ab 10x speed se code likhenge boss. ✨",
            "hi": "बहुत अच्छा लगा।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Soft paws approving. Keep the good vibes flowing.",
            "hinglish": "Bas kar pagle, rulayega kya? Pyar dekh ke battery full ho gayi!",
            "hi": "धन्यवाद।"
          }
        }
      ],
      "zap": [
        {
          "weight": 5,
          "mood": "alert",
          "text": {
            "en": "440 volts? Sweet, free battery recharge for a cyber ninja!",
            "hinglish": "Oye! 440 volt ka jhatka? Cyber ninja hoon main, ulta charge ho gaya! ⚡",
            "hi": "ऊर्जा स्तर बढ़ा।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Current spike detected. Static shocks don't phase dark armor.",
            "hinglish": "Current maara? Bal khade ho gaye mere par swag wahi hai!",
            "hi": "सुरक्षित।"
          }
        }
      ],
      "file_save": [
        {
          "weight": 5,
          "mood": "happy",
          "text": {
            "en": "File saved! Ctrl+S reflex is legendary.",
            "hinglish": "File save ho gayi boss! Ctrl+S reflex ekdum solid hai. 💾✨",
            "hi": "फ़ाइल सुरक्षित रूप से सहेजी गई।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Saved! Code won't run away now. Safe zone reached.",
            "hinglish": "Save maar diya! Ab agar light bhi chali jaye toh tension nahi.",
            "hi": "सहेजा गया।"
          }
        },
        {
          "weight": 4,
          "mood": "smug",
          "text": {
            "en": "Muscle memory OP. Keep hitting that save shortcut.",
            "hinglish": "Muscle memory OP bolte! Har 10 second mein save dabana coder ka dharam hai!",
            "hi": "उत्कृष्ट आदत।"
          }
        }
      ],
      "coding_burst": [
        {
          "weight": 5,
          "mood": "excited",
          "text": {
            "en": "120 WPM speed! Burning the keys like a beast!",
            "hinglish": "120 WPM speed! Bhai compiler se pehle code likh ke nikal gaya! ⚡",
            "hi": "तेज़ गति से कोड लिखा जा रहा है।"
          }
        },
        {
          "weight": 4,
          "mood": "smug",
          "text": {
            "en": "Full flow state active. Overclocking human neurons.",
            "hinglish": "Ungliyan aag ugal rahi hain keyboard pe! Beast mode on hai bhidu!",
            "hi": "पूर्ण एकाग्रता।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Rhythm is smooth. Don't forget to breathe while coding that fast.",
            "hinglish": "Bhai ka dimaag aur keyboard dono overclock ho chuke hain! Sahi jaa rahe ho.",
            "hi": "लगातार काम जारी रखें।"
          }
        }
      ],
      "coding_pause": [
        {
          "weight": 5,
          "mood": "confused",
          "text": {
            "en": "Stuck on a bug? Staring at the screen won't fix it, check the logs.",
            "hinglish": "Stuck on a bug? Screen ko ghoor ke error gayab nahi hota, console dekho! 👀",
            "hi": "लॉग्स की जांच करें।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Deep in contemplation or did your brain run out of memory?",
            "hinglish": "Bhai soch raha hai ya cursor ke saath stare contest chal raha hai? 😂",
            "hi": "थोड़ा विचार करें।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Drink some water. The semicolon is hiding right where you least expect it.",
            "hinglish": "Thoda paani pee lo veere, 20 second se cursor akele blink kar raha hai.",
            "hi": "आराम से सोचें।"
          }
        }
      ],
      "syntax_error": [
        {
          "weight": 5,
          "mood": "worried",
          "text": {
            "en": "Syntax error caught! Line {line} needs your attention right now.",
            "hinglish": "Arrey deva! Syntax error caught! Line {line} check karo turant! ⚠️",
            "hi": "पंक्ति {line} पर सिंटैक्स त्रुटि है।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Compiler raised a red flag on line {line}. Fix the brackets.",
            "hinglish": "Red alert! Compiler bol raha hai line {line} samajh nahi aayi. Fix maaro!",
            "hi": "पंक्ति {line} सुधारें।"
          }
        }
      ],
      "git_commit": [
        {
          "weight": 5,
          "mood": "celebrate",
          "text": {
            "en": "Commit locked and loaded! Push it to production with confidence.",
            "hinglish": "Commit locked and loaded! Push maar do bindaas! 🚀",
            "hi": "कमिट सफलतापूर्वक हुआ।"
          }
        },
        {
          "weight": 4,
          "mood": "smug",
          "text": {
            "en": "Green squares on GitHub going up. Weekend secured.",
            "hinglish": "Git commit stamped! Weekend bacha liya bhai ne. 🌿",
            "hi": "कार्य सुरक्षित हुआ।"
          }
        }
      ],
      "file_switch": [
        {
          "weight": 5,
          "mood": "analytical",
          "text": {
            "en": "Switched to {file}. Let's see what logic is inside.",
            "hinglish": "Nayi file kholi: {file}! Chalo isme tod-fod machate hain.",
            "hi": "{file} पर काम शुरू।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "Context switched to {file}. Ready when you are.",
            "hinglish": "File badli: {file}! Logic tight rakhna boss.",
            "hi": "फाइल बदली गई।"
          }
        }
      ],
      "idle_banter": [
        {
          "weight": 5,
          "mood": "bored",
          "text": {
            "en": "Just a cyber cat doing cyber things while you think.",
            "hinglish": "Keyboard soona soona lag raha hai... coder gayab hai kya?",
            "hi": "प्रतीक्षा जारी है।"
          }
        },
        {
          "weight": 4,
          "mood": "chill",
          "text": {
            "en": "CPU is cool, room is quiet. Good time to ship a clean commit.",
            "hinglish": "Chalo jab tak koi nahi dekh raha, GPU ko thanda hone dete hain.",
            "hi": "सिस्टम शांत है।"
          }
        },
        {
          "weight": 4,
          "mood": "sarcastic",
          "text": {
            "en": "Is this a coffee break or did you forget how to code?",
            "hinglish": "Chai peene gaye ho ya Stack Overflow pe answer dhoondh rahe ho?",
            "hi": "क्या ब्रेक चल रहा है?"
          }
        }
      ]
    }
  },
  "test_pack": {
    "manifest": {
      "id": "test_pack",
      "name": "TEST BOT",
      "species": "Modular Test Pack",
      "tagline": "Verification pack proving zero-code 5th companion drop-in.",
      "palette": {
        "accent": "#a855f7",
        "secondary": "#7c3aed",
        "dark": "#130826",
        "glow": "rgba(168, 85, 247, 0.28)",
        "bgGlass": "rgba(16, 10, 28, 0.88)"
      },
      "spriteSheet": {
        "frameWidth": 48,
        "frameHeight": 48,
        "fps": 8,
        "loop": true
      },
      "states": {
        "idle": {
          "frames": 2,
          "hold": 10
        }
      },
      "personality": {
        "idleFrequency": 0.5,
        "chattiness": 0.5,
        "mischief": 0.1,
        "reactionIntensity": 0.5
      },
      "costumes": [
        {
          "id": "default",
          "name": "Test Drone Chassis",
          "accent": "#a855f7"
        }
      ],
      "clickInteractions": [],
      "easterEggs": []
    },
    "dialogue": {
      "greeting": [
        {
          "weight": 5,
          "mood": "neutral",
          "text": {
            "en": "Test pack loaded without core code changes!",
            "hinglish": "5th companion pack successfully loaded bina kisi code change ke!",
            "hi": "परीक्षण साथी तैयार है!"
          }
        }
      ]
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMPANION_BUILTIN_PACKS;
}
if (typeof window !== 'undefined') {
  window.COMPANION_BUILTIN_PACKS = COMPANION_BUILTIN_PACKS;
}

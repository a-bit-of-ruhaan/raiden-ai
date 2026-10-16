# RAIDEN COMPANION SYSTEM — SPRITE SHEET SPECIFICATION

This directory contains self-contained companion packs for Raiden AI. Any pack placed in `companions/<id>/` is automatically loaded by `CompanionRegistry` without requiring core code changes.

---

## 📁 Pack Folder Structure

```text
companions/<id>/
├── manifest.json       # Required: Pack schema (id, name, palette, states, personality, costumes)
├── dialogue.json       # Required: Pre-authored dialogue lines grouped by trigger
└── sprites/            # Optional: Custom sprite sheets (falls back to procedural pixel engine)
    ├── spritesheet.png # Single unified sprite sheet
    └── slices/         # Optional individual state slices
```

---

## 🎨 Sprite Sheet Grid Specification

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Base Resolution** | 32×32 or 48×48 px per frame | 48×48 recommended for cyber pets and characters |
| **Grid Layout** | Horizontal rows per state | Row 0: Idle, Row 1: Listen, Row 2: Think, Row 3: Generating, etc. |
| **Scale Mode** | Integer Nearest-Neighbor (`image-rendering: pixelated;`) | Renders ultra-crisp at 1x, 2x, 3x, 4x integer scales |
| **Color Depth** | 16-color indexed or 32-bit RGBA PNG with alpha transparency | Transparent background |
| **Frame Rates** | 8 – 12 FPS standard | Configurable per state in `manifest.json` |

### Standard State Row Mapping

| Row Index | State | Recommended Frames | Loop Mode |
| :--- | :--- | :--- | :--- |
| **Row 0** | `idle` | 4 frames | Loop (Breathe, subtle ear/tail wave) |
| **Row 1** | `listening` / `curious` | 3 - 4 frames | Hold on final alert frame |
| **Row 2** | `thinking` | 4 frames | Loop (Holo-scan, chin tap, head tilt) |
| **Row 3** | `generating` | 6 frames | Fast loop (Tail wag, code scan, humming) |
| **Row 4** | `celebrating` | 6 frames | Ping-pong or loop (Zoomies, victory bounce) |
| **Row 5** | `error` | 3 - 4 frames | Loop or shake (Worried, glitch, droopy ears) |
| **Row 6** | `waiting` | 4 frames | Slow loop (Stretching, yawning, ball nudge) |
| **Row 7** | `sleeping` | 2 frames | Ultra-slow loop (Curled up, soft breathing) |

---

## 📜 `manifest.json` Schema Reference

```json
{
  "id": "companion_id",
  "name": "COMPANION_NAME",
  "species": "Archetype / Description",
  "tagline": "Short bio or slogan",
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
    "idle": { "frames": 4, "hold": 12 },
    "thinking": { "frames": 4, "hold": 8 },
    "generating": { "frames": 6, "hold": 4 },
    "celebrating": { "frames": 5, "hold": 6 },
    "error": { "frames": 4, "hold": 10 }
  },
  "personality": {
    "idleFrequency": 0.5,
    "chattiness": 0.6,
    "mischief": 0.3,
    "reactionIntensity": 0.7
  },
  "costumes": [
    { "id": "default", "name": "Standard Gear", "accent": "#00f0ff" }
  ],
  "clickInteractions": [
    { "trigger": "click", "action": "reaction_name", "cooldown": 2000 }
  ],
  "easterEggs": [
    { "id": "triple_click_burst", "name": "Secret Move", "hint": "Click 3 times rapidly" }
  ]
}
```

---

## 💬 `dialogue.json` Schema Reference

Lines are categorized by triggers (`greeting`, `thinking`, `completion`, `error`, `waiting`, `sleep`, `click`, `idle_banter`). Each line includes:
- `weight`: Integer priority weight (higher = more frequent).
- `mood`: Visual emotion tag (`neutral`, `happy`, `sarcastic`, `excited`, `mentor`).
- `text`: Multilingual map containing `en` (English), `hi` (Hindi), and `hinglish`.

```json
{
  "greeting": [
    {
      "weight": 5,
      "mood": "happy",
      "text": {
        "en": "Ready to build!",
        "hinglish": "Raiden ready hai, batao kya banayein!",
        "hi": "मैं तैयार हूँ!"
      }
    }
  ]
}
```

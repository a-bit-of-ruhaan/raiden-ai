/**
 * RAIDEN COMPANION SYSTEM — DIALOGUE ENGINE
 * Manages pre-authored dialogue, weighted random selection, cooldowns,
 * multilingual variants (en / hi / hinglish), and non-blocking speech bubbles.
 * 
 * Non-Negotiable Rule 2:
 * Pre-authored dialogue ONLY. Never triggers extra LLM inference calls.
 */

class DialogueEngine {
  constructor(options = {}) {
    this.bubbleElement = options.bubbleElement || null;
    this.textElement = options.textElement || null;
    this.settings = options.settings || null;
    this.dialogueBank = {};
    this.cooldowns = new Map();
    this.recentLines = new Map(); // Category -> Set of recent lines (avoid immediate repeat)
    this.typewriterTimer = null;
    this.autoHideTimer = null;
    this.typewriterSpeed = 26; // ms per char

    // Category cooldowns (ms)
    this.defaultCooldowns = {
      greeting: 10000,
      typing: 18000,
      thinking: 8000,
      completion: 6000,
      error: 4000,
      click: 2000,
      idle_banter: 28000,
      copy: 6000,
      celebrate: 6000,
      milestone: 15000,
      code_detected: 25000
    };
  }

  setBubbleElements(bubble, text) {
    this.bubbleElement = bubble;
    this.textElement = text;
  }

  loadDialogue(dialogueData) {
    this.dialogueBank = dialogueData || {};
    this.cooldowns.clear();
    this.recentLines.clear();
  }

  /**
   * Determine if dialogue is allowed under current chattiness and cooldown rules.
   */
  canSpeak(trigger, isStreaming = false) {
    if (!this.settings || !this.settings.get('enabled')) return false;

    const chattiness = this.settings.get('chattiness') || 'chill';
    if (chattiness === 'silent') return false;

    // During active token streaming, suppress speech bubbles to keep reading area clear
    if (isStreaming && trigger !== 'error') {
      return false;
    }

    const now = Date.now();
    const lastTime = this.cooldowns.get(trigger) || 0;
    let cd = this.defaultCooldowns[trigger] || 8000;

    // Chill mode multiplies idle cooldowns by 1.8x
    if (chattiness === 'chill' && (trigger === 'idle_banter' || trigger === 'typing')) {
      cd *= 1.8;
    }

    if (now - lastTime < cd) {
      return false;
    }

    return true;
  }

  /**
   * Select a line from a trigger category.
   * Handles weighted random, language variant fallback, and non-repeats.
   */
  selectLine(trigger) {
    const list = this.dialogueBank[trigger];
    if (!list || !Array.isArray(list) || list.length === 0) {
      return null;
    }

    const preferredLang = (this.settings ? this.settings.get('language') : 'hinglish') || 'hinglish';
    let recent = this.recentLines.get(trigger);
    if (!recent) {
      recent = [];
      this.recentLines.set(trigger, recent);
    }

    // Filter out recently used lines if we have alternatives
    let candidates = list.filter((item, idx) => !recent.includes(idx));
    if (candidates.length === 0) {
      recent.length = 0; // Reset history
      candidates = list;
    }

    // Calculate total weight
    const totalWeight = candidates.reduce((sum, item) => sum + (item.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    let chosenItem = candidates[0];

    for (const item of candidates) {
      rand -= (item.weight || 1);
      if (rand <= 0) {
        chosenItem = item;
        break;
      }
    }

    // Record index in recent list
    const originalIndex = list.indexOf(chosenItem);
    if (originalIndex !== -1) {
      recent.push(originalIndex);
      if (recent.length > Math.min(8, Math.floor(list.length / 2))) {
        recent.shift();
      }
    }

    // Extract text in preferred language with graceful fallback:
    // 1. Preferred Lang -> 2. Hinglish -> 3. English -> 4. Hindi -> 5. String item itself
    let text = '';
    if (typeof chosenItem === 'string') {
      text = chosenItem;
    } else if (chosenItem.text) {
      if (typeof chosenItem.text === 'object') {
        text = chosenItem.text[preferredLang] ||
               chosenItem.text['hinglish'] ||
               chosenItem.text['en'] ||
               chosenItem.text['hi'] ||
               Object.values(chosenItem.text)[0] || '';
      } else {
        text = String(chosenItem.text);
      }
    }

    this.cooldowns.set(trigger, Date.now());
    return {
      text,
      mood: chosenItem.mood || 'neutral',
      trigger
    };
  }

  /**
   * Display dialogue line inside the non-blocking glassmorphic bubble.
   */
  say(line, onComplete = null) {
    if (!line || !line.text) return;
    const text = line.text;

    const bubble = this.bubbleElement || document.getElementById('raiden-dialogue-bubble');
    const textContainer = this.textElement || document.getElementById('mascot-bubble-text') || bubble;

    if (!bubble || !textContainer) return;

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);

    // Make bubble visible
    bubble.classList.add('visible');

    // Typewriter effect
    let charIdx = 0;
    textContainer.textContent = '';

    this.typewriterTimer = setInterval(() => {
      if (charIdx < text.length) {
        textContainer.textContent += text.charAt(charIdx);
        charIdx++;
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        if (typeof onComplete === 'function') onComplete();

        // Auto-dismiss calculation: reading speed ~45ms per character + 2200ms grace hold
        const holdTime = Math.max(3000, Math.min(8500, text.length * 55 + 2200));
        this.autoHideTimer = setTimeout(() => {
          this.hide();
        }, holdTime);
      }
    }, this.typewriterSpeed);
  }

  hide() {
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    const bubble = this.bubbleElement || document.getElementById('raiden-dialogue-bubble');
    if (bubble) {
      bubble.classList.remove('visible');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DialogueEngine;
}
if (typeof window !== 'undefined') {
  window.DialogueEngine = DialogueEngine;
}

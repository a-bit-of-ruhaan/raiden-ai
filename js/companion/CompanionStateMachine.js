/**
 * RAIDEN COMPANION SYSTEM — ADVANCED BEHAVIOR STATE MACHINE
 * Manages explicit companion states, priority hierarchies, debounced transitions,
 * non-looping temporary reaction restoration, and cooldown gating.
 * 
 * Strict Priority Policy:
 * 6. USER_OVERRIDE  - Explicit user manual pose, dragging, accessibility lock
 * 5. REACTION       - Short high-priority reactions (celebrations, errors, wake-up)
 * 4. TASK           - AI thinking, streaming reply
 * 3. MUSIC          - Background music groove & dance
 * 2. TYPING         - User active typing in composer or editor
 * 1. IDLE           - Ambient breathing, stretching, low-power sleep
 */

class CompanionStateMachine {
  static PRIORITY = {
    IDLE: 1,
    TYPING: 2,
    MUSIC: 3,
    TASK: 4,
    REACTION: 5,
    USER_OVERRIDE: 6
  };

  static STATES = [
    'idle',
    'waiting',
    'sleeping',
    'typing',
    'curious',
    'music_dance',
    'thinking',
    'replying',
    'celebrating',
    'wake_up',
    'greeting',
    'error',
    'confused',
    'dragged',
    'stretch'
  ];

  constructor(options = {}) {
    this.currentState = 'idle';
    this.currentPriority = CompanionStateMachine.PRIORITY.IDLE;
    
    // Persistent underlying state stack (e.g., music_dance remains when temporary celebration ends)
    this.persistentState = 'idle';
    this.persistentPriority = CompanionStateMachine.PRIORITY.IDLE;

    this.stateTimer = null;
    this.cooldowns = new Map();
    this.listeners = new Set();
    this.onStateChange = options.onStateChange || null;
    this.automaticReactionsEnabled = options.automaticReactionsEnabled !== false;

    // Typing grace timer
    this.typingTimer = null;
    this.typingGraceMs = options.typingGraceMs || 1800;
  }

  setAutomaticReactionsEnabled(enabled) {
    this.automaticReactionsEnabled = Boolean(enabled);
    if (!this.automaticReactionsEnabled && this.currentPriority < CompanionStateMachine.PRIORITY.USER_OVERRIDE) {
      this.revertToIdle();
    }
  }

  /**
   * Request transition to a new behavioral state.
   * @param {string} newState Target state name
   * @param {number} durationMs 0 for persistent/looping, >0 for auto-revert
   * @param {number} priority Priority level (1 - 6)
   * @param {boolean} isPersistent Whether state should persist as underlying baseline (e.g. music)
   * @returns {boolean} True if transition was accepted
   */
  transition(newState, durationMs = 0, priority = CompanionStateMachine.PRIORITY.IDLE, isPersistent = false) {
    const normalized = String(newState || 'idle').toLowerCase();

    // Check automatic reaction kill switch (allow user overrides)
    if (!this.automaticReactionsEnabled && priority < CompanionStateMachine.PRIORITY.USER_OVERRIDE) {
      return false;
    }

    // Ignore if current active priority is strictly higher than requested
    if (priority < this.currentPriority) {
      // If the incoming state is persistent (like music mode arriving while thinking), record it
      if (isPersistent && priority >= this.persistentPriority) {
        this.persistentState = normalized;
        this.persistentPriority = priority;
      }
      return false;
    }

    // Update persistent baseline if this is a lasting state (music, idle) — not typing or reactions
    if (isPersistent || (durationMs === 0 && normalized !== 'typing')) {
      if (priority >= this.persistentPriority || normalized === 'idle') {
        this.persistentState = normalized;
        this.persistentPriority = priority;
      }
    }

    // Cancel obsolete timers
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    const prevState = this.currentState;
    this.currentState = normalized;
    this.currentPriority = priority;

    // Notify registered listeners
    this.notify(this.currentState, prevState);

    // Schedule auto-restoration for temporary reactions
    if (durationMs > 0) {
      this.stateTimer = setTimeout(() => {
        this.restorePreviousState();
      }, durationMs);
    }

    return true;
  }

  /**
   * Transition with rate-limiting cooldown to prevent flickering.
   */
  transitionWithCooldown(newState, durationMs = 0, priority = CompanionStateMachine.PRIORITY.IDLE, cooldownMs = 3000) {
    const now = Date.now();
    const lastTime = this.cooldowns.get(newState) || 0;
    if (now - lastTime < cooldownMs) {
      return false;
    }
    const success = this.transition(newState, durationMs, priority);
    if (success) {
      this.cooldowns.set(newState, now);
    }
    return success;
  }

  /**
   * Handle debounced typing activity without reading text content.
   */
  notifyTypingActivity() {
    if (!this.automaticReactionsEnabled) return;

    // Transition to typing state if not blocked by thinking/reaction
    if (this.currentPriority <= CompanionStateMachine.PRIORITY.TYPING) {
      this.transition('typing', 0, CompanionStateMachine.PRIORITY.TYPING, false);
    }

    // Reset typing grace timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.finishTyping();
    }, this.typingGraceMs);
  }

  finishTyping() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.currentState === 'typing') {
      this.restorePreviousState();
    }
  }

  /**
   * Restores the highest-priority underlying baseline instead of blindly dropping to idle.
   */
  restorePreviousState() {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    const prevState = this.currentState;
    const targetState = this.persistentState || 'idle';
    const targetPriority = this.persistentPriority || CompanionStateMachine.PRIORITY.IDLE;

    this.currentState = targetState;
    this.currentPriority = targetPriority;

    this.notify(this.currentState, prevState);
  }

  revertToIdle() {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }

    const prevState = this.currentState;
    this.currentState = 'idle';
    this.currentPriority = CompanionStateMachine.PRIORITY.IDLE;
    this.persistentState = 'idle';
    this.persistentPriority = CompanionStateMachine.PRIORITY.IDLE;

    this.notify('idle', prevState);
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  notify(current, prev) {
    if (typeof this.onStateChange === 'function') {
      try { this.onStateChange(current, prev); } catch(e) {}
    }
    for (const listener of this.listeners) {
      try {
        listener(current, prev);
      } catch (err) {
        console.warn('[CompanionStateMachine] Error in state listener:', err);
      }
    }
  }

  getState() {
    return this.currentState;
  }

  getPriority() {
    return this.currentPriority;
  }

  getPersistentState() {
    return this.persistentState;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionStateMachine;
}
if (typeof window !== 'undefined') {
  window.CompanionStateMachine = CompanionStateMachine;
}

/**
 * RAIDEN COMPANION SYSTEM — EVENT BUS
 * Decoupled, non-blocking Observer bridge between Core Chat and the Companion Subsystem.
 * 
 * Guarantees:
 * 1. Zero Impact: Listener errors are caught and swallowed; core chat will NEVER crash or hang.
 * 2. Throttling: High-frequency events (token_streaming) throttled to 15Hz to keep CPU near 0%.
 * 3. Safe Disconnect: One call unhooks all listeners.
 */

class CompanionEventBus {
  constructor() {
    this.listeners = new Map();
    this.lastEventTimes = new Map();
    this.throttleLimits = {
      token_streaming: 65, // ~15 FPS max
      user_typing: 120
    };
  }

  /**
   * Subscribe a listener callback to an event.
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe a listener.
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event across the companion layer.
   * Automatically throttles high-frequency events and isolates exceptions.
   */
  emit(event, payload = {}) {
    // Check throttle limits for high-frequency events
    const limit = this.throttleLimits[event];
    if (limit) {
      const now = Date.now();
      const last = this.lastEventTimes.get(event) || 0;
      if (now - last < limit) {
        return; // Skip throttled frame
      }
      this.lastEventTimes.set(event, now);
    }

    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.size === 0) return;

    for (const cb of callbacks) {
      try {
        cb(payload);
      } catch (err) {
        // Rule 1: Always isolate companion errors so core chat never breaks
        console.warn(`[CompanionEventBus] Handled non-fatal error in event '${event}':`, err);
      }
    }
  }

  /**
   * Clear all registered event listeners.
   */
  clear() {
    this.listeners.clear();
    this.lastEventTimes.clear();
  }
}

// Export for ES modules and Node test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionEventBus;
}
if (typeof window !== 'undefined') {
  window.CompanionEventBus = CompanionEventBus;
}

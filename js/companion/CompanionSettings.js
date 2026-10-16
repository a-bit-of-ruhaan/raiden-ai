/**
 * RAIDEN COMPANION SYSTEM — SETTINGS MANAGER
 * Handles isolated persistence for companion customization and preferences.
 * 
 * Non-Negotiable Rule 4:
 * Switching companions or tweaking companion parameters never touches chats,
 * model selection, API keys, or core system preferences.
 */

class CompanionSettings {
  static STORAGE_KEY = 'raiden_companion_settings';

  static DEFAULTS = {
    enabled: true,
    selectedCompanion: 'void',
    chattiness: 'chill', // 'silent' | 'chill' | 'chatty'
    size: 'standard', // 'compact' | 'standard' | 'large'
    dockPosition: 'right', // 'right' | 'left'
    sound: true,
    animationIntensity: 'full', // 'full' | 'reduced' | 'static'
    language: 'hinglish', // 'hinglish' | 'en' | 'hi'
    focusMode: false,
    themeSync: true, // Automatically synchronize app color theme with companion
    activeTheme: 'void',
    costumes: {
      void: 'default',
      pixel: 'default',
      nova: 'default',
      cipher: 'default'
    },
    discoveredInteractions: {
      void: [],
      pixel: [],
      nova: [],
      cipher: []
    }
  };

  constructor() {
    this.settings = this.load();
  }

  /**
   * Load persisted settings from localStorage safely with defaults fallback.
   */
  load() {
    try {
      if (typeof localStorage === 'undefined') {
        return { ...CompanionSettings.DEFAULTS };
      }
      const raw = localStorage.getItem(CompanionSettings.STORAGE_KEY);
      if (!raw) return { ...CompanionSettings.DEFAULTS };
      const parsed = JSON.parse(raw);
      return {
        ...CompanionSettings.DEFAULTS,
        ...parsed,
        costumes: { ...CompanionSettings.DEFAULTS.costumes, ...(parsed.costumes || {}) },
        discoveredInteractions: { ...CompanionSettings.DEFAULTS.discoveredInteractions, ...(parsed.discoveredInteractions || {}) }
      };
    } catch (e) {
      console.warn('[CompanionSettings] Could not load settings, using defaults:', e);
      return { ...CompanionSettings.DEFAULTS };
    }
  }

  /**
   * Persist current settings.
   */
  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CompanionSettings.STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('[CompanionSettings] Could not save settings:', e);
    }
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : CompanionSettings.DEFAULTS[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  update(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    this.save();
  }

  /**
   * Record a discovered easter egg or secret interaction for a companion.
   * @param {string} companionId 
   * @param {string} interactionId 
   * @returns {boolean} True if newly discovered
   */
  unlockDiscovery(companionId, interactionId) {
    if (!this.settings.discoveredInteractions[companionId]) {
      this.settings.discoveredInteractions[companionId] = [];
    }
    const list = this.settings.discoveredInteractions[companionId];
    if (!list.includes(interactionId)) {
      list.push(interactionId);
      this.save();
      return true;
    }
    return false;
  }

  getDiscoveries(companionId) {
    return this.settings.discoveredInteractions[companionId] || [];
  }

  reset() {
    this.settings = { ...CompanionSettings.DEFAULTS };
    this.save();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionSettings;
}
if (typeof window !== 'undefined') {
  window.CompanionSettings = CompanionSettings;
}

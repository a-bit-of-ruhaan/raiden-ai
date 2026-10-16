/**
 * RAIDEN COMPANION SYSTEM — DYNAMIC THEME ENGINE
 * Switches and coordinates UI themes tailored to each companion's aesthetic.
 * 
 * Supports:
 * - VOID: Cyber-Ronin Obsidian & Neon Cyan
 * - PIXEL: Warm Cyber-Slate & Neon Goldenrod / Amber
 * - NOVA: Deep Cyber-Plum, Radiant Violet & Hot Pink
 * - CIPHER: Dark Hacker Terminal & Matrix Emerald / Mint
 */

class CompanionThemes {
  static THEMES = {
    void: {
      id: 'void',
      name: 'Cyber Ronin (Void Cyan)',
      accent: '#00f0ff',
      accentGlow: 'rgba(0, 240, 255, 0.28)',
      accentBorder: 'rgba(0, 240, 255, 0.35)',
      accentSecondary: '#7928ca',
      bgDark: '#080b10',
      bgGlass: 'rgba(10, 13, 20, 0.88)',
      pillBg: 'rgba(0, 240, 255, 0.12)',
      bubbleBorder: 'rgba(0, 240, 255, 0.35)',
      particleColor: '#00f0ff',
      soundPitch: 1.0
    },
    pixel: {
      id: 'pixel',
      name: 'Cyber Puppy (Pixel Gold)',
      accent: '#ffb703',
      accentGlow: 'rgba(255, 183, 3, 0.30)',
      accentBorder: 'rgba(255, 183, 3, 0.38)',
      accentSecondary: '#fb8500',
      bgDark: '#0c0a07',
      bgGlass: 'rgba(16, 13, 9, 0.88)',
      pillBg: 'rgba(255, 183, 3, 0.15)',
      bubbleBorder: 'rgba(255, 183, 3, 0.38)',
      particleColor: '#ffb703',
      soundPitch: 1.35
    },
    nova: {
      id: 'nova',
      name: 'Electric Starlight (Nova Magenta)',
      accent: '#ff2a85',
      accentGlow: 'rgba(255, 42, 133, 0.32)',
      accentBorder: 'rgba(255, 42, 133, 0.40)',
      accentSecondary: '#b5179e',
      bgDark: '#0e0814',
      bgGlass: 'rgba(18, 12, 22, 0.88)',
      pillBg: 'rgba(255, 42, 133, 0.15)',
      bubbleBorder: 'rgba(255, 42, 133, 0.40)',
      particleColor: '#ff2a85',
      soundPitch: 1.2
    },
    cipher: {
      id: 'cipher',
      name: 'Terminal Matrix (Cipher Emerald)',
      accent: '#00ff88',
      accentGlow: 'rgba(0, 255, 136, 0.28)',
      accentBorder: 'rgba(0, 255, 136, 0.38)',
      accentSecondary: '#059669',
      bgDark: '#060f0a',
      bgGlass: 'rgba(8, 16, 12, 0.88)',
      pillBg: 'rgba(0, 255, 136, 0.14)',
      bubbleBorder: 'rgba(0, 255, 136, 0.38)',
      particleColor: '#00ff88',
      soundPitch: 0.85
    }
  };

  constructor(settings) {
    this.settings = settings;
  }

  /**
   * Apply a theme by ID. Updates body CSS class and sets custom properties.
   */
  applyTheme(themeId) {
    const theme = CompanionThemes.THEMES[themeId] || CompanionThemes.THEMES.void;
    if (typeof document === 'undefined') return theme;

    const body = document.body;
    if (!body) return theme;

    // Remove existing companion theme classes
    if (body.classList) {
      for (const key of Object.keys(CompanionThemes.THEMES)) {
        if (typeof body.classList.remove === 'function') {
          body.classList.remove(`theme-companion-${key}`);
        }
      }
      if (typeof body.classList.add === 'function') {
        body.classList.add(`theme-companion-${theme.id}`);
      }
    }

    // Update root CSS variables for dynamic accents
    const root = document.documentElement;
    if (root && root.style) {
      root.style.setProperty('--companion-accent', theme.accent);
      root.style.setProperty('--companion-glow', theme.accentGlow);
      root.style.setProperty('--companion-border', theme.accentBorder);
      root.style.setProperty('--companion-secondary', theme.accentSecondary);
      root.style.setProperty('--companion-glass-bg', theme.bgGlass);
      root.style.setProperty('--companion-particle', theme.particleColor);
    }

    if (this.settings) {
      this.settings.set('activeTheme', theme.id);
    }

    return theme;
  }

  syncWithCompanion(companionId) {
    if (this.settings && this.settings.get('themeSync')) {
      return this.applyTheme(companionId);
    }
    return null;
  }

  getCurrentTheme() {
    const currentId = this.settings ? this.settings.get('activeTheme') : 'void';
    return CompanionThemes.THEMES[currentId] || CompanionThemes.THEMES.void;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanionThemes;
}
if (typeof window !== 'undefined') {
  window.CompanionThemes = CompanionThemes;
}

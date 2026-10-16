/**
 * RAIDEN COMPANION SYSTEM — ANIMATION MANIFEST
 * Authoritative behavior-to-asset mapping, kinetics metadata, playback properties,
 * priority assignments, and graceful fallback cascades.
 */

const ANIMATION_MANIFEST = {
  // 1. Idle & Ambient Life (Priority 1)
  idle: {
    id: 'idle',
    label: 'Ambient Idle',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0,
    priority: 1,
    fallbackState: null,
    spriteStateKey: 'idle',
    kinetics: {
      breatheSpeed: 0.8,
      breatheAmp: 1.5,
      tiltSpeed: 0.4,
      tiltAmp: 0.03,
      tailSpeed: 1.0,
      earTwitchIntervalMs: 4000,
      blinkIntervalMs: 2800,
      glanceIntervalMs: 6000
    },
    particles: null,
    audioTone: null
  },

  sleeping: {
    id: 'sleeping',
    label: 'Low-Power Sleep',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0,
    priority: 1,
    fallbackState: 'idle',
    spriteStateKey: 'sleeping',
    kinetics: {
      breatheSpeed: 0.35,
      breatheAmp: 0.8,
      tiltSpeed: 0,
      tiltAmp: 0,
      tailSpeed: 0.2
    },
    particles: 'zzz',
    audioTone: 'purr'
  },

  waiting: {
    id: 'waiting',
    label: 'Pondering / Waiting',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 3200,
    priority: 2,
    fallbackState: 'idle',
    spriteStateKey: 'idle',
    kinetics: {
      breatheSpeed: 1.0,
      breatheAmp: 1.2,
      tiltSpeed: 0.6,
      tiltAmp: 0.05
    },
    particles: null,
    audioTone: 'blip'
  },

  stretch: {
    id: 'stretch',
    label: 'Cat Stretch',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 2800,
    priority: 2,
    fallbackState: 'idle',
    spriteStateKey: 'stretch',
    kinetics: {
      breatheSpeed: 1.2,
      breatheAmp: 2.5,
      tiltSpeed: 0.3,
      tiltAmp: 0.04
    },
    particles: null,
    audioTone: 'purr'
  },

  // 2. Typing Reaction (Priority 2.2)
  typing: {
    id: 'typing',
    label: 'Typing Reaction',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 1800, // Debounce auto-revert window
    priority: 2.2,
    fallbackState: 'curious',
    spriteStateKey: 'talking',
    kinetics: {
      breatheSpeed: 2.2,
      breatheAmp: 1.8,
      tiltSpeed: 1.5,
      tiltAmp: 0.06,
      pawTapSpeed: 4.5,
      glanceX: -0.7,
      glanceY: 0.4
    },
    particles: 'typing_sparks',
    audioTone: null
  },

  curious: {
    id: 'curious',
    label: 'Inquisitive Glance',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 2400,
    priority: 2,
    fallbackState: 'idle',
    spriteStateKey: 'idle',
    kinetics: {
      breatheSpeed: 1.2,
      breatheAmp: 1.0,
      tiltSpeed: 0,
      tiltAmp: 0.09,
      bounceY: -3
    },
    particles: 'sparkle',
    audioTone: 'blip'
  },

  // 3. Music Mode & Dance Reaction (Priority 2.8)
  music_dance: {
    id: 'music_dance',
    label: 'Music Groove & Dance',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0, // Loops while playback active
    priority: 2.8,
    fallbackState: 'idle',
    spriteStateKey: 'celebrating',
    kinetics: {
      bpm: 120, // 2 Hz bounce
      breatheSpeed: 4.0,
      breatheAmp: 4.0,
      tiltSpeed: 2.0,
      tiltAmp: 0.14,
      swayX: 3.5,
      bounceY: -5,
      headphones: true
    },
    particles: 'music_notes',
    audioTone: null
  },

  // 4. AI Lifecycle: Thinking & Replying (Priority 3.5)
  thinking: {
    id: 'thinking',
    label: 'AI Reasoning & Concentration',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0, // Until reply begins
    priority: 3.5,
    fallbackState: 'idle',
    spriteStateKey: 'thinking',
    kinetics: {
      breatheSpeed: 1.5,
      breatheAmp: 1.2,
      tiltSpeed: 0.8,
      tiltAmp: -0.06,
      hudScanline: true
    },
    particles: 'hologram',
    audioTone: 'blip'
  },

  replying: {
    id: 'replying',
    label: 'AI Speaking & Streaming',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0, // Until streaming completes
    priority: 3.5,
    fallbackState: 'talking',
    spriteStateKey: 'talking',
    kinetics: {
      breatheSpeed: 3.5,
      breatheAmp: 2.5,
      tiltSpeed: 2.0,
      tiltAmp: 0.05,
      mouthGlowPulse: true
    },
    particles: 'waveform',
    audioTone: null
  },

  // 5. Celebrations, Wins & Special Reactions (Priority 4.2)
  celebrating: {
    id: 'celebrating',
    label: 'Task Success & Victory',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 2800,
    priority: 4.2,
    fallbackState: 'idle',
    spriteStateKey: 'celebrating',
    kinetics: {
      breatheSpeed: 4.0,
      breatheAmp: 6.0,
      tiltSpeed: 3.0,
      tiltAmp: 0.14,
      bounceY: -8
    },
    particles: 'victory',
    audioTone: 'chime'
  },

  wake_up: {
    id: 'wake_up',
    label: 'User Return & Wake Up',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 2200,
    priority: 4.0,
    fallbackState: 'idle',
    spriteStateKey: 'idle',
    kinetics: {
      breatheSpeed: 2.5,
      breatheAmp: 3.0,
      tiltSpeed: 1.2,
      tiltAmp: 0.08
    },
    particles: 'sparkle',
    audioTone: 'bounce'
  },

  greeting: {
    id: 'greeting',
    label: 'App Startup Welcome',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 3000,
    priority: 4.0,
    fallbackState: 'idle',
    spriteStateKey: 'celebrating',
    kinetics: {
      breatheSpeed: 3.0,
      breatheAmp: 4.0,
      tiltSpeed: 1.5,
      tiltAmp: 0.10
    },
    particles: 'sparkle',
    audioTone: 'chime'
  },

  // 6. Error & Frustration Reactions (Priority 5.0)
  error: {
    id: 'error',
    label: 'System / Syntax Error Glitch',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 3200,
    priority: 5.0,
    fallbackState: 'idle',
    spriteStateKey: 'error',
    kinetics: {
      glitchJitter: true,
      jitterAmp: 3.0,
      chromaticAberration: true
    },
    particles: 'glitch',
    audioTone: 'alert'
  },

  confused: {
    id: 'confused',
    label: 'Puzzled / Stunned',
    playbackType: 'procedural_kinetics',
    loop: false,
    defaultDurationMs: 3000,
    priority: 3.8,
    fallbackState: 'idle',
    spriteStateKey: 'idle',
    kinetics: {
      breatheSpeed: 1.0,
      breatheAmp: 1.0,
      tiltSpeed: 0,
      tiltAmp: -0.15,
      floatingQuestionMark: true
    },
    particles: 'question',
    audioTone: 'blip'
  },

  // 7. Interactive user events
  dragged: {
    id: 'dragged',
    label: 'Window Being Dragged',
    playbackType: 'procedural_kinetics',
    loop: true,
    defaultDurationMs: 0,
    priority: 4.8,
    fallbackState: 'idle',
    spriteStateKey: 'idle',
    kinetics: {
      stretchY: 1.25,
      swayLegs: true
    },
    particles: null,
    audioTone: 'blip'
  }
};

/**
 * Helper to fetch manifest metadata with robust fallback.
 */
function getAnimationManifestItem(stateName) {
  const key = String(stateName || 'idle').toLowerCase();
  // Alias mapping
  const aliases = {
    generating: 'replying',
    speaking: 'replying',
    listening: 'curious',
    startled: 'error',
    playfully_annoyed: 'confused',
    proud: 'celebrating',
    victory: 'celebrating',
    sleepy: 'sleeping',
    wakeup: 'wake_up',
    dance: 'music_dance',
    dancing: 'music_dance',
    music: 'music_dance'
  };
  const resolved = aliases[key] || key;
  return ANIMATION_MANIFEST[resolved] || ANIMATION_MANIFEST.idle;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ANIMATION_MANIFEST,
    getAnimationManifestItem
  };
}
if (typeof window !== 'undefined') {
  window.ANIMATION_MANIFEST = ANIMATION_MANIFEST;
  window.getAnimationManifestItem = getAnimationManifestItem;
}

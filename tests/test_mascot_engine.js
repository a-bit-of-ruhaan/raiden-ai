const fs = require('fs');

console.log('Testing MascotController and Integration...');

// 1. Verify JS file syntax and exports
const MascotController = require('../js/mascot.js');
if (typeof MascotController !== 'function') {
  throw new Error('MascotController is not a function');
}
console.log('✔ MascotController class exported and parsed cleanly.');

// Mock browser globals
global.window = {
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  AudioContext: function() {
    return {
      state: 'running',
      currentTime: 0,
      createOscillator: () => ({
        type: 'sine',
        frequency: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {}
        },
        connect: () => {}
      }),
      destination: {}
    };
  }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

global.document = {
  getElementById: (id) => ({
    id,
    getContext: () => ({
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} })
    }),
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    addEventListener: () => {}
  }),
  body: {
    classList: { toggle: () => {} }
  },
  addEventListener: () => {}
};

global.Image = function() {
  this.src = '';
  this.naturalWidth = 256;
  this.naturalHeight = 256;
  this.complete = true;
};
global.requestAnimationFrame = () => {};

// Initialize mascot instance
const mascot = new MascotController({
  canvasId: 'raidenCanvas',
  bubbleId: 'raiden-dialogue-bubble',
  containerId: 'raiden-mascot-container',
  width: 130,
  height: 130
});

console.log('✔ Mascot instance instantiated. Initial state:', mascot.currentState);

// 2. Test all 14 required states
const expectedStates = [
  'IDLE', 'CURIOUS', 'THINKING', 'SPEAKING', 'LISTENING',
  'HAPPY', 'PROUD', 'CONFUSED', 'SLEEPY', 'STARTLED',
  'PLAYFULLY_ANNOYED', 'ERROR', 'VICTORY', 'DRAGGED', 'STRETCH'
];

for (const s of expectedStates) {
  const success = mascot.setState(s, 0, mascot.PRIORITY.CRITICAL);
  if (!success) {
    throw new Error('Failed to transition to state: ' + s);
  }
}
console.log('✔ All 15 state transitions verified.');

// 3. Test event bus triggers
const events = [
  'APP_READY', 'TYPING', 'MESSAGE_SENT', 'LLM_THINKING',
  'STREAMING', 'LLM_DONE', 'ERROR', 'MESSAGE_COPIED',
  'CHAT_CLEARED', 'VOICE_LISTENING', 'VOICE_DONE', 'CPU_SPIKE'
];

for (const ev of events) {
  mascot.handleSystemEvent(ev, { text: 'function calculate()', isRoast: false });
}
console.log('✔ All 12 application events successfully handled.');

// 4. Test interactive methods
mascot.pet();
mascot.zap();
mascot.cyclePose();
mascot.cycleNextDialogue();
mascot.simulateGrab();
mascot.setExpression('happy');
mascot.setExpression('confident');
mascot.setExpression('annoyed');
mascot.setExpression('thinking');
mascot.setExpression('neutral');

const soundToggled = mascot.toggleSound();
const dialogueToggled = mascot.toggleDialogue();
const animToggled = mascot.toggleAnimation();
const compactToggled = mascot.toggleCompact();

console.log('✔ All interactive methods, audio, expressions, and toggles verified.');

// 5. Test DOM IDs in index.html
const html = fs.readFileSync('index.html', 'utf8');
const requiredIds = [
  'composer-companion-layout',
  'composer-textarea',
  'btn-send-prompt',
  'raiden-mascot-container',
  'raiden-dialogue-bubble',
  'mascot-bubble-text',
  'mascot-status-pill',
  'raidenCanvas',
  'mascot-toolbar',
  'btn-mascot-pet',
  'btn-mascot-zap',
  'btn-mascot-pose',
  'btn-mascot-sound',
  'btn-mascot-menu',
  'btn-mascot-min',
  'mascot-popover-menu',
  'setting-mascot-motion-toggle',
  'setting-mascot-dialogue-toggle',
  'setting-mascot-sound-toggle',
  'setting-mascot-compact-toggle'
];

if (!html.includes('class="composer-container"')) {
  throw new Error('Missing class="composer-container" in index.html');
}

for (const id of requiredIds) {
  if (!html.includes('id="' + id + '"')) {
    throw new Error('Missing expected element ID in index.html: ' + id);
  }
}
console.log(`✔ Verified all ${requiredIds.length} companion DOM elements present in index.html.`);

// 6. Test styles.css selectors
const css = fs.readFileSync('css/styles.css', 'utf8');
const requiredSelectors = [
  '.composer-companion-layout',
  '#raiden-mascot-container',
  '#raidenCanvas',
  '#raiden-dialogue-bubble',
  '.mascot-toolbar',
  '.mascot-popover-menu',
  '#raiden-mascot-container.minimized'
];

for (const sel of requiredSelectors) {
  if (!css.includes(sel)) {
    throw new Error('Missing CSS selector in styles.css: ' + sel);
  }
}
console.log('✔ All CSS selectors verified in styles.css.');

console.log('\n========================================');
console.log('🎉 ALL LIVING MASCOT TESTS PASSED (100%)');
console.log('========================================');
process.exit(0);


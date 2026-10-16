/**
 * Test companion switching, cycling, and drag/dock mechanics
 */
const assert = require('assert');

// Mock browser environment
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  screen: { width: 1920, height: 1080 },
  innerWidth: 1200,
  innerHeight: 800
};
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.document = {
  getElementById: (id) => {
    if (id === 'raidenCanvas' || id === 'mascotCanvas') {
      return {
        id,
        getContext: () => ({
          clearRect: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          drawImage: () => {},
          fillRect: () => {},
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          stroke: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} })
        }),
        addEventListener: () => {},
        style: {},
        width: 130,
        height: 130
      };
    }
    return {
      id,
      addEventListener: () => {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      style: {
        setProperty: () => {}
      },
      appendChild: () => {}
    };
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  documentElement: { style: { setProperty: () => {} } },
  body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } }
};
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem: function(k, v) { this._store[k] = String(v); }
};
global.Image = class {
  constructor() {
    this.complete = true;
    this.naturalWidth = 64;
    this.naturalHeight = 64;
    this.src = '';
  }
};
global.fetch = async () => ({ ok: true, json: async () => ({}) });

const MascotController = require('../js/mascot.js');

console.log('Testing Companion Switching & Dragging Mechanics...');

const mascot = new MascotController({ canvasId: 'raidenCanvas' });

// 1. Verify window globals
assert(global.window.mascotController === mascot, 'window.mascotController must be assigned');
assert(global.window.mascot === mascot, 'window.mascot must be assigned');
console.log('✔ Global controller bindings verified.');

// 2. Test cycleCompanion
mascot.activeCompanionId = 'void';
const next1 = mascot.cycleCompanion(false);
assert.strictEqual(next1, 'pixel', 'Void should cycle to Pixel');
assert.strictEqual(mascot.activeCompanionId, 'pixel');

const next2 = mascot.cycleCompanion(false);
assert.strictEqual(next2, 'nova', 'Pixel should cycle to Nova');
assert.strictEqual(mascot.activeCompanionId, 'nova');

const next3 = mascot.cycleCompanion(false);
assert.strictEqual(next3, 'cipher', 'Nova should cycle to Cipher');
assert.strictEqual(mascot.activeCompanionId, 'cipher');

const next4 = mascot.cycleCompanion(false);
assert.strictEqual(next4, 'void', 'Cipher should cycle to Void');
assert.strictEqual(mascot.activeCompanionId, 'void');
console.log('✔ Character cycling (Void -> Pixel -> Nova -> Cipher -> Void) verified.');

// 3. Test direct switch
mascot.switchCompanion('pixel', false);
assert.strictEqual(mascot.activeCompanionId, 'pixel');
assert(mascot.spriteSheet.src.includes('pixel'), 'Spritesheet must update to pixel');
console.log('✔ Direct switch and spritesheet sync verified.');

// 4. Test desktop toggle
assert.strictEqual(mascot.isFloatingOutside, false);
mascot.toggleDesktopFloat();
assert.strictEqual(mascot.isFloatingOutside, true, 'Should float outside on toggle');

mascot.toggleDesktopFloat();
assert.strictEqual(mascot.isFloatingOutside, false, 'Should dock back inside on toggle');
console.log('✔ Float / Dock toggle verified.');

console.log('🎉 ALL SWITCH AND DRAG TESTS PASSED 100%!');
process.exit(0);

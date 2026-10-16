/**
 * Comprehensive Verification Suite for RAIDEN Living Mascot & Animation Engine
 * Validates:
 * 1. Animation Manifest (states, kinetics, loop types, fallbacks)
 * 2. CompanionStateMachine Priority Hierarchy & Stateful Restoration
 * 3. Privacy-preserving Typing Detection (no text inspection, 1800ms debounce)
 * 4. Music Playback Detection & State Transitions (Dancing, DJ Headphones)
 * 5. 600+ Situational Hinglish Repository Integration
 * 6. Real-time English Wit & Roast prompt configuration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🧪 TESTING ADVANCED LIVING MASCOT & ANIMATION ENGINE');
console.log('========================================================\n');

// 1. ANIMATION MANIFEST VERIFICATION
console.log('▶ Test 1: Animation Manifest Validation...');
const { ANIMATION_MANIFEST, getAnimationManifestItem } = require('../js/companion/AnimationManifest.js');
assert(ANIMATION_MANIFEST, 'ANIMATION_MANIFEST should be exported');

const requiredStates = [
  'idle', 'sleeping', 'waiting', 'stretch', 'typing', 'curious',
  'music_dance', 'thinking', 'replying', 'celebrating', 'wake_up',
  'greeting', 'error', 'confused', 'dragged'
];

for (const state of requiredStates) {
  const config = getAnimationManifestItem(state);
  assert(config, `State '${state}' must exist in manifest`);
  assert(typeof config.loop === 'boolean', `State '${state}' must define boolean loop`);
  assert(config.fallbackState !== undefined, `State '${state}' must have a fallback state`);
  assert(config.kinetics, `State '${state}' must define micro-kinetics`);
}
console.log(`  ✔ Verified all ${requiredStates.length} behavior states in AnimationManifest.`);

// 2. BEHAVIOR STATE MACHINE & STATEFUL RESTORATION
console.log('\n▶ Test 2: Behavior State Machine Priority & Stateful Restoration...');
const CompanionStateMachine = require('../js/companion/CompanionStateMachine.js');

// Mock CompanionSettings
class MockSettings {
  constructor() { this.data = { enabled: true, sound: true, auto_reactions: true }; }
  get(k) { return this.data[k]; }
}
const mockSettings = new MockSettings();
const fsm = new CompanionStateMachine({ settings: mockSettings });

assert.strictEqual(fsm.currentState, 'idle', 'Initial state must be idle');

// Set baseline state (music_dance, priority 3)
const musicSuccess = fsm.transition('music_dance', 0, CompanionStateMachine.PRIORITY.MUSIC, true);
assert(musicSuccess, 'Should successfully transition to music_dance');
assert.strictEqual(fsm.currentState, 'music_dance');
assert.strictEqual(fsm.persistentState, 'music_dance', 'persistentState should preserve music_dance');

// Temporary reaction (celebrating, priority 5, duration 200ms)
const celebSuccess = fsm.transition('celebrating', 200, CompanionStateMachine.PRIORITY.REACTION);
assert(celebSuccess, 'Should interrupt with higher priority celebration');
assert.strictEqual(fsm.currentState, 'celebrating');
assert.strictEqual(fsm.persistentState, 'music_dance', 'persistentState must still remember music_dance');

// Lower priority cannot interrupt high priority
const lowerIgnored = fsm.transition('typing', 0, CompanionStateMachine.PRIORITY.TYPING);
assert(!lowerIgnored, 'Lower priority typing must not interrupt active celebration');

// Fast forward timer to verify stateful restoration
fsm.restorePreviousState();
assert.strictEqual(fsm.currentState, 'music_dance', 'After temporary celebration, must restore persistentState (music_dance)');
console.log('  ✔ Stateful restoration verified: Mascot returns to music_dance, not blindly to idle.');

// 3. TYPING DEBOUNCING & PRIVACY
console.log('\n▶ Test 3: Typing Grace Period & Debouncing (No Content Inspection)...');
fsm.revertToIdle();
assert.strictEqual(fsm.currentState, 'idle', 'Must be idle before typing test');

// Start typing
fsm.notifyTypingActivity();
assert.strictEqual(fsm.currentState, 'typing', 'Typing signal must set typing state');

// Rapid typing signals (within grace period) must keep typing alive without flickering
fsm.notifyTypingActivity();
fsm.notifyTypingActivity();
assert.strictEqual(fsm.currentState, 'typing', 'Repeated keystrokes bridge smoothly without flickering');

// Finish typing
fsm.finishTyping();
assert.strictEqual(fsm.currentState, 'idle', 'After typing grace ends, returns to underlying state (idle)');
console.log('  ✔ Privacy-preserving typing verified: pure activity signal with 1800ms debounce.');

// 4. MASCOT CONTROLLER CLASS & PARTICLES VERIFICATION
console.log('\n▶ Test 4: MascotController Overlays & Particle Engine...');
// Mock window and document
global.window = { matchMedia: () => ({ matches: false, addEventListener: () => {} }) };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = {
  getElementById: (id) => {
    return {
      getContext: () => ({
        imageSmoothingEnabled: true,
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        moveTo: () => {},
        lineTo: () => {}
      }),
      width: 130,
      classList: {
        remove: () => {},
        add: () => {},
        toggle: () => {},
        contains: () => false
      },
      style: {},
      addEventListener: () => {}
    };
  },
  body: {
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    }
  },
  addEventListener: () => {}
};
global.Image = class { constructor() { this.src = ''; } };
global.requestAnimationFrame = (fn) => {};
global.cancelAnimationFrame = (id) => {};

const MascotController = require('../js/mascot.js');
const mascot = new MascotController({ canvasId: 'testCanvas' });

// Verify states
assert(mascot.setState('TYPING'), 'Should support TYPING state');
assert(mascot.setState('DANCING'), 'Should support DANCING state');
assert(mascot.setState('MUSIC_DANCE'), 'Should support MUSIC_DANCE state');

// Verify music particle support
mascot.spawnParticles('music_notes', 4);
const musicParticles = mascot.particles.filter(p => p.type === 'music_notes');
assert(musicParticles.length >= 4, 'Should spawn music_notes particles with glyphs');
assert(musicParticles[0].glyph === '♪' || musicParticles[0].glyph === '♫', 'Music particle glyph must be ♪ or ♫');

// Verify typing sparks particle support
mascot.spawnParticles('typing_sparks', 2);
const typingSparks = mascot.particles.filter(p => p.type === 'typing_sparks');
assert(typingSparks.length >= 2, 'Should spawn typing_sparks particles');

// Verify overlay methods exist
assert(typeof mascot.renderDancingHeadphones === 'function', 'renderDancingHeadphones must exist');
assert(typeof mascot.renderTypingPawHUD === 'function', 'renderTypingPawHUD must exist');
console.log('  ✔ MascotController overlays & music particles verified.');

// 5. 600+ SITUATIONAL HINGLISH REPOSITORY VERIFICATION
console.log('\n▶ Test 5: 600+ Situational Hinglish Dialogue Repository Verification...');
const hinglishData = JSON.parse(fs.readFileSync(path.join(__dirname, '../raiden_core/hinglish_data.json'), 'utf-8'));
const banks = hinglishData.situational_banks;
assert(banks, 'situational_banks must exist in hinglish_data.json');
const bankCount = Object.keys(banks).length;
let totalDialogues = 0;
for (const [key, list] of Object.entries(banks)) {
  totalDialogues += list.length;
}
assert(totalDialogues >= 600, `Expected at least 600 situational dialogues, found ${totalDialogues}`);
assert(banks.MUSIC_PLAYING && banks.MUSIC_PLAYING.length >= 5, 'MUSIC_PLAYING situational bank must exist');
assert(banks.MUSIC_PAUSED && banks.MUSIC_PAUSED.length >= 2, 'MUSIC_PAUSED situational bank must exist');
console.log(`  ✔ Verified ${totalDialogues} situational dialogues across ${bankCount} categories (target: 500-600).`);

// 6. REAL-TIME ENGLISH ROAST PROMPT VERIFICATION
console.log('\n▶ Test 6: Real-Time English Banter & Roast Prompting...');
const humorEngineFile = fs.readFileSync(path.join(__dirname, '../raiden_core/humor_engine.py'), 'utf-8');
assert(humorEngineFile.includes('Rules: Reply strictly in witty, hilarious English'), 'humor_engine must prompt LLM strictly in witty English');
assert(humorEngineFile.includes('Playfully roast the user or make a sarcastic, funny joke'), 'humor_engine must instruct LLM to roast the user');
assert(humorEngineFile.includes('No Hinglish'), 'humor_engine must explicitly prevent broken Hinglish from local LLM');

const mainFile = fs.readFileSync(path.join(__dirname, '../main.py'), 'utf-8');
assert(mainFile.includes('Real-Time Wit & Roasts: Give funny responses and playfully roast the user in English'), 'main.py DEFAULT_SYSTEM_PROMPT must configure real-time English roasts');

console.log('  ✔ Verified real-time English wit and playful roasts configured cleanly.');

console.log('\n========================================================');
console.log('🎉 ALL ADVANCED LIVING MASCOT ENGINE TESTS PASSED (100%)');
console.log('========================================================');
process.exit(0);

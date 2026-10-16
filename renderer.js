/**
 * RAIDEN Desktop Mascot — Electron Renderer Process
 * Connects MascotController to Electron's transparent desktop overlay window,
 * handles real-time OS activity awareness, bounded roaming, hybrid humor, and docking.
 */

const { ipcRenderer } = (typeof window !== 'undefined' && window.require)
  ? window.require('electron')
  : { ipcRenderer: null };

// Initialize Desktop Mascot Engine
const mascot = new MascotController({
  canvasId: 'mascotCanvas',
  bubbleId: 'dialogue-bubble',
  containerId: 'desktop-pet-container',
  width: 180,
  height: 180
});

window.mascot = mascot;
window.mascotController = mascot;
window.setMascotState = (stateName) => mascot.setState(stateName);
window.handleSystemEvent = (eventType, metadata) => mascot.handleSystemEvent(eventType, metadata);

// Preferences & State
const state = {
  activityEnabled: localStorage.getItem('raiden_mascot_activity') !== 'false',
  roamingEnabled: localStorage.getItem('raiden_mascot_roaming') !== 'false',
  alwaysOnTop: localStorage.getItem('raiden_mascot_always_top') !== 'false',
  lastActivityCategory: 'other',
  isRoamingNow: false,
  roamOffset: 0,
  lastBanterTime: 0,
  lastSaveBanterTime: 0,
  lastBurstBanterTime: 0,
  lastPauseBanterTime: 0,
  lastSwitchBanterTime: 0
};

// UI Elements
const badge = document.getElementById('activity-badge');
const btnDock = document.getElementById('btn-dock');
const btnTalk = document.getElementById('btn-talk');
const btnPat = document.getElementById('btn-pat');
const btnZap = document.getElementById('btn-zap');
const btnStance = document.getElementById('btn-stance');
const btnSwitchCompanion = document.getElementById('btn-switch-companion');
const btnAudio = document.getElementById('btn-audio');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnClose = document.getElementById('btn-close');

const settingsMenu = document.getElementById('pet-settings-menu');
const toggleActivity = document.getElementById('toggle-activity');
const toggleScreen = document.getElementById('toggle-screen');
const toggleRoaming = document.getElementById('toggle-roaming');
const toggleAlwaysTop = document.getElementById('toggle-always-top');
const btnResetPos = document.getElementById('btn-reset-pos');
const btnClearMem = document.getElementById('btn-clear-mem');

// Notify backend bridge that floating widget is active
async function syncDockState(isFloating) {
  try {
    await fetch('http://127.0.0.1:8765/api/companion/dock_state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_floating: isFloating,
        active_companion: mascot.activeCompanionId || 'pixel'
      })
    });
  } catch (e) {}
}

// -----------------------------------------------------------------
// DOCKING & CONTROL BUTTONS
// -----------------------------------------------------------------
if (btnDock) {
  btnDock.addEventListener('click', async () => {
    mascot.triggerDialogue('Returning home to Raiden window! 🏠');
    await syncDockState(false);
    setTimeout(() => {
      if (ipcRenderer) ipcRenderer.send('dock-mascot');
      else window.close();
    }, 600);
  });
}

if (btnTalk) {
  btnTalk.addEventListener('click', async () => {
    mascot.setState('CURIOUS', 1800);
    mascot.playCyberTone('blip');
    try {
      const screenRes = await fetch('http://127.0.0.1:8765/api/screen/observe_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companion_id: mascot.activeCompanionId || 'pixel' })
      });
      if (screenRes.ok) {
        const data = await screenRes.json();
        if (data && data.commentary && data.commentary.text) {
          mascot.setState(data.commentary.mood || 'ALERT', 3500);
          mascot.triggerDialogue(data.commentary.text);
          return;
        }
      }
    } catch (e) {}

    await fetchBanterForEvent({
      type: 'MANUAL_POKE',
      category: state.lastActivityCategory,
      description: 'User clicked talk button'
    });
  });
}

if (btnPat) {
  btnPat.addEventListener('click', () => {
    mascot.pet();
  });
}

if (btnZap) {
  btnZap.addEventListener('click', () => {
    mascot.zap();
  });
}

if (btnStance) {
  btnStance.addEventListener('click', () => {
    mascot.cyclePose();
  });
}

if (btnSwitchCompanion) {
  const companions = ['void', 'pixel', 'nova', 'cipher'];
  btnSwitchCompanion.addEventListener('click', () => {
    const current = (mascot.activeCompanionId || 'void').toLowerCase();
    const currIdx = companions.indexOf(current);
    const nextIdx = (currIdx + 1) % companions.length;
    const nextId = companions[nextIdx];
    mascot.switchCompanion(nextId, true);
    syncDockState(true);
  });
}

if (btnAudio) {
  btnAudio.addEventListener('click', () => {
    const isEnabled = mascot.toggleSound();
    btnAudio.textContent = isEnabled ? '🔊' : '🔇';
  });
}

if (btnClose) {
  btnClose.addEventListener('click', () => {
    syncDockState(false);
    if (ipcRenderer) ipcRenderer.send('dock-mascot');
    else window.close();
  });
}

// -----------------------------------------------------------------
// SETTINGS POPOVER
// -----------------------------------------------------------------
if (btnSettings) {
  btnSettings.addEventListener('click', () => {
    if (settingsMenu) {
      settingsMenu.classList.toggle('visible');
    }
  });
}

if (btnCloseSettings) {
  btnCloseSettings.addEventListener('click', () => {
    if (settingsMenu) {
      settingsMenu.classList.remove('visible');
    }
  });
}

if (toggleActivity) {
  toggleActivity.addEventListener('click', () => {
    state.activityEnabled = !state.activityEnabled;
    localStorage.setItem('raiden_mascot_activity', state.activityEnabled ? 'true' : 'false');
    toggleActivity.textContent = state.activityEnabled ? 'ON' : 'OFF';
    toggleActivity.classList.toggle('active', state.activityEnabled);
    if (badge) badge.style.display = state.activityEnabled ? 'flex' : 'none';
  });
}

if (toggleScreen) {
  // Sync initial state from bridge
  fetch('http://127.0.0.1:8765/api/screen/status')
    .then(r => r.json())
    .then(data => {
      if (data && data.enabled) {
        toggleScreen.classList.add('active');
        toggleScreen.textContent = 'ON';
      }
    }).catch(() => {});

  toggleScreen.addEventListener('click', async () => {
    const isNowActive = !toggleScreen.classList.contains('active');
    toggleScreen.classList.toggle('active', isNowActive);
    toggleScreen.textContent = isNowActive ? 'ON' : 'OFF';
    try {
      await fetch('http://127.0.0.1:8765/api/screen/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: isNowActive })
      });
      mascot.triggerDialogue(isNowActive ? 'Visual screen perception online! 👀' : 'Screen perception paused.');
    } catch (e) {}
  });
}

if (toggleRoaming) {
  toggleRoaming.addEventListener('click', () => {
    state.roamingEnabled = !state.roamingEnabled;
    localStorage.setItem('raiden_mascot_roaming', state.roamingEnabled ? 'true' : 'false');
    toggleRoaming.textContent = state.roamingEnabled ? 'ON' : 'OFF';
    toggleRoaming.classList.toggle('active', state.roamingEnabled);
  });
}

if (toggleAlwaysTop) {
  toggleAlwaysTop.addEventListener('click', () => {
    state.alwaysOnTop = !state.alwaysOnTop;
    localStorage.setItem('raiden_mascot_always_top', state.alwaysOnTop ? 'true' : 'false');
    toggleAlwaysTop.textContent = state.alwaysOnTop ? 'ON' : 'OFF';
    toggleAlwaysTop.classList.toggle('active', state.alwaysOnTop);
    if (ipcRenderer) {
      ipcRenderer.send('toggle-always-on-top', state.alwaysOnTop);
    }
  });
}

if (btnResetPos) {
  btnResetPos.addEventListener('click', () => {
    if (ipcRenderer) {
      ipcRenderer.send('reset-position');
      mascot.triggerDialogue('Position reset to home corner! 📍');
    }
  });
}

if (btnClearMem) {
  btnClearMem.addEventListener('click', async () => {
    try {
      await fetch('http://127.0.0.1:8765/api/companion/clear_memory', { method: 'POST' });
      mascot.triggerDialogue('Memory reset ho gaya! Fresh brain mode. 🧠✨');
    } catch (e) {
      mascot.triggerDialogue('Memory clear ho gaya!');
    }
  });
}

// -----------------------------------------------------------------
// SMOOTH ELECTRON WINDOW DRAGGING WITH DROP PHYSICS
// -----------------------------------------------------------------
const canvas = document.getElementById('mascotCanvas');
let isMoving = false;
let startX = 0;
let startY = 0;

if (canvas && ipcRenderer) {
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isMoving = true;
      startX = e.screenX;
      startY = e.screenY;
      mascot.setState('DRAGGED', 0, 100);
      mascot.playCyberTone('blip');
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMoving) return;
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    startX = e.screenX;
    startY = e.screenY;
    ipcRenderer.send('move-window', { deltaX, deltaY });
  });

  window.addEventListener('mouseup', () => {
    if (isMoving) {
      isMoving = false;
      mascot.setState('ALERT', 1200, 100);
      mascot.playCyberTone('bounce');
      setTimeout(() => {
        mascot.revertToIdle();
      }, 1200);
    }
  });
}

// -----------------------------------------------------------------
// REAL-TIME WINDOWS ACTIVITY MONITOR & HYBRID HUMOR LOOP
// -----------------------------------------------------------------
async function pollActivity() {
  if (!state.activityEnabled) return;

  try {
    const res = await fetch('http://127.0.0.1:8765/api/activity/poll', { method: 'POST' });
    if (!res.ok) return;

    const data = await res.json();
    const event = data.event;
    const snap = data.snapshot;

    // Update Activity Badge
    if (badge && snap) {
      let label = snap.category ? snap.category.toUpperCase() : 'READY';
      if (snap.is_deep_sleep) label = 'SLEEPING 💤';
      else if (snap.is_idle) label = 'IDLE';
      else if (snap.current_file) {
        const dirtyPrefix = snap.is_file_dirty ? '● ' : '';
        label = `CODING (${dirtyPrefix}${snap.current_file})`;
      } else if (snap.process && snap.process !== 'unknown') {
        label = `${snap.category.toUpperCase()} (${snap.process.replace('.exe', '')})`;
      }

      badge.textContent = `● ${label}`;
      state.lastActivityCategory = snap.category;
    }

    // Process State Changes
    if (event) {
      const etype = event.type;
      const now = Date.now();

      if (etype === 'USER_IDLE') {
        mascot.setState('SLEEPY', 0, 50);
      } else if (etype === 'USER_WAKE') {
        mascot.setState('CURIOUS', 2500, 75);
        mascot.playCyberTone('blip');
        if (now - state.lastBanterTime > 8000) {
          state.lastBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'APP_SWITCH') {
        if (event.to_category === 'coding') {
          mascot.setState('ALERT', 2000, 60);
        } else if (event.to_category === 'gaming') {
          mascot.setState('HAPPY', 2500, 60);
        } else {
          mascot.setState('CURIOUS', 1800, 50);
        }

        if (now - state.lastBanterTime > 12000) {
          state.lastBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'FILE_SAVE') {
        mascot.setState('HAPPY', 2200, 75);
        mascot.playCyberTone('bounce');
        if (badge) {
          badge.textContent = `● SAVED: ${event.file || 'CODE'} 💾`;
          badge.style.borderColor = 'rgba(0, 255, 136, 0.7)';
          setTimeout(() => { if (badge) badge.style.borderColor = ''; }, 2200);
        }
        if (now - state.lastSaveBanterTime > 35000) {
          state.lastSaveBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'CODING_BURST') {
        mascot.setState('THINKING', 3000, 70);
        mascot.playCyberTone('blip');
        if (badge) {
          badge.textContent = `● FLOW STATE ⚡ (${Math.round(event.streak_sec || 5)}s)`;
          badge.style.borderColor = 'rgba(0, 240, 255, 0.8)';
          setTimeout(() => { if (badge) badge.style.borderColor = ''; }, 3000);
        }
        if (now - state.lastBurstBanterTime > 50000) {
          state.lastBurstBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'CODING_PAUSE') {
        mascot.setState('CONFUSED', 3200, 65);
        if (badge) {
          badge.textContent = `● PONDERING 🤔`;
        }
        if (now - state.lastPauseBanterTime > 60000) {
          state.lastPauseBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'FILE_SWITCH') {
        mascot.setState('CURIOUS', 1800, 60);
        if (badge) {
          badge.textContent = `● EDITING: ${event.file}`;
        }
        if (now - state.lastSwitchBanterTime > 60000) {
          state.lastSwitchBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'SYNTAX_ERROR') {
        mascot.setState('ERROR', 3500, 95);
        mascot.playCyberTone('alert');
        if (badge) {
          badge.textContent = `● SYNTAX ERROR L${event.line || '?'} ⚠️`;
          badge.style.borderColor = 'rgba(239, 68, 68, 0.9)';
          setTimeout(() => { if (badge) badge.style.borderColor = ''; }, 3500);
        }
        await fetchBanterForEvent(event);
      } else if (etype === 'GIT_COMMIT') {
        mascot.setState('VICTORY', 3500, 90);
        mascot.playCyberTone('chime');
        if (badge) {
          badge.textContent = `● COMMITTED! 🚀`;
        }
        await fetchBanterForEvent(event);
      } else if (etype === 'SCREEN_OBSERVATION') {
        const obs = event.observation || {};
        const comm = event.commentary || {};
        const mood = comm.mood || obs.suggested_mood || 'ALERT';
        const tone = comm.tone || 'blip';

        mascot.setState(mood, 4000, 85);
        mascot.playCyberTone(tone);

        if (badge) {
          const app = (obs.app_context || 'DESKTOP').slice(0, 15);
          badge.textContent = `● VIS: ${app} 👀`;
          badge.style.borderColor = 'rgba(0, 240, 255, 0.9)';
          setTimeout(() => { if (badge) badge.style.borderColor = ''; }, 3500);
        }

        if (comm.text) {
          mascot.triggerDialogue(comm.text);
        }
      } else if (etype === 'CODING_STREAK') {
        mascot.setState('STRETCH', 3000, 70);
        await fetchBanterForEvent(event);
      } else if (etype === 'HEAVY_LOAD') {
        mascot.setState('ERROR', 2500, 65);
        await fetchBanterForEvent(event);
      } else if (etype === 'MUSIC_PLAYING') {
        mascot.setState('DANCING', 0, 50);
        mascot.playCyberTone('bounce');
        if (badge) {
          const track = event.track || event.title || 'Music';
          const artist = event.artist ? ` - ${event.artist}` : '';
          badge.textContent = `● VIBING: ${track}${artist} 🎵`;
          badge.style.borderColor = 'rgba(0, 240, 255, 0.85)';
        }
        if (!state.lastMusicBanterTime || now - state.lastMusicBanterTime > 45000) {
          state.lastMusicBanterTime = now;
          await fetchBanterForEvent(event);
        }
      } else if (etype === 'MUSIC_PAUSED' || etype === 'MUSIC_STOPPED') {
        if (mascot.currentState === 'DANCING' || mascot.currentState === 'MUSIC_DANCE') {
          mascot.restorePreviousState();
        }
        if (badge && badge.textContent.includes('VIBING')) {
          badge.textContent = `● RAIDEN ONLINE ⚡`;
          badge.style.borderColor = '';
        }
      }
    }
  } catch (e) {
    // Backend offline / not ready yet
  }
}

async function fetchBanterForEvent(event) {
  try {
    const res = await fetch('http://127.0.0.1:8765/api/companion/banter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event,
        companion_id: mascot.activeCompanionId || 'pixel',
        timeout_sec: 2.0
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        mascot.triggerDialogue(data.text);
      }
    }
  } catch (e) {
    mascot.cycleNextDialogue();
  }
}

// -----------------------------------------------------------------
// BOUNDED DESKTOP ROAMING
// Micro-hops on the desktop when idle, returning to home position.
// -----------------------------------------------------------------
function triggerMicroRoam() {
  if (!state.roamingEnabled || isMoving || mascot.currentState === 'SLEEPY' || mascot.currentState === 'DRAGGED') {
    return;
  }

  // 15% probability per tick if idle
  if (Math.random() > 0.15) return;

  state.isRoamingNow = true;
  const direction = state.roamOffset >= 24 ? -1 : (state.roamOffset <= -24 ? 1 : (Math.random() < 0.5 ? -1 : 1));
  const step = direction * 12;
  state.roamOffset += step;

  mascot.setState('CURIOUS', 1200);
  if (ipcRenderer) {
    ipcRenderer.send('roam-step', { deltaX: step, deltaY: 0 });
  }

  // Hop back towards anchor after 3 seconds
  setTimeout(() => {
    if (state.roamOffset !== 0 && !isMoving) {
      const returnStep = -state.roamOffset;
      state.roamOffset = 0;
      if (ipcRenderer) {
        ipcRenderer.send('roam-step', { deltaX: returnStep, deltaY: 0 });
      }
      mascot.revertToIdle();
    }
    state.isRoamingNow = false;
  }, 3000);
}

// Start Background Loops
syncDockState(true);
setInterval(pollActivity, 1500);
setInterval(triggerMicroRoam, 10000);

// Periodic dock state sync with main app
async function checkDockSync() {
  try {
    const res = await fetch('http://127.0.0.1:8765/api/companion/dock_state');
    if (!res.ok) return;
    const data = await res.json();
    if (data) {
      if (data.is_floating === true) {
        if (ipcRenderer) {
          const coords = (typeof data.x === 'number' && typeof data.y === 'number')
            ? { x: data.x, y: data.y }
            : null;
          ipcRenderer.send('show-mascot', coords);
        }
      } else if (data.is_floating === false) {
        if (ipcRenderer) ipcRenderer.send('dock-mascot');
      }
      if (data.active_companion && data.active_companion !== mascot.activeCompanionId) {
        mascot.switchCompanion(data.active_companion, false);
      }
    }
  } catch (e) {}
}
setInterval(checkDockSync, 1000);

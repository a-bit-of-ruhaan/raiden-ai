/**
 * RAIDEN COMPANION SYSTEM — BEHAVIOR SCHEDULER
 * Manages inactivity timeouts, sleep cycles, click combos, time-of-day greetings,
 * and tracks discovered easter eggs for the exploration reward system.
 */

const PRIORITY = {
  IDLE: 1,
  CONTEXTUAL: 2,
  INTERACTION: 3,
  TASK: 4,
  CRITICAL: 5
};

class BehaviorScheduler {
  constructor(options = {}) {
    this.stateMachine = options.stateMachine || null;
    this.dialogueEngine = options.dialogueEngine || null;
    this.settings = options.settings || null;
    this.animationPlayer = options.animationPlayer || null;

    this.lastActivityTime = Date.now();
    this.isSleeping = false;
    this.checkInterval = null;

    // Click tracking for combos
    this.clickHistory = [];
    this.longPressTimer = null;
    this.pressStartTime = 0;
  }

  start() {
    this.stop();
    this.lastActivityTime = Date.now();
    this.checkInterval = setInterval(() => {
      this.evaluateInactivity();
    }, 6000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  notifyActivity() {
    this.lastActivityTime = Date.now();
    if (this.isSleeping) {
      this.wakeUp();
    }
  }

  evaluateInactivity() {
    if (!this.stateMachine || this.isSleeping) return;
    const elapsed = Date.now() - this.lastActivityTime;

    // 10 minutes -> Low-power sleep
    if (elapsed > 600000 && this.stateMachine.getState() === 'idle') {
      this.isSleeping = true;
      this.stateMachine.transition('sleeping', 0, PRIORITY.IDLE);
      if (this.dialogueEngine && this.dialogueEngine.canSpeak('sleep')) {
        const line = this.dialogueEngine.selectLine('sleep');
        if (line) this.dialogueEngine.say(line);
      }
      return;
    }

    // 2 minutes -> Stretch / yawn
    if (elapsed > 120000 && elapsed < 128000 && this.stateMachine.getState() === 'idle') {
      this.stateMachine.transition('waiting', 3000, PRIORITY.CONTEXTUAL);
      if (this.dialogueEngine && this.dialogueEngine.canSpeak('waiting')) {
        const line = this.dialogueEngine.selectLine('waiting');
        if (line) this.dialogueEngine.say(line);
      }
      return;
    }

    // 35 seconds -> Idle banter or glance
    if (elapsed > 35000 && elapsed < 42000 && this.stateMachine.getState() === 'idle') {
      if (this.dialogueEngine && this.dialogueEngine.canSpeak('idle_banter')) {
        const line = this.dialogueEngine.selectLine('idle_banter');
        if (line) this.dialogueEngine.say(line);
      }
    }
  }

  wakeUp() {
    this.isSleeping = false;
    if (this.stateMachine) {
      this.stateMachine.transition('celebrating', 2200, PRIORITY.CONTEXTUAL);
    }
    if (this.dialogueEngine && this.dialogueEngine.canSpeak('wakeUp')) {
      const line = this.dialogueEngine.selectLine('wakeUp');
      if (line) this.dialogueEngine.say(line);
    }
  }

  /**
   * Handle click on the mascot canvas to detect rapid click combos.
   */
  handleClick(companionId) {
    this.notifyActivity();
    const now = Date.now();
    this.clickHistory.push(now);

    // Keep only clicks within last 900ms
    this.clickHistory = this.clickHistory.filter(t => now - t < 900);

    // 3 rapid clicks = Secret Combo Discovery!
    if (this.clickHistory.length >= 3) {
      this.clickHistory = [];
      this.handleTripleClickCombo(companionId);
      return;
    }

    // Single click reaction
    if (this.stateMachine) {
      this.stateMachine.transition('curious', 2400, PRIORITY.INTERACTION);
    }
    if (this.dialogueEngine && this.dialogueEngine.canSpeak('click')) {
      const line = this.dialogueEngine.selectLine('click') || this.dialogueEngine.selectLine('banter');
      if (line) this.dialogueEngine.say(line);
    }
    if (this.animationPlayer) {
      this.animationPlayer.spawnSpecialParticles('sparkle', 6);
    }
  }

  handleTripleClickCombo(companionId) {
    if (this.stateMachine) {
      this.stateMachine.transition('celebrating', 3600, PRIORITY.INTERACTION);
    }
    if (this.animationPlayer) {
      this.animationPlayer.spawnSpecialParticles('combo', 20);
    }

    if (this.settings) {
      const isNew = this.settings.unlockDiscovery(companionId, 'triple_click_burst');
      if (isNew && this.dialogueEngine) {
        this.dialogueEngine.say({
          text: 'Secret combo unlocked: Triple Click Celebration!',
          mood: 'happy'
        });
        return;
      }
    }

    if (this.dialogueEngine && this.dialogueEngine.canSpeak('celebrate')) {
      const line = this.dialogueEngine.selectLine('celebrate');
      if (line) this.dialogueEngine.say(line);
    }
  }

  /**
   * Evaluate time-of-day for customized greetings.
   */
  getTimeOfDayGreeting() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      return { trigger: 'late_night', hint: 'Late night coding session' };
    } else if (hour >= 5 && hour < 12) {
      return { trigger: 'morning', hint: 'Morning energy' };
    } else if (hour >= 12 && hour < 18) {
      return { trigger: 'afternoon', hint: 'Afternoon grind' };
    } else {
      return { trigger: 'evening', hint: 'Evening build' };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BehaviorScheduler;
}
if (typeof window !== 'undefined') {
  window.BehaviorScheduler = BehaviorScheduler;
}

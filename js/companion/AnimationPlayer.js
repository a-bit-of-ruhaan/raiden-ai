/**
 * RAIDEN COMPANION SYSTEM — ANIMATION PLAYER
 * Retro pixel-art 2D canvas renderer with integer scaling, particle bursts,
 * poof hot-swapping transitions, and strict low-end hardware efficiency.
 * 
 * Non-Negotiable Rule 2:
 * Animations halt when tab is hidden, prefers-reduced-motion is respected,
 * and idle CPU stays negligible.
 */

class AnimationPlayer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false; // Crisp pixel art
    }

    this.settings = options.settings || null;
    this.activePack = null;
    this.currentState = 'idle';
    this.currentFrame = 0;
    this.tickCount = 0;
    this.isPaused = false;
    this.particles = [];
    this.poofTransition = 0; // 0 to 1 for poof smoke burst on companion switch

    // Animation kinetics
    this.phase = 0;
    this.earTwitch = 0;
    this.tailSpeed = 1.0;
    this.streamingPulse = 0;
    this.bounceY = 0;
    this.tiltAngle = 0;
    this.glanceX = 0;
    this.glanceY = 0;

    // Sprite assets cache
    this.loadedImages = new Map();

    // Setup tab visibility listener to halt CPU loop when backgrounded
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isPaused = document.hidden;
      });
    }

    // Check reduced motion media query
    this.reducedMotion = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mq.matches;
      mq.addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });
    }
  }

  setPack(pack) {
    this.activePack = pack;
    this.triggerPoof();
    if (pack && pack.id) {
      this.preloadPackSprites(pack.id);
    }
  }

  preloadPackSprites(id) {
    if (typeof Image === 'undefined') return;
    const states = ['idle', 'thinking', 'talking', 'celebrating', 'sleeping'];
    for (const st of states) {
      const key = `${id}_${st}`;
      if (!this.loadedImages.has(key)) {
        const img = new Image();
        img.onload = () => {
          this.loadedImages.set(key, img);
        };
        img.src = `companions/${id}/sprites/${st}.png`;
      }
    }
  }

  setState(stateName) {
    this.currentState = (stateName || 'idle').toLowerCase();
    this.currentFrame = 0;
  }

  triggerPoof() {
    this.poofTransition = 1.0;
    this.spawnPoofParticles(18);
  }

  spawnPoofParticles(count = 14) {
    const palette = (this.activePack && this.activePack.manifest && this.activePack.manifest.palette) || {};
    const color = palette.accent || '#00f0ff';
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4);
      const speed = 1.8 + Math.random() * 2.8;
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.02,
        size: 3 + Math.random() * 4,
        color: i % 2 === 0 ? color : '#ffffff'
      });
    }
  }

  spawnSpecialParticles(type = 'sparkle', count = 8) {
    const palette = (this.activePack && this.activePack.manifest && this.activePack.manifest.palette) || {};
    const color = palette.accent || '#00f0ff';

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -1.2 - Math.random() * 2.2,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: color,
        type: type
      });
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isPaused) return;

    const companionId = (this.activePack && this.activePack.id) || 'void';
    const palette = (this.activePack && this.activePack.manifest && this.activePack.manifest.palette) || {
      accent: '#00f0ff',
      dark: '#121620'
    };

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 + 10);

    // Apply reduced motion lock or animated physics
    if (!this.reducedMotion && this.settings && this.settings.get('animationIntensity') !== 'static') {
      this.phase += 0.05;
      
      // State-specific procedural kinetics
      switch (this.currentState) {
        case 'idle':
        case 'waiting':
          this.bounceY = Math.sin(this.phase * 0.8) * 1.5;
          this.swayX = 0;
          this.tiltAngle = Math.sin(this.phase * 0.4) * 0.03;
          break;
        case 'typing':
          this.bounceY = Math.sin(this.phase * 2.8) * 1.8;
          this.swayX = Math.sin(this.phase * 1.4) * 1.5;
          this.tiltAngle = 0.05;
          if (Math.random() < 0.12) {
            this.spawnSpecialParticles('typing_sparks', 1);
          }
          break;
        case 'music_dance':
        case 'dancing':
          // 120-BPM rhythmic bounce & sway
          this.bounceY = -4 + Math.abs(Math.sin(this.phase * 3.2)) * 5;
          this.swayX = Math.sin(this.phase * 1.6) * 4;
          this.tiltAngle = Math.sin(this.phase * 1.6) * 0.12;
          if (Math.random() < 0.09) {
            this.spawnSpecialParticles('music_notes', 1);
          }
          break;
        case 'listening':
        case 'curious':
          this.bounceY = -3 + Math.sin(this.phase * 1.2) * 1.0;
          this.swayX = 0;
          this.tiltAngle = 0.08;
          break;
        case 'thinking':
          this.bounceY = Math.sin(this.phase * 1.5) * 1.2;
          this.swayX = 0;
          this.tiltAngle = -0.05;
          break;
        case 'generating':
        case 'replying':
          this.bounceY = Math.sin(this.phase * 3.5) * 2.5;
          this.swayX = 0;
          this.tiltAngle = Math.sin(this.phase * 2.0) * 0.04;
          break;
        case 'celebrating':
        case 'wake_up':
          this.bounceY = -6 + Math.abs(Math.sin(this.phase * 4.0)) * 6;
          this.swayX = Math.sin(this.phase * 2.0) * 2;
          this.tiltAngle = Math.sin(this.phase * 3.0) * 0.12;
          break;
        case 'confused':
          this.bounceY = Math.sin(this.phase * 0.8) * 0.8;
          this.swayX = 0;
          this.tiltAngle = -0.14;
          break;
        case 'error':
          this.bounceY = (Math.random() - 0.5) * 3;
          this.swayX = (Math.random() - 0.5) * 3;
          this.tiltAngle = (Math.random() - 0.5) * 0.10;
          break;
        default:
          this.bounceY = 0;
          this.swayX = 0;
          this.tiltAngle = 0;
      }
    } else {
      this.bounceY = 0;
      this.swayX = 0;
      this.tiltAngle = 0;
    }

    this.ctx.translate(this.swayX || 0, this.bounceY);
    this.ctx.rotate(this.tiltAngle);

    // Check if real sprite PNG model is loaded for this companion
    let stateKey = 'idle';
    if (['generating', 'replying', 'listening', 'typing'].includes(this.currentState)) {
      stateKey = 'talking';
    } else if (['celebrating', 'music_dance', 'dancing', 'wake_up'].includes(this.currentState)) {
      stateKey = 'celebrating';
    } else if (['thinking', 'sleeping'].includes(this.currentState)) {
      stateKey = this.currentState;
    }
    const spriteImg = this.loadedImages.get(`${companionId}_${stateKey}`) || this.loadedImages.get(`${companionId}_idle`);

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      // Crisp 64x64 sprite drawn at 1.5x scale (96x96) centered
      const drawSize = 96;
      this.ctx.drawImage(spriteImg, -drawSize / 2, -drawSize / 2 - 8, drawSize, drawSize);
    } else {
      // Procedural pixel grid fallback
      this.drawCompanionSilhouette(companionId, palette);
    }

    // Render cyber-headphones if in music dance mode
    if (['music_dance', 'dancing'].includes(this.currentState)) {
      this.drawHeadphones(this.ctx, 3, palette);
    }

    this.ctx.restore();

    // Render active particles
    this.renderParticles();

    // Decay poof transition
    if (this.poofTransition > 0) {
      this.poofTransition -= 0.03;
    }
  }

  /**
   * Procedural retro pixel art engine fallback.
   * Renders distinct silhouettes for each of the 4 characters.
   */
  drawCompanionSilhouette(id, palette) {
    const ctx = this.ctx;
    if (!ctx) return;
    const px = 3; // Pixel grid unit
    const drawFn = (fn, ...args) => {
      if (typeof this[fn] === 'function') {
        this[fn](...args);
      } else if (typeof AnimationPlayer.prototype[fn] === 'function') {
        AnimationPlayer.prototype[fn].call(this, ...args);
      }
    };

    switch (id) {
      case 'pixel':
        // PIXEL: Playful floppy-eared cyber puppy with collar & wagging tail
        drawFn('drawPixelPuppy', ctx, px, palette);
        break;

      case 'nova':
        // NOVA: Expressive anime-retro pixel girl with twin-tails & hoodie
        drawFn('drawNovaGirl', ctx, px, palette);
        break;

      case 'cipher':
        // CIPHER: Pixel hacker dev with cyberpunk visor & floating mini holo-deck
        drawFn('drawCipherHacker', ctx, px, palette);
        break;

      case 'void':
      default:
        // VOID: Cyber-ninja cat with pointed cyber-ears, katana sheath & glowing visor
        drawFn('drawVoidCat', ctx, px, palette);
        break;
    }
  }

  drawVoidCat(ctx, px, pal) {
    const glow = pal.accent || '#00f0ff';
    const dark = '#10131c';
    const plate = '#1e2433';

    // Body & Cloak
    ctx.fillStyle = dark;
    ctx.fillRect(-8 * px, -6 * px, 16 * px, 14 * px);
    ctx.fillStyle = plate;
    ctx.fillRect(-7 * px, -5 * px, 14 * px, 12 * px);

    // Pointed Cyber Ears
    ctx.fillStyle = dark;
    ctx.fillRect(-7 * px, -12 * px, 4 * px, 6 * px);
    ctx.fillRect(3 * px, -12 * px, 4 * px, 6 * px);
    ctx.fillStyle = glow;
    ctx.fillRect(-6 * px, -10 * px, 2 * px, 4 * px);
    ctx.fillRect(4 * px, -10 * px, 2 * px, 4 * px);

    // Glowing Visor / Eyes
    ctx.fillStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8;
    if (this.currentState === 'thinking') {
      ctx.fillRect(-5 * px, -3 * px, 4 * px, 1 * px);
      ctx.fillRect(1 * px, -3 * px, 4 * px, 3 * px);
    } else if (this.currentState === 'celebrating') {
      // Crescent happy eyes
      ctx.fillRect(-5 * px, -4 * px, 3 * px, 1 * px);
      ctx.fillRect(2 * px, -4 * px, 3 * px, 1 * px);
    } else {
      ctx.fillRect(-5 * px, -3 * px, 3 * px, 2 * px);
      ctx.fillRect(2 * px, -3 * px, 3 * px, 2 * px);
    }
    ctx.shadowBlur = 0;

    // Tail wave
    const tailWave = Math.sin(this.phase * 1.5) * 4;
    ctx.fillStyle = glow;
    ctx.fillRect(8 * px, 2 * px + tailWave, 5 * px, 2 * px);
    ctx.fillRect(12 * px, -2 * px + tailWave, 2 * px, 5 * px);
  }

  drawPixelPuppy(ctx, px, pal) {
    const gold = pal.accent || '#ffb703';
    const fur = '#251c14';
    const lightFur = '#3a2e24';
    const collar = '#fb8500';

    // Body
    ctx.fillStyle = fur;
    ctx.fillRect(-9 * px, -5 * px, 18 * px, 13 * px);
    ctx.fillStyle = lightFur;
    ctx.fillRect(-8 * px, -4 * px, 16 * px, 11 * px);

    // Floppy Puppy Ears
    ctx.fillStyle = fur;
    const earBounce = Math.sin(this.phase * 2.5) * 2;
    ctx.fillRect(-11 * px, -10 * px + earBounce, 4 * px, 8 * px);
    ctx.fillRect(7 * px, -10 * px - earBounce, 4 * px, 8 * px);

    // Big expressive puppy eyes
    ctx.fillStyle = gold;
    ctx.shadowColor = gold;
    ctx.shadowBlur = 6;
    ctx.fillRect(-5 * px, -3 * px, 3 * px, 3 * px);
    ctx.fillRect(2 * px, -3 * px, 3 * px, 3 * px);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4 * px, -3 * px, 1 * px, 1 * px);
    ctx.fillRect(3 * px, -3 * px, 1 * px, 1 * px);
    ctx.shadowBlur = 0;

    // Snout & Nose
    ctx.fillStyle = '#110c08';
    ctx.fillRect(-2 * px, 1 * px, 4 * px, 2 * px);

    // Cyber Collar
    ctx.fillStyle = collar;
    ctx.fillRect(-7 * px, 5 * px, 14 * px, 2 * px);

    // Enthusiastic wagging tail
    const wagSpeed = this.currentState === 'generating' ? 6.0 : 3.0;
    const wag = Math.sin(this.phase * wagSpeed) * 6;
    ctx.fillStyle = gold;
    ctx.fillRect(9 * px, -1 * px + wag, 5 * px, 3 * px);
  }

  drawNovaGirl(ctx, px, pal) {
    const magenta = pal.accent || '#ff2a85';
    const violet = pal.secondary || '#b5179e';
    const hair = '#1d122b';
    const skin = '#fce7f3';

    // Twin-tail hair
    ctx.fillStyle = violet;
    const hairSway = Math.sin(this.phase * 1.4) * 2;
    ctx.fillRect(-12 * px, -8 * px + hairSway, 4 * px, 12 * px);
    ctx.fillRect(8 * px, -8 * px - hairSway, 4 * px, 12 * px);

    // Head / Face
    ctx.fillStyle = skin;
    ctx.fillRect(-6 * px, -8 * px, 12 * px, 10 * px);

    // Bangs & Hair Ribbon
    ctx.fillStyle = hair;
    ctx.fillRect(-7 * px, -10 * px, 14 * px, 4 * px);
    ctx.fillStyle = magenta;
    ctx.fillRect(-5 * px, -11 * px, 3 * px, 2 * px);

    // Expressive Eyes
    ctx.fillStyle = magenta;
    ctx.shadowColor = magenta;
    ctx.shadowBlur = 7;
    if (this.currentState === 'celebrating') {
      // Starry eyes
      ctx.fillRect(-4 * px, -5 * px, 2 * px, 2 * px);
      ctx.fillRect(2 * px, -5 * px, 2 * px, 2 * px);
    } else {
      ctx.fillRect(-4 * px, -5 * px, 2 * px, 3 * px);
      ctx.fillRect(2 * px, -5 * px, 2 * px, 3 * px);
    }
    ctx.shadowBlur = 0;

    // Oversized Hoodie
    ctx.fillStyle = '#2d1b3d';
    ctx.fillRect(-8 * px, 2 * px, 16 * px, 10 * px);
    ctx.fillStyle = magenta;
    ctx.fillRect(-2 * px, 4 * px, 4 * px, 6 * px);
  }

  drawCipherHacker(ctx, px, pal) {
    const green = pal.accent || '#00ff88';
    const coat = '#0a1710';
    const collar = '#122e20';

    // Trench coat / Collar
    ctx.fillStyle = coat;
    ctx.fillRect(-8 * px, -4 * px, 16 * px, 15 * px);
    ctx.fillStyle = collar;
    ctx.fillRect(-6 * px, -2 * px, 12 * px, 12 * px);

    // Head
    ctx.fillStyle = '#060d08';
    ctx.fillRect(-6 * px, -10 * px, 12 * px, 7 * px);

    // Cyberpunk Matrix Visor
    ctx.fillStyle = green;
    ctx.shadowColor = green;
    ctx.shadowBlur = 9;
    ctx.fillRect(-5 * px, -7 * px, 10 * px, 2 * px);
    ctx.shadowBlur = 0;

    // Floating Holo-Code lines when thinking/generating
    if (this.currentState === 'thinking' || this.currentState === 'generating') {
      const scanY = Math.sin(this.phase * 3) * 3;
      ctx.fillStyle = green;
      ctx.shadowColor = green;
      ctx.shadowBlur = 5;
      ctx.fillRect(-10 * px, -13 * px + scanY, 7 * px, 1 * px);
      ctx.fillRect(3 * px, -15 * px - scanY, 9 * px, 1 * px);
      ctx.fillRect(-8 * px, 9 * px + scanY, 8 * px, 1 * px);
      ctx.shadowBlur = 0;
    }
  }

  drawHeadphones(ctx, px, pal) {
    const accent = pal.accent || '#00f0ff';
    ctx.save();

    // Headphone headband arch over head
    ctx.strokeStyle = '#0a0d14';
    ctx.lineWidth = 2.5 * px;
    ctx.beginPath();
    ctx.arc(0, -7 * px, 11 * px, Math.PI * 0.82, Math.PI * 2.18);
    ctx.stroke();

    // Neon accent glow stripe
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1 * px;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pulsing DJ Equalizer heights on earcups
    const eqLeft = Math.max(1, Math.abs(Math.sin(this.phase * 4)) * 4 * px);
    const eqRight = Math.max(1, Math.abs(Math.cos(this.phase * 4)) * 4 * px);

    // Left earcup
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(-13 * px, -6 * px, 4 * px, 8 * px);
    ctx.fillStyle = accent;
    ctx.fillRect(-12 * px, -5 * px + (4 * px - eqLeft / 2), 2 * px, eqLeft);

    // Right earcup
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(9 * px, -6 * px, 4 * px, 8 * px);
    ctx.fillStyle = accent;
    ctx.fillRect(10 * px, -5 * px + (4 * px - eqRight / 2), 2 * px, eqRight);

    ctx.restore();
  }

  renderParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = p.color || '#00f0ff';
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'music_notes') {
        ctx.font = '13px monospace';
        ctx.fillText(p.char || '♪', p.x, p.y);
      } else if (p.type === 'zzz') {
        ctx.font = '9px monospace';
        ctx.fillText('z', p.x, p.y);
      } else if (p.type === 'question') {
        ctx.font = '12px monospace';
        ctx.fillText('?', p.x, p.y);
      } else if (p.type === 'typing_sparks') {
        ctx.fillRect(p.x, p.y, p.size || 2, p.size || 2);
      } else {
        ctx.fillRect(p.x, p.y, p.size || 3, p.size || 3);
      }
      ctx.restore();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationPlayer;
}
if (typeof window !== 'undefined') {
  window.AnimationPlayer = AnimationPlayer;
}

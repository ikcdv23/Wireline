// Juice: screen shake, particulas DOM, flashes y freeze-frame.
// Se encarga de todo el "feel" visual fuera del canvas.

import { CONFIG } from '../config/constants.js';
import { lerp } from '../lib/math.js';

export class JuiceEngine {
  constructor(container, canvas) {
    this.container = container;
    this.canvas = canvas;
    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeStart = 0;
  }

  // --- Screen shake ---

  shake(intensity = 5, duration = 200) {
    // Solo reemplazar si es mas fuerte que el actual
    const elapsed = performance.now() - this.shakeStart;
    const currentDecay =
      elapsed < this.shakeDuration
        ? (1 - elapsed / this.shakeDuration) * this.shakeIntensity
        : 0;
    if (intensity > currentDecay) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
      this.shakeStart = performance.now();
      if (!this._shaking) this._animateShake();
    }
  }

  _animateShake() {
    this._shaking = true;
    const elapsed = performance.now() - this.shakeStart;
    if (elapsed > this.shakeDuration) {
      this.container.style.transform = '';
      this._shaking = false;
      return;
    }

    const progress = elapsed / this.shakeDuration;
    const decay = 1 - progress;
    const x = Math.floor((Math.random() - 0.5) * 2 * this.shakeIntensity * decay);
    const y = Math.floor((Math.random() - 0.5) * 2 * this.shakeIntensity * decay);
    this.container.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(() => this._animateShake());
  }

  // --- Particulas ---

  spawnParticles(x, y, count, color, opts = {}) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;
    const screenX = canvasRect.left + x * scaleX;
    const screenY = canvasRect.top + y * scaleY;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = opts.size || (3 + Math.random() * 4);
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = color;
      p.style.boxShadow = `0 0 ${size * 2}px ${color}`;
      p.style.left = screenX + 'px';
      p.style.top = screenY + 'px';

      document.body.appendChild(p);

      const angle =
        opts.angle != null
          ? opts.angle + (Math.random() - 0.5) * (opts.spread || 1)
          : Math.random() * Math.PI * 2;
      const speed = opts.speed || 80 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = opts.life || 400 + Math.random() * 400;

      this.particles.push({
        el: p,
        x: screenX, y: screenY,
        vx, vy,
        life, maxLife: life,
        born: performance.now(),
      });
    }

    if (!this._particleLoopRunning) {
      this._particleLoopRunning = true;
      this._animateParticles();
    }
  }

  // Arcos electricos a lo largo de un segmento
  spawnElectricArc(x1, y1, x2, y2, color = CONFIG.COLORS.ACCENT_CYAN, intensity = 1) {
    const steps = Math.floor(4 * intensity);
    const count = Math.ceil(2 * intensity);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = lerp(x1, x2, t) + (Math.random() - 0.5) * 20;
      const py = lerp(y1, y2, t) + (Math.random() - 0.5) * 20;
      this.spawnParticles(px, py, count, color, {
        size: 2 + Math.random() * 3 * intensity,
        speed: 30 + Math.random() * 50 * intensity,
        life: 200 + Math.random() * 200,
      });
    }
  }

  // Explosion radial en un nodo
  spawnNodeBurst(x, y, color, count = 12) {
    this.spawnParticles(x, y, count, color, {
      speed: 60 + Math.random() * 80,
      life: 300 + Math.random() * 300,
      size: 3 + Math.random() * 4,
    });
  }

  // Explosion al puntuar
  spawnScoreExplosion(x, y, success) {
    const color = success ? CONFIG.COLORS.ACCENT_GREEN : CONFIG.COLORS.ACCENT_RED;
    this.spawnParticles(x, y, 24, color, {
      speed: 100 + Math.random() * 150,
      life: 500 + Math.random() * 400,
      size: 3 + Math.random() * 5,
    });
    this.spawnParticles(x, y, 8, '#ffffff', {
      speed: 150 + Math.random() * 100,
      life: 300,
      size: 2,
    });
  }

  // Victoria de ronda — cascada de oleadas
  spawnVictoryExplosion(x, y) {
    this.spawnParticles(x, y, 30, CONFIG.COLORS.ACCENT_GREEN, {
      speed: 120 + Math.random() * 200,
      life: 700 + Math.random() * 500,
      size: 4 + Math.random() * 5,
    });
    setTimeout(() => {
      this.spawnParticles(x, y, 20, CONFIG.COLORS.ACCENT_YELLOW, {
        speed: 80 + Math.random() * 150,
        life: 600 + Math.random() * 400,
        size: 3 + Math.random() * 4,
      });
    }, 100);
    setTimeout(() => {
      this.spawnParticles(x, y, 15, '#ffffff', {
        speed: 180 + Math.random() * 120,
        life: 400,
        size: 2 + Math.random() * 3,
      });
    }, 200);
    setTimeout(() => this.spawnConfetti(), 150);
  }

  // Confeti — particulas de colores cayendo por toda la pantalla
  spawnConfetti(count = 40) {
    const colors = ['#00e5ff', '#39ff14', '#ffd700', '#ff3a3a', '#bf40ff', '#ffffff'];
    const w = this.canvas.getBoundingClientRect().width;
    const top = this.canvas.getBoundingClientRect().top;
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const sx = Math.random() * w + this.canvas.getBoundingClientRect().left;
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 3 + Math.random() * 5;
      p.style.width = size + 'px';
      p.style.height = size * (0.5 + Math.random()) + 'px';
      p.style.background = color;
      p.style.left = sx + 'px';
      p.style.top = (top - 20) + 'px';
      document.body.appendChild(p);

      const vx = (Math.random() - 0.5) * 60;
      const vy = 40 + Math.random() * 80;
      const life = 1500 + Math.random() * 1000;

      this.particles.push({
        el: p,
        x: sx, y: top - 20,
        vx, vy,
        life, maxLife: life,
        born: performance.now(),
        noGravity: true,
        spin: (Math.random() - 0.5) * 10,
      });
    }
    if (!this._particleLoopRunning) {
      this._particleLoopRunning = true;
      this._animateParticles();
    }
  }

  // Game over — particulas rojas en oleadas
  spawnGameOverEffect() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const cx = 400;
        const cy = 280;
        this.spawnParticles(cx, cy, 15, CONFIG.COLORS.ACCENT_RED, {
          speed: 40 + Math.random() * 80,
          life: 800 + Math.random() * 600,
          size: 4 + Math.random() * 5,
        });
        this.shake(8 + i * 3, 200);
      }, i * 200);
    }
  }

  // Dado que aterriza — impacto pequeno
  spawnDiceLand(x, y, color) {
    this.spawnParticles(x, y, 4, color, {
      speed: 40 + Math.random() * 30,
      life: 200 + Math.random() * 150,
      size: 2 + Math.random() * 2,
      angle: -Math.PI / 2,
      spread: 1.5,
    });
  }

  // Trail — particulas siguiendo un punto
  spawnTrail(x, y, color, count = 2) {
    this.spawnParticles(x, y, count, color, {
      speed: 15 + Math.random() * 20,
      life: 150 + Math.random() * 100,
      size: 2 + Math.random() * 2,
    });
  }

  _animateParticles() {
    const now = performance.now();
    this.particles = this.particles.filter((p) => {
      const age = now - p.born;
      if (age > p.maxLife) {
        p.el.remove();
        return false;
      }

      const t = age / p.maxLife;
      const dt = 1 / 60;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.noGravity) {
        p.vy += 80 * dt;
      } else {
        // Confeti — movimiento flotante
        p.vx += Math.sin(age * 0.005 + p.x) * 2 * dt;
      }
      p.vx *= 0.98;

      const alpha = Math.max(0, 1 - Math.floor(t * 5) / 5);
      p.el.style.left = Math.floor(p.x / 2) * 2 + 'px';
      p.el.style.top = Math.floor(p.y / 2) * 2 + 'px';
      p.el.style.opacity = alpha;
      if (p.spin) {
        p.el.style.transform = `rotate(${p.spin * age * 0.01}deg)`;
      }
      return true;
    });

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this._animateParticles());
    } else {
      this._particleLoopRunning = false;
    }
  }

  // --- Flash de pantalla ---

  flash(color = '#ffffff', duration = 150, intensity = 0.15) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: ${color}; opacity: ${intensity}; pointer-events: none; z-index: 9999;
            transition: opacity ${duration}ms steps(4);
        `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), duration);
    });
  }

  doubleFlash(color, duration = 200) {
    this.flash(color, duration * 0.6, 0.25);
    setTimeout(() => this.flash(color, duration, 0.12), duration * 0.3);
  }

  // Pulso de pausa — brightness + contrast spike
  freezeFrame(duration = 80) {
    this.container.style.filter = 'brightness(1.5) contrast(1.2)';
    setTimeout(() => {
      this.container.style.filter = '';
    }, duration);
  }
}

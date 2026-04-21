// HUD: ronda, zona, score, vidas, dinero. Tambien gestiona los estados
// visuales de overheat / meltdown cuando el score supera el target.

import { CONFIG } from '../../config/constants.js';
import { clamp, lerp, easeOutCubic } from '../../lib/math.js';

export class HUD {
  constructor() {
    this.els = {
      round: document.getElementById('round-display'),
      zone: document.getElementById('zone-display'),
      score: document.getElementById('score-display'),
      target: document.getElementById('target-display'),
      lives: document.getElementById('lives-display'),
      money: document.getElementById('money-display'),
      btnRoll: document.getElementById('btn-roll'),
      btnConfirm: document.getElementById('btn-confirm'),
      hudCenter: document.getElementById('hud-center'),
    };
    this._overheatAnim = null;
    this._currentTarget = 0;
  }

  update(state) {
    this.els.round.textContent = `Ronda ${state.round}`;

    const zone = CONFIG.ZONES[state.zone] || CONFIG.ZONES[0];
    this.els.zone.textContent = zone.name;
    this.els.zone.style.color = zone.color;

    this.els.target.textContent = state.target;
    this.els.lives.textContent = '♥'.repeat(state.lives);
    this.els.money.textContent = `$${state.money}`;
    this._currentTarget = state.target;
  }

  setScore(value, animate = false) {
    this.els.score.textContent = value;
    this.updateScoreStyle(value);
    if (animate) {
      this.els.score.classList.add('score-pop');
      setTimeout(() => this.els.score.classList.remove('score-pop'), 300);
    }
  }

  // Score en tiempo real durante la animacion de corriente
  setLiveScore(value) {
    this.els.score.textContent = value;
    this.updateScoreStyle(value);
  }

  // Estilo del score segun relacion con el target (HOT / OVERHEAT / MELTDOWN)
  updateScoreStyle(value) {
    const target = this._currentTarget;
    const el = this.els.score;
    const center = this.els.hudCenter;

    el.classList.remove('score-hot', 'score-overheat', 'score-meltdown');
    center.classList.remove('hud-shake', 'hud-overheat');

    if (target <= 0 || value <= 0) {
      el.style.color = '';
      el.style.textShadow = '';
      return;
    }

    const ratio = value / target;

    if (ratio >= 2.0) {
      el.classList.add('score-meltdown');
      center.classList.add('hud-overheat');
    } else if (ratio >= 1.3) {
      el.classList.add('score-overheat');
      center.classList.add('hud-shake');
    } else if (ratio >= 1.0) {
      el.classList.add('score-hot');
    } else if (ratio >= 0.7) {
      el.style.color = CONFIG.COLORS.ACCENT_CYAN;
      el.style.textShadow = `3px 3px 0px #005566`;
    } else {
      el.style.color = CONFIG.COLORS.TEXT_DIM;
      el.style.textShadow = '';
    }
  }

  animateScoreCount(from, to, duration = 800, onTick = null) {
    const start = performance.now();
    let lastValue = from;
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const value = Math.round(lerp(from, to, easeOutCubic(t)));
      this.els.score.textContent = value;
      this.updateScoreStyle(value);

      if (value !== lastValue && onTick) {
        onTick(value);
        lastValue = value;
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        this.els.score.classList.add('score-pop');
        setTimeout(() => this.els.score.classList.remove('score-pop'), 300);
      }
    };
    requestAnimationFrame(tick);
  }

  enableRoll(on) {
    this.els.btnRoll.disabled = !on;
  }

  enableConfirm(on) {
    this.els.btnConfirm.disabled = !on;
  }

  setConfirmText(text) {
    this.els.btnConfirm.textContent = text;
  }

  flashResult(success) {
    const color = success ? CONFIG.COLORS.ACCENT_GREEN : CONFIG.COLORS.ACCENT_RED;
    this.els.score.style.color = color;
    this.els.score.style.textShadow = `0 0 30px ${color}`;
    setTimeout(() => {
      this.els.score.style.color = '';
      this.els.score.style.textShadow = '';
      this.els.score.classList.remove('score-hot', 'score-overheat', 'score-meltdown');
      this.els.hudCenter.classList.remove('hud-shake', 'hud-overheat');
    }, 1000);
  }
}

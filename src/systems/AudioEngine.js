// Audio sintetico via Web Audio API. Todos los efectos se generan al vuelo
// con osciladores — cero archivos de samples.

import { clamp } from '../lib/math.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
  }

  ensure() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // --- Efectos de sonido ---

  playRoll() {
    this.ensure();
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this._tick(150 + Math.random() * 500, 0.07);
        this._tone(80 + Math.random() * 100, 0.03, 'square', 0.04);
      }, i * 50 + Math.random() * 30);
    }
    setTimeout(() => {
      this._tone(200, 0.08, 'triangle', 0.1);
    }, 350);
  }

  playPlace() {
    this.ensure();
    this._tone(600, 0.03, 'square', 0.12);
    this._tone(900, 0.04, 'sine', 0.1, 0.02);
    this._tone(1100, 0.03, 'sine', 0.06, 0.04);
  }

  playRemove() {
    this.ensure();
    this._tone(500, 0.04, 'square', 0.08);
    this._tone(300, 0.05, 'square', 0.06, 0.03);
  }

  playCurrent(progress) {
    this.ensure();
    const freq = 120 + progress * 800;
    this._tone(freq, 0.1, 'sawtooth', 0.05);
    this._tone(freq * 1.5, 0.06, 'sine', 0.03);
  }

  // Tono que sube con el acumulado
  playNodeScore(runningTotal, maxExpected) {
    this.ensure();
    const t = clamp(runningTotal / (maxExpected || 30), 0, 1);
    const freq = 400 + t * 1000;
    this._tone(freq, 0.08, 'sine', 0.12);
    this._tone(freq * 1.5, 0.05, 'sine', 0.06, 0.02);
    this._tick(freq * 0.5, 0.03);
  }

  // Barrido ascendente + acorde al aplicar multiplicador
  playMultApply(mult) {
    this.ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300 * mult, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);

    this._tone(800, 0.1, 'sine', 0.08, 0.1);
    this._tone(1000, 0.1, 'sine', 0.06, 0.13);
  }

  playScoreTick(value, max) {
    this.ensure();
    const t = clamp(value / (max || 1), 0, 1);
    const freq = 300 + t * 900;
    this._tone(freq, 0.025, 'sine', 0.07);
  }

  playSuccess() {
    this.ensure();
    // Fanfarria ascendente
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      this._tone(freq, 0.12, 'sine', 0.1, i * 0.06);
      this._tone(freq * 0.5, 0.15, 'triangle', 0.04, i * 0.06);
    });
    // Acorde final
    setTimeout(() => {
      this._tone(523, 0.4, 'sine', 0.08, 0);
      this._tone(659, 0.4, 'sine', 0.06, 0);
      this._tone(784, 0.4, 'sine', 0.06, 0);
      this._tone(1047, 0.3, 'sine', 0.05, 0);
    }, 400);
  }

  playFail() {
    this.ensure();
    this._tone(350, 0.15, 'square', 0.08);
    this._tone(280, 0.2, 'square', 0.08, 0.1);
    this._tone(200, 0.3, 'sawtooth', 0.06, 0.25);
    this._tone(150, 0.4, 'sawtooth', 0.04, 0.4);
  }

  playShopBuy() {
    this.ensure();
    this._tone(600, 0.04, 'sine', 0.1);
    this._tone(800, 0.04, 'sine', 0.1, 0.04);
    this._tone(1000, 0.04, 'sine', 0.08, 0.08);
  }

  playChestOpen() {
    this.ensure();
    for (let i = 0; i < 8; i++) {
      const freq = 300 + i * 100 + Math.random() * 50;
      this._tone(freq, 0.06, 'sine', 0.06, i * 0.04);
    }
    this._tone(1200, 0.15, 'sine', 0.08, 0.35);
  }

  playRewardReveal() {
    this.ensure();
    this._tone(800, 0.05, 'sine', 0.1);
    this._tone(1200, 0.06, 'sine', 0.08, 0.04);
  }

  playGameOver() {
    this.ensure();
    const notes = [500, 450, 380, 300, 250, 180];
    notes.forEach((freq, i) => {
      this._tone(freq, 0.25, 'sawtooth', 0.07, i * 0.18);
      this._tone(freq * 0.5, 0.3, 'square', 0.03, i * 0.18);
    });
    setTimeout(() => {
      this._tone(60, 0.6, 'sine', 0.1);
      this._tone(80, 0.5, 'square', 0.04);
    }, 1200);
  }

  playLoseLife() {
    this.ensure();
    this._tone(150, 0.15, 'square', 0.12);
    this._tone(80, 0.2, 'sine', 0.08, 0.05);
    this._tick(100, 0.08);
  }

  playReroll() {
    this.ensure();
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this._tick(300 + Math.random() * 300, 0.05);
      }, i * 40);
    }
  }

  playZoneTransition() {
    this.ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
    this._tone(300, 0.4, 'triangle', 0.05, 0.2);
    this._tone(600, 0.3, 'sine', 0.04, 0.35);
  }

  // --- Modales ---

  playModalOpen() {
    this.ensure();
    this._tone(400, 0.04, 'square', 0.08);
    this._tone(600, 0.04, 'square', 0.06, 0.03);
    this._tone(800, 0.05, 'sine', 0.05, 0.06);
  }

  playModalClose() {
    this.ensure();
    this._tone(600, 0.03, 'square', 0.06);
    this._tone(400, 0.04, 'square', 0.05, 0.02);
  }

  playBreakdownTick() {
    this.ensure();
    this._tone(500 + Math.random() * 200, 0.025, 'square', 0.06);
  }

  playBreakdownTotal(success) {
    this.ensure();
    if (success) {
      this._tone(700, 0.06, 'sine', 0.1);
      this._tone(900, 0.06, 'sine', 0.08, 0.04);
      this._tone(1100, 0.08, 'sine', 0.06, 0.08);
    } else {
      this._tone(400, 0.08, 'square', 0.08);
      this._tone(300, 0.1, 'square', 0.06, 0.05);
    }
  }

  // --- Primitivas ---

  _tone(freq, duration, type = 'sine', volume = 0.1, delay = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  _tick(freq, duration) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + duration);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }
}

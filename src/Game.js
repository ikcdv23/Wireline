// del jugador y el bucle de rondas (idle → rolling → placing → scoring → shop).

import { CONFIG } from './config/constants.js';
import { Board } from './entities/Board.js';
import { DiceManager } from './entities/DiceManager.js';
import { ComponentManager } from './entities/ComponentManager.js';
import { ScoringEngine } from './systems/ScoringEngine.js';
import { Renderer } from './systems/Renderer.js';
import { InputHandler } from './systems/InputHandler.js';
import { AudioEngine } from './systems/AudioEngine.js';
import { JuiceEngine } from './systems/JuiceEngine.js';
import { HUD } from './screens/ui/HUD.js';
import { Modal } from './screens/ui/Modal.js';
import { Shop } from './screens/ui/Shop.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { PauseScreen } from './screens/PauseScreen.js';
import { startMenuMusic } from './systems/MenuMusic.js';

const ZONE_PATTERNS = ['prototipo', 'produccion', 'sobrecarga', 'singularidad'];

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('board-canvas');
    this.diceTray = document.getElementById('dice-tray');

    // Sistemas
    this.board = new Board(ZONE_PATTERNS[0]);
    this.diceManager = new DiceManager();
    this.renderer = new Renderer(this.canvas);
    this.scoring = new ScoringEngine();
    this.hud = new HUD();
    this.componentManager = new ComponentManager();
    this.shop = new Shop(this.componentManager);
    this.audio = new AudioEngine();
    this.juice = new JuiceEngine(this.container, this.canvas);

    this.renderer.juice = this.juice;
    this.renderer.audio = this.audio;

    // Estado del jugador
    this.state = {
      lives: CONFIG.PLAYER.START_LIVES,
      money: CONFIG.PLAYER.START_MONEY,
      round: 1,
      zone: 0,
      zoneRound: 1,
      target: 0,
      totalScore: 0,
      phase: 'idle',
    };

    this.roundScore = 0;

    // Input
    this.input = new InputHandler(
      this.canvas,
      this.board,
      this.diceManager,
      (die, node) => this.onDiePlaced(die, node),
      (die, node) => this.onDieRemoved(die, node),
    );

    // Pantallas modales (game over / victoria / pausa)
    this.gameOverScreen = new GameOverScreen({
      onBackToMenu: () => this.goToMenu(),
      audio: this.audio,
    });
    this.pauseScreen = new PauseScreen({
      onResume: () => this.resume(),
      onQuit: () => this.quitToMenu(),
      audio: this.audio,
    });

    // Botones
    this.hud.els.btnRoll.addEventListener('click', () => this.rollDice());
    this.hud.els.btnConfirm.addEventListener('click', () => this.activateCircuit());
    document.getElementById('btn-pause').addEventListener('click', () => this.pause());

    this.paused = false;
    this.renderLoop = this.renderLoop.bind(this);

    // ESC para pausar/continuar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
  }

  start() {
    this.container.classList.remove('hidden');
    this.renderer.resize();

    this.state.target = this.scoring.getTarget(this.state.round);
    this.state.phase = 'idle';
    this.roundScore = 0;
    this.paused = false;
    this.hud.update(this.state);
    this.hud.setScore(0);
    this.hud.enableRoll(true);
    this.hud.enableConfirm(false);
    requestAnimationFrame(this.renderLoop);
  }

  // --- Pausa ---

  pause() {
    if (this.state.phase === 'gameover' || this.state.phase === 'shop') return;
    if (this.paused) return;

    this.paused = true;
    this.input.disable();

    const zone = CONFIG.ZONES[this.state.zone] || CONFIG.ZONES[0];
    this.pauseScreen.mount({
      zone: zone.name,
      round: this.state.round,
      lives: this.state.lives,
      money: this.state.money,
    });
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;

    this.pauseScreen.unmount(() => {
      if (this.state.phase === 'placing') {
        this.input.enable();
      }
    });
  }

  quitToMenu() {
    this.paused = false;
    this.pauseScreen.unmount(() => this.goToMenu());
  }

  goToMenu() {
    // Cerrar la pantalla de game over si estaba abierta
    this.gameOverScreen.unmount();

    // Resetear estado
    this.board = new Board(ZONE_PATTERNS[0]);
    this.diceManager.fullReset();
    this.input.board = this.board;
    this.input.disable();
    this.state = {
      lives: CONFIG.PLAYER.START_LIVES,
      money: CONFIG.PLAYER.START_MONEY,
      round: 1,
      zone: 0,
      zoneRound: 1,
      target: 0,
      totalScore: 0,
      phase: 'idle',
    };
    this.roundScore = 0;
    this.diceTray.innerHTML = '';
    this.hud.setScore(0);

    setTimeout(() => {
      const menu = document.getElementById('mainmenu-overlay');
      menu.classList.remove('hidden');
      menu.offsetHeight;
      menu.classList.add('visible');
      startMenuMusic();
    }, 300);
  }

  renderLoop() {
    if (this.state.phase !== 'scoring') {
      this.renderer.drawBoard(this.board);
    }
    requestAnimationFrame(this.renderLoop);
  }

  // --- Tirar dados ---

  rollDice() {
    if (this.state.phase !== 'idle') return;

    this.audio.init();
    this.state.phase = 'rolling';
    this.board.clearAllDice();

    this.diceManager.roll();
    this.diceManager.renderTray(this.diceTray);
    this.audio.playRoll();
    this.juice.shake(3, 200);

    // Dados aparecen con bounce escalonado + particulas de impacto
    const dieEls = this.diceTray.querySelectorAll('.die');
    dieEls.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-30px) scale(0.3)';
      setTimeout(() => {
        el.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scale(1)';
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2 - this.canvas.getBoundingClientRect().left;
        const cy = rect.top + rect.height / 2 - this.canvas.getBoundingClientRect().top;
        this.juice.spawnDiceLand(cx, cy + 240, el.style.color || CONFIG.COLORS.ACCENT_CYAN);
        this.juice.shake(1, 50);
      }, i * 100 + 50);
    });

    setTimeout(() => {
      this.state.phase = 'placing';
      this.input.enable();
      this.hud.enableRoll(false);
      this.hud.enableConfirm(true);
      this.hud.setConfirmText('ACTIVAR CIRCUITO');
      this.renderer.showPreview = true;
      this.updateRoutePreview();
    }, dieEls.length * 100 + 150);
  }

  rerollRemaining() {
    this.board.clearAllDice();

    const remaining = this.diceManager.getUnplacedDice();
    if (remaining.length === 0) return;

    this.diceManager.reroll(remaining.map((d) => d.id));
    this.diceManager.renderTray(this.diceTray);
    this.audio.playReroll();
    this.juice.shake(2, 150);

    const dieEls = this.diceTray.querySelectorAll('.die');
    dieEls.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-20px) scale(0.5)';
      setTimeout(() => {
        el.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scale(1)';
      }, i * 80);
    });

    this.state.phase = 'placing';
    this.input.enable();
    this.hud.enableRoll(false);
    this.hud.enableConfirm(true);
    this.hud.setConfirmText('ACTIVAR CIRCUITO');
    this.renderer.showPreview = true;
    this.updateRoutePreview();
  }

  updateRoutePreview() {
    const result = this.scoring.previewBestRoute(this.board);
    this.renderer.previewResult = result;
  }

  // --- Colocar / quitar dados ---

  onDiePlaced(die, node) {
    this.diceManager.renderTray(this.diceTray);
    this.audio.playPlace();
    this.juice.spawnNodeBurst(node.x, node.y, die.color || CONFIG.COLORS.ACCENT_CYAN, 8);
    this.juice.shake(2, 60);
    this.juice.freezeFrame(40);
    this.updateRoutePreview();
  }

  onDieRemoved(die, node) {
    this.diceManager.renderTray(this.diceTray);
    this.audio.playRemove();
    this.updateRoutePreview();
  }

  // --- Activar circuito ---

  activateCircuit() {
    if (this.state.phase !== 'placing') return;
    if (!this.board.hasAnyDicePlaced()) return;

    this.state.phase = 'scoring';
    this.input.disable();
    this.hud.enableConfirm(false);
    this.renderer.showPreview = false;
    this.renderer.previewResult = null;

    // Freeze frame al activar — momento de anticipacion
    this.juice.freezeFrame(100);
    this.juice.flash(CONFIG.COLORS.ACCENT_CYAN, 80, 0.08);

    const result = this.scoring.scoreBestRoute(this.board);

    if (result.route.length === 0) {
      this.resolveActivation(0);
      return;
    }

    // Animar corriente con scoring en vivo — HUD actualizado en tiempo real
    const baseRoundScore = this.roundScore;
    this.renderer.animateRoute(
      this.board,
      result.route,
      result,
      () => {
        const output = this.board.getOutputNode();

        // Mult al final
        if (result.mult > CONFIG.SCORING.BASE_MULT) {
          this.audio.playMultApply(result.mult);
          this.juice.doubleFlash(CONFIG.COLORS.ACCENT_YELLOW, 200);
          this.juice.shake(6, 200);
          this.juice.freezeFrame(60);
        }

        // Breakdown con animacion y sonido por fila
        this.showScoreBreakdown(result);
        Modal.showBreakdown(this.audio);

        // Conteo en HUD
        const prevScore = this.roundScore;
        const newScore = this.roundScore + result.total;

        this.hud.animateScoreCount(prevScore, newScore, 600, (val) => {
          this.audio.playScoreTick(val - prevScore, result.total);
        });

        setTimeout(() => {
          Modal.hideBreakdown();
          this.resolveActivation(result.total);
        }, 1800);
      },
      (liveScore) => {
        // Callback del renderer: score en tiempo real durante la corriente
        const totalLive = baseRoundScore + liveScore;
        this.hud.setLiveScore(totalLive);

        // Particulas de calor si sobrepasa el target
        if (totalLive > this.state.target * 1.5) {
          this.juice.spawnParticles(400, 30, 2, CONFIG.COLORS.ACCENT_RED, {
            speed: 20 + Math.random() * 40,
            life: 300 + Math.random() * 200,
            size: 2 + Math.random() * 3,
            angle: Math.PI / 2,
            spread: 1.5,
          });
        }
        if (totalLive > this.state.target * 2) {
          const colors = ['#ff3a3a', '#ff8800', '#ffd700', '#ffffff'];
          const c = colors[Math.floor(Math.random() * colors.length)];
          this.juice.spawnParticles(400, 30, 3, c, {
            speed: 30 + Math.random() * 60,
            life: 400 + Math.random() * 300,
            size: 3 + Math.random() * 4,
            angle: Math.PI / 2,
            spread: 2,
          });
        }
      },
    );
  }

  // --- Resolver activacion ---

  resolveActivation(score) {
    this.roundScore += score;

    const reachedTarget = this.roundScore >= this.state.target;
    const output = this.board.getOutputNode();
    const remaining = this.diceManager.getUnplacedDice();

    if (reachedTarget) {
      // === Ronda ganada ===
      this.audio.playSuccess();
      this.hud.flashResult(true);
      this.state.totalScore += this.roundScore;

      this.juice.spawnVictoryExplosion(output.x, output.y);
      this.juice.shake(10, 400);
      this.juice.doubleFlash(CONFIG.COLORS.ACCENT_GREEN, 300);
      this.juice.freezeFrame(120);

      // Dados sobrantes = dinero (con efecto por dado)
      if (remaining.length > 0) {
        const totalBonus = remaining.reduce((sum, d) => sum + d.value, 0);
        remaining.forEach((d, i) => {
          setTimeout(() => {
            this.renderer.addFloatingText(
              400 - 40 + i * 20, 490,
              `+$${d.value}`,
              CONFIG.COLORS.ACCENT_YELLOW,
            );
            this.audio.playScoreTick(i, remaining.length);
          }, 300 + i * 150);
        });
        setTimeout(() => {
          this.state.money += totalBonus;
          this.hud.update(this.state);
        }, 300 + remaining.length * 150);
      }

      this.runEndOfRound();
      setTimeout(() => this.advanceRound(), 1200 + remaining.length * 150);
    } else if (remaining.length > 0) {
      // === Quedan dados — siguiente tiro ===
      this.juice.shake(4, 120);
      this.juice.flash(CONFIG.COLORS.ACCENT_YELLOW, 100, 0.08);

      this.renderer.addFloatingText(
        400, 260,
        `${this.roundScore}/${this.state.target}`,
        CONFIG.COLORS.ACCENT_YELLOW,
      );
      this.renderer.addFloatingText(
        400, 290,
        `${remaining.length} DADOS`,
        CONFIG.COLORS.TEXT_DIM,
      );

      setTimeout(() => this.rerollRemaining(), 1200);
    } else {
      // === Sin dados — pierdes vida ===
      this.audio.playLoseLife();
      this.hud.flashResult(false);

      this.juice.spawnScoreExplosion(output.x, output.y, false);
      this.juice.shake(12, 500);
      this.juice.doubleFlash(CONFIG.COLORS.ACCENT_RED, 300);
      this.juice.freezeFrame(150);

      this.renderer.addFloatingText(
        400, 260,
        `${this.roundScore}/${this.state.target}`,
        CONFIG.COLORS.ACCENT_RED,
      );
      this.renderer.addFloatingText(400, 290, 'SIN DADOS', CONFIG.COLORS.ACCENT_RED);

      this.state.lives--;

      // Consolacion: $1 por cada nodo con dado que la corriente toco
      const nodesWithDice = this.board.nodes.filter((n) => n.dieValue !== null).length;
      if (nodesWithDice > 0) {
        this.state.money += nodesWithDice;
        this.renderer.addFloatingText(
          400, 320,
          `+$${nodesWithDice} (nodos)`,
          CONFIG.COLORS.ACCENT_YELLOW,
        );
      }

      this.hud.update(this.state);

      this.runEndOfRound();

      if (this.state.lives <= 0) {
        setTimeout(() => this.gameOver(), 1200);
      } else {
        this.renderer.addFloatingText(400, 320, 'REINTENTAR RONDA', CONFIG.COLORS.TEXT_DIM);
        setTimeout(() => this.retryRound(), 1200);
      }
    }
  }

  runEndOfRound() {
    for (const node of this.board.nodes) {
      if (node.component && node.component.onRoundEnd) {
        node.component.onRoundEnd(node);
      }
      if (
        node.component &&
        node.component.usesLeft !== undefined &&
        node.component.usesLeft <= 0
      ) {
        node.component = null;
      }
    }
  }

  // --- Avanzar ronda ---

  advanceRound() {
    this.state.zoneRound++;

    const zone = CONFIG.ZONES[this.state.zone];
    if (this.state.zoneRound > zone.rounds) {
      this.state.zone++;
      this.state.zoneRound = 1;

      if (this.state.zone >= CONFIG.ZONES.length) {
        this.victory();
        return;
      }

      this.audio.playZoneTransition();
      this.juice.doubleFlash(CONFIG.ZONES[this.state.zone].color, 400);
      this.juice.shake(8, 400);
      this.juice.spawnConfetti(25);

      const savedComponents = [];
      for (const node of this.board.nodes) {
        if (node.component) savedComponents.push(node.component);
      }

      const newPattern = ZONE_PATTERNS[this.state.zone];
      this.board = new Board(newPattern);
      this.input.board = this.board;

      const freeNodes = this.board.getNormalNodes().filter((n) => !n.component);
      savedComponents.forEach((comp, i) => {
        if (freeNodes[i]) freeNodes[i].component = comp;
      });
    }

    this.state.round++;
    this.state.target = this.scoring.getTarget(this.state.round);

    const showShop = true;

    if (showShop) {
      this.state.phase = 'shop';
      this.hud.update(this.state);
      this.shop.open(
        this.state,
        this.board,
        this.renderer,
        this.audio,
        this.juice,
        this.diceManager,
        () => {
          this.startNewRound();
        },
      );
    } else {
      this.startNewRound();
    }
  }

  retryRound() {
    this.board.clearAllDice();
    this.diceManager.reset();
    this.diceTray.innerHTML = '';
    this.roundScore = 0;
    this.state.phase = 'idle';
    this.hud.update(this.state);
    this.hud.setScore(0);
    this.hud.enableRoll(true);
    this.hud.enableConfirm(false);
  }

  startNewRound() {
    this.board.clearAllDice();
    this.diceManager.reset();
    this.diceTray.innerHTML = '';
    this.roundScore = 0;
    this.state.phase = 'idle';
    this.hud.update(this.state);
    this.hud.setScore(0);
    this.hud.enableRoll(true);
    this.hud.enableConfirm(false);
  }

  // --- Game over / victoria ---

  gameOver() {
    this.state.phase = 'gameover';
    this.audio.playGameOver();
    this.juice.spawnGameOverEffect();
    this.juice.shake(15, 800);
    this.juice.doubleFlash(CONFIG.COLORS.ACCENT_RED, 500);

    setTimeout(() => {
      this.gameOverScreen.mount({
        round: this.state.round,
        score: this.state.totalScore,
      });
    }, 1200);
  }

  // --- Score breakdown ---

  showScoreBreakdown(result) {
    const panel = document.getElementById('score-breakdown');
    let html = '<div class="breakdown-title">DESGLOSE</div>';

    for (const detail of result.details) {
      const node = this.board.getNode(detail.nodeId);
      const comp = node ? node.component : null;
      let label = `NODO ${detail.nodeId}`;
      if (comp) {
        label += ` [${comp.name}]`;
      }
      html += `<div class="breakdown-row">
                <span class="br-label">${label}</span>
                <span class="br-value">+${detail.value}</span>
            </div>`;
    }

    html += `<div class="breakdown-row">
            <span class="br-label">BASE</span>
            <span class="br-value">${result.baseScore}</span>
        </div>`;

    html += `<div class="breakdown-row br-mult">
            <span class="br-label">MULT</span>
            <span class="br-value">x${result.mult}</span>
        </div>`;

    const isGood = this.roundScore + result.total >= this.state.target;
    html += `<div class="breakdown-row br-total">
            <span class="br-label">TOTAL</span>
            <span class="br-value ${isGood ? 'good' : 'bad'}">${result.total}</span>
        </div>`;

    if (this.roundScore > 0) {
      const accumulated = this.roundScore + result.total;
      html += `<div class="breakdown-row">
                <span class="br-label">RONDA</span>
                <span class="br-value">${this.roundScore} + ${result.total} = ${accumulated}</span>
            </div>`;
    }

    panel.innerHTML = html;
    panel.classList.remove('hidden');
  }

  hideScoreBreakdown() {
    Modal.hideBreakdown();
  }

  victory() {
    this.state.phase = 'gameover';
    this.audio.playSuccess();
    this.juice.spawnVictoryExplosion(400, 280);
    this.juice.shake(12, 600);
    this.juice.doubleFlash(CONFIG.COLORS.ACCENT_YELLOW, 500);

    // Confeti en oleadas
    setTimeout(() => this.juice.spawnConfetti(50), 300);
    setTimeout(() => this.juice.spawnConfetti(30), 800);
    setTimeout(() => this.juice.spawnConfetti(20), 1300);

    setTimeout(() => {
      this.gameOverScreen.mount({
        round: this.state.round,
        score: this.state.totalScore,
        title: '★ SINGULARIDAD ALCANZADA ★',
        victory: true,
      });
    }, 1500);
  }
}

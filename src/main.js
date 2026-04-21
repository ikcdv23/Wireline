// Entry point del juego.
// Inicializa el splash, el menu principal y arranca la partida al pulsar
// "Nueva partida". Todo lo que esta dentro de la partida vive en Game.

import { Game } from './Game.js';
import { startMenuMusic, stopMenuMusic } from './systems/MenuMusic.js';

const game = new Game();

// --- Splash screen ---
(function initSplash() {
  const splash = document.getElementById('splash-overlay');

  function onInteract() {
    splash.removeEventListener('click', onInteract);
    document.removeEventListener('keydown', onKeyInteract);

    // Desbloquear audio y arrancar musica
    game.audio.init();
    startMenuMusic();

    // Fade out splash
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.classList.add('done');
      const menu = document.getElementById('mainmenu-overlay');
      menu.classList.remove('hidden');
      menu.offsetHeight;
      menu.classList.add('visible');
      initMenu();
    }, 600);
  }

  function onKeyInteract() {
    onInteract();
  }

  splash.addEventListener('click', onInteract);
  document.addEventListener('keydown', onKeyInteract);
})();

// --- Menu principal ---
function initMenu() {
  const menuOverlay = document.getElementById('mainmenu-overlay');
  const btnStart = document.getElementById('btn-start');

  btnStart.addEventListener('click', () => {
    game.audio.ensure();
    game.audio._tone(200, 0.08, 'square', 0.06);
    game.audio._tone(400, 0.1, 'sine', 0.08, 0.05);
    game.audio._tone(600, 0.1, 'sine', 0.08, 0.1);
    game.audio._tone(900, 0.12, 'sine', 0.1, 0.16);
    game.audio._tone(1200, 0.18, 'sine', 0.1, 0.24);

    stopMenuMusic();

    menuOverlay.classList.remove('visible');
    setTimeout(() => {
      menuOverlay.classList.add('hidden');
      game.start();
    }, 280);
  });

  // Glow pulsante del titulo
  const titleGlow = document.getElementById('menu-title-glow');
  if (titleGlow) {
    let pulseDir = 1;
    let pulseVal = 0;
    function pulseTick() {
      pulseVal += pulseDir * 0.025;
      if (pulseVal >= 1) { pulseVal = 1; pulseDir = -1; }
      if (pulseVal <= 0) { pulseVal = 0; pulseDir = 1; }
      titleGlow.style.opacity = pulseVal.toFixed(2);
      requestAnimationFrame(pulseTick);
    }
    requestAnimationFrame(pulseTick);
  }
}

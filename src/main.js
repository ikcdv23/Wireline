// Entry point del juego.
// Orquesta splash + menu. Dentro de la partida, todo vive en Game.

import { Game } from './Game.js';
import { startMenuMusic, stopMenuMusic } from './systems/MenuMusic.js';
import { SplashScreen } from './screens/SplashScreen.js';
import { MenuScreen } from './screens/MenuScreen.js';

const game = new Game();

const menu = new MenuScreen({
  onStart: () => {
    // Jingle del boton "Nueva partida"
    game.audio.ensure();
    game.audio._tone(200, 0.08, 'square', 0.06);
    game.audio._tone(400, 0.1, 'sine', 0.08, 0.05);
    game.audio._tone(600, 0.1, 'sine', 0.08, 0.1);
    game.audio._tone(900, 0.12, 'sine', 0.1, 0.16);
    game.audio._tone(1200, 0.18, 'sine', 0.1, 0.24);

    stopMenuMusic();
    menu.unmount();

    setTimeout(() => game.start(), 280);
  },
  onTutorial: () => {
    console.log('Tutorial pendiente de implementar');
  },
});

const splash = new SplashScreen({
  onDone: () => {
    game.audio.init();
    startMenuMusic();
    splash.unmount();

    setTimeout(() => menu.mount(), 600);
  },
});
splash.mount();

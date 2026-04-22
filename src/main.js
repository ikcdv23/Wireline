import {Game} from './Game.js';
import {startMenuMusic, stopMenuMusic} from './systems/MenuMusic.js';
import {SplashScreen} from './screens/SplashScreen.js';
import {MenuScreen} from './screens/MenuScreen.js';
import {ScreenManager} from './screens/ScreenManager.js';

const game = new Game ();
const manager = new ScreenManager ();

const menu = new MenuScreen ({
  onStart: () => {
    game.audio.ensure ();
    game.audio._tone (200, 0.08, 'square', 0.06);
    game.audio._tone (400, 0.1, 'sine', 0.08, 0.05);
    game.audio._tone (600, 0.1, 'sine', 0.08, 0.1);
    game.audio._tone (900, 0.12, 'sine', 0.1, 0.16);
    game.audio._tone (1200, 0.18, 'sine', 0.1, 0.24);

    stopMenuMusic ();
    menu.unmount ();

    setTimeout (() => game.start (), 480);
  },
  onTutorial: () => {
    console.log ('Tutorial pendiente de implementar');
  },
});

const splash = new SplashScreen ({
  onDone: () => {
    game.audio.init ();
    startMenuMusic ();
    manager.show (menu);
  },
});

manager.show (splash);

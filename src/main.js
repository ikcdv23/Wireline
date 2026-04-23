import {Game} from './Game.js';
import {startMenuMusic, stopMenuMusic} from './systems/MenuMusic.js';
import {SplashScreen} from './screens/SplashScreen.js';
import {MenuScreen} from './screens/MenuScreen.js';
import {ChangelogScreen} from './screens/ChangelogScreen.js';
import {TutorialScreen} from './screens/TutorialScreen.js';
import {ScreenManager} from './screens/ScreenManager.js';

const game = new Game ();
const manager = new ScreenManager ();

const changelog = new ChangelogScreen ({
  onClose: () => changelog.unmount (),
  audio: game.audio,
});

const tutorial = new TutorialScreen ({
  onFinish: () => tutorial.unmount (),
  onSkip: () => {
    tutorial.unmount ();
    game.goToMenu ();
    setTimeout (() => {
      startMenuMusic ();
      manager.show (menu);
    }, 300);
  },
  audio: game.audio,
});

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
    game.audio.ensure ();
    stopMenuMusic ();
    menu.unmount ();

    setTimeout (() => {
      game.start ();
      tutorial.mount ();
    }, 480);
  },
  onChangelog: () => changelog.mount (),
});

const splash = new SplashScreen ({
  onDone: () => {
    game.audio.init ();
    startMenuMusic ();
    manager.show (menu);
  },
});

manager.show (splash);

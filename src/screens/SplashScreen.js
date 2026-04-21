
export class SplashScreen {
  constructor ({ onDone }) {
    this.onDone = onDone;
    this.splash = document.getElementById('splash-overlay');

    this.onClick = this.onClick.bind(this);
    this.onKey = this.onKey.bind(this);
  }

  mount () {
    this.splash.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKey);
  }

  unmount () {
    this.splash.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKey);

    this.splash.classList.add('fade-out');
    setTimeout(() => this.splash.classList.add('done'), 600);
  }

  onClick () {
    this.onDone();
  }

  onKey () {
    this.onDone();
  }
}

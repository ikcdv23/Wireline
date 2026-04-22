export class MenuScreen {
  constructor ({onStart, onTutorial, onChangelog}) {
    this.onStart = onStart;
    this.onTutorial = onTutorial;
    this.onChangelog = onChangelog;

    this.overlay = document.getElementById ('mainmenu-overlay');
    this.btnStart = document.getElementById ('btn-start');
    this.btnTutorial = document.getElementById ('btn-tutorial');
    this.btnChangelog = document.getElementById ('btn-changelog');

    this.onClickStart = this.onClickStart.bind (this);
    this.onClickTutorial = this.onClickTutorial.bind (this);
    this.onClickChangelog = this.onClickChangelog.bind (this);

    this.pulseRaf = null;
  }

  mount () {
    this.overlay.classList.remove ('hidden');
    this.overlay.offsetHeight;
    this.overlay.classList.add ('visible');

    this.btnStart.addEventListener ('click', this.onClickStart);
    this.btnTutorial.addEventListener ('click', this.onClickTutorial);
    this.btnChangelog.addEventListener ('click', this.onClickChangelog);
    this.startGlow ();
  }

  unmount () {
    this.btnStart.removeEventListener ('click', this.onClickStart);
    this.btnTutorial.removeEventListener ('click', this.onClickTutorial);
    this.btnChangelog.removeEventListener ('click', this.onClickChangelog);
    this.stopGlow ();

    this.overlay.classList.remove ('visible');
    setTimeout (() => this.overlay.classList.add ('hidden'), 280);
  }

  onClickStart () {
    this.onStart ();
  }

  onClickTutorial () {
    this.onTutorial ();
  }

  onClickChangelog () {
    this.onChangelog ();
  }

  startGlow () {
    const titleGlow = document.getElementById ('menu-title-glow');
    if (!titleGlow) return;
    let dir = 1;
    let val = 0;
    const tick = () => {
      val += dir * 0.025;
      if (val >= 1) {
        val = 1;
        dir = -1;
      }
      if (val <= 0) {
        val = 0;
        dir = 1;
      }
      titleGlow.style.opacity = val.toFixed (2);
      this.pulseRaf = requestAnimationFrame (tick);
    };
    this.pulseRaf = requestAnimationFrame (tick);
  }

  stopGlow () {
    if (this.pulseRaf !== null) {
      cancelAnimationFrame (this.pulseRaf);
      this.pulseRaf = null;
    }
  }
}

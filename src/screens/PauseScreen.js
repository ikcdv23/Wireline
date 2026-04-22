export class PauseScreen {
  constructor ({onResume, onQuit, audio}) {
    this.onResume = onResume;
    this.onQuit = onQuit;
    this.audio = audio;

    this.overlay = document.getElementById ('pause-overlay');
    this.info = document.getElementById ('pause-info');
    this.btnResume = document.getElementById ('btn-resume');
    this.btnQuit = document.getElementById ('btn-quit');

    this.onClickResume = this.onClickResume.bind (this);
    this.onClickQuit = this.onClickQuit.bind (this);
  }

  mount ({zone, round, lives, money} = {}) {
    this.info.innerHTML = `ZONA: ${zone} &nbsp;■&nbsp; RONDA: ${round}<br>VIDAS: ${'♥'.repeat (lives)} &nbsp;■&nbsp; $${money}`;

    this.overlay.classList.remove ('hidden');
    this.overlay.offsetHeight;
    this.overlay.classList.add ('visible');

    if (this.audio) this.audio.playModalOpen ();

    this.btnResume.addEventListener ('click', this.onClickResume);
    this.btnQuit.addEventListener ('click', this.onClickQuit);
  }

  unmount (afterClose) {
    this.btnResume.removeEventListener ('click', this.onClickResume);
    this.btnQuit.removeEventListener ('click', this.onClickQuit);

    if (this.audio) this.audio.playModalClose ();

    this.overlay.classList.remove ('visible');
    setTimeout (() => {
      this.overlay.classList.add ('hidden');
      if (afterClose) afterClose ();
    }, 250);
  }

  onClickResume () {
    this.onResume ();
  }

  onClickQuit () {
    this.onQuit ();
  }
}

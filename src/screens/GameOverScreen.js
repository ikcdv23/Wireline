export class GameOverScreen {
  constructor ({onBackToMenu, audio}) {
    this.onBackToMenu = onBackToMenu;
    this.audio = audio;

    this.overlay = document.getElementById ('gameover-overlay');
    this.panel = document.getElementById ('gameover-panel');
    this.panelTitle = this.panel.querySelector ('h2');
    this.btnRestart = document.getElementById ('btn-restart');
    this.finalRound = document.getElementById ('final-round');
    this.finalScore = document.getElementById ('final-score');

    this.onClickBack = this.onClickBack.bind (this);
  }

  mount ({round, score, title = 'CORTOCIRCUITO', victory = false} = {}) {
    this.panelTitle.textContent = title;
    this.panel.classList.toggle ('victory', victory);
    this.finalRound.textContent = round;
    this.finalScore.textContent = score;

    this.overlay.classList.remove ('hidden');
    this.overlay.offsetHeight;
    this.overlay.classList.add ('visible');

    if (this.audio) this.audio.playModalOpen ();

    this.btnRestart.addEventListener ('click', this.onClickBack);
  }

  unmount () {
    this.btnRestart.removeEventListener ('click', this.onClickBack);

    if (this.audio) this.audio.playModalClose ();

    this.overlay.classList.remove ('visible');
    setTimeout (() => this.overlay.classList.add ('hidden'), 250);
  }

  onClickBack () {
    this.onBackToMenu ();
  }
}

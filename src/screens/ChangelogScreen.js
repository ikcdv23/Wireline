import { CHANGELOG } from '../config/changelog.js';

export class ChangelogScreen {
  constructor ({onClose, audio}) {
    this.onClose = onClose;
    this.audio = audio;

    this.overlay = document.getElementById ('changelog-overlay');
    this.content = document.getElementById ('changelog-content');
    this.btnClose = document.getElementById ('btn-changelog-close');

    this.onClickClose = this.onClickClose.bind (this);
    this._populated = false;
  }

  mount () {
    if (!this._populated) {
      this.content.innerHTML = this._render ();
      this._populated = true;
    }

    this.overlay.classList.remove ('hidden');
    this.overlay.offsetHeight;
    this.overlay.classList.add ('visible');

    if (this.audio) this.audio.playModalOpen ();

    this.btnClose.addEventListener ('click', this.onClickClose);
  }

  unmount () {
    this.btnClose.removeEventListener ('click', this.onClickClose);

    if (this.audio) this.audio.playModalClose ();

    this.overlay.classList.remove ('visible');
    setTimeout (() => this.overlay.classList.add ('hidden'), 280);
  }

  onClickClose () {
    this.onClose ();
  }

  _render () {
    return CHANGELOG.map ((entry, index) => {
      const isLatest = index === 0;
      const notesHtml = entry.notes.map (n => this._renderNote (n)).join ('');

      return `
        <div class="changelog-entry${isLatest ? ' is-latest' : ''}">
          <div class="changelog-header">
            <span class="changelog-version">v${entry.version}</span>
            ${isLatest ? '<span class="changelog-badge">LATEST</span>' : ''}
            <span class="changelog-date">${entry.date}</span>
          </div>
          <div class="changelog-title">${entry.title}</div>
          <ul class="changelog-notes">${notesHtml}</ul>
        </div>
      `;
    }).join ('');
  }

  _renderNote (note) {
    if (typeof note === 'string') {
      return `<li>${note}</li>`;
    }
    if (note.card) {
      const style = `color: ${note.color}; border-color: ${note.color}; background: ${note.color}22;`;
      return `
        <li class="changelog-card">
          <span class="card-icon" style="${style}">${note.icon}</span>
          <div class="card-body">
            <div class="card-name">${note.name}</div>
            <div class="card-desc">${note.desc}</div>
          </div>
        </li>
      `;
    }
    return '';
  }
}

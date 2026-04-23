import { TUTORIAL_STEPS } from '../config/tutorial.js';

export class TutorialScreen {
  constructor ({onFinish, onSkip, audio}) {
    this.onFinish = onFinish;
    this.onSkip = onSkip;
    this.audio = audio;
    this.currentStep = 0;

    this.overlay = document.getElementById ('tutorial-overlay');
    this.spotlight = document.getElementById ('tutorial-spotlight');
    this.tooltip = document.getElementById ('tutorial-tooltip');
    this.titleEl = document.getElementById ('tutorial-title');
    this.textEl = document.getElementById ('tutorial-text');
    this.progressEl = document.getElementById ('tutorial-progress');
    this.btnNext = document.getElementById ('btn-tutorial-next');
    this.btnBack = document.getElementById ('btn-tutorial-back');
    this.btnSkip = document.getElementById ('btn-tutorial-skip');

    this.onClickNext = this.onClickNext.bind (this);
    this.onClickBack = this.onClickBack.bind (this);
    this.onClickSkip = this.onClickSkip.bind (this);
    this.onKeyDown = this.onKeyDown.bind (this);
    this.onResize = this.onResize.bind (this);
  }

  mount () {
    this.currentStep = 0;

    this.overlay.classList.remove ('hidden');
    this.overlay.offsetHeight;
    this.overlay.classList.add ('visible');

    this.btnNext.addEventListener ('click', this.onClickNext);
    this.btnBack.addEventListener ('click', this.onClickBack);
    this.btnSkip.addEventListener ('click', this.onClickSkip);
    window.addEventListener ('keydown', this.onKeyDown);
    window.addEventListener ('resize', this.onResize);

    this._renderStep ();
  }

  unmount () {
    this.btnNext.removeEventListener ('click', this.onClickNext);
    this.btnBack.removeEventListener ('click', this.onClickBack);
    this.btnSkip.removeEventListener ('click', this.onClickSkip);
    window.removeEventListener ('keydown', this.onKeyDown);
    window.removeEventListener ('resize', this.onResize);

    this.overlay.classList.remove ('visible');
    setTimeout (() => this.overlay.classList.add ('hidden'), 280);
  }

  _renderStep () {
    const step = TUTORIAL_STEPS[this.currentStep];
    const total = TUTORIAL_STEPS.length;
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === total - 1;

    this.titleEl.textContent = step.title;
    this.textEl.textContent = step.text;
    this.progressEl.textContent = `${this.currentStep + 1} / ${total}`;

    this.btnBack.style.visibility = isFirst ? 'hidden' : 'visible';
    this.btnNext.textContent = isLast ? 'EMPEZAR' : 'SIGUIENTE \u25B8';

    if (step.target) {
      const el = document.querySelector (step.target);
      if (el) {
        this.overlay.classList.remove ('no-target');
        this.spotlight.classList.remove ('hidden');
        this._positionSpotlight (el);
        this._positionTooltipNear (el);
        if (this.audio) this.audio.playBreakdownTick ();
        return;
      }
    }

    this.overlay.classList.add ('no-target');
    this.spotlight.classList.add ('hidden');
    this.tooltip.classList.add ('centered');
    this.tooltip.style.top = '';
    this.tooltip.style.left = '';
    if (this.audio) this.audio.playBreakdownTick ();
  }

  _positionSpotlight (el) {
    const rect = el.getBoundingClientRect ();
    const padding = 12;
    this.spotlight.style.top = rect.top - padding + 'px';
    this.spotlight.style.left = rect.left - padding + 'px';
    this.spotlight.style.width = rect.width + padding * 2 + 'px';
    this.spotlight.style.height = rect.height + padding * 2 + 'px';
  }

  _positionTooltipNear (target) {
    this.tooltip.classList.remove ('centered');
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.style.top = '0px';
    this.tooltip.style.left = '0px';

    const targetRect = target.getBoundingClientRect ();
    const ttRect = this.tooltip.getBoundingClientRect ();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const margin = 24;

    let top;
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;
    if (spaceBelow > ttRect.height + margin) {
      top = targetRect.bottom + margin;
    } else if (spaceAbove > ttRect.height + margin) {
      top = targetRect.top - ttRect.height - margin;
    } else {
      top = Math.max (margin, (vh - ttRect.height) / 2);
    }

    let left = targetRect.left + targetRect.width / 2 - ttRect.width / 2;
    left = Math.max (margin, Math.min (left, vw - ttRect.width - margin));

    this.tooltip.style.top = top + 'px';
    this.tooltip.style.left = left + 'px';
    this.tooltip.style.visibility = 'visible';
  }

  onClickNext () {
    if (this.currentStep === TUTORIAL_STEPS.length - 1) {
      this.onFinish ();
      return;
    }
    this.currentStep++;
    this._renderStep ();
  }

  onClickBack () {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._renderStep ();
    }
  }

  onClickSkip () {
    this.onSkip ();
  }

  onKeyDown (e) {
    if (e.key === 'Escape') {
      this.onSkip ();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      this.onClickNext ();
    } else if (e.key === 'ArrowLeft') {
      this.onClickBack ();
    }
  }

  onResize () {
    this._renderStep ();
  }
}

// Sistema de modales: abrir, cerrar, mostrar breakdown con tick por fila.
// Se comunica con CSS (clases hidden/visible) para las animaciones.

export const Modal = {
  open(overlayId, audio) {
    const el = document.getElementById(overlayId);
    if (!el) return;

    el.classList.remove('hidden');
    // Forzar reflow para que la transicion funcione
    el.offsetHeight;
    el.classList.add('visible');

    if (audio) audio.playModalOpen();
  },

  close(overlayId, audio, onDone) {
    const el = document.getElementById(overlayId);
    if (!el) return;

    if (audio) audio.playModalClose();

    el.classList.remove('visible');

    setTimeout(() => {
      el.classList.add('hidden');
      if (onDone) onDone();
    }, 250);
  },

  showBreakdown(audio) {
    const el = document.getElementById('score-breakdown');
    if (!el) return;

    el.classList.remove('hidden');
    el.offsetHeight;
    el.classList.add('visible');

    const rows = el.querySelectorAll('.breakdown-row');
    rows.forEach((row, i) => {
      setTimeout(() => {
        if (audio) {
          if (row.classList.contains('br-total')) {
            const isGood = row.querySelector('.good');
            audio.playBreakdownTotal(!!isGood);
          } else {
            audio.playBreakdownTick();
          }
        }
      }, 50 + i * 60);
    });
  },

  hideBreakdown() {
    const el = document.getElementById('score-breakdown');
    if (!el) return;

    el.classList.remove('visible');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 200);
  },
};

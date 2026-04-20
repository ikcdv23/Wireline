// === SISTEMA DE MODALES CON ANIMACION Y SONIDO ===

const Modal = {
    // Abrir un overlay con animacion
    open(overlayId, audio) {
        const el = document.getElementById(overlayId);
        if (!el) return;

        el.classList.remove('hidden');
        // Forzar reflow para que la transicion funcione
        el.offsetHeight;
        el.classList.add('visible');

        if (audio) audio.playModalOpen();
    },

    // Cerrar un overlay con animacion
    close(overlayId, audio, onDone) {
        const el = document.getElementById(overlayId);
        if (!el) return;

        if (audio) audio.playModalClose();

        el.classList.remove('visible');

        // Esperar a que termine la transicion
        setTimeout(() => {
            el.classList.add('hidden');
            if (onDone) onDone();
        }, 250);
    },

    // Mostrar el breakdown con sonido por fila
    showBreakdown(audio) {
        const el = document.getElementById('score-breakdown');
        if (!el) return;

        el.classList.remove('hidden');
        el.offsetHeight;
        el.classList.add('visible');

        // Sonido por cada fila que aparece
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

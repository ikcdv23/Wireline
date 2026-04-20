// === PUNTO DE ENTRADA ===

const game = new Game();

// --- MUSICA DEL MENU (scope global) ---
let _menuMusic = null;

function startMenuMusic() {
    if (_menuMusic) return;
    _menuMusic = new Audio('assets/audio/Wireline_Oficial_Theme_Song_/Wireline_Oficial_Theme_Song_.mp3');
    _menuMusic.loop = true;
    _menuMusic.volume = 0;
    _menuMusic.play().catch(() => {});
    let vol = 0;
    const fadeIn = setInterval(() => {
        vol = Math.min(vol + 0.05, 0.8);
        if (_menuMusic) _menuMusic.volume = vol;
        if (vol >= 0.8) clearInterval(fadeIn);
    }, 50);
}

function stopMenuMusic() {
    if (!_menuMusic) return;
    const m = _menuMusic;
    let vol = m.volume;
    const fadeOut = setInterval(() => {
        vol = Math.max(vol - 0.05, 0);
        m.volume = vol;
        if (vol <= 0) {
            clearInterval(fadeOut);
            m.pause();
            m.currentTime = 0;
        }
    }, 30);
    _menuMusic = null;
}

// --- SPLASH SCREEN ---
(function initSplash() {
    const splash = document.getElementById('splash-overlay');

    function onInteract() {
        splash.removeEventListener('click', onInteract);
        document.removeEventListener('keydown', onKeyInteract);

        // Desbloquear audio y arrancar musica
        game.audio.init();
        startMenuMusic();

        // Fade out splash
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.classList.add('done');
            // Mostrar menu
            const menu = document.getElementById('mainmenu-overlay');
            menu.classList.remove('hidden');
            menu.offsetHeight;
            menu.classList.add('visible');
            initMenu();
        }, 600);
    }

    function onKeyInteract() {
        onInteract();
    }

    splash.addEventListener('click', onInteract);
    document.addEventListener('keydown', onKeyInteract);
})();

// --- MENU PRINCIPAL ---
function initMenu() {
    const menuOverlay = document.getElementById('mainmenu-overlay');
    const btnStart = document.getElementById('btn-start');

    btnStart.addEventListener('click', () => {
        game.audio.ensure();
        game.audio._tone(200, 0.08, 'square', 0.06);
        game.audio._tone(400, 0.1, 'sine', 0.08, 0.05);
        game.audio._tone(600, 0.1, 'sine', 0.08, 0.1);
        game.audio._tone(900, 0.12, 'sine', 0.1, 0.16);
        game.audio._tone(1200, 0.18, 'sine', 0.1, 0.24);

        stopMenuMusic();

        menuOverlay.classList.remove('visible');
        setTimeout(() => {
            menuOverlay.classList.add('hidden');
            game.start();
        }, 280);
    });

    // Glow pulsante del titulo
    const titleGlow = document.getElementById('menu-title-glow');
    if (titleGlow) {
        let pulseDir = 1;
        let pulseVal = 0;
        function pulseTick() {
            pulseVal += pulseDir * 0.025;
            if (pulseVal >= 1) { pulseVal = 1; pulseDir = -1; }
            if (pulseVal <= 0) { pulseVal = 0; pulseDir = 1; }
            titleGlow.style.opacity = pulseVal.toFixed(2);
            requestAnimationFrame(pulseTick);
        }
        requestAnimationFrame(pulseTick);
    }
}

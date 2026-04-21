// Musica de fondo del menu principal.
// Fade in al abrir, fade out al empezar partida.
// Estado modular: solo existe una instancia activa a la vez.

let _menuMusic = null;

export function startMenuMusic() {
  if (_menuMusic) return;
  _menuMusic = new Audio('/audio/theme.mp3');
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

export function stopMenuMusic() {
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

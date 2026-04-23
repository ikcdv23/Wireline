// Configuracion global del juego: valores de balance, colores y textos.

export const CONFIG = {
  BOARD: {
    NODE_RADIUS: 32,
  },

  DICE: {
    COUNT: 5,
    FACES: 6,
  },

  PLAYER: {
    START_LIVES: 3,
    START_MONEY: 5,
    INTEREST_PER: 5,
    INTEREST_MAX: 5,
  },

  SCORING: {
    BASE_MULT: 1.0,
    // FUTURE FEAT --> añadir modificadores de partida imitando las barajas de balatro (baraja azul +1 descarte, roja +1 mano)
    BASE_TARGET: 15,
    TARGET_GROWTH: 1.40,
  },

  ZONES: [
    {name: 'Prototipo', rounds: 3, color: '#b040ff'},
    {name: 'Produccion', rounds: 6, color: '#00f0ff'},
    {name: 'Sobrecarga', rounds: 6, color: '#ffe156'},
    {name: 'Singularidad', rounds: 6, color: '#ff4060'}, 
    // FUTURE FEAT --> modo infinito
    /* Contemplar implementar una generacion procedural de rondas 
    para el modo infinito, en vez de repetir la ultima zona.
    */
  ],

  COLORS: {
    BG_DARK: '#0f0f1b',
    BG_NODE: '#16213e',
    BG_NODE_HOVER: '#2a2a4e',
    BG_NODE_OCCUPIED: '#1a2a1e',
    WIRE: '#00e5ff33',
    WIRE_ACTIVE: '#00e5ff',
    WIRE_GLOW: '#00e5ffaa',
    ACCENT_CYAN: '#00e5ff',
    ACCENT_YELLOW: '#ffd700',
    ACCENT_RED: '#ff3a3a',
    ACCENT_GREEN: '#39ff14',
    TEXT_DIM: '#5a5a7a',
    TEXT_PRIMARY: '#d8d8e8',
    SOURCE_COLOR: '#39ff14',
    OUTPUT_COLOR: '#ff3a3a',
  },

  ANIMATION: {
    CURRENT_SPEED: 3, 
    SCORE_TICK_DURATION: 600, 
  },
};

// IDs especiales de nodo
export const NODE_SOURCE = 'source';
export const NODE_OUTPUT = 'output';

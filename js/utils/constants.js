// === CONFIGURACION DEL JUEGO ===

const CONFIG = {
    BOARD: {
        NODE_RADIUS: 32,
    },

    DICE: {
        COUNT: 5,
        FACES: 6,
    },

    PLAYER: {
        START_LIVES: 3,
        START_MONEY: 3,
    },

    SCORING: {
        BASE_MULT: 1.0,       // sin mult gratis — los componentes son el unico camino
        BASE_TARGET: 15,      // objetivo ronda 1 mas alto desde el principio
        TARGET_GROWTH: 1.35,  // curva mas empinada: 15 → 20 → 27 → 37 → 50...
    },

    ZONES: [
        { name: 'Prototipo', rounds: 3, color: '#b040ff' },
        { name: 'Produccion', rounds: 3, color: '#00f0ff' },
        { name: 'Sobrecarga', rounds: 3, color: '#ffe156' },
        { name: 'Singularidad', rounds: 3, color: '#ff4060' },
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
        CURRENT_SPEED: 3,        // pixels per frame para la animacion de corriente
        SCORE_TICK_DURATION: 800, // ms para el conteo de puntuacion
    },
};

// IDs especiales de nodo
const NODE_SOURCE = 'source';
const NODE_OUTPUT = 'output';

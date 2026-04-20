// === TABLERO / GRID DE NODOS ===

// Patrones de tablero por zona — cada uno tiene topologia unica
const BOARD_PATTERNS = {
    // Zona 0: Linea simple con un desvio — tutorial natural
    prototipo: {
        nodes: [
            { id: 0, x: 100, y: 280, type: 'source' },
            { id: 1, x: 250, y: 280 },
            { id: 2, x: 400, y: 180 },
            { id: 3, x: 400, y: 380 },
            { id: 4, x: 550, y: 280 },
            { id: 5, x: 700, y: 280, type: 'output' },
        ],
        edges: [
            [0,1], [1,2], [1,3], [2,4], [3,4], [4,5],
        ],
    },

    // Zona 1: Diamante — mas nodos, rutas cruzadas
    produccion: {
        nodes: [
            { id: 0, x: 100, y: 280, type: 'source' },
            { id: 1, x: 250, y: 160 },
            { id: 2, x: 250, y: 400 },
            { id: 3, x: 400, y: 100 },
            { id: 4, x: 400, y: 280 },
            { id: 5, x: 400, y: 460 },
            { id: 6, x: 550, y: 160 },
            { id: 7, x: 550, y: 400 },
            { id: 8, x: 700, y: 280, type: 'output' },
        ],
        edges: [
            [0,1], [0,2], [1,3], [1,4], [2,4], [2,5],
            [3,6], [4,6], [4,7], [5,7], [6,8], [7,8],
        ],
    },

    // Zona 2: Hexagonal — muchas rutas, muchas decisiones
    sobrecarga: {
        nodes: [
            { id: 0, x: 80,  y: 280, type: 'source' },
            { id: 1, x: 210, y: 160 },
            { id: 2, x: 210, y: 400 },
            { id: 3, x: 340, y: 100 },
            { id: 4, x: 340, y: 280 },
            { id: 5, x: 340, y: 460 },
            { id: 6, x: 470, y: 160 },
            { id: 7, x: 470, y: 400 },
            { id: 8, x: 600, y: 100 },
            { id: 9, x: 600, y: 280 },
            { id: 10, x: 600, y: 460 },
            { id: 11, x: 720, y: 280, type: 'output' },
        ],
        edges: [
            [0,1], [0,2], [1,3], [1,4], [2,4], [2,5],
            [3,6], [4,6], [4,7], [5,7],
            [6,8], [6,9], [7,9], [7,10],
            [8,11], [9,11], [10,11],
        ],
    },

    // Zona 3: Estrella / tela de arana — todo conectado al centro, caos
    singularidad: {
        nodes: [
            { id: 0,  x: 80,  y: 280, type: 'source' },
            { id: 1,  x: 220, y: 120 },
            { id: 2,  x: 220, y: 280 },
            { id: 3,  x: 220, y: 440 },
            { id: 4,  x: 400, y: 60  },
            { id: 5,  x: 400, y: 200 },
            { id: 6,  x: 400, y: 360 },
            { id: 7,  x: 400, y: 500 },
            { id: 8,  x: 580, y: 120 },
            { id: 9,  x: 580, y: 280 },
            { id: 10, x: 580, y: 440 },
            { id: 11, x: 720, y: 280, type: 'output' },
        ],
        edges: [
            [0,1], [0,2], [0,3],
            [1,4], [1,5], [2,5], [2,6], [3,6], [3,7],
            [4,8], [5,8], [5,9], [6,9], [6,10], [7,10],
            [8,11], [9,11], [10,11],
            // Conexiones extra cruzadas — caos
            [1,2], [2,3], [4,5], [5,6], [6,7], [8,9], [9,10],
        ],
    },
};

class Board {
    constructor(patternName) {
        this.nodes = [];
        this.edges = [];
        this.patternName = patternName || 'prototipo';
        this.build(this.patternName);
    }

    build(patternName) {
        const pattern = BOARD_PATTERNS[patternName];
        if (!pattern) return;

        // Guardar coordenadas normalizadas (0-1) basadas en el diseno original 800x560
        this.nodes = pattern.nodes.map(n => ({
            id: n.id,
            nx: n.x / 800,   // normalizado
            ny: n.y / 560,
            x: n.x,          // se recomputa en scaleToCanvas
            y: n.y,
            type: n.type || 'normal',
            dieValue: null,
            component: null,
            hover: false,
        }));

        this.edges = pattern.edges.map(([from, to]) => ({ from, to }));
    }

    // Recomputa posiciones al tamano real del canvas
    scaleToCanvas(canvasW, canvasH) {
        const padX = 60;
        const padY = 40;
        const w = canvasW - padX * 2;
        const h = canvasH - padY * 2;
        for (const node of this.nodes) {
            node.x = Math.floor(padX + node.nx * w);
            node.y = Math.floor(padY + node.ny * h);
        }
    }

    getNode(id) {
        return this.nodes.find(n => n.id === id);
    }

    getSourceNode() {
        return this.nodes.find(n => n.type === NODE_SOURCE);
    }

    getOutputNode() {
        return this.nodes.find(n => n.type === NODE_OUTPUT);
    }

    getNormalNodes() {
        return this.nodes.filter(n => n.type === 'normal');
    }

    getNeighbors(nodeId) {
        const neighborIds = [];
        for (const edge of this.edges) {
            if (edge.from === nodeId) neighborIds.push(edge.to);
            if (edge.to === nodeId) neighborIds.push(edge.from);
        }
        return neighborIds.map(id => this.getNode(id));
    }

    getNodeAtPosition(x, y) {
        const radius = CONFIG.BOARD.NODE_RADIUS;
        for (const node of this.nodes) {
            if (dist(x, y, node.x, node.y) <= radius * 1.3) {
                return node;
            }
        }
        return null;
    }

    placeDieOnNode(nodeId, value) {
        const node = this.getNode(nodeId);
        if (node && node.type !== NODE_SOURCE && node.type !== NODE_OUTPUT) {
            node.dieValue = value;
            return true;
        }
        return false;
    }

    removeDieFromNode(nodeId) {
        const node = this.getNode(nodeId);
        if (node) {
            node.dieValue = null;
        }
    }

    clearAllDice() {
        this.nodes.forEach(n => n.dieValue = null);
    }

    hasAnyDicePlaced() {
        return this.nodes.some(n => n.dieValue !== null);
    }
}

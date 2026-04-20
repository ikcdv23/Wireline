// === COMPONENTES (modificadores comprables) ===

const COMPONENT_DEFS = [
    {
        id: 'amplifier',
        name: 'Amplificador',
        desc: 'x2 mult en este nodo',
        price: 4,
        rarity: 'common',
        symbol: '\u00D7',      // ×
        color: '#ffe156',     // amarillo
        ringStyle: 'mult',    // anillo doble pulsante
        apply(node, routeScore) {
            return { addMult: 2.0 };
        },
    },
    {
        id: 'capacitor',
        name: 'Condensador',
        desc: 'Suma los puntos del dado anterior al actual',
        price: 5,
        rarity: 'common',
        symbol: '\u2B82',      // bateria
        color: '#40ff90',     // verde
        ringStyle: 'charge',  // barra de carga que se llena
        storedValue: 0,
        apply(node) {
            const bonus = this.storedValue;
            // Guardar el dado actual para la proxima activacion
            this.storedValue = node.dieValue || 0;
            return { addFlat: bonus };
        },
    },
    {
        id: 'transformer',
        name: 'Transformador',
        desc: 'El dado en este nodo cuenta doble',
        price: 6,
        rarity: 'uncommon',
        symbol: '\u21C6',      // flechas dobles
        color: '#00f0ff',     // cyan
        ringStyle: 'double',  // nodo se dibuja como doble circulo
        apply(node) {
            return { doubleDie: true };
        },
    },
    {
        id: 'shortcircuit',
        name: 'Cortocircuito',
        desc: 'Conecta con los 2 nodos mas cercanos',
        price: 7,
        rarity: 'uncommon',
        symbol: '\u26A1',      // rayo
        color: '#ff8040',     // naranja
        ringStyle: 'arcs',    // arcos visuales hacia nodos conectados
        modifyEdges(board, nodeId) {
            // Conectar con los 2 nodos mas cercanos que no sean vecinos directos
            const node = board.getNode(nodeId);
            const currentNeighborIds = new Set();
            for (const edge of board.edges) {
                if (edge.from === nodeId) currentNeighborIds.add(edge.to);
                if (edge.to === nodeId) currentNeighborIds.add(edge.from);
            }
            const candidates = board.nodes
                .filter(n => n.id !== nodeId && n.type !== NODE_SOURCE && n.type !== NODE_OUTPUT && !currentNeighborIds.has(n.id))
                .map(n => ({ id: n.id, dist: dist(node.x, node.y, n.x, n.y) }))
                .sort((a, b) => a.dist - b.dist);
            return candidates.slice(0, 2).map(c => ({ from: nodeId, to: c.id }));
        },
    },
    {
        id: 'fuse',
        name: 'Fusible',
        desc: 'x5 mult pero se destruye en 2 usos',
        price: 8,
        rarity: 'rare',
        symbol: '\u2622',      // radiactivo
        color: '#ff4060',     // rojo
        ringStyle: 'danger',  // parpadeo de advertencia + contador
        usesLeft: 2,
        apply(node) {
            if (this.usesLeft > 0) {
                this.usesLeft--;
                return { addMult: 5.0 };
            }
            return { destroy: true };
        },
    },
    {
        id: 'splitter',
        name: 'Divisor',
        desc: 'La corriente toma TODAS las rutas desde este nodo',
        price: 9,
        rarity: 'rare',
        symbol: '\u2726',      // estrella
        color: '#b040ff',     // purpura
        ringStyle: 'radial',  // rayos saliendo hacia todos los vecinos
        apply(node) {
            return { splitCurrent: true };
        },
    },
];

class ComponentManager {
    getRandomShopItems(count = 3, playerMoney = 0) {
        const available = COMPONENT_DEFS.filter(c => c.price <= playerMoney + 4);
        const shuffled = shuffleArray(available);
        return shuffled.slice(0, count).map(def => ({
            ...def,
            // Clonar para que cada instancia sea independiente
            usesLeft: def.usesLeft,
            storedValue: def.storedValue || 0,
        }));
    }

    createInstance(defId) {
        const def = COMPONENT_DEFS.find(d => d.id === defId);
        if (!def) return null;
        return { ...def, usesLeft: def.usesLeft, storedValue: def.storedValue || 0 };
    }
}

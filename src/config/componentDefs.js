// Definiciones de los componentes comprables. Cada uno modifica la puntuacion
// o el grafo de alguna forma. La logica concreta vive en `apply` o `modifyEdges`.

import {NODE_SOURCE, NODE_OUTPUT} from './constants.js';
import {dist} from '../lib/math.js';

export const COMPONENT_DEFS = [
  {
    id: 'capacitor',
    name: 'Condensador',
    desc: 'Suma los puntos del dado anterior al actual',
    price: 5,
    rarity: 'common',
    symbol: '⮂', // bateria
    color: '#40ff90', // verde
    ringStyle: 'charge', // barra de carga que se llena
    storedValue: 0,
    apply (node) {
      const bonus = this.storedValue;
      // Guardar el dado actual para la proxima activacion
      this.storedValue = node.dieValue || 0;
      return {addFlat: bonus};
    },
    getLabel (_node) {
      const stored = this.storedValue || 0;
      return stored > 0 ? `+${stored} MEM` : 'EMPTY';
    },
    getTooltipExtra (_node) {
      const s = this.storedValue || 0;
      return s > 0 ? `GUARDADO: +${s} PTS` : 'SIN CARGA';
    },
  },
  {
    id: 'transformer',
    name: 'Transformador',
    desc: 'El dado en este nodo cuenta doble',
    price: 6,
    rarity: 'uncommon',
    symbol: '⇆', // flechas dobles
    color: '#00f0ff', // cyan
    ringStyle: 'double', // nodo se dibuja como doble cuadrado
    apply (node) {
      return {doubleDie: true};
    },
    getLabel (node) {
      return `${node.dieValue}>${node.dieValue * 2}`;
    },
    getTooltipExtra (node) {
      return node.dieValue
        ? `AHORA: ${node.dieValue} > ${node.dieValue * 2}`
        : null;
    },
  },
  {
    id: 'overload',
    name: 'Sobretension',
    desc: 'Dispara 2 veces solo si el dado es maximo en su tipo (10 en D10, 12 en D12...)',
    price: 1,
    rarity: 'uncommon',
    symbol: '⇅', // flechas verticales
    color: '#ff39a8', // rosa
    ringStyle: 'invert', // ver case 'invert' en Renderer.drawComponentEffect
    apply (node) {
      // Dispara solo si el dado es el maximo de su tipo (6 en d6, 12 en d12...).
      // node.dieFaces lo rellena Board.placeDieOnNode cuando el dado aterriza.
      if (node.dieFaces && node.dieValue === node.dieFaces) {
        return {doubleDie: true};
      }
      return {};
    },
    getLabel (node) {
      if (node.dieValue === node.dieFaces) {
        return `${node.dieValue} MAX!`;
      } else {
        return `${node.dieValue}`;
      }
    },
    getTooltipExtra (node) {
      if (!node.dieValue) return null;
      if (node.dieValue !== node.dieFaces) return 'INACTIVO';
      return `AHORA: ${node.dieValue} → ${node.dieValue * 2}`;
    },
  },
  {
    id: 'shortcircuit',
    name: 'Cortocircuito',
    desc: 'Conecta con los 2 nodos mas cercanos',
    price: 7,
    rarity: 'uncommon',
    symbol: '⚡', // rayo
    color: '#ff8040', // naranja
    ringStyle: 'arcs', // arcos visuales hacia nodos conectados
    modifyEdges (board, nodeId) {
      // Conectar con los 2 nodos mas cercanos que no sean vecinos directos
      const node = board.getNode (nodeId);
      const currentNeighborIds = new Set ();
      for (const edge of board.edges) {
        if (edge.from === nodeId) currentNeighborIds.add (edge.to);
        if (edge.to === nodeId) currentNeighborIds.add (edge.from);
      }
      const candidates = board.nodes
        .filter (
          n =>
            n.id !== nodeId &&
            n.type !== NODE_SOURCE &&
            n.type !== NODE_OUTPUT &&
            !currentNeighborIds.has (n.id)
        )
        .map (n => ({id: n.id, dist: dist (node.x, node.y, n.x, n.y)}))
        .sort ((a, b) => a.dist - b.dist);
      return candidates.slice (0, 2).map (c => ({from: nodeId, to: c.id}));
    },
    getLabel (_node) {
      return 'LINK+';
    },
    getTooltipExtra (_node) {
      return '+2 CONEXIONES EXTRA';
    },
  },
  {
    id: 'amplifier',
    name: 'Amplificador',
    desc: 'x2 mult en este nodo',
    price: 8,
    rarity: 'rare',
    symbol: '×', // ×
    color: '#ffe156', // amarillo
    ringStyle: 'mult', // anillo doble pulsante
    apply (node, routeScore) {
      return {addMult: 2.0};
    },
    getLabel (node) {
      return `${node.dieValue}x2=${node.dieValue * 2}`;
    },
    getTooltipExtra (node) {
      return node.dieValue
        ? `AHORA: ${node.dieValue} x2 = ${node.dieValue * 2}`
        : null;
    },
  },
  {
    id: 'fuse',
    name: 'Fusible',
    desc: 'x5 mult pero se destruye en 2 usos',
    price: 8,
    rarity: 'rare',
    symbol: '☢', // radiactivo
    color: '#ff4060', // rojo
    ringStyle: 'danger', // parpadeo de advertencia + contador
    usesLeft: 2,
    apply (node) {
      if (this.usesLeft > 0) {
        this.usesLeft--;
        return {addMult: 5.0};
      }
      return {destroy: true};
    },
    getLabel (_node) {
      return `x5 [${this.usesLeft}]`;
    },
    getTooltipExtra (_node) {
      return `USOS: ${this.usesLeft || 0}/2`;
    },
  },
  {
    id: 'splitter',
    name: 'Divisor',
    desc: 'La corriente toma TODAS las rutas desde este nodo',
    price: 9,
    rarity: 'rare',
    symbol: '✦', // estrella
    color: '#b040ff', // purpura
    ringStyle: 'radial', // rayos saliendo hacia todos los vecinos
    apply (node) {
      return {splitCurrent: true};
    },
    getLabel (_node) {
      return 'SPLIT';
    },
    getTooltipExtra (_node) {
      return 'TODA RUTA SUMA';
    },
  },
];

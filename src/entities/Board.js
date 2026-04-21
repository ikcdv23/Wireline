// Tablero: grafo de nodos y aristas. Gestiona topologia, colocacion de dados
// y posicionamiento responsivo sobre el canvas.

import { BOARD_PATTERNS } from '../config/boardPatterns.js';
import { CONFIG, NODE_SOURCE, NODE_OUTPUT } from '../config/constants.js';
import { dist } from '../lib/math.js';

export class Board {
  constructor(patternName) {
    this.nodes = [];
    this.edges = [];
    this.patternName = patternName || 'prototipo';
    this.build(this.patternName);
  }

  build(patternName) {
    const pattern = BOARD_PATTERNS[patternName];
    if (!pattern) return;

    // Coordenadas normalizadas (0-1) basadas en el diseno original 800x560.
    // En scaleToCanvas se recomputan a pixeles segun tamano real.
    this.nodes = pattern.nodes.map((n) => ({
      id: n.id,
      nx: n.x / 800,
      ny: n.y / 560,
      x: n.x,
      y: n.y,
      type: n.type || 'normal',
      dieValue: null,
      dieFaces: null,
      component: null,
      hover: false,
    }));

    this.edges = pattern.edges.map(([from, to]) => ({ from, to }));
  }

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
    return this.nodes.find((n) => n.id === id);
  }

  getSourceNode() {
    return this.nodes.find((n) => n.type === NODE_SOURCE);
  }

  getOutputNode() {
    return this.nodes.find((n) => n.type === NODE_OUTPUT);
  }

  getNormalNodes() {
    return this.nodes.filter((n) => n.type === 'normal');
  }

  getNeighbors(nodeId) {
    const neighborIds = [];
    for (const edge of this.edges) {
      if (edge.from === nodeId) neighborIds.push(edge.to);
      if (edge.to === nodeId) neighborIds.push(edge.from);
    }
    return neighborIds.map((id) => this.getNode(id));
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

  placeDieOnNode(nodeId, value, faces = null) {
    const node = this.getNode(nodeId);
    if (node && node.type !== NODE_SOURCE && node.type !== NODE_OUTPUT) {
      node.dieValue = value;
      node.dieFaces = faces;
      return true;
    }
    return false;
  }

  removeDieFromNode(nodeId) {
    const node = this.getNode(nodeId);
    if (node) {
      node.dieValue = null;
      node.dieFaces = null;
    }
  }

  clearAllDice() {
    this.nodes.forEach((n) => {
      n.dieValue = null;
      n.dieFaces = null;
    });
  }

  hasAnyDicePlaced() {
    return this.nodes.some((n) => n.dieValue !== null);
  }
}

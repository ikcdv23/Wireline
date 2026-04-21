// Pathfinding + calculo de puntuacion. Recorre el grafo con DFS y evalua cada
// ruta aplicando los efectos de los componentes colocados.

import { CONFIG, NODE_SOURCE, NODE_OUTPUT } from '../config/constants.js';

export class ScoringEngine {
  // Encuentra la mejor ruta (mayor puntuacion) desde fuente a salida.
  findBestRoute(board) {
    const source = board.getSourceNode();
    const output = board.getOutputNode();
    if (!source || !output) {
      return { route: [], score: 0, mult: 1, details: [], total: 0, baseScore: 0 };
    }

    // Construir grafo con aristas extra de componentes (cortocircuito)
    const edges = this.buildEdges(board);

    const allRoutes = [];
    this.dfs(
      board,
      edges,
      source.id,
      output.id,
      [source.id],
      new Set([source.id]),
      allRoutes,
    );

    if (allRoutes.length === 0) {
      return { route: [], score: 0, mult: 1, details: [], total: 0, baseScore: 0 };
    }

    const hasSplitter = board.nodes.some(
      (n) => n.component && n.component.id === 'splitter',
    );

    if (hasSplitter) {
      // Divisor: sumar TODAS las rutas sin repetir nodos
      return this.evaluateWithSplitter(board, allRoutes);
    }

    // Sin divisor: la mejor ruta unica gana
    let bestResult = null;
    for (const route of allRoutes) {
      const result = this.evaluateRoute(board, route);
      if (!bestResult || result.total > bestResult.total) {
        bestResult = result;
      }
    }

    return bestResult;
  }

  // Construir lista de aristas incluyendo las extra de componentes
  buildEdges(board) {
    const edges = [...board.edges];

    for (const node of board.nodes) {
      if (node.component && node.component.modifyEdges) {
        const extraEdges = node.component.modifyEdges(board, node.id);
        for (const e of extraEdges) {
          const exists = edges.some(
            (ex) =>
              (ex.from === e.from && ex.to === e.to) ||
              (ex.from === e.to && ex.to === e.from),
          );
          if (!exists) {
            edges.push(e);
          }
        }
      }
    }

    return edges;
  }

  getNeighborsFromEdges(edges, nodeId) {
    const ids = [];
    for (const edge of edges) {
      if (edge.from === nodeId) ids.push(edge.to);
      if (edge.to === nodeId) ids.push(edge.from);
    }
    return ids;
  }

  dfs(board, edges, currentId, targetId, path, visited, allRoutes) {
    if (currentId === targetId) {
      allRoutes.push([...path]);
      return;
    }

    const neighborIds = this.getNeighborsFromEdges(edges, currentId);
    for (const nid of neighborIds) {
      if (!visited.has(nid)) {
        visited.add(nid);
        path.push(nid);
        this.dfs(board, edges, nid, targetId, path, visited, allRoutes);
        path.pop();
        visited.delete(nid);
      }
    }
  }

  evaluateRoute(board, route) {
    let baseScore = 0;
    let mult = CONFIG.SCORING.BASE_MULT;
    const details = [];

    for (const nodeId of route) {
      const node = board.getNode(nodeId);
      if (node.type === NODE_SOURCE || node.type === NODE_OUTPUT) continue;

      let dieValue = node.dieValue || 0;

      if (node.component && node.component.apply) {
        const effect = node.component.apply(node);
        if (effect.addMult) mult *= effect.addMult;
        if (effect.addFlat) dieValue += effect.addFlat;
        if (effect.doubleDie) dieValue *= 2;
      }

      baseScore += dieValue;

      if (dieValue > 0) {
        details.push({ nodeId, value: dieValue, nodeName: `Nodo ${nodeId}` });
      }
    }

    const total = Math.round(baseScore * mult);

    return { route, baseScore, mult, total, details };
  }

  // Divisor: sumar score de todas las rutas, contando cada nodo solo una vez.
  evaluateWithSplitter(board, allRoutes) {
    let totalBaseScore = 0;
    let maxMult = CONFIG.SCORING.BASE_MULT;
    const countedNodes = new Set();
    const allDetails = [];
    let bestRoute = allRoutes[0]; // Para la animacion usamos la mejor ruta

    for (const route of allRoutes) {
      const result = this.evaluateRoute(board, route);

      if (result.mult > maxMult) maxMult = result.mult;

      for (const detail of result.details) {
        if (!countedNodes.has(detail.nodeId)) {
          countedNodes.add(detail.nodeId);
          totalBaseScore += detail.value;
          allDetails.push(detail);
        }
      }

      if (result.total > this.evaluateRoute(board, bestRoute).total) {
        bestRoute = route;
      }
    }

    const total = Math.round(totalBaseScore * maxMult);

    return {
      route: bestRoute,
      baseScore: totalBaseScore,
      mult: maxMult,
      total,
      details: allDetails,
      allRoutes: allRoutes.length,
    };
  }

  getTarget(roundNumber) {
    return Math.round(
      CONFIG.SCORING.BASE_TARGET *
        Math.pow(CONFIG.SCORING.TARGET_GROWTH, roundNumber - 1),
    );
  }
}

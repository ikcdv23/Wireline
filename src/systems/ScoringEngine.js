import { CONFIG, NODE_SOURCE, NODE_OUTPUT } from '../config/constants.js';

export class ScoringEngine {
  previewBestRoute(board) {
    return this._resolveBestRoute(board).result;
  }

  scoreBestRoute(board) {
    const { result, activatedRoutes } = this._resolveBestRoute(board);
    for (const route of activatedRoutes) {
      this._commitRoute(board, route);
    }
    return result;
  }

  getTarget(roundNumber) {
    return Math.round(
      CONFIG.SCORING.BASE_TARGET *
      Math.pow(CONFIG.SCORING.TARGET_GROWTH, roundNumber - 1),
    );
  }

  _resolveBestRoute(board) {
    const source = board.getSourceNode();
    const output = board.getOutputNode();
    if (!source || !output) {
      return { result: this._emptyResult(), activatedRoutes: [] };
    }

    const edges = this._buildEdges(board);
    const allRoutes = [];
    this._dfs(edges, source.id, output.id, [source.id], new Set([source.id]), allRoutes);

    if (allRoutes.length === 0) {
      return { result: this._emptyResult(), activatedRoutes: [] };
    }

    const best = this._pickBestRoute(board, allRoutes);
    return { result: best, activatedRoutes: [best.route] };
  }

  _emptyResult() {
    return { route: [], score: 0, mult: 1, details: [], total: 0, baseScore: 0 };
  }

  _buildEdges(board) {
    const edges = [...board.edges];

    for (const node of board.nodes) {
      if (node.component && node.component.modifyEdges) {
        const extraEdges = node.component.modifyEdges(board, node.id);
        for (const e of extraEdges) {
          const exists = edges.some(
            ex =>
              (ex.from === e.from && ex.to === e.to) ||
              (ex.from === e.to && ex.to === e.from),
          );
          if (!exists) edges.push(e);
        }
      }
    }

    return edges;
  }

  _getNeighborsFromEdges(edges, nodeId) {
    const ids = [];
    for (const edge of edges) {
      if (edge.from === nodeId) ids.push(edge.to);
      if (edge.to === nodeId) ids.push(edge.from);
    }
    return ids;
  }

  _dfs(edges, currentId, targetId, path, visited, allRoutes) {
    if (currentId === targetId) {
      allRoutes.push([...path]);
      return;
    }

    const neighborIds = this._getNeighborsFromEdges(edges, currentId);
    for (const nid of neighborIds) {
      if (!visited.has(nid)) {
        visited.add(nid);
        path.push(nid);
        this._dfs(edges, nid, targetId, path, visited, allRoutes);
        path.pop();
        visited.delete(nid);
      }
    }
  }

  _evaluateRoute(board, route) {
    let baseScore = 0;
    let mult = CONFIG.SCORING.BASE_MULT;
    const details = [];

    for (const nodeId of route) {
      const node = board.getNode(nodeId);
      if (node.type === NODE_SOURCE || node.type === NODE_OUTPUT) continue;

      let dieValue = node.dieValue || 0;
      const comp = node.component;

      if (node.dieValue && comp && comp.effect) {
        const fx = comp.effect(node);
        if (fx.addMult) mult *= fx.addMult;
        if (fx.addFlat) dieValue += fx.addFlat;
        if (fx.doubleDie) dieValue *= 2;
      }

      baseScore += dieValue;

      if (dieValue > 0) {
        details.push({ nodeId, value: dieValue, nodeName: `Nodo ${nodeId}` });
      }
    }

    const total = Math.round(baseScore * mult);
    return { route, baseScore, mult, total, details };
  }

  _pickBestRoute(board, allRoutes) {
    let best = null;
    for (const route of allRoutes) {
      const result = this._evaluateRoute(board, route);
      if (!best || result.total > best.total) best = result;
    }
    return best;
  }

  _combineAllRoutes(board, allRoutes) {
    let totalBaseScore = 0;
    let maxMult = CONFIG.SCORING.BASE_MULT;
    const countedNodes = new Set();
    const allDetails = [];
    let bestResult = null;

    for (const route of allRoutes) {
      const result = this._evaluateRoute(board, route);

      if (result.mult > maxMult) maxMult = result.mult;

      for (const detail of result.details) {
        if (!countedNodes.has(detail.nodeId)) {
          countedNodes.add(detail.nodeId);
          totalBaseScore += detail.value;
          allDetails.push(detail);
        }
      }

      if (!bestResult || result.total > bestResult.total) {
        bestResult = result;
      }
    }

    const total = Math.round(totalBaseScore * maxMult);

    return {
      route: bestResult.route,
      baseScore: totalBaseScore,
      mult: maxMult,
      total,
      details: allDetails,
      allRoutes: allRoutes.length,
    };
  }

  _commitRoute(board, route) {
    for (const nodeId of route) {
      const node = board.getNode(nodeId);
      if (node.type === NODE_SOURCE || node.type === NODE_OUTPUT) continue;
      const comp = node.component;
      if (comp && comp.onScore) comp.onScore(node);
    }
  }
}

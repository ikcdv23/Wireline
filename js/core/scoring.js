// === SCORING: PATHFINDING + CALCULO DE PUNTUACION ===

class ScoringEngine {
    // Encuentra la mejor ruta (mayor puntuacion) desde fuente a salida
    // Tiene en cuenta componentes que modifican aristas o bifurcan
    findBestRoute(board) {
        const source = board.getSourceNode();
        const output = board.getOutputNode();
        if (!source || !output) return { route: [], score: 0, mult: 1, details: [], total: 0, baseScore: 0 };

        // Construir grafo con aristas extra de componentes (cortocircuito)
        const edges = this.buildEdges(board);

        const allRoutes = [];
        this.dfs(board, edges, source.id, output.id, [source.id], new Set([source.id]), allRoutes);

        if (allRoutes.length === 0) return { route: [], score: 0, mult: 1, details: [], total: 0, baseScore: 0 };

        // Comprobar si hay algun divisor en el tablero
        const hasSplitter = board.nodes.some(n => n.component && n.component.id === 'splitter');

        if (hasSplitter) {
            // Divisor: sumar TODAS las rutas que pasan por un nodo con divisor
            return this.evaluateWithSplitter(board, allRoutes);
        }

        // Sin divisor: mejor ruta unica
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
        // Empezar con las aristas base del tablero
        const edges = [...board.edges];

        // Anadir aristas de componentes (cortocircuito)
        for (const node of board.nodes) {
            if (node.component && node.component.modifyEdges) {
                const extraEdges = node.component.modifyEdges(board, node.id);
                for (const e of extraEdges) {
                    // Evitar duplicados
                    const exists = edges.some(ex =>
                        (ex.from === e.from && ex.to === e.to) ||
                        (ex.from === e.to && ex.to === e.from)
                    );
                    if (!exists) {
                        edges.push(e);
                    }
                }
            }
        }

        return edges;
    }

    // Vecinos usando la lista de aristas expandida
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

            // Aplicar componentes
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

    // Divisor: sumar el score de todas las rutas, sin contar nodos repetidos dos veces
    evaluateWithSplitter(board, allRoutes) {
        let totalBaseScore = 0;
        let maxMult = CONFIG.SCORING.BASE_MULT;
        const countedNodes = new Set();
        const allDetails = [];
        let bestRoute = allRoutes[0]; // Para la animacion usamos la mejor ruta

        // Evaluar cada ruta
        for (const route of allRoutes) {
            const result = this.evaluateRoute(board, route);

            // Usar el mult mas alto de cualquier ruta
            if (result.mult > maxMult) maxMult = result.mult;

            // Sumar valores de nodos no contados aun
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
        return Math.round(CONFIG.SCORING.BASE_TARGET * Math.pow(CONFIG.SCORING.TARGET_GROWTH, roundNumber - 1));
    }
}

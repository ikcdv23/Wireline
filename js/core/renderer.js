// === RENDERIZADO PIXEL ART DEL TABLERO ===

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentAnimation = null;
        this.activeRoute = null;
        this.animProgress = 0;
        this.floatingTexts = [];
        this.juice = null;
        this.audio = null;
        this.pulseTime = 0;

        // Preview de ruta durante placing
        this.previewResult = null;
        this.showPreview = false;

        // Desactivar antialiasing para look pixelado
        this.ctx.imageSmoothingEnabled = false;

        // Responsive canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.floor(rect.width);
        this.canvas.height = Math.floor(rect.height);
        this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // --- FONDO: cuadricula de circuito animada ---
    drawBackground() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const t = this.pulseTime;

        // Fondo solido
        ctx.fillStyle = CONFIG.COLORS.BG_DARK;
        ctx.fillRect(0, 0, W, H);

        // Grid de circuito: lineas cada 48px con leve fade animado
        const gridSize = 48;
        const scrollOffset = Math.floor(t * 8) % gridSize; // mueve 8px/s suave a steps
        ctx.strokeStyle = CONFIG.COLORS.WIRE + '88'; // muy sutil
        ctx.lineWidth = 1;

        // Horizontal
        for (let y = -scrollOffset; y < H + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, Math.floor(y));
            ctx.lineTo(W, Math.floor(y));
            ctx.stroke();
        }
        // Vertical
        for (let x = scrollOffset; x < W + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(Math.floor(x), 0);
            ctx.lineTo(Math.floor(x), H);
            ctx.stroke();
        }

        // Intersecciones: punto en cada cruce
        ctx.fillStyle = CONFIG.COLORS.WIRE + 'aa';
        for (let y = -scrollOffset; y < H + gridSize; y += gridSize) {
            for (let x = scrollOffset; x < W + gridSize; x += gridSize) {
                ctx.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, 3, 3);
            }
        }

        // Scanlines sutiles
        const scanAlpha = 0x0c;
        ctx.fillStyle = `rgba(0,0,0,${scanAlpha / 255})`;
        for (let sy = 0; sy < H; sy += 4) {
            ctx.fillRect(0, sy, W, 2);
        }
    }

    drawBoard(board) {
        this.clear();
        this.ctx.imageSmoothingEnabled = false;
        this.pulseTime = performance.now() * 0.003;
        board.scaleToCanvas(this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawEdges(board);
        if (this.showPreview && this.previewResult && this.previewResult.route.length > 1) {
            this.drawRoutePreview(board, this.previewResult);
        }
        this.drawNodes(board);
        this.drawFloatingTexts();
        this.drawTooltip(board);
    }

    // Determina si un segmento es diagonal (necesita L)
    isLSegment(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        return dx > dy * 0.5 && dy > dx * 0.5;
    }

    // Punto intermedio de la L (esquina del angulo recto)
    getLCorner(from, to) {
        return { x: to.x, y: from.y };
    }

    // Posicion a lo largo de un segmento (recto o L) segun t [0-1]
    getSegmentPoint(from, to, t) {
        if (this.isLSegment(from, to)) {
            const corner = this.getLCorner(from, to);
            // Calcular longitud de cada tramo para repartir t proporcionalmente
            const leg1 = Math.abs(corner.x - from.x);
            const leg2 = Math.abs(to.y - corner.y);
            const total = leg1 + leg2;
            const split = leg1 / total;

            if (t <= split) {
                const lt = t / split;
                return { x: lerp(from.x, corner.x, lt), y: from.y };
            } else {
                const lt = (t - split) / (1 - split);
                return { x: corner.x, y: lerp(corner.y, to.y, lt) };
            }
        } else {
            return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
        }
    }

    // Traza el path de un segmento (recto o L)
    traceSegmentPath(ctx, from, to, t = 1) {
        if (this.isLSegment(from, to)) {
            const corner = this.getLCorner(from, to);
            const leg1 = Math.abs(corner.x - from.x);
            const leg2 = Math.abs(to.y - corner.y);
            const total = leg1 + leg2;
            const split = leg1 / total;

            ctx.moveTo(from.x, from.y);
            if (t <= split) {
                const lt = t / split;
                ctx.lineTo(lerp(from.x, corner.x, lt), from.y);
            } else {
                ctx.lineTo(corner.x, corner.y);
                const lt = (t - split) / (1 - split);
                ctx.lineTo(corner.x, lerp(corner.y, to.y, lt));
            }
        } else {
            ctx.moveTo(from.x, from.y);
            const p = this.getSegmentPoint(from, to, t);
            ctx.lineTo(p.x, p.y);
        }
    }

    // --- CABLES: lineas rectas estilo circuito impreso ---
    drawEdges(board) {
        const ctx = this.ctx;
        for (const edge of board.edges) {
            const from = board.getNode(edge.from);
            const to = board.getNode(edge.to);

            ctx.beginPath();
            this.traceSegmentPath(ctx, from, to, 1);
            ctx.strokeStyle = CONFIG.COLORS.WIRE;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Marcas a lo largo del cable
            const steps = 4;
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const p = this.getSegmentPoint(from, to, t);
                ctx.fillStyle = CONFIG.COLORS.WIRE;
                ctx.fillRect(Math.floor(p.x) - 1, Math.floor(p.y) - 1, 3, 3);
            }
        }
    }

    // --- NODOS: cuadrados pixelados ---
    drawNodes(board) {
        const ctx = this.ctx;
        const S = CONFIG.BOARD.NODE_RADIUS; // mitad del lado del cuadrado

        // Efectos de componentes debajo
        for (const node of board.nodes) {
            if (node.component) {
                this.drawComponentEffect(ctx, board, node, S);
            }
        }

        for (const node of board.nodes) {
            const blink = Math.floor(this.pulseTime + node.id) % 2 === 0;
            const comp = node.component;
            const compColor = comp ? comp.color : null;
            const x = Math.floor(node.x - S);
            const y = Math.floor(node.y - S);
            const size = S * 2;

            // Sombra pixelada
            ctx.fillStyle = '#00000044';
            ctx.fillRect(x + 3, y + 3, size, size);

            // Fondo
            let bgColor, borderColor;
            if (node.type === NODE_SOURCE) {
                bgColor = '#39ff1418';
                borderColor = CONFIG.COLORS.SOURCE_COLOR;
            } else if (node.type === NODE_OUTPUT) {
                bgColor = '#ff3a3a18';
                borderColor = CONFIG.COLORS.OUTPUT_COLOR;
            } else if (comp) {
                bgColor = compColor + '18';
                borderColor = compColor;
            } else if (node.hover) {
                bgColor = '#2a2a4e';
                borderColor = CONFIG.COLORS.ACCENT_CYAN;
            } else if (node.dieValue !== null) {
                bgColor = '#1a2a1e';
                borderColor = CONFIG.COLORS.ACCENT_GREEN;
            } else {
                bgColor = CONFIG.COLORS.BG_NODE;
                borderColor = '#ffffff15';
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, size, size);

            // Borde pixelado (3px)
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, size, size);

            // Esquinas decorativas (doble pixel en las esquinas)
            if (node.type !== 'normal' || comp) {
                const c = borderColor;
                ctx.fillStyle = c;
                // Esquinas externas
                ctx.fillRect(x - 3, y - 3, 6, 3);
                ctx.fillRect(x - 3, y - 3, 3, 6);
                ctx.fillRect(x + size - 3, y - 3, 6, 3);
                ctx.fillRect(x + size, y - 3, 3, 6);
                ctx.fillRect(x - 3, y + size, 6, 3);
                ctx.fillRect(x - 3, y + size - 3, 3, 6);
                ctx.fillRect(x + size - 3, y + size, 6, 3);
                ctx.fillRect(x + size, y + size - 3, 3, 6);
            }

            // Contenido
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (node.type === NODE_SOURCE) {
                ctx.fillStyle = CONFIG.COLORS.SOURCE_COLOR;
                ctx.font = '8px "Press Start 2P"';
                ctx.fillText('IN', node.x, node.y);
            } else if (node.type === NODE_OUTPUT) {
                ctx.fillStyle = CONFIG.COLORS.OUTPUT_COLOR;
                ctx.font = '8px "Press Start 2P"';
                ctx.fillText('OUT', node.x, node.y);
            } else if (node.dieValue !== null) {
                ctx.fillStyle = compColor || CONFIG.COLORS.ACCENT_CYAN;
                ctx.font = '16px "Press Start 2P"';
                ctx.fillText(node.dieValue, node.x, node.y - (comp ? 5 : 0));

                if (comp) {
                    ctx.font = '6px "Press Start 2P"';
                    ctx.fillStyle = compColor + 'cc';
                    const label = this.getComponentLabel(comp, node);
                    ctx.fillText(label, node.x, node.y + 14);
                }
            } else if (comp) {
                // Simbolo del componente
                ctx.font = '14px "Press Start 2P"';
                ctx.fillStyle = compColor;
                ctx.fillText(comp.symbol, node.x, node.y - 4);
                ctx.font = '5px "Press Start 2P"';
                ctx.fillStyle = compColor + 'aa';
                ctx.fillText(comp.name.toUpperCase(), node.x, node.y + 14);
            } else if (node._placeable) {
                // Nodo disponible para colocar componente — parpadeo invitando
                const blink2 = Math.floor(this.pulseTime * 2) % 2 === 0;
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = blink2 ? CONFIG.COLORS.ACCENT_YELLOW + 'cc' : CONFIG.COLORS.ACCENT_YELLOW + '55';
                ctx.fillText('SLOT', node.x, node.y);
            } else {
                // Nodo vacio: cruz pequena
                ctx.fillStyle = '#ffffff12';
                ctx.fillRect(node.x - 1, node.y - 4, 3, 9);
                ctx.fillRect(node.x - 4, node.y - 1, 9, 3);
            }
        }
    }

    getComponentLabel(comp, node) {
        switch (comp.id) {
            case 'amplifier':
                return `${node.dieValue}x2=${node.dieValue * 2}`;
            case 'capacitor':
                const stored = comp.storedValue || 0;
                return stored > 0 ? `+${stored} MEM` : 'EMPTY';
            case 'transformer':
                return `${node.dieValue}>${node.dieValue * 2}`;
            case 'shortcircuit':
                return 'LINK+';
            case 'fuse':
                return `x5 [${comp.usesLeft}]`;
            case 'splitter':
                return 'SPLIT';
            default:
                return comp.name;
        }
    }

    drawComponentEffect(ctx, board, node, S) {
        const comp = node.component;
        const pulse = Math.floor(this.pulseTime * 2 + node.id) % 2 === 0;
        const x = Math.floor(node.x);
        const y = Math.floor(node.y);

        switch (comp.ringStyle) {
            case 'mult': {
                // Cuadrado exterior parpadeante
                if (pulse) {
                    ctx.strokeStyle = comp.color + '55';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeRect(x - S - 6, y - S - 6, S * 2 + 12, S * 2 + 12);
                    ctx.setLineDash([]);
                }
                // Segundo cuadrado mas grande
                ctx.strokeStyle = comp.color + '22';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - S - 10, y - S - 10, S * 2 + 20, S * 2 + 20);
                break;
            }

            case 'charge': {
                // Barra de carga horizontal debajo del nodo
                const stored = comp.storedValue || 0;
                const fill = stored > 0 ? Math.min(stored / 6, 1) : 0;
                const barW = S * 2 - 8;
                const barH = 4;
                const barX = x - S + 4;
                const barY = y + S + 6;

                ctx.fillStyle = comp.color + '33';
                ctx.fillRect(barX, barY, barW, barH);
                if (fill > 0) {
                    ctx.fillStyle = comp.color;
                    ctx.fillRect(barX, barY, Math.floor(barW * fill), barH);
                }
                // Marco
                ctx.strokeStyle = comp.color + '66';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barW, barH);
                break;
            }

            case 'double': {
                // Doble cuadrado concentrico
                ctx.strokeStyle = comp.color + '55';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - S - 6, y - S - 6, S * 2 + 12, S * 2 + 12);
                break;
            }

            case 'arcs': {
                // Lineas rectas con angulo recto hacia nodos conectados
                if (comp.modifyEdges) {
                    const extraEdges = comp.modifyEdges(board, node.id);
                    for (const edge of extraEdges) {
                        const target = board.getNode(edge.to);
                        if (!target) continue;

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(target.x, y);
                        ctx.lineTo(target.x, target.y);
                        ctx.strokeStyle = comp.color + (pulse ? '66' : '33');
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 3]);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Marca en el destino
                        ctx.fillStyle = comp.color + '55';
                        ctx.fillRect(target.x - 3, target.y - 3, 6, 6);
                    }
                }
                break;
            }

            case 'danger': {
                // Borde rojo parpadeante
                if (pulse) {
                    ctx.strokeStyle = comp.color + '88';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - S - 4, y - S - 4, S * 2 + 8, S * 2 + 8);
                }

                // Bloques indicando usos restantes
                const uses = comp.usesLeft != null ? comp.usesLeft : 0;
                for (let i = 0; i < 2; i++) {
                    const bx = x - 8 + i * 12;
                    const by = y + S + 6;
                    ctx.fillStyle = i < uses ? comp.color : comp.color + '33';
                    ctx.fillRect(bx, by, 8, 4);
                }
                break;
            }

            case 'radial': {
                // Flechas pixeladas hacia cada vecino
                const neighbors = board.getNeighbors(node.id);
                const dashAnim = Math.floor(this.pulseTime * 8) % 2;

                for (const neighbor of neighbors) {
                    const dx = neighbor.x - x;
                    const dy = neighbor.y - y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const nx = dx / len;
                    const ny = dy / len;

                    const startX = x + nx * (S + 4);
                    const startY = y + ny * (S + 4);
                    const endX = x + nx * (S + 20);
                    const endY = y + ny * (S + 20);

                    ctx.beginPath();
                    ctx.moveTo(Math.floor(startX), Math.floor(startY));
                    ctx.lineTo(Math.floor(endX), Math.floor(endY));
                    ctx.strokeStyle = comp.color + '66';
                    ctx.lineWidth = 2;
                    ctx.setLineDash(dashAnim ? [3, 3] : [1, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Punta — cuadrado
                    ctx.fillStyle = comp.color + '88';
                    ctx.fillRect(Math.floor(endX) - 2, Math.floor(endY) - 2, 5, 5);
                }
                break;
            }
        }
    }

    // --- PREVIEW DE RUTA (durante placing) ---
    drawRoutePreview(board, result) {
        const ctx = this.ctx;
        const route = result.route;
        const pulse = (Math.sin(this.pulseTime * 2) + 1) / 2; // 0..1

        // Dibujar ruta completa con linea punteada animada
        for (let i = 0; i < route.length - 1; i++) {
            const from = board.getNode(route[i]);
            const to = board.getNode(route[i + 1]);

            // Glow sutil
            ctx.beginPath();
            this.traceSegmentPath(ctx, from, to, 1);
            ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE + '18';
            ctx.lineWidth = 8;
            ctx.stroke();

            // Linea punteada animada
            ctx.beginPath();
            this.traceSegmentPath(ctx, from, to, 1);
            ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE + '55';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -this.pulseTime * 15;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
        }

        // Marcar nodos que estan en la ruta
        const S = CONFIG.BOARD.NODE_RADIUS;
        for (const nodeId of route) {
            const node = board.getNode(nodeId);
            if (node.type === NODE_SOURCE || node.type === NODE_OUTPUT) continue;

            // Cuadrado exterior pulsante
            const expand = pulse * 3;
            ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE + '33';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                node.x - S - 3 - expand,
                node.y - S - 3 - expand,
                S * 2 + 6 + expand * 2,
                S * 2 + 6 + expand * 2
            );
        }
    }

    // --- ANIMACION DE CORRIENTE CON SCORING EN VIVO ---
    animateRoute(board, route, scoringResult, onComplete, onScoreUpdate = null) {
        this.activeRoute = route;
        this.animProgress = 0;
        const totalSegments = route.length - 1;
        if (totalSegments <= 0) {
            if (onComplete) onComplete();
            return;
        }

        // Precalcular score acumulado por nodo para mostrar durante animacion
        const nodeScores = {};  // nodeId -> { value, runningTotal }
        let running = 0;
        for (const detail of (scoringResult.details || [])) {
            running += detail.value;
            nodeScores[detail.nodeId] = { value: detail.value, runningTotal: running };
        }
        this._routeNodeScores = nodeScores;
        this._routeRunningScore = 0;
        this._routeMult = scoringResult.mult || 1;
        this._routeTotal = scoringResult.total || 0;
        this._routeBaseScore = scoringResult.baseScore || 0;

        const duration = 500 + totalSegments * 350; // un poco mas lento para que se disfrute
        const startTime = performance.now();
        let lastSegment = -1;

        const animate = (now) => {
            const elapsed = now - startTime;
            this.animProgress = clamp(elapsed / duration, 0, 1);

            this.drawBoard(board);
            this.drawActiveRoute(board, route, this.animProgress);

            const currentSeg = Math.floor(this.animProgress * totalSegments);
            if (currentSeg > lastSegment && currentSeg < totalSegments) {
                lastSegment = currentSeg;
                const from = board.getNode(route[currentSeg]);
                const to = board.getNode(route[currentSeg + 1]);

                // Intensidad basada en el progreso
                const arcIntensity = 1 + this.animProgress * 2;

                // Particulas electricas en el segmento — mas intensas a medida que avanza
                if (this.juice) {
                    this.juice.spawnElectricArc(from.x, from.y, to.x, to.y, CONFIG.COLORS.ACCENT_CYAN, arcIntensity);
                }

                // Al llegar a un nodo con dado: efecto de scoring
                const toScore = nodeScores[to.id];
                if (to.dieValue !== null && toScore) {
                    this._routeRunningScore = toScore.runningTotal;

                    // Actualizar HUD en tiempo real
                    const liveTotal = Math.round(toScore.runningTotal * this._routeMult);
                    if (onScoreUpdate) onScoreUpdate(liveTotal);

                    // Floating +valor
                    this.addFloatingText(to.x, to.y - 40, `+${toScore.value}`, CONFIG.COLORS.ACCENT_CYAN);

                    // Burst mas grande cuanto mas llevas acumulado
                    const burstCount = clamp(6 + Math.floor(this._routeRunningScore / 3) * 3, 6, 30);
                    if (this.juice) {
                        this.juice.spawnNodeBurst(to.x, to.y, CONFIG.COLORS.ACCENT_CYAN, burstCount);
                        // Chispas blancas extra si el valor es alto
                        if (toScore.value >= 5) {
                            this.juice.spawnNodeBurst(to.x, to.y, '#ffffff', Math.floor(burstCount / 3));
                        }
                        // Shake que crece con cada nodo
                        this.juice.shake(2 + Math.floor(this._routeRunningScore / 8), 100);
                        // Freeze frame al recoger puntos altos
                        if (toScore.value >= 8) {
                            this.juice.freezeFrame(40);
                        }
                    }

                    // Sonido especifico de recoger puntos
                    if (this.audio) {
                        this.audio.playNodeScore(toScore.runningTotal, this._routeBaseScore || 30);
                    }
                } else {
                    // Nodo vacio — zumbido mas bajo
                    if (this.audio) {
                        this.audio.playCurrent(this.animProgress * 0.5);
                    }
                }
            }

            // Trail de particulas siguiendo la cabeza
            if (this.juice && this.animProgress > 0.05 && this.animProgress < 0.98) {
                const segIdx2 = Math.min(Math.floor(this.animProgress * totalSegments), totalSegments - 1);
                const segFrac2 = this.animProgress * totalSegments - segIdx2;
                const f2 = board.getNode(route[segIdx2]);
                const t2 = board.getNode(route[Math.min(segIdx2 + 1, route.length - 1)]);
                const hp = this.getSegmentPoint(f2, t2, segFrac2);
                this.juice.spawnTrail(hp.x, hp.y, CONFIG.COLORS.ACCENT_CYAN, 1 + Math.floor(this.animProgress * 3));
            }

            if (this.animProgress < 1) {
                this.currentAnimation = requestAnimationFrame(animate);
            } else {
                this.activeRoute = null;
                this._routeNodeScores = null;
                if (onComplete) onComplete();
            }
        };

        this.currentAnimation = requestAnimationFrame(animate);
    }

    drawActiveRoute(board, route, progress) {
        const ctx = this.ctx;
        const totalSegments = route.length - 1;
        const currentSegment = progress * totalSegments;

        // Intensidad basada en score acumulado
        const runScore = this._routeRunningScore || 0;
        const intensity = clamp(runScore / 20, 0, 1);

        // Color que va del cyan al blanco cuanto mas score
        const glowAlpha = Math.floor(lerp(0x44, 0xcc, intensity)).toString(16).padStart(2, '0');

        for (let i = 0; i < totalSegments; i++) {
            const from = board.getNode(route[i]);
            const to = board.getNode(route[i + 1]);

            if (i < currentSegment) {
                const segProgress = clamp(currentSegment - i, 0, 1);

                // Glow — mas grueso con mas score
                const glowWidth = 8 + intensity * 8;
                ctx.beginPath();
                this.traceSegmentPath(ctx, from, to, segProgress);
                ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE + glowAlpha;
                ctx.lineWidth = glowWidth;
                ctx.stroke();

                // Linea principal
                ctx.beginPath();
                this.traceSegmentPath(ctx, from, to, segProgress);
                ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Highlight nodo alcanzado
                if (segProgress >= 1) {
                    const S = CONFIG.BOARD.NODE_RADIUS;
                    ctx.strokeStyle = CONFIG.COLORS.WIRE_ACTIVE + '88';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(to.x - S - 4, to.y - S - 4, S * 2 + 8, S * 2 + 8);
                }
            }
        }

        // Cabeza de corriente
        const segIdx = Math.min(Math.floor(currentSegment), totalSegments - 1);
        const segFrac = currentSegment - segIdx;
        const from = board.getNode(route[segIdx]);
        const to = board.getNode(route[Math.min(segIdx + 1, route.length - 1)]);
        const head = this.getSegmentPoint(from, to, segFrac);
        const headX = Math.floor(head.x);
        const headY = Math.floor(head.y);

        // Glow cuadrado — crece con intensity
        const headGlow = 10 + intensity * 8;
        ctx.fillStyle = CONFIG.COLORS.WIRE_ACTIVE + '33';
        ctx.fillRect(headX - headGlow, headY - headGlow, headGlow * 2, headGlow * 2);

        ctx.fillStyle = CONFIG.COLORS.WIRE_ACTIVE + '88';
        ctx.fillRect(headX - 6, headY - 6, 12, 12);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(headX - 3, headY - 3, 6, 6);

        // Contador de score viajando con la cabeza
        if (runScore > 0) {
            ctx.save();
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            const scoreText = `${runScore}`;
            const textY = headY - headGlow - 8;

            // Sombra
            ctx.fillStyle = '#000000';
            ctx.fillText(scoreText, headX + 2, textY + 2);

            // Color que va de cyan a amarillo a blanco
            let scoreColor;
            if (intensity < 0.3) {
                scoreColor = CONFIG.COLORS.ACCENT_CYAN;
            } else if (intensity < 0.7) {
                scoreColor = CONFIG.COLORS.ACCENT_YELLOW;
            } else {
                scoreColor = '#ffffff';
            }
            ctx.fillStyle = scoreColor;
            ctx.fillText(scoreText, headX, textY);

            // Mostrar mult si > base
            if (this._routeMult > CONFIG.SCORING.BASE_MULT) {
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = CONFIG.COLORS.ACCENT_YELLOW;
                ctx.fillText(`x${this._routeMult}`, headX, textY - 14);
            }

            ctx.restore();
        }
    }

    addFloatingText(x, y, text, color = CONFIG.COLORS.ACCENT_CYAN) {
        this.floatingTexts.push({
            x, y, text, color,
            startTime: performance.now(),
            duration: 1200,
        });
    }

    drawFloatingTexts() {
        const ctx = this.ctx;
        const now = performance.now();
        this.floatingTexts = this.floatingTexts.filter(ft => {
            const elapsed = now - ft.startTime;
            if (elapsed > ft.duration) return false;

            const t = elapsed / ft.duration;
            // Movimiento escalonado (pixelado)
            const step = Math.floor(t * 8) / 8;
            const offsetY = -40 * step;
            const alpha = Math.max(0, 1 - step * 1.2);

            if (alpha <= 0) return false;

            ctx.save();
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Sombra
            ctx.fillStyle = '#000000';
            ctx.fillText(ft.text, ft.x + 2, ft.y + offsetY + 2);

            // Texto
            const a = Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillStyle = ft.color + a;
            ctx.fillText(ft.text, ft.x, ft.y + offsetY);
            ctx.restore();
            return true;
        });
    }

    drawTooltip(board) {
        // Buscar nodo con hover que tenga componente
        const node = board.nodes.find(n => n.hover && n.component);
        if (!node) return;

        const ctx = this.ctx;
        const comp = node.component;
        const S = CONFIG.BOARD.NODE_RADIUS;

        const name = comp.name.toUpperCase();
        const desc = comp.desc;
        const extra = this.getTooltipExtra(comp, node);

        const lines = [name, '', desc];
        if (extra) lines.push('', extra);

        // Medir ancho
        ctx.font = '7px "Press Start 2P"';
        let maxW = 0;
        for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > maxW) maxW = w;
        }

        const padX = 10;
        const padY = 8;
        const lineH = 14;
        const boxW = maxW + padX * 2;
        const boxH = lines.length * lineH + padY * 2;

        // Posicionar arriba del nodo, centrado
        let tx = Math.floor(node.x - boxW / 2);
        let ty = Math.floor(node.y - S - boxH - 12);

        // Clamp dentro del canvas
        tx = clamp(tx, 4, this.canvas.width - boxW - 4);
        ty = clamp(ty, 4, this.canvas.height - boxH - 4);

        // Sombra
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(tx + 3, ty + 3, boxW, boxH);

        // Fondo
        ctx.fillStyle = '#12121f';
        ctx.fillRect(tx, ty, boxW, boxH);

        // Borde
        ctx.strokeStyle = comp.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, boxW, boxH);

        // Esquinas decorativas
        ctx.fillStyle = comp.color;
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
        ctx.fillRect(tx + boxW - 2, ty - 2, 4, 4);
        ctx.fillRect(tx - 2, ty + boxH - 2, 4, 4);
        ctx.fillRect(tx + boxW - 2, ty + boxH - 2, 4, 4);

        // Texto
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            const lineY = ty + padY + i * lineH;
            if (i === 0) {
                // Nombre — color del componente
                ctx.font = '7px "Press Start 2P"';
                ctx.fillStyle = comp.color;
            } else if (lines[i] === '') {
                continue;
            } else if (i === lines.length - 1 && extra) {
                // Linea extra — amarillo
                ctx.font = '6px "Press Start 2P"';
                ctx.fillStyle = CONFIG.COLORS.ACCENT_YELLOW;
            } else {
                // Descripcion — gris claro
                ctx.font = '6px "Press Start 2P"';
                ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
            }
            ctx.fillText(lines[i], tx + padX, lineY);
        }

        // Flecha apuntando al nodo
        const arrowX = Math.floor(node.x);
        const arrowY = ty + boxH;
        ctx.fillStyle = comp.color;
        ctx.fillRect(arrowX - 3, arrowY, 6, 3);
        ctx.fillRect(arrowX - 1, arrowY + 3, 2, 3);
    }

    getTooltipExtra(comp, node) {
        switch (comp.id) {
            case 'amplifier':
                return node.dieValue ? `AHORA: ${node.dieValue} x2 = ${node.dieValue * 2}` : null;
            case 'capacitor':
                const s = comp.storedValue || 0;
                return s > 0 ? `GUARDADO: +${s} PTS` : 'SIN CARGA';
            case 'transformer':
                return node.dieValue ? `AHORA: ${node.dieValue} > ${node.dieValue * 2}` : null;
            case 'fuse':
                return `USOS: ${comp.usesLeft || 0}/2`;
            case 'shortcircuit':
                return '+2 CONEXIONES EXTRA';
            case 'splitter':
                return 'TODA RUTA SUMA';
            default:
                return null;
        }
    }

    stopAnimation() {
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
            this.currentAnimation = null;
        }
    }
}

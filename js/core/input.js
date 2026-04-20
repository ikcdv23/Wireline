// === INPUT: DRAG & DROP DE DADOS AL TABLERO ===

class InputHandler {
    constructor(canvas, board, diceManager, onDiePlaced, onDieRemoved) {
        this.canvas = canvas;
        this.board = board;
        this.diceManager = diceManager;
        this.onDiePlaced = onDiePlaced;
        this.onDieRemoved = onDieRemoved;
        this.enabled = false;

        this.setupCanvasDropZone();
        this.setupCanvasClick();
    }

    enable() { this.enabled = true; }
    disable() { this.enabled = false; }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    setupCanvasDropZone() {
        this.canvas.addEventListener('dragover', (e) => {
            if (!this.enabled) return;
            e.preventDefault();
            const pos = this.getCanvasPos(e);
            // Highlight nodo bajo el cursor
            this.board.nodes.forEach(n => n.hover = false);
            const node = this.board.getNodeAtPosition(pos.x, pos.y);
            if (node && node.type !== NODE_SOURCE && node.type !== NODE_OUTPUT && node.dieValue === null) {
                node.hover = true;
            }
        });

        this.canvas.addEventListener('dragleave', () => {
            this.board.nodes.forEach(n => n.hover = false);
        });

        this.canvas.addEventListener('drop', (e) => {
            if (!this.enabled) return;
            e.preventDefault();
            this.board.nodes.forEach(n => n.hover = false);

            const dieId = parseInt(e.dataTransfer.getData('text/plain'));
            const pos = this.getCanvasPos(e);
            const node = this.board.getNodeAtPosition(pos.x, pos.y);

            if (node && node.type !== NODE_SOURCE && node.type !== NODE_OUTPUT && node.dieValue === null) {
                const die = this.diceManager.getDie(dieId);
                if (die && !die.placed) {
                    this.board.placeDieOnNode(node.id, die.value);
                    this.diceManager.placeDie(dieId, node.id);
                    if (this.onDiePlaced) this.onDiePlaced(die, node);
                }
            }
        });
    }

    setupCanvasClick() {
        // Click derecho para quitar un dado del nodo
        this.canvas.addEventListener('contextmenu', (e) => {
            if (!this.enabled) return;
            e.preventDefault();
            const pos = this.getCanvasPos(e);
            const node = this.board.getNodeAtPosition(pos.x, pos.y);

            if (node && node.dieValue !== null) {
                this.board.removeDieFromNode(node.id);
                const die = this.diceManager.removeDieFromNode(node.id);
                if (die && this.onDieRemoved) this.onDieRemoved(die, node);
            }
        });

        // Hover visual
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.enabled) return;
            const pos = this.getCanvasPos(e);
            this.board.nodes.forEach(n => {
                n.hover = dist(pos.x, pos.y, n.x, n.y) <= CONFIG.BOARD.NODE_RADIUS * 1.3
                    && n.type !== NODE_SOURCE && n.type !== NODE_OUTPUT;
            });
        });
    }
}

// Gestor de dados: inventario persistente entre rondas, tirada, reroll,
// colocacion y bandeja visual en el DOM.

import { DIE_TYPES } from '../config/dieTypes.js';
import { randInt } from '../lib/math.js';

export class DiceManager {
  constructor() {
    this.dice = [];
    // Inventario persistente de dados entre rondas. Empieza con 5x d6.
    this.inventory = [
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
    ];
  }

  roll() {
    this.dice = [];
    for (let i = 0; i < this.inventory.length; i++) {
      const inv = this.inventory[i];
      const def = DIE_TYPES[inv.type];
      this.dice.push({
        id: i,
        type: inv.type,
        faces: def.faces,
        value: randInt(1, def.faces),
        placed: false,
        nodeId: null,
        color: def.color,
        name: def.name,
      });
    }
    return this.dice;
  }

  // Re-tirar solo los dados que aun no se colocaron
  reroll(dieIds) {
    const kept = this.dice.filter((d) => dieIds.includes(d.id));
    this.dice = kept.map((d, i) => ({
      ...d,
      id: i,
      value: randInt(1, d.faces),
      placed: false,
      nodeId: null,
    }));
    return this.dice;
  }

  getDie(id) {
    return this.dice.find((d) => d.id === id);
  }

  placeDie(dieId, nodeId) {
    const die = this.getDie(dieId);
    if (die) {
      die.placed = true;
      die.nodeId = nodeId;
    }
  }

  removeDieFromNode(nodeId) {
    const die = this.dice.find((d) => d.nodeId === nodeId);
    if (die) {
      die.placed = false;
      die.nodeId = null;
    }
    return die;
  }

  getPlacedDice() {
    return this.dice.filter((d) => d.placed);
  }

  getUnplacedDice() {
    return this.dice.filter((d) => !d.placed);
  }

  // --- Gestion de inventario ---

  addDie(type) {
    this.inventory.push({ type });
  }

  removeDie(index) {
    if (index >= 0 && index < this.inventory.length) {
      this.inventory.splice(index, 1);
    }
  }

  upgradeDie(index) {
    const order = ['d4', 'd6', 'd8', 'd10', 'd12'];
    const current = this.inventory[index];
    if (!current) return false;
    const idx = order.indexOf(current.type);
    if (idx < order.length - 1) {
      current.type = order[idx + 1];
      return true;
    }
    return false;
  }

  getInventorySummary() {
    const counts = {};
    for (const die of this.inventory) {
      counts[die.type] = (counts[die.type] || 0) + 1;
    }
    return counts;
  }

  reset() {
    this.dice = [];
  }

  fullReset() {
    this.dice = [];
    this.inventory = [
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
      { type: 'd6' },
    ];
  }

  renderTray(container) {
    container.innerHTML = '';
    this.dice.forEach((die) => {
      const el = document.createElement('div');
      el.className = 'die' + (die.placed ? ' placed' : '');
      el.dataset.dieId = die.id;
      el.style.borderColor = die.color;
      el.style.color = die.color;
      el.style.boxShadow = `4px 4px 0px ${die.color}33`;

      el.innerHTML = `
                <span class="die-value">${die.value}</span>
                <span class="die-type">${die.name}</span>
            `;

      if (!die.placed) {
        el.draggable = true;
        el.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', die.id.toString());
          el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => {
          el.classList.remove('dragging');
        });
      }
      container.appendChild(el);
    });
  }
}

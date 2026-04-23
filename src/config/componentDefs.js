import { NODE_SOURCE, NODE_OUTPUT } from './constants.js';
import { dist } from '../lib/math.js';

export const COMPONENT_DEFS = [
    /*
  - CAPACITOR
  */
  {
    id: 'capacitor',
    name: 'Condensador',
    desc: 'Suma los puntos del dado anterior al actual',
    price: 5,
    rarity: 'common',
    symbol: '⮂',
    color: '#40ff90',
    ringStyle: 'charge',
    storedValue: 0,
    effect(node) {
      if (!node.dieValue) return {};
      return { addFlat: this.storedValue };
    },
    onScore(node) {
      if (node.dieValue) {
        this.storedValue = node.dieValue;
      }
    },
    onRoundEnd(_node) {
      this.storedValue = 0;
    },
    getLabel(_node) {
      const stored = this.storedValue || 0;
      return stored > 0 ? `+${stored} MEM` : 'EMPTY';
    },
    getTooltipExtra(_node) {
      const s = this.storedValue || 0;
      return s > 0 ? `GUARDADO: +${s} PTS` : 'SIN CARGA';
    },
  },
  /*
  - TRANSFORMER
  */
  {
    id: 'transformer',
    name: 'Transformador',
    desc: 'El dado en este nodo cuenta doble',
    price: 6,
    rarity: 'uncommon',
    symbol: '⇆',
    color: '#00f0ff',
    ringStyle: 'double',
    effect(_node) {
      return { doubleDie: true };
    },
    getLabel(node) {
      return `${node.dieValue}>${node.dieValue * 2}`;
    },
    getTooltipExtra(node) {
      return node.dieValue
        ? `AHORA: ${node.dieValue} > ${node.dieValue * 2}`
        : null;
    },
  },
  /*
  - OVERLOAD
  */
  {
    id: 'overload',
    name: 'Sobretension',
    desc: 'x2 multi solo si el dado es maximo en su tipo',
    price: 6,
    rarity: 'uncommon',
    symbol: '⇅',
    color: '#ff39a8',
    ringStyle: 'invert',
    effect(node) {
      if (node.dieFaces && node.dieValue === node.dieFaces) {
        return { addMult: 2.0 };
      }
      return {};
    },
    getLabel(node) {
      if (node.dieValue === node.dieFaces) return `${node.dieValue} MAX!`;
      return `${node.dieValue}`;
    },
    getTooltipExtra(node) {
      if (!node.dieValue) return null;
      if (node.dieValue !== node.dieFaces) return 'INACTIVO';
      return `AHORA: ${node.dieValue} → ${node.dieValue * 2}`;
    },
  },
    /*
  - APLIFIER
  */
  {
    id: 'amplifier',
    name: 'Amplificador',
    desc: 'x2 mult en este nodo',
    price: 12,
    rarity: 'rare',
    symbol: '×',
    color: '#ffe156',
    ringStyle: 'mult',
    effect(_node) {
      return { addMult: 2.0 };
    },
    getLabel(node) {
      return `${node.dieValue}x2=${node.dieValue * 2}`;
    },
    getTooltipExtra(node) {
      return node.dieValue
        ? `AHORA: ${node.dieValue} x2 = ${node.dieValue * 2}`
        : null;
    },
  },  
  /*
  - FUSE
  */
  {
    id: 'fuse',
    name: 'Fusible',
    desc: 'x5 mult pero se destruye en 2 usos',
    price: 12,
    rarity: 'rare',
    symbol: '☢',
    color: '#ff4060',
    ringStyle: 'danger',
    usesLeft: 2,
    effect(_node) {
      if (this.usesLeft > 0) return { addMult: 5.0 };
      return {};
    },
    onScore(_node) {
      if (this.usesLeft > 0) this.usesLeft--;
    },
    getLabel(_node) {
      return `x5 [${this.usesLeft}]`;
    },
    getTooltipExtra(_node) {
      return `USOS: ${this.usesLeft || 0}/2`;
    },
  },
    /*
  - INVERTER
  */
  {
    id: 'inverter',
    name: 'Inversor',
    desc: 'Invierte el valor del dado (1↔N, 2↔N-1...). Rescata tiradas bajas, penaliza altas',
    price: 5,
    rarity: 'common',
    symbol: '⇌',
    color: '#60a0ff',
    ringStyle: 'mult',
    effect(node) {
      if (!node.dieValue || !node.dieFaces) return {};
      const inverted = node.dieFaces + 1 - node.dieValue;
      return { addFlat: inverted - node.dieValue };
    },
    getLabel(node) {
      if (!node.dieValue) return 'INV';
      const inverted = node.dieFaces + 1 - node.dieValue;
      return `${node.dieValue}>${inverted}`;
    },
    getTooltipExtra(node) {
      if (!node.dieValue) return null;
      const inverted = node.dieFaces + 1 - node.dieValue;
      return `AHORA: ${node.dieValue} > ${inverted}`;
    },
  },
  /*
  - CRITICAL
  */
  {
    id: 'critical',
    name: 'Acumulador Critico',
    desc: 'Carga 3 activaciones, luego suelta x3 mult y resetea',
    price: 10,
    rarity: 'rare',
    symbol: '◉',
    color: '#e0e0ff',
    ringStyle: 'charge',
    storedValue: 0,
    effect(_node) {
      if (this.storedValue + 2 >= 6) return { addMult: 3.0 };
      return {};
    },
    onScore(_node) {
      this.storedValue += 2;
      if (this.storedValue >= 6) {
        this.storedValue = 0;
      }
    },
    onRoundEnd(_node) {
      this.storedValue = 0;
    },
    getLabel(_node) {
      const step = this.storedValue / 2;
      if (step === 2) return 'CRIT!';
      return `CHG ${step}/3`;
    },
    getTooltipExtra(_node) {
      const step = this.storedValue / 2;
      if (step === 2) return 'PROXIMA: x3 MULT';
      return `CARGA: ${step}/3`;
    },
  },
];

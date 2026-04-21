// Gestor de componentes: genera items aleatorios de tienda y clona instancias
// fresh a partir de las definiciones globales.

import { COMPONENT_DEFS } from '../config/componentDefs.js';
import { shuffleArray } from '../lib/math.js';

export class ComponentManager {
  getRandomShopItems(count = 3, playerMoney = 0) {
    const available = COMPONENT_DEFS.filter((c) => c.price <= playerMoney + 4);
    const shuffled = shuffleArray(available);
    return shuffled.slice(0, count).map((def) => ({
      ...def,
      // Clonar para que cada instancia sea independiente
      usesLeft: def.usesLeft,
      storedValue: def.storedValue || 0,
    }));
  }

  createInstance(defId) {
    const def = COMPONENT_DEFS.find((d) => d.id === defId);
    if (!def) return null;
    return { ...def, usesLeft: def.usesLeft, storedValue: def.storedValue || 0 };
  }
}

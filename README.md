# Wireline

> **v2.1.1** · Vanilla JS + Canvas 2D + Web Audio API · Build con Vite

Roguelike de dados y circuitos. Coloca dados en los nodos del tablero, activa la corriente y maximiza la puntuacion con componentes que alteran el scoring. Inspirado en Balatro.

---

## Arrancar el proyecto

```
npm install       # una sola vez, instala Vite
npm run dev       # servidor de desarrollo con HMR en http://localhost:5173
npm run build     # bundle optimizado en dist/
npm run preview   # previsualiza el build
```

Requiere Node 18 o superior. Recomendado tener la consola del navegador (F12) abierta durante el desarrollo — los stack traces apuntan al archivo y linea reales.

---

## Estructura

```
src/
├── main.js               Entry point: splash, menu, arranque
├── Game.js               Orquestador principal
├── config/               Datos del juego (sin logica)
│   ├── constants.js      CONFIG global: balance, colores, zonas
│   ├── dieTypes.js       Definiciones de dados (d4 a d12)
│   ├── boardPatterns.js  Topologias de los 4 tableros
│   └── componentDefs.js  Definiciones de los componentes comprables
├── entities/             Modelo con estado mutable
│   ├── Board.js          Grafo de nodos + aristas + dados colocados
│   ├── DiceManager.js    Inventario de dados + tirada + reroll
│   └── ComponentManager.js  Genera items de tienda, clona instancias
├── systems/              Logica que opera sobre entities
│   ├── ScoringEngine.js  Pathfinding DFS + calculo de puntuacion
│   ├── Renderer.js       Dibujo canvas + animacion de corriente
│   ├── InputHandler.js   Drag & drop, hover, click derecho
│   ├── AudioEngine.js    Sintesis de sonidos via Web Audio
│   ├── JuiceEngine.js    Screen shake, particulas, flashes
│   └── MenuMusic.js      Fade in/out del theme del menu
├── ui/                   Codigo que habla con el DOM
│   ├── HUD.js            Ronda, zona, score, vidas, dinero
│   ├── Modal.js          Abrir/cerrar overlays con animacion
│   └── Shop.js           Tienda con pestañas: circuitos, dados, cofres
└── lib/
    └── math.js           randInt, lerp, dist, clamp, shuffleArray, easings

public/                   Assets servidos estaticamente
└── audio/
    └── theme.mp3

index.html                HTML raiz, carga src/main.js como modulo
vite.config.js            Config minima del dev server + build
```

---

## Arquitectura: que va donde

Cada carpeta responde una pregunta. Si algun dia dudas donde poner un archivo, contesta la pregunta y la carpeta sale sola.

| Carpeta | Pregunta que responde |
|---|---|
| `config/` | "¿Que datos define el juego?" — constantes, tablas, defs. Sin logica. |
| `entities/` | "¿Que cosas tienen estado propio?" — tablero, dados, inventario. |
| `systems/` | "¿Que maquinaria opera sobre entities?" — scoring, render, audio, FX. |
| `ui/` | "¿Que codigo habla con el DOM?" — HUD, modales, tienda. |
| `lib/` | "¿Que utils son ajenos al dominio?" — mates, aleatoriedad. |

---

## Convenciones de codigo

- **PascalCase** en archivos que exportan una clase (`DiceManager.js`, `Board.js`).
- **camelCase** en archivos de datos o utilidades (`constants.js`, `math.js`).
- **Un concepto por archivo** siempre que sea posible.
- **Imports relativos** con extension `.js` explicita.
- **Parametros no usados** prefijados con `_` (ej. `getLabel(_node)`) para silenciar hints del linter.
- **`===` siempre**; nunca `==` (evita coercion de tipos inesperada).

---

## Como añadir un componente

La mayoria del contenido nuevo del juego son componentes. Todo vive en `src/config/componentDefs.js` y, salvo visuales totalmente nuevos, no necesitas tocar nada mas.

### 1. Define el componente

Añade una entrada al array `COMPONENT_DEFS`:

```javascript
{
  id: 'uniqueId',            // string unico
  name: 'Nombre',            // mostrado en tienda y tooltip
  desc: 'Descripcion corta', // explicacion para el jugador
  price: 6,                  // coste en tienda
  rarity: 'common',          // decorativo (de momento no gatea nada)
  symbol: '×',               // unicode mostrado dentro del nodo
  color: '#ffd700',          // color principal del componente
  ringStyle: 'mult',         // visual del efecto — ver lista abajo

  apply(node) { ... },                    // opcional
  modifyEdges(board, nodeId) { ... },     // opcional
  getLabel(node) { ... },                 // opcional
  getTooltipExtra(node) { ... },          // opcional
}
```

### 2. Implementa al menos uno de los metodos

Segun lo que haga el componente:

**`apply(node)`** — se llama cuando la corriente pasa por el nodo durante el scoring. Devuelve un objeto con los efectos:

| Propiedad | Efecto |
|---|---|
| `addMult: N` | multiplica el mult total por N |
| `addFlat: N` | suma N al valor del dado (antes de multiplicar) |
| `doubleDie: true` | duplica el valor del dado |
| `{}` (o no devolver nada) | sin efecto |

Dentro de `apply`, `this` es la instancia del componente — puedes guardar estado ahi entre activaciones (ej. `this.storedValue` del condensador, `this.usesLeft` del fusible).

**`modifyEdges(board, nodeId)`** — se llama durante el pathfinding. Devuelve un array de aristas extra `{ from, to }`. Solo usalo si el componente cambia la topologia del grafo (como shortcircuit).

### 3. Expon el estado al jugador

- **`getLabel(node)`** — string corto (3-6 chars) que aparece dentro del nodo junto al valor del dado. Devuelve un string.
- **`getTooltipExtra(node)`** — linea amarilla extra en el tooltip de hover. Devuelve un string, o `null` si en ese estado no quieres mostrar linea extra.

Ambos son opcionales. Si no los defines, el Renderer usa `comp.name` como label y no muestra linea extra.

### Datos disponibles en `node`

Cualquiera de los metodos recibe `node` con estos campos utiles:

| Campo | Descripcion |
|---|---|
| `node.dieValue` | valor del dado colocado (1..N) o `null` si no hay dado |
| `node.dieFaces` | caras del dado colocado (4, 6, 8, 10, 12) o `null` |
| `node.id` | id del nodo en el grafo |
| `node.x, node.y` | posicion pixel en canvas |
| `node.type` | `'source'`, `'output'`, o `'normal'` |
| `node.component` | la propia instancia del componente |
| `node.hover` | `true` cuando el cursor esta encima |

### ringStyles disponibles

Controla la decoracion visual del nodo cuando tiene el componente. Reutiliza uno existente si puedes:

| ringStyle | Aspecto |
|---|---|
| `mult` | anillo doble pulsante (amplifier) |
| `charge` | barra de carga horizontal (condensador) |
| `double` | cuadrado exterior fijo (transformador) |
| `arcs` | arcos punteados a vecinos extra (cortocircuito) |
| `danger` | borde parpadeante + contador de usos (fusible) |
| `radial` | rayos hacia todos los vecinos (divisor) |
| `invert` | borde dashed + etiqueta de estado MAX (sobretension) |

Si necesitas un visual nuevo, añade un `case` en `drawComponentEffect` de `src/systems/Renderer.js`.

### Ejemplo completo: componente condicional

```javascript
{
  id: 'overload',
  name: 'Sobretension',
  desc: 'Dispara 2 veces solo si el dado es maximo en su tipo',
  price: 10,
  rarity: 'uncommon',
  symbol: '⇅',
  color: '#ff39a8',
  ringStyle: 'invert',
  apply(node) {
    if (node.dieFaces && node.dieValue === node.dieFaces) {
      return { doubleDie: true };
    }
    return {};
  },
  getLabel(node) {
    return node.dieValue === node.dieFaces
      ? `${node.dieValue} MAX!`
      : `${node.dieValue}`;
  },
  getTooltipExtra(node) {
    if (!node.dieValue) return null;
    if (node.dieValue !== node.dieFaces) return 'INACTIVO';
    return `AHORA: ${node.dieValue} → ${node.dieValue * 2}`;
  },
},
```

---

## Otras extensiones

- **Zona nueva**: patron en `src/config/boardPatterns.js` + entrada en `CONFIG.ZONES` de `src/config/constants.js`.
- **Dado nuevo**: entrada en `src/config/dieTypes.js`.
- **Sonido nuevo**: metodo nuevo en `src/systems/AudioEngine.js`.
- **Juice/FX nuevo**: metodo nuevo en `src/systems/JuiceEngine.js`.

---

## Tips de desarrollo

- **HMR**: cuando editas un archivo, Vite recarga solo ese modulo sin reiniciar la partida. Perfecto para tunear balance en `constants.js` o ajustar FX en caliente.
- **Source maps**: los errores del navegador apuntan al archivo y linea reales, no a un bundle minificado.
- **Inspeccionar estado desde la consola**: por defecto `game` vive en el scope del modulo y no es accesible. Si quieres debuggear desde devtools, añade `window.game = game;` temporalmente en `src/main.js`.

---

## Bugs conocidos

- **Dinero negativo en la tienda**: comprar dos componentes seguidos cuando solo te alcanza para uno deja el saldo en negativo. Causa: closure obsoleto en `renderComponents` de `src/ui/Shop.js`. Fix pendiente para la Fase 5 del refactor.

---

## Versionado

Esquema `MAJOR.MINOR.PATCH`:

| Bump | Cuando | Ejemplo |
|---|---|---|
| **PATCH** (`2.1.X`) | Contenido nuevo sin cambio estructural: componentes, dados, patrones, balance. | Añadir Sobretension: 2.1.0 → 2.1.1 |
| **MINOR** (`2.X.0`) | Feature estructural o fase del refactor. | Completar Fase 2 (Screen Manager): 2.1.X → 2.2.0 |
| **MAJOR** (`X.0.0`) | Rework grande o breaking change. | Cambio de engine, multiplayer, sistema de save slots. |

Al hacer bump de version, actualiza **3 sitios** (hoy son fuentes de verdad duplicadas):

1. `package.json` → campo `version`
2. `index.html` → elemento con id `splash-sub` y texto del `menu-footer`
3. Este README → linea del encabezado y titulo de esta seccion si hace falta

> **TODO futuro**: centralizar la version en `package.json` y exponerla via `define` en `vite.config.js` para que HTML y UI la lean dinamicamente. Asi solo hay una fuente de verdad.

---

## Roadmap del refactor

- [x] **Fase 1** — Modulos ES6 + Vite: codebase migrado desde scripts classic a imports/exports. Estructura `src/` con capas claras.
- [ ] **Fase 2** — Screen Manager: centralizar pantallas (menu, partida, shop, gameover) en clases con `mount` / `unmount`. Eliminar el `document.getElementById` disperso.
- [ ] **Fase 3** — Separar logica de presentacion en `Game` (hoy mezcla loop, reglas, DOM y FX).
- [ ] **Fase 4** — Estado unico + event bus. Hoy el estado esta repartido en `Game.state`, `Game.roundScore`, `DiceManager.inventory`, `Board.nodes[].component`, etc.
- [ ] **Fase 5** — Bugs conocidos + calidad.

---

## Creditos

- **Codigo y diseño**: javatoDev
- **Musica original**: javatoDev (prod. ntr) — theme del menu compuesto en FL Studio (`public/audio/theme.mp3`)
- **Inspiracion conceptual**: [Balatro](https://www.playbalatro.com/) (LocalThunk)

---

## Licencia

Sin licencia publica definida. Todos los derechos reservados. La musica original es obra del autor — no reutilizar sin permiso.

# Handoff para la proxima sesion de Claude

> Documento de transicion entre sesiones. Ultima actualizacion: **2026-04-22**.
> Escrito por la sesion anterior para que la siguiente entre en contexto rapido.

## Como esta el proyecto

Wireline va por la **v2.2.0**. El juego funciona y es jugable. **Fase 2 del refactor cerrada en lo esencial** (Splash, Menu, Pausa, GameOver, Changelog migradas a clases con mount/unmount). Shop pendiente (ver abajo).

**Nota importante**: el usuario puede trabajar desde dos PCs. Si hay commits recientes en git que no esperabas, es que venian del otro PC. Sincronizar antes de tocar cualquier cosa.

## Colaboracion con el usuario

El usuario aprende mientras refactoriza. **Tutor-style, WHY antes del WHAT** — pero **codigo concreto primero, explicacion bloque a bloque despues**. No soltar teoria por delante. Analogia que el uso: "es como si me dijeras que escriba una tortilla en ingles, se hacer la tortilla pero no se escribir en ingles".

**Regla acordada en esta sesion**: 10 minutos en papel antes de preguntar. Traer **hipotesis**, no problema crudo. Rol de rubber duck, no oraculo. Ver memoria `feedback_user_autonomy.md`.

**Lo que sabe a dia de hoy**:
- Clases ES6, `constructor`, `this`, metodos, `bind`.
- `export` / `import` con extension `.js`.
- Destructuring en parametros.
- `addEventListener` / `removeEventListener` con referencias estables.
- `requestAnimationFrame` / `cancelAnimationFrame`.
- Patron de callbacks (`onDone`, `onStart`, `onClose`).
- Screen Manager y mount/unmount.
- El `||` como condicional (operador de coalescencia).
- Early return / guard clauses.
- Que `apply()` en el motor era PURO + MUTADOR y por que eso era un problema.
- Preview vs score / evaluacion pura vs commit.

**Lo que NO quiere tocar**: CSS. Delega visuales en Claude.

**Tropiezos recurrentes a vigilar**:
- Confunde "crear pantalla" (`new`) con "montarla" (`mount()`).
- No abre la consola por defecto. Si peta algo, recordarle F12 → Console.
- ES Modules + strict mode → variables inexistentes lanzan `ReferenceError` (le paso con `dieFaces` a secas en vez de `node.dieFaces`).
- Typos de IDs HTML rompen sin aviso.

## Que hicimos en la sesion 2026-04-22 (larga, mucha miga)

### 1. Memoria migrada a la ruta correcta
Las memorias previas vivian en el slug del directorio padre (`Proyectos-DEV`). Esta sesion se abrio desde `wireline/` — slug distinto, memoria vacia. Migradas 8 memorias nuevas especificas a esta ruta (user background, teaching mode, no-coauthor, powershell, hard rules, project state, obsidian, handoff).

### 2. Cierre de Fase 2
- `GameOverScreen` extraida con estado dinamico (`round`, `score`, `title`, `victory`).
- `PauseScreen` extraida con callback `afterClose` para reactivar input.
- `ChangelogScreen` nueva — modal accesible desde el menu con banner pulsante "vX.X.X IS HERE !!!".

Shop pendiente de migrar a API uniforme (`mount`/`unmount` en vez de `open`/`onClose`). Lo hablamos y decidimos aparcarlo.

### 3. Refactor gordo del ScoringEngine
Problema detectado: el motor corria la misma logica para preview (colocar dado) y para activar, y los componentes con estado mutable (Condensador, Fusible, Critico) sufrian side-effects silenciosos. El preview gastaba usos del Fusible y cargaba el Critico.

Refactor aplicado:
- `previewBestRoute(board)` — puro, sin side effects.
- `scoreBestRoute(board)` — con commit, muta estado solo en la ruta activada.
- Split por componente: `effect(node)` (calcula) + `onScore(node)` (muta).
- `_commitRoute` aislado del resto de evaluacion.
- Fix adicional: el motor **solo llama a `effect`/`onScore` si hay dado en el nodo** (contrato "el componente activa cuando pones un dado encima").

El usuario siguio la implementacion y acabo encontrando un bug que se me escapo: `onScore` tenia que tener el mismo guard `node.dieValue` en `_commitRoute`. Lo arreglamos juntos.

### 4. Componentes
- **Nuevos**: Inversor ($5, common) e Acumulador Critico ($10, rare — carga 3 activaciones, dispara x3 mult).
- **Eliminados**: Cortocircuito y Divisor. El `splitter` hardcodeado en ScoringEngine tambien limpiado.
- **Rebalance**: Sobretension pasa de x2 a x3 mult ($4); Amplificador $8→$12; Fusible $8→$12; Sobretension $1→$4.
- **Bug fix Condensador**: linea `storedValue = dieValue || 0` reseteaba la memoria a 0 cuando el nodo estaba vacio. Refactorizado a `effect` + `onScore` + `onRoundEnd`.

### 5. UI/UX
- Juego a pantalla completa (quitados los caps `max-width: 1400px` y `max-height: 900px`).
- Panel de controles unificado (`#control-panel`) que agrupa dados + botones con borde cian arriba y abajo, levantado 40px del suelo para que los botones queden mas cerca del tablero.
- HUD e iconos ampliados (+20-30%) para mejor legibilidad.
- Modal de desglose (#score-breakdown) ampliado con `min-width: 420px`.
- **Banner "v2.2.0 IS HERE !!!"** en el menu, pulsante, con sheen animado cian. Clicable → abre ChangelogScreen con las novedades.
- ChangelogScreen scrollable, entrada `is-latest` destacada con borde cian y badge LATEST amarillo.

### 6. Version bump a 2.2.0
3 sitios sincronizados: `package.json`, `index.html` (splash-sub + menu-footer), `README.md` (header).

## Estado actual de archivos clave

```
src/
├── main.js               Orquestador (menu, splash, changelog, manager)
├── Game.js               Sigue siendo monolito — Fase 3 lo separara
├── config/
│   ├── changelog.js      ✅ Nuevo — historial de versiones
│   ├── componentDefs.js  ✅ 7 componentes (eliminados split y short)
│   ├── constants.js, dieTypes.js, boardPatterns.js
├── screens/
│   ├── SplashScreen.js   ✅
│   ├── MenuScreen.js     ✅ (ahora con onChangelog)
│   ├── ChangelogScreen.js ✅ Nueva
│   ├── GameOverScreen.js ✅
│   ├── PauseScreen.js    ✅
│   ├── ScreenManager.js  ✅
│   └── ui/               HUD, Modal, Shop (widgets DOM)
├── entities/, systems/, lib/
└── systems/ScoringEngine.js  ✅ Refactorizado preview/score
```

## Que viene despues

**El usuario ha dicho que despues de cerrar esta sesion me pedira "algo gordo pero necesario"**. No se que es. Al retomar, esperar a que lo explique.

**Pendiente conocido**:
1. **Shop** a API uniforme (`mount`/`unmount`). Trabajo medio, 30 min.
2. **Fase 3**: separar logica/presentacion en `Game.js`. Incluye crear `GameScreen` que envuelva `#game-container`. 3-5 sesiones.
3. **Tutorial real** (ahora es placeholder que hace `console.log`).
4. **Generacion procedural de zonas** (idea que planteo el usuario).

**Bugs conocidos pendientes**:
- **Dinero negativo en shop**: closure obsoleto en `renderComponents` de `src/screens/ui/Shop.js`. Diferido a Fase 5.
- `_combineAllRoutes` en `ScoringEngine` es codigo muerto desde que eliminamos el Divisor. Se puede borrar limpio.

## Reglas duras del usuario

- **Nunca usa `ç`** — dedazo (Enter pegado). Corregir tacitamente.
- **Handles publicos**: `javatoDev` (dev) y `javatoDev (prod. ntr)` para musica. NO "javier".
- **Musica del menu**: composicion propia en FL Studio. Respetar autoria.
- **Distribucion**: itch.io HTML5 primario, Electron Win+Linux despues. No Mac, no Rust.
- **Commits SIN Co-Authored-By** de Claude.
- **PowerShell 5.1**: no soporta `&&`, usar `;` en comandos manuales.

## Referencias

- `README.md` del proyecto — arquitectura, convenciones, como añadir componentes.
- `src/config/changelog.js` — historial de versiones.
- Vault Obsidian del usuario (multi-proyecto) — ver memoria `reference_obsidian_vault.md`.
- Memorias en `.claude/projects/c--Users-alcat-OneDrive-Desktop-Proyectos-DEV-wireline/memory/`.

---

Suerte, proxima sesion. El usuario hace commit y baja el repo en otro PC — asume que el estado de git es la fuente de verdad.

# Handoff para la proxima sesion de Claude

> Documento de transicion entre sesiones. Ultima actualizacion: **2026-04-23**.
> Escrito por la sesion anterior para que la siguiente entre en contexto rapido.

## Como esta el proyecto

Wireline va por la **v2.2.0**. El juego funciona y es jugable. **Fase 2 del refactor cerrada en lo esencial** (Splash, Menu, Pausa, GameOver, Changelog migradas a clases con mount/unmount; ScreenManager activo; Game.js ya no toca DOM del menu). Shop pendiente de migrar a API uniforme.

**Nota importante**: el usuario trabaja desde dos PCs. Si hay commits recientes en git que no esperabas, es que venian del otro PC. `git pull` siempre antes de tocar cualquier cosa.

## Colaboracion con el usuario

Tutor-style, **WHY antes del WHAT**, pero **codigo concreto primero, explicacion bloque a bloque despues**. No soltar teoria por delante. Analogia que uso: "es como si me dijeras que escriba una tortilla en ingles, se hacer la tortilla pero no se escribir en ingles".

**10 minutos en papel antes de preguntar**. Traer hipotesis, no problema crudo. Rol de rubber duck, no oraculo.

**Cuando el usuario diga "dejame lucharlas"**: no dar soluciones directas. Hacer preguntas socraticas. Pero si se bloquea ("no se he hecho una mierda"), cortar con la mayeutica y darle la solucion con explicacion bloque a bloque.

**Lo que sabe a dia de hoy**:
- Clases ES6, `constructor`, `this`, metodos, `bind`.
- `export` / `import` con extension `.js`.
- Destructuring en parametros.
- `addEventListener` / `removeEventListener` con referencias estables.
- `requestAnimationFrame` / `cancelAnimationFrame`.
- Patron de callbacks (`onDone`, `onStart`, `onClose`, `onReturnToMenu`).
- Screen Manager y mount/unmount.
- Separacion de responsabilidades (Game no debe tocar DOM del menu).
- Preview vs score / evaluacion pura vs commit.

**Lo que NO quiere tocar**: CSS. Delega visuales en Claude.

**Tropiezos recurrentes a vigilar**:
- Confunde "crear pantalla" (`new`) con "montarla" (`mount()`).
- No abre la consola por defecto. Si peta algo, recordarle F12 → Console.
- ES Modules + strict mode → variables inexistentes lanzan `ReferenceError`.
- Typos de IDs HTML rompen sin aviso.
- Cuando copia-pega codigo, a veces le pasan cosas raras (lineas duplicadas, lineas fantasma de otros archivos).

**Lo que el usuario me ha pedido mejorar**:
- Revisar yo el codigo antes de preguntar por estado. Pregunte 3 veces si los bugs estaban arreglados sin mirar el codigo. Proxima vez: mirar primero, preguntar despues.

## Que hicimos en la sesion 2026-04-23

### 1. Dos bugs de refactor atados en corto

- **Eliminado `_combineAllRoutes`** en `ScoringEngine` (codigo muerto desde que quitamos el Divisor).
- **`Game.goToMenu()` ya no toca DOM del menu**. Antes hacia `getElementById('mainmenu-overlay')` + `classList.add('visible')` + `startMenuMusic()` a mano, violando separacion de responsabilidades.
  - Ahora `Game` recibe `onReturnToMenu` como callback en el constructor.
  - `main.js` define ese callback: `() => { manager.show(menu); startMenuMusic(); }`.
  - `Game` solo sabe resetear estado y llamar al callback.

**Detalle feo pendiente (bajo coste)**: en `src/Game.js:23-24` hay una linea duplicada `this.container = document.getElementById('game-container');`. Borrar una.

### 2. Diseño completo del sistema de FUSION DE DADOS

El usuario quiere implementar una mecanica nueva: combinar dados para subir de tier. **Todo el diseño esta cerrado**, listo para empezar a implementar en la proxima sesion.

---

## SISTEMA DE FUSION — DISEÑO CERRADO

### Nueva moneda: tickets

- Empiezas con 0 tickets.
- Cada fusion consume 1 ticket.
- Se obtienen por: cofres (azar, no diseñado aun), score bonus, o compra en tienda ($5).

### Fusion

- `2 × d4 → 1 × d6`
- `2 × d6 → 1 × d8`
- `2 × d8 → 1 × d10`
- `2 × d10 → 1 × d12`
- Solo dados del mismo tipo.
- Consume 1 ticket.
- **Irreversible**. No hay deshacer.

### Tienda

- **Solo vende d4 ($4) y d6 ($8)**. Son materia prima.
- **No vende d8, d10, d12** — solo se obtienen por fusion.
- **Tickets a $5**.
- Cantidad ilimitada de compras.

### Venta de dados

- Solo se pueden vender d4 y d6 (los de materia prima).
- Precio de venta: **mitad del precio de compra** — d4 se vende por $2, d6 por $4.
- Los d8, d10, d12 no se venden ni se descartan. Una vez los tienes, son permanentes.

### Inventario (nueva pantalla, Fase B)

- Dos secciones: **Mis dados** y **Modificadores**.
- La seccion de modificadores sera **placeholder "Proximamente"** en esta iteracion.
- Muestra "dados conocidos" (slots vacios de d8/d10/d12 que el jugador no tiene aun, para que sepa que existen y hasta donde puede llegar).
- Al clicar un dado de materia prima (d4/d6):
  - Boton **Vender** ($2 o $4).
  - Boton **Fusionar** → entra en modo seleccion, resalta dados compatibles del mismo tipo, oscurece el resto.
- Al clicar un dado superior (d8+):
  - No hay accion posible, solo visualizacion.
- **UX critica**: el boton de accion destructiva (fusionar) debe estar separado visualmente del principal. El usuario menciono su trauma con el "descartar vs jugar mano" de Balatro.

### Acceso al inventario

- Entre rondas (misma ventana temporal que la Shop).
- Dos botones lado a lado: uno para Shop, otro para Inventario.

### Animacion/visual por tier

- Los dados superiores vibran/palpitan con intensidad creciente.
- d12 = rojo neon, vibra fuerte, da sensacion de "inestable de tanto poder".
- Escalado proporcional hacia abajo (d10 menos, d8 un poco, d4/d6 estaticos).

### Score bonus — Tabla Fibonacci

Al acabar una ronda, se calcula el excedente sobre el target. Segun cuanto lo superes:

**Monedas extra**:

| Excedente | Monedas acum. |
|---|---|
| ≥ 5% | +1 |
| ≥ 8% | +2 |
| ≥ 13% | +3 |
| ≥ 21% | +4 |
| ≥ 34% | +5 |
| ≥ 55% | +6 |
| ≥ 89% | +7 |
| ≥ 144% | +8 |

Los deltas entre umbrales son Fibonacci (3, 5, 8, 13, 21, 34, 55).

**Tickets**:

- Excedente ≥ 25% → +1 ticket.
- Excedente ≥ 100% → +2 tickets en total.

Solo 2 umbrales para tickets (vs 8 para monedas) → tickets son raros, conservan peso como recurso.

### Fases de implementacion

**Fase A — Fundamentos** (proxima sesion, prioridad 1):
1. Añadir `tickets` al state del jugador (`CONFIG.PLAYER.START_TICKETS: 0` en `constants.js`, `state.tickets` en `Game.js`). Tambien en el reset de `goToMenu`.
2. Mostrar contador de tickets en el HUD (nuevo span junto al `#money-display`, icono, metodo `setTickets` en `HUD.js`). Icono sugerido: `&#127903;` (🎟) o similar — tono distinto al dorado del dinero.
3. Restringir la Shop a solo d4 y d6 (filtro en `DIE_TYPES` dentro de `Shop.js`).
4. Añadir "ticket" a la venta en la Shop ($5). Nuevo tipo de item, reutilizar logica de compra existente.
5. Implementar bonus Fibonacci en `Game` al fin de ronda: calcular excedente `(score - target) / target * 100`, aplicar tabla, sumar monedas y tickets al state, mostrar feedback en el score breakdown.

**Fase B — Inventario y fusion** (sesion siguiente):
- Crear `InventoryScreen.js` con mount/unmount.
- Renderizar dados agrupados por tipo con contadores.
- Renderizar "dados conocidos" (slots placeholder de los no obtenidos).
- Implementar click → menu de acciones (vender/fusionar).
- Modo seleccion de fusion (oscurece incompatibles).
- Boton de acceso al lado del boton de Shop.
- Placeholder "Modificadores - Proximamente".

**Fase C — Polish visual**:
- Animaciones diferenciadas por tier (vibracion, glow, color calido creciente).
- Sonidos de fusion.
- Feedback visual al superar umbrales del score bonus.

**Fase D — Cofres** (pendiente de diseñar):
- El usuario menciono que los cofres darian tickets al azar. No se ha diseñado aun. Al retomar: preguntarle por el sistema de cofres antes de implementarlo.

### Preguntas de diseño que pueden surgir

- **¿Cuantos dados empieza teniendo el jugador?** Verificarlo en `DiceManager.fullReset()`. El diseño actual asume que el jugador puede quedarse con muy pocos dados si fusiona mucho. Confirmar que esa experiencia es la deseada.
- **¿Como se muestra el bonus Fibonacci?** Proponer que aparezca en el score breakdown como lineas extra con los umbrales alcanzados.

---

## Estado actual de archivos clave

```
src/
├── main.js               Orquestador (splash, menu, changelog, tutorial, manager, Game con onReturnToMenu)
├── Game.js               Limpio de DOM del menu. Sigue siendo monolito en el resto (Fase 3 lo dividira)
├── config/
│   ├── changelog.js      Historial de versiones
│   ├── componentDefs.js  7 componentes
│   ├── constants.js, dieTypes.js, boardPatterns.js
├── screens/
│   ├── SplashScreen.js   ✅
│   ├── MenuScreen.js     ✅ (con onStart, onTutorial, onChangelog)
│   ├── ChangelogScreen.js ✅
│   ├── TutorialScreen.js ✅ (placeholder funcional)
│   ├── GameOverScreen.js ✅
│   ├── PauseScreen.js    ✅
│   ├── ScreenManager.js  ✅
│   └── ui/               HUD, Modal, Shop
├── entities/, systems/, lib/
└── systems/ScoringEngine.js   Refactorizado preview/score (sin _combineAllRoutes)
```

## Bugs conocidos pendientes

- **Dinero negativo en shop**: closure obsoleto en `renderComponents` de `src/screens/ui/Shop.js`. Diferido a Fase 5 del refactor.
- **`Game.js:23-24`**: linea `this.container = document.getElementById('game-container');` duplicada. Borrar una.

## Fases restantes del refactor (contexto largo)

| Fase | Que falta | Sesiones aprox |
|---|---|---|
| Fase 2 (casi cerrada) | Migrar Shop a API uniforme (`mount`/`unmount`). | 1 |
| Fase 3 | Separar logica/presentacion en `Game.js`. Crear `GameScreen`. | 3-5 |
| Fase 4 | Estado unico + event bus. | 3-5 |
| Fase 5 | Bugs conocidos + limpieza CSS. | 1-2 |

El usuario prefiere **alternar refactor con contenido** — no bloquea mecanicas nuevas por estar en medio del refactor. Fase A del sistema de fusion es contenido con un poquito de infraestructura, encaja bien ahora.

## Reglas duras del usuario

- **Nunca usa `ç`** — dedazo (Enter pegado). Corregir tacitamente.
- **Handles publicos**: `javatoDev` (dev) y `javatoDev (prod. ntr)` para musica. NO "javier".
- **Musica del menu**: composicion propia en FL Studio. Respetar autoria.
- **Distribucion**: itch.io HTML5 primario, Electron Win+Linux despues. No Mac, no Rust.
- **Commits SIN Co-Authored-By** de Claude.
- **PowerShell 5.1** si se trabaja desde Windows: no soporta `&&`, usar `;` en comandos manuales.

## Referencias

- `README.md` del proyecto — arquitectura, convenciones, como añadir componentes.
- `src/config/changelog.js` — historial de versiones.
- Vault Obsidian del usuario (multi-proyecto) — ver memoria `reference_obsidian_vault.md`.

---

Suerte, proxima sesion. El usuario hace commit y baja el repo en otro PC — asume que el estado de git es la fuente de verdad.

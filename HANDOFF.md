# Handoff para la proxima sesion de Claude

> Documento de transicion entre sesiones. Ultima actualizacion: **2026-04-21**.
> Escrito por la sesion anterior para que la siguiente entre en contexto rapido.

## Como esta el proyecto

Wireline va por la version **2.1.2**. El juego funciona y es jugable. Estamos en medio de la **Fase 2 del refactor** (Screen Manager). Ver [README.md](README.md) seccion "Roadmap del refactor" para el plan completo.

## Colaboracion con el usuario

El usuario aprende mientras refactoriza. **Importante: tutor-style, explicar WHY antes del WHAT**. El usuario aplica con guia, tu le corriges. Cuando se atasca con sintaxis, no presuponer que sabe JS avanzado — es dev backend que esta aprendiendo frontend.

**Lo que sabe a dia de hoy (lecciones ya cubiertas)**:
- Clases ES6, constructor, `this`, metodos sin `function`.
- `export` / `import` con extension `.js`.
- Destructuracion en parametros: `constructor ({ onDone })`.
- `this.metodo = this.metodo.bind(this)` — el truco de fijar `this` a la instancia.
- `addEventListener` / `removeEventListener` con referencias estables.
- `requestAnimationFrame` / `cancelAnimationFrame` (se cubrio al extraer el glow del menu).
- Que `onDone` / `onStart` son callbacks — la Screen no sabe que pasa despues.

**Lo que NO quiere tocar**:
- CSS. Delega en Claude todo lo visual ("te dejare al mando del apartado visual"). Ver memoria `reference_obsidian_vault.md` para contexto.

**Tropiezos recientes a tener presentes**:
- Confunde con facilidad "crear una pantalla" (instanciar con `new`) con "montarla" (llamar `mount()`). Son dos operaciones distintas y hay que recordarlo.
- No mira la consola del navegador por defecto. Cuando algo peta, recordarle abrir F12 → Console.
- ES Modules + strict mode → las variables inexistentes **lanzan ReferenceError**, no son undefined silencioso.
- Typos en IDs HTML (duplicados, o `btn-tutorial` vs `btn-start`) rompen sin avisar.

## Que hicimos en esta sesion (2026-04-21)

**1. Arreglar imports rotos tras mover ui/**
El usuario movio en su IDE `src/ui/` dentro de `src/screens/ui/`. Decidio mantenerlo asi. Actualizados los imports en `Game.js` y los imports relativos dentro de `screens/ui/HUD.js` y `screens/ui/Shop.js` (un `../` extra).

**2. Vault de Obsidian actualizado**
El usuario tiene un second brain en `/home/javier/Escritorio/Obsidian-Second-Brain/`. Antes era solo de Lumma (app Next.js). Ahora es multi-proyecto:
- `Home.md` reestructurado como indice multi-proyecto (Lumma + Wireline).
- Nuevo: `02-arquitectura/Estructura de Wireline.md`.
- Nuevo: `03-aprendizaje/Screen Manager Pattern.md`.

**3. Fase 2 — extraidas SplashScreen y MenuScreen**
- `src/screens/SplashScreen.js` — pantalla inicial "CLICK PARA CONTINUAR" con `mount`/`unmount`/`onDone`.
- `src/screens/MenuScreen.js` — menu principal con botones "Nueva partida" y "Tutorial", glow pulsante del titulo cancelado en unmount (leccion viva del patron "lo que atas lo desatas").
- `src/main.js` reducido a orquestacion (~40 lineas): crea `menu` y `splash`, engancha callbacks, llama `splash.mount()`.
- `src/screens/screenManager.js` existe pero **esta vacio** — sera el siguiente paso.

**4. Fix del parpadeo del tablero al arrancar**
`#game-container` siempre estaba visible de fondo; entre fade-out splash y fade-in menu se veia el HUD/tablero. Resuelto con:
- `class="hidden"` en el HTML del `#game-container`.
- Regla CSS especifica: `#game-container.hidden { visibility: hidden; opacity: 0; pointer-events: none; }` (NO `display: none` porque rompe el dimensionado del canvas).
- En `Game.start()`: `this.container.classList.remove('hidden'); this.renderer.resize();` al principio.

**5. Boton TUTORIAL (placeholder)**
Añadido en `index.html` con id `btn-tutorial`. Nuevo callback `onTutorial` en `MenuScreen`. En `main.js` hace `console.log('Tutorial pendiente')` — placeholder para futuro. El usuario intento implementarlo pero cometio 3 bugs clasicos que luego arreglamos juntos:
- `onTutorial` usado sin estar en el destructuring del constructor.
- `this.onClickStart.bind(this)` sin asignacion (la funcion bound se tira a la basura).
- Dos botones con el mismo `id="btn-start"` en el HTML.

## Estado actual de archivos clave

```
src/
├── main.js               Orquestador (~40 lineas, solo callbacks)
├── Game.js               Sigue mezclando mucho — Fase 3 lo separara
├── screens/
│   ├── SplashScreen.js   ✅ Extraida
│   ├── MenuScreen.js     ✅ Extraida
│   ├── screenManager.js  ⏳ Vacio, siguiente paso
│   └── ui/               HUD, Modal, Shop (widgets DOM)
├── entities/ config/ systems/ lib/  Intactas desde la ultima vez
index.html                #game-container arranca con class="hidden"
css/style.css             Regla nueva para #game-container.hidden
```

## Que viene despues

El usuario pregunto cuanto queda de refactor. Resumen que le di:

| Fase | Que falta | Sesiones aprox |
|---|---|---|
| Fase 2 (en curso) | ScreenManager + GameOverScreen + VictoryScreen + PauseScreen | 2-3 |
| Fase 3 | Separar logica/presentacion en `Game.js` | 3-5 |
| Fase 4 | Estado unico + event bus | 3-5 |
| Fase 5 | Bugs conocidos + limpieza CSS | 1-2 |

**Opciones para la proxima sesion, por orden de recomendacion**:

1. **ScreenManager** con las 2 pantallas ya extraidas. `main.js` quedaria en 5-10 lineas. Cierra la pieza central del patron.
2. **Mas pantallas** (GameOverScreen, VictoryScreen, PauseScreen) antes del manager. Alternativa si el usuario prefiere ver mas migracion antes de introducir concepto nuevo.
3. **Tutorial real** (no solo boton). Mejor esperar a que el ScreenManager exista.
4. **Contenido de juego** (componentes nuevos, dados nuevos, zonas). Se puede hacer ya sin esperar. Util para motivacion si el refactor se vuelve pesado.

Yo tiraria por la 1. Pero deja que el usuario elija — el tiene criterio.

## Bugs conocidos pendientes

- **Dinero negativo en shop**: comprar 2 componentes seguidos cuando solo alcanza para 1. Closure obsoleto en `renderComponents` de `src/screens/ui/Shop.js`. Diferido a Fase 5.

## Referencias utiles

- `README.md` del proyecto — documentacion oficial, como añadir componentes, convenciones.
- Vault Obsidian en `/home/javier/Escritorio/Obsidian-Second-Brain/` — notas conceptuales del usuario. Ver memoria `reference_obsidian_vault.md`.
- Memoria en `/home/javier/.claude/projects/-home-javier-Personal-Wireline/memory/` — preferencias duraderas del usuario, autoria de la musica, regla del ç, handles publicos.

## Reglas duras del usuario

Copiadas aqui por si acaso (estan tambien en memoria):

- **Nunca usa `ç`** — si aparece, es dedazo (Enter pegado). Corregir tacitamente.
- **Handles publicos**: `javatoDev` (dev) y `javatoDev (prod. ntr)` para musica. NO "javier".
- **La musica del menu** (`public/audio/theme.mp3`) es composicion propia en FL Studio. Respetar autoria.
- **Distribucion**: itch.io HTML5 como primario, Electron Win+Linux en el futuro. No Mac, no Rust.

---

Suerte, proxima sesion. Animo.

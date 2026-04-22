# Handoff para la proxima sesion de Claude

> Documento de transicion entre sesiones. Ultima actualizacion: **2026-04-22**.
> Escrito por la sesion anterior para que la siguiente entre en contexto rapido.

## Como esta el proyecto

Wireline va por la version **2.1.2**. El juego funciona y es jugable. Estamos en medio de la **Fase 2 del refactor** (Screen Manager). Ver [README.md](README.md) seccion "Roadmap del refactor" para el plan completo.

**Nota importante**: el usuario puede trabajar desde dos PCs. Si hay commits recientes en git que no esperabas, es que venian del otro PC. Sincronizar antes de tocar cualquier cosa.

## Colaboracion con el usuario

El usuario aprende mientras refactoriza. **Importante: tutor-style, explicar WHY antes del WHAT**. El usuario aplica con guia, tu le corriges. Cuando se atasca con sintaxis, no presuponer que sabe JS avanzado — es dev backend que esta aprendiendo frontend.

**Lo que sabe a dia de hoy (lecciones ya cubiertas)**:
- Clases ES6, constructor, `this`, metodos sin `function`.
- `export` / `import` con extension `.js`.
- Destructuracion en parametros: `constructor ({ onDone })`.
- `this.metodo = this.metodo.bind(this)` — el truco de fijar `this` a la instancia.
- `addEventListener` / `removeEventListener` con referencias estables.
- `requestAnimationFrame` / `cancelAnimationFrame` (cubierto al extraer el glow del menu).
- Que `onDone` / `onStart` son callbacks — la Screen no sabe que pasa despues.
- Concepto de Screen Manager: gestiona que pantalla esta activa, desmonta la anterior al cambiar.

**Lo que NO quiere tocar**:
- CSS. Delega en Claude todo lo visual ("te dejare al mando del apartado visual").

**Tropiezos recientes a tener presentes**:
- Confunde con facilidad "crear una pantalla" (instanciar con `new`) con "montarla" (llamar `mount()`). Son dos operaciones distintas y hay que recordarlo.
- No mira la consola del navegador por defecto. Cuando algo peta, recordarle abrir F12 → Console.
- ES Modules + strict mode → las variables inexistentes **lanzan ReferenceError**, no son undefined silencioso.
- Typos en IDs HTML (duplicados, o `btn-tutorial` vs `btn-start`) rompen sin avisar.
- **Prefiere que NO le sueltes teoria por delante**. Quiere ver codigo concreto primero, explicacion bloque a bloque despues. Se lo dijo textualmente: "es como si me dijeras que escriba una tortilla en ingles, se hacer la tortilla pero no se escribir en ingles".

## Que hicimos en la sesion 2026-04-21

**1. Arreglar imports rotos tras mover ui/**
El usuario movio en su IDE `src/ui/` dentro de `src/screens/ui/`. Decidio mantenerlo asi. Actualizados los imports en `Game.js` y los imports relativos dentro de `screens/ui/HUD.js` y `screens/ui/Shop.js`.

**2. Vault de Obsidian actualizado**
Second brain en `/home/javier/Escritorio/Obsidian-Second-Brain/` ahora es multi-proyecto (Lumma + Wireline):
- `Home.md` reestructurado como indice multi-proyecto.
- Nuevo: `02-arquitectura/Estructura de Wireline.md`.
- Nuevo: `03-aprendizaje/Screen Manager Pattern.md`.

**3. Fase 2 — extraidas SplashScreen y MenuScreen**
- `src/screens/SplashScreen.js` con `mount`/`unmount`/`onDone`.
- `src/screens/MenuScreen.js` con botones "Nueva partida" y "Tutorial", glow pulsante cancelado en unmount.
- `src/main.js` reducido a orquestacion por callbacks.

**4. Fix del parpadeo del tablero al arrancar**
- `class="hidden"` en `#game-container` en HTML.
- Regla CSS especifica: `#game-container.hidden { visibility: hidden; opacity: 0; pointer-events: none; }` (NO `display: none` por el dimensionado del canvas).
- En `Game.start()`: `this.container.classList.remove('hidden'); this.renderer.resize();`.

**5. Boton TUTORIAL (placeholder)**
- Nuevo `id="btn-tutorial"` en HTML.
- Callback `onTutorial` en `MenuScreen`.
- `console.log('Tutorial pendiente')` en `main.js`.

## Que hicimos en la sesion 2026-04-22 (mini, 20 min)

**1. Creado `src/screens/ScreenManager.js`** (version minima, 12 lineas):
```js
export class ScreenManager {
  constructor () { this.current = null; }
  show (screen) {
    if (this.current) this.current.unmount();
    this.current = screen;
    screen.mount();
  }
}
```
Archivo renombrado de `screenManager.js` a `ScreenManager.js` (PascalCase por ser clase).

**2. Migrado `src/main.js` para usar el manager**:
- Nuevo import de `ScreenManager` + `const manager = new ScreenManager()`.
- Ultima linea: `splash.mount()` → `manager.show(splash)`.
- En el `onDone` del splash: desaparecieron `splash.unmount()` + `setTimeout`. Queda `manager.show(menu)` directo.
- El `onStart` del menu **no se toco**: sigue con `menu.unmount()` manual + `setTimeout(() => game.start(), 480)` porque `game` aun no es una Screen.

**3. Consecuencia a vigilar**: la transicion splash → menu ahora es **simultanea** (cross-fade: splash haciendo fade-out mientras menu hace fade-in). Antes eran secuenciales con `setTimeout(600)`. Como ambos son fondos oscuros deberia verse bien. Si el usuario se queja, añadir asincronia al manager (unmount devuelve promise que se resuelve tras el fade).

**4. Pendiente de probar**: el usuario aun no ha probado el juego tras la migracion. Al retomar, preguntar si el flujo completo funciona (splash → click → menu → nueva partida → partida → pausa → salir al menu → etc.) y diagnosticar si algo peta.

## Estado actual de archivos clave

```
src/
├── main.js               Orquestador via manager (~38 lineas)
├── Game.js               Sigue mezclando mucho — Fase 3 lo separara
├── screens/
│   ├── SplashScreen.js   ✅ Extraida
│   ├── MenuScreen.js     ✅ Extraida
│   ├── ScreenManager.js  ✅ Creado (version minima)
│   └── ui/               HUD, Modal, Shop (widgets DOM)
├── entities/ config/ systems/ lib/  Intactas
index.html                #game-container arranca con class="hidden"
css/style.css             Regla nueva para #game-container.hidden
```

## Que viene despues

**Siguiente sesion (en casa, otro PC)**:

1. **Probar primero** que la migracion del manager no rompio nada. Si peta, F12 console y diagnosticar.
2. **Extraer `PauseScreen`** o **`GameOverScreen`** (cortas, mismo patron que ya conoce). Se registran en el flow con `manager.show(...)`.
3. Cuando esten las pantallas basicas migradas, valorar si añadir async al manager (promesas en unmount) o seguir con setTimeout manuales.

**Fases restantes** (contexto largo):

| Fase | Que falta | Sesiones aprox |
|---|---|---|
| Fase 2 (en curso) | GameOverScreen + VictoryScreen + PauseScreen + (tal vez) GameScreen | 2-3 |
| Fase 3 | Separar logica/presentacion en `Game.js` | 3-5 |
| Fase 4 | Estado unico + event bus | 3-5 |
| Fase 5 | Bugs conocidos + limpieza CSS | 1-2 |

**Ideas de jugabilidad en discusion** (mencionadas por el usuario, no empezadas):
- **Generacion procedural aleatoria**. El usuario lo planteo. Hay dos versiones — MVP viable en 2-3 sesiones (una zona "infinita" con patrones aleatorios) o profunda (requiere Fase 4). Pendiente de discusion de alcance cuando retomemos.

## Bugs conocidos pendientes

- **Dinero negativo en shop**: closure obsoleto en `renderComponents` de `src/screens/ui/Shop.js`. Diferido a Fase 5.

## Referencias utiles

- `README.md` del proyecto.
- Vault Obsidian en `/home/javier/Escritorio/Obsidian-Second-Brain/` (memoria `reference_obsidian_vault.md`).
- Memoria en `/home/javier/.claude/projects/-home-javier-Personal-Wireline/memory/`.

## Reglas duras del usuario

- **Nunca usa `ç`** — si aparece, es dedazo (Enter pegado). Corregir tacitamente.
- **Handles publicos**: `javatoDev` (dev) y `javatoDev (prod. ntr)` para musica. NO "javier".
- **La musica del menu** (`public/audio/theme.mp3`) es composicion propia en FL Studio.
- **Distribucion**: itch.io HTML5 como primario, Electron Win+Linux en el futuro. No Mac, no Rust.

---

Suerte, proxima sesion. El usuario hace commit y baja el repo en otro PC — asume que el estado de git es la fuente de verdad.

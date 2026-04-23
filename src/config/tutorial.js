export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'BIENVENIDO A WIRELINE',
    text: 'Roguelike de dados y circuitos. Te ensenyo los fundamentos en menos de un minuto. Usa SIGUIENTE para avanzar, ATRAS para repetir un paso, SALTAR para volver al menu.',
    target: null,
  },
  {
    id: 'hud-center',
    title: 'TU OBJETIVO',
    text: 'El numero cian es tu puntuacion actual de la ronda. El numero tras la barra es el objetivo que debes alcanzar. Si agotas los dados sin llegar, pierdes una vida.',
    target: '#hud-center',
  },
  {
    id: 'hud-right',
    title: 'VIDAS Y DINERO',
    text: 'Los corazones son tus vidas — pierde todas y game over. El diamante amarillo es el dinero que acumulas y gastas en la tienda entre rondas.',
    target: '#hud-right',
  },
  {
    id: 'board',
    title: 'EL CIRCUITO',
    text: 'El tablero es un grafo. El nodo verde es la fuente, el rojo la salida. La corriente fluye entre ambos pasando por los nodos azules. Solo los nodos con un dado encima suman puntos.',
    target: '#board-canvas',
  },
  {
    id: 'roll',
    title: 'TIRAR LOS DADOS',
    text: 'Arrancas la ronda pulsando aqui. Lanza tu inventario de dados — apareceran abajo con sus valores para que los coloques.',
    target: '#btn-roll',
  },
  {
    id: 'tray',
    title: 'TUS DADOS',
    text: 'Los dados tirados viven aqui mientras los colocas. Arrastra cada uno hasta un nodo azul del tablero. Intenta construir la mejor ruta posible desde la fuente hasta la salida.',
    target: '#dice-tray-wrap',
  },
  {
    id: 'activate',
    title: 'ACTIVAR EL CIRCUITO',
    text: 'Cuando tengas los dados colocados, pulsa aqui. La corriente recorrera la mejor ruta, sumando el valor de cada dado — y los potenciadores que haya en la ruta alteraran el resultado.',
    target: '#btn-confirm',
  },
  {
    id: 'multi-roll',
    title: 'VARIOS TIROS POR RONDA',
    text: 'Si despues de activar aun no llegas al objetivo y te quedan dados, vuelves a TIRAR con los restantes. Las puntuaciones de cada activacion se acumulan. Aguanta hasta superar el objetivo.',
    target: '#btn-roll',
  },
  {
    id: 'money',
    title: 'COMO GANAR DINERO',
    text: 'Al superar el objetivo, cada dado que te sobre se convierte en $ por su valor. Si pierdes la ronda, recibes $1 por cada nodo con dado. Y cada 5 monedas ahorradas te dan $1 de interes extra al empezar la siguiente ronda (hasta $5 max). Guardar paga.',
    target: '#money-display',
  },
  {
    id: 'shop',
    title: 'LA TIENDA',
    text: 'Al completar una ronda aparece la tienda. Tres pestanyas: circuitos (potenciadores que modifican el scoring), dados (comprar o mejorar) y cofres (aleatorios). Invierte con cabeza.',
    target: null,
  },
  {
    id: 'zones',
    title: 'LAS ZONAS',
    text: 'El juego se divide en zonas con patrones de tablero distintos y dificultad creciente. La primera zona son 3 rondas, las demas 6 cada una. Llega al final para ganar la run.',
    target: null,
  },
  {
    id: 'done',
    title: 'LISTO PARA JUGAR',
    text: 'Eso es todo. Cuando pulses EMPEZAR estaras en una partida real. Buena suerte con tus circuitos, javatoDev no se hace responsable de runs perdidas por malas tiradas.',
    target: null,
  },
];

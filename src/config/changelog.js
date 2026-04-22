export const CURRENT_VERSION = '2.2.0';

export const CHANGELOG = [
  {
    version: '2.2.0',
    date: '2026-04-22',
    title: 'Nuevos potenciadores y ajustes de balance',
    notes: [
      {
        card: true,
        icon: '⇌',
        color: '#60a0ff',
        name: 'Inversor',
        desc: 'Invierte el valor del dado. Un 1 vale como maximo, un maximo vale como 1. Rescata tiradas bajas, castiga tiradas altas.',
      },
      {
        card: true,
        icon: '◉',
        color: '#e0e0ff',
        name: 'Acumulador Critico',
        desc: 'Carga tres activaciones y suelta x3 mult. Alto riesgo, alto premio — alinea la ruta para que dispare en tu mejor activacion.',
      },
      'Sobretension ahora da x3 mult (antes x2).',
      'Condensador: recuerda el dado anterior entre tiradas de la misma ronda.',
      'Fusible: ya no gasta usos hasta que activas la corriente.',
      'Los potenciadores solo disparan si pones un dado sobre su nodo. Antes algunos se activaban solo por estar en la ruta.',
      'El juego dura mas: el primer mundo sigue siendo 3 rondas, pero los demas pasan a 6 rondas cada uno. Mas reto.',
      'Cortocircuito y Divisor retirados del catalogo.',
      'Precios ajustados: Amplificador 12, Fusible 12, Sobretension 4.',
      'El juego ocupa la pantalla completa.',
      'HUD mas grande, modal de desglose ampliado, botones TIRAR y ACTIVAR en un panel unificado bajo el tablero.',
      'Pagina de novedades accesible desde el menu (la que estas leyendo).',
    ],
  },
  {
    version: '2.1.2',
    date: '2026-04-21',
    title: 'Fluidez al arrancar partida',
    notes: [
      'Al arrancar una partida ya no parpadea el tablero entre el menu y el juego.',
      'Boton TUTORIAL en el menu (contenido real llegara pronto).',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-04-20',
    title: 'Baseline',
    notes: [
      '7 potenciadores iniciales y 4 zonas.',
      'Tienda con pestañas de circuitos, dados y cofres.',
      'Sistema de vidas, dinero y reintentar ronda.',
    ],
  },
];

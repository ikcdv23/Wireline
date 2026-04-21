// Definiciones de los 5 tipos de dado (D4 a D12).
// Cada uno tiene caras, nombre, precio base, color y simbolo ASCII.

export const DIE_TYPES = {
  d4:  { faces: 4,  name: 'D4',  color: '#5a7a9a', price: 4,  symbol: '/4\\' },
  d6:  { faces: 6,  name: 'D6',  color: '#00e5ff', price: 8,  symbol: '[6]' },
  d8:  { faces: 8,  name: 'D8',  color: '#39ff14', price: 12,  symbol: '<8>' },
  d10: { faces: 10, name: 'D10', color: '#ffd700', price: 16, symbol: '{10}' },
  d12: { faces: 12, name: 'D12', color: '#bf40ff', price: 20, symbol: '*12*' },
};

export const DESTINOS_CATALOGO = [
  "QUEMADOR SILO 1",
  "QUEMADOR SILO 2",
  "BUNKERS",
  "PISOS MOVILES",
  "A DEPOSITO",
  "A C-31 / C-35",
] as const;

export type Destino = typeof DESTINOS_CATALOGO[number];

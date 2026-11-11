import {interpolate, spring} from 'remotion';

// Molas rápidas e secas: chegam em menos de meio segundo.
export const MOLA_SECA = {damping: 22, stiffness: 260, mass: 0.6};
export const MOLA_PULO = {damping: 13, stiffness: 240, mass: 0.6}; // passa um pouco do ponto e volta

// Mola de 0 a 1 que começa em "atraso" (segundos).
export const mola = (quadro: number, fps: number, atraso = 0, config = MOLA_SECA) =>
  spring({frame: quadro - atraso * fps, fps, config});

// Interpolação linear travada nas pontas.
export const trecho = (valor: number, de: [number, number], para: [number, number]) =>
  interpolate(valor, de, para, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const misturar = (a: number, b: number, t: number) => a + (b - a) * t;

// Número pseudoaleatório estável a partir de uma semente (não muda entre quadros).
export const acaso = (semente: number) => {
  const x = Math.sin(semente * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

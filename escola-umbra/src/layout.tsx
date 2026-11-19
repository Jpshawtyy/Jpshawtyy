// Layout da tela com o apresentador (Kai). Quando ele aparece, o conteúdo das cenas termina mais
// acima e a faixa de baixo vira o "palco": o Kai à esquerda e a legenda num balão de fala à direita.

import React, {useContext} from 'react';

export const PALCO = {
  topo: 1100, // onde termina o conteúdo das cenas quando o Kai está no canto
  base: 1478, // o Kai é cortado aqui (abaixo disso fica a interface do Instagram)
  balao: {x0: 470, x1: 920, y0: 1118, y1: 1415}, // balão da legenda, ao lado da boca do Kai
};

export type Layout = {
  kai: 'grande' | 'canto' | 'cta' | null; // onde o Kai está nesta cena (null = sem Kai)
  comPalco: boolean; // o Kai está no canto e o conteúdo precisa deixar a faixa de baixo livre
  fundo: number; // y onde o conteúdo da cena deve terminar
  balao: {x0: number; x1: number; y0: number; y1: number} | null; // onde vai a legenda (null = embaixo, centrada)
};

export const LAYOUT_SEM_PALCO: Layout = {kai: null, comPalco: false, fundo: 1250, balao: null};

// Layout de cada posição do Kai.
export const LAYOUT_COM_KAI: Record<'grande' | 'canto' | 'cta', Layout> = {
  // gancho: título em cima, Kai grande embaixo à esquerda, balão ao lado da cabeça dele
  grande: {kai: 'grande', comPalco: false, fundo: 1250, balao: {x0: 560, x1: 920, y0: 700, y1: 980}},
  canto: {kai: 'canto', comPalco: true, fundo: PALCO.topo, balao: PALCO.balao},
  // CTA: conteúdo em cima, Kai e Faísca embaixo
  cta: {kai: 'cta', comPalco: false, fundo: 960, balao: {x0: 560, x1: 920, y0: 960, y1: 1180}},
};

export const LayoutCtx = React.createContext<Layout>(LAYOUT_SEM_PALCO);
export const useLayout = () => useContext(LayoutCtx);

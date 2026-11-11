import type {Cena, Legenda, LegendaPronta, MapaCartas, Roteiro} from './tipos';
import {VIDEO} from './tema';
import {simularMesa} from './mesa/motor';

export type CenaPlanejada = {
  cena: Cena;
  indice: number;
  inicio: number; // segundos
  duracao: number; // segundos
  de: number; // quadro inicial
  quadros: number;
};

export type Plano = {cenas: CenaPlanejada[]; totalQuadros: number; totalSegundos: number};

// Duração usada quando a cena não informa "duracao".
export const duracaoPadrao = (cena: Cena, cartas: MapaCartas): number => {
  switch (cena.tipo) {
    case 'gancho':
      return 2;
    case 'carta_destaque':
      return 3.5;
    case 'lista':
      return 1.2 + cena.itens.length * 1.7;
    case 'piramide':
      return 1.2 + cena.niveis.length * 1.3;
    case 'comparacao':
      return 2 + Math.max(cena.bons.length, cena.ruins.length) * 1.2;
    case 'riscado':
      return 1 + cena.itens.length * 1.8;
    case 'mesa':
      return simularMesa(cena, cartas).duracaoMinima;
    case 'cta':
      return 4.5;
  }
};

export const planejar = (roteiro: Roteiro, cartas: MapaCartas): Plano => {
  const fps = VIDEO.fps;
  const cenas: CenaPlanejada[] = [];
  let cursor = 0;
  roteiro.cenas.forEach((cena, indice) => {
    const inicio = cena.inicio ?? cursor;
    const proxima = roteiro.cenas[indice + 1];
    // Com "inicio" na cena seguinte, a duração vai até lá (sincronia com a narração).
    const duracao =
      proxima?.inicio !== undefined
        ? Math.max(0.5, proxima.inicio - inicio)
        : (cena.duracao ?? duracaoPadrao(cena, cartas));
    const de = Math.round(inicio * fps);
    const quadros = Math.max(1, Math.round((inicio + duracao) * fps) - de);
    cenas.push({cena, indice, inicio, duracao, de, quadros});
    cursor = inicio + duracao;
  });
  const ultima = cenas[cenas.length - 1];
  const totalQuadros = ultima ? ultima.de + ultima.quadros : fps;
  return {cenas, totalQuadros, totalSegundos: totalQuadros / fps};
};

// Junta "legenda" (atalho) e "legendas" e preenche os tempos que faltam.
export const legendasDaCena = (cena: Cena, duracao: number): LegendaPronta[] => {
  const brutas: Legenda[] = [...(cena.legenda ? [{texto: cena.legenda}] : []), ...(cena.legendas ?? [])];
  return completarLegendas(brutas, duracao);
};

export const completarLegendas = (brutas: Legenda[], duracao: number): LegendaPronta[] => {
  if (brutas.length === 0) return [];
  const fatia = duracao / brutas.length;
  const comInicio = brutas.map((l, i) => ({...l, em: l.em ?? (i === 0 ? 0.25 : i * fatia)}));
  return comInicio.map((l, i) => ({
    texto: l.texto,
    em: l.em,
    ate: l.ate ?? (comInicio[i + 1] ? comInicio[i + 1].em : duracao),
  }));
};

// Momento (segundos dentro da cena) em que cada item de uma lista entra.
export const temposDosItens = (itens: {em?: number}[], duracao: number, primeiro = 0.35, folga = 0.7): number[] => {
  const passo = (duracao - primeiro - folga) / Math.max(1, itens.length);
  return itens.map((item, i) => item.em ?? primeiro + i * passo);
};

export const comoObjeto = <T extends object>(item: string | T, chave: keyof T): T =>
  typeof item === 'string' ? ({[chave]: item} as T) : item;

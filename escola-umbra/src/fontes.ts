import {loadFont as carregarAnton} from '@remotion/google-fonts/Anton';
import {loadFont as carregarBarlow} from '@remotion/google-fonts/Barlow';
import {loadFont as carregarBarlowCondensed} from '@remotion/google-fonts/BarlowCondensed';

// Identidade "Estilo Arena". O guia usa Impact (títulos) e Bahnschrift (apoio), que são fontes do Windows
// e não estão no Google Fonts; aqui vão as equivalentes mais próximas:
// - Anton no lugar da Impact (títulos, sempre em maiúsculas, inclinados e com sombra vermelha)
// - Barlow no lugar da Bahnschrift (legendas e textos)
// - Barlow Condensed para as etiquetas em maiúsculas espaçadas
const anton = carregarAnton('normal', {weights: ['400'], subsets: ['latin']});
const barlow = carregarBarlow('normal', {weights: ['500', '600', '700'], subsets: ['latin']});
const barlowCondensed = carregarBarlowCondensed('normal', {weights: ['500', '600', '700'], subsets: ['latin']});

export const FONTE_TITULO = anton.fontFamily;
export const FONTE_TEXTO = barlow.fontFamily;
export const FONTE_MONO = barlowCondensed.fontFamily; // etiquetas

// Resolve quando as fontes terminaram de carregar. Quem mede texto precisa esperar por isto.
export const fontesProntas: Promise<unknown> = Promise.all([anton.waitUntilDone(), barlow.waitUntilDone(), barlowCondensed.waitUntilDone()]);

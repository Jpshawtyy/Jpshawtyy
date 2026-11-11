// Identidade visual da Escola Umbra. Tudo que é cor, medida e área segura mora aqui.

export const CORES = {
  fundo: '#0A0A0C',
  ouro: '#E8B84A',
  vermelho: '#D6334A',
  texto: '#F3EEE2',
  secundario: '#9A9488',
  pillOuroTexto: '#2A1E05',
  pillVermelhoTexto: '#FFF1F2',
} as const;

export const VIDEO = {largura: 1080, altura: 1920, fps: 30} as const;

// Área segura do Reels: nada importante nos 250px de cima, 450px de baixo e 160px da direita.
export const SEGURA = {topo: 250, base: 450, direita: 160, esquerda: 70} as const;

// Retângulo onde o conteúdo pode ficar.
export const AREA = {
  x0: SEGURA.esquerda,
  x1: VIDEO.largura - SEGURA.direita, // 920
  y0: SEGURA.topo, // 250
  y1: VIDEO.altura - SEGURA.base, // 1470
  cx: (SEGURA.esquerda + VIDEO.largura - SEGURA.direita) / 2, // 495
  largura: VIDEO.largura - SEGURA.direita - SEGURA.esquerda, // 850
} as const;

// Linhas fixas da moldura.
export const MOLDURA = {
  etiquetaY: 256, // topo da etiqueta da série
  etiquetaAltura: 42,
  conteudoY0: 322, // onde o conteúdo de cada cena pode começar
  legendaBase: 1404, // base do bloco da legenda dinâmica
  rodapeY: 1424, // topo do @ no rodapé
} as const;

// Proporção de uma carta de Pokémon (63 x 88 mm).
export const PROPORCAO_CARTA = 88 / 63;

export const MARCA = '@escolaumbratcg';

// Marcas de regulamento válidas no Standard atual. Na rotação, troque aqui.
export const MARCAS_STANDARD = ['H', 'I', 'J'];

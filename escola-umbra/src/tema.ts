// Identidade visual da Escola Umbra. Tudo que é cor, medida e área segura mora aqui.

// Identidade "Estilo Arena" (guia Liga Umbra): preto, vermelho de marca, ouro de destaque, branco quente.
export const CORES = {
  fundo: '#0A0A0D', // Sombra
  vermelho: '#E5323F', // Vermelho: cor da marca (painéis, etiquetas, sombra dos títulos)
  vermelhoEscuro: '#7D0F1A', // Vermelho escuro: fundo dos painéis em degradê
  ouro: '#F0C160', // Ouro: listras, sublinhados, números e palavra-chave
  texto: '#F5F1E8', // Branco: títulos e textos
  secundario: '#A19C93', // texto de apoio
  painel: '#141418', // fundo das barras e caixas escuras
  pillOuroTexto: '#0A0A0D',
  pillVermelhoTexto: '#F5F1E8',
} as const;

export const VIDEO = {largura: 1080, altura: 1920, fps: 30} as const;

// Área segura do Reels: nada importante nos 250px de cima, 450px de baixo e 160px da direita.
// A margem da esquerda é igual à da direita para o conteúdo ficar centrado no meio real da tela (x = 540).
export const SEGURA = {topo: 250, base: 450, direita: 160, esquerda: 160} as const;

// Retângulo onde o conteúdo pode ficar.
export const AREA = {
  x0: SEGURA.esquerda,
  x1: VIDEO.largura - SEGURA.direita, // 920
  y0: SEGURA.topo, // 250
  y1: VIDEO.altura - SEGURA.base, // 1470
  cx: (SEGURA.esquerda + VIDEO.largura - SEGURA.direita) / 2, // 540
  largura: VIDEO.largura - SEGURA.direita - SEGURA.esquerda, // 760
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

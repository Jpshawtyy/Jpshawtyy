// Formato do roteiro (aulas/aula-XX.json) e dos dados que o vídeo recebe.

// ---------- Cartas ----------

// No roteiro uma carta é citada por um apelido definido em "cartas" ou direto pelo nome em inglês.
export type RefCarta = string;

export type DefCarta = {
  nome: string;
  set?: string; // nome da coleção, ex.: "Twilight Masquerade"
  numero?: string | number; // número na coleção, ex.: 77
  id?: string; // id da API, ex.: "sv6-77" (opcional, tem prioridade)
  fornece?: string; // só para energia especial: tipo que ela fornece
  fora_do_standard?: boolean; // aceita uma carta que não está no Standard atual
};

export type Ataque = {nome: string; custo: string[]; dano: string; texto: string};

// Dados de uma carta, sempre vindos da Pokémon TCG API.
export type CartaDados = {
  ref: string;
  id: string;
  nome: string;
  supertipo: 'Pokémon' | 'Trainer' | 'Energy';
  subtipos: string[];
  hp: number | null;
  tipos: string[];
  evoluiDe: string | null;
  ataques: Ataque[];
  habilidades: {nome: string; texto: string}[];
  regras: string[];
  custoRecuo: number;
  fraquezas: {tipo: string; valor: string}[];
  resistencias: {tipo: string; valor: string}[];
  colecao: string;
  colecaoId: string;
  numero: string;
  marca: string | null;
  raridade: string | null;
  fornece: string | null; // tipo de energia que a carta fornece (só Energia)
  imagem: string; // caminho dentro de public/, ex.: "cards/sv6-77.png"
};

export type MapaCartas = Record<string, CartaDados>;

// ---------- Legenda ----------

// Texto com *asteriscos* marca a palavra-chave em dourado.
export type Legenda = {
  texto: string;
  em?: number; // segundo (dentro da cena) em que aparece
  ate?: number; // segundo em que some
  fala?: string; // o que o narrador diz, se for diferente do texto ("" = não fala)
};

// Legenda com os tempos já preenchidos.
export type LegendaPronta = {texto: string; em: number; ate: number};

// Fala do narrador sem legenda na tela.
export type Fala = {texto: string; em?: number};

type CenaBase = {
  duracao?: number; // segundos
  inicio?: number; // segundo absoluto no vídeo (para sincronizar com a narração)
  legenda?: string; // atalho para uma legenda só
  legendas?: Legenda[];
  falas?: Fala[]; // narração sem legenda (ex.: no CTA)
  kai?: string | {em: number; animacao: string}[]; // gesto do Kai nesta cena (ex.: "apontando") ou uma lista de gestos
  faisca?: string; // gesto do Faísca nesta cena
  // Personagem 2D (imagens recortadas em public/mascote/<pose>.png) no Deck do Dia:
  // x = centro, base = onde ficam os pés, altura em px; espelhar vira a imagem.
  mascote?: {pose: string; x?: number; base?: number; altura?: number; espelhar?: boolean};
};

// ---------- Cenas ----------

export type CenaGancho = CenaBase & {tipo: 'gancho'; texto: string; subtitulo?: string; carta?: RefCarta}; // carta: só no Deck do Dia (a que voa para a tela)

export type CenaCartaDestaque = CenaBase & {
  tipo: 'carta_destaque';
  carta: RefCarta;
  pill?: string; // "DE VOLTA", "META"...
  pill_cor?: 'ouro' | 'vermelho';
  titulo?: string;
  texto?: string;
  // zoom num ponto da carta: x e y de 0 a 1 (0,0 = canto de cima à esquerda), a partir do segundo "em"
  foco?: {em: number; x: number; y: number; escala?: number};
};

export type ItemLista = string | {texto: string; detalhe?: string; em?: number; destaque?: boolean; carta?: RefCarta}; // destaque: não apaga quando o próximo entra; carta: miniatura no lugar do número
export type CenaLista = CenaBase & {tipo: 'lista'; titulo?: string; itens: ItemLista[]};

export type NivelPiramide = {
  rotulo: string;
  detalhe?: string; // no ranking aparece grande à direita (ex.: "36,5%")
  destaque?: boolean;
  em?: number;
  carta?: RefCarta; // só no ranking: miniatura da carta que representa o item
  valor?: number; // só no ranking: a barra é preenchida na proporção deste número
};
export type CenaPiramide = CenaBase & {
  tipo: 'piramide';
  titulo?: string;
  modo?: 'piramide' | 'ranking';
  niveis: NivelPiramide[]; // do primeiro que sobe (a base) até o topo
  fonte?: string; // linha pequena embaixo, para citar a origem dos dados
};

export type ItemComparacao = RefCarta | {carta?: RefCarta; texto?: string};
export type CenaComparacao = CenaBase & {
  tipo: 'comparacao';
  titulo?: string;
  pill_bons?: string;
  pill_ruins?: string;
  apagar_ruins?: boolean; // as cartas do lado "ruins" ficam desbotadas (padrão: sim)
  bons: ItemComparacao[];
  ruins: ItemComparacao[];
};

export type ItemRiscado = string | {texto: string; em?: number; riscar_em?: number};
export type CenaRiscado = CenaBase & {tipo: 'riscado'; titulo?: string; itens: ItemRiscado[]};

// Lista do deck em grade: cada carta com a quantidade. "destaques" ganham moldura dourada a partir de "em".
export type ItemDecklist = {carta: RefCarta; qtd: number};
export type CenaDecklist = CenaBase & {
  tipo: 'decklist';
  titulo?: string;
  cartas: ItemDecklist[];
  destaques?: {carta: RefCarta; em?: number}[];
  // Montagem: o deck vai sendo montado em grupos, com contador 0/60. Cada grupo entra junto com uma das
  // últimas frases da cena; as cartas que não estão em nenhum grupo entram com o último.
  grupos?: {cartas: RefCarta[]; adesivo?: string; em?: number}[];
};

// Impacto: frase gigante batendo na tela, com versos de carta voando atrás. Com "logo", o emblema cai na tela (revelação).
export type CenaImpacto = CenaBase & {
  tipo: 'impacto';
  texto: string;
  subtitulo?: string;
  logo?: boolean;
  antes?: string; // rótulo pequeno em cima do texto, no formato de meme (ex.: "POV:")
  dramatico?: boolean; // zoom lento, vinheta vermelha e estrondo grave
  cartas?: RefCarta[]; // cartas explodindo do centro para fora
  bate?: number; // segundo em que a frase (ou o emblema) bate na tela
  topo?: number; // altura do texto na tela (padrão: meio da tela)
};

// Combo: o alvo fica com a barra de HP e cada passo bate nele (dano) ou tira HP máximo (ex.: Gravity Mountain).
// Os passos entram junto com as últimas frases da cena. Com "selo", o carimbo aparece se o HP chegar a zero.
export type PassoCombo = {carta: RefCarta; tipo: 'dano' | 'hp'; valor: number; rotulo?: string; em?: number};
export type CenaCombo = CenaBase & {tipo: 'combo'; alvo: RefCarta; passos: PassoCombo[]; selo?: string};

// Respiração guiada: o círculo cresce (puxa), para (segura) e diminui (solta), com contagem.
export type CenaRespira = CenaBase & {tipo: 'respira'; puxa?: number; segura?: number; solta?: number; em?: number};

// Ficha de uma carta que ainda não tem imagem oficial (ex.: carta nova do Japão): nome, HP, tipo
// e cada habilidade e ataque, desenhados no estilo da marca. As linhas entram com as últimas frases da cena.
export type LinhaFicha = {tipo: 'habilidade' | 'ataque'; nome: string; custo?: string[]; dano?: string; texto: string; em?: number};
export type CenaFicha = CenaBase & {
  tipo: 'ficha';
  nome: string;
  estagio?: string; // "Básico", "Estágio 1"...
  hp?: number;
  energia?: string; // tipo em inglês, como na API: "Metal", "Psychic"...
  pill?: string;
  selo?: string; // faixa no pé (padrão: "carta do Japão · ainda não saiu aqui")
  linhas: LinhaFicha[];
};

// Contagem regressiva (3, 2, 1), um número por tempo da música.
export type CenaContagem = CenaBase & {tipo: 'contagem'; de?: number; passo?: number};

// Confronto: o atacante dá o golpe no defensor e aparece o dano que entrou de verdade (ex.: 200 vira 0).
export type CenaConfronto = CenaBase & {
  tipo: 'confronto';
  atacante: RefCarta;
  defensor: RefCarta;
  ataque: string; // nome do ataque, como na carta
  resultado: number; // dano que o defensor recebe
  selo?: string; // carimbo grande (ex.: "IMUNE")
  em?: number; // segundo do golpe (padrão 1,0)
};

export type CenaCta = CenaBase & {
  tipo: 'cta';
  principal?: string; // "SALVA"
  complemento?: string; // "pra próxima partida"
  seguir?: string; // "segue @escolaumbratcg"
};

// ---------- Mesa ----------

export type LadoId = 'eu' | 'oponente';

export type PokemonInicial =
  | RefCarta
  | {
      carta: RefCarta;
      evoluiu_de?: RefCarta[]; // cartas por baixo, da básica para cima
      energias?: RefCarta[];
      ferramentas?: RefCarta[];
      dano?: number;
      entrou_no_turno?: number;
    };

export type LadoInicial = {
  ativo?: PokemonInicial | null;
  banco?: PokemonInicial[];
  mao?: RefCarta[] | number; // lista de cartas, ou só a quantidade (mão escondida)
  deck?: number;
  descarte?: RefCarta[];
  premios?: number;
};

export type EstadoInicial = {
  turno: number; // 1 = primeiro turno do jogo
  quem_comecou: LadoId;
  vez?: LadoId; // se faltar, é calculado pelo número do turno
  eu: LadoInicial;
  oponente?: LadoInicial;
  estadio?: RefCarta;
};

type AcaoBase = {
  em?: number; // segundo (dentro da cena) em que a ação começa
  duracao?: number;
  legenda?: string;
  fala?: string; // o que o narrador diz nesta ação, se for diferente da legenda ("" = não fala)
  selo?: string; // texto grande no centro da mesa durante a ação (ex.: "vitória")
  lado?: LadoId; // quem faz a ação (padrão: quem está na vez)
};

export type Acao = AcaoBase &
  (
    | {acao: 'comprar'; carta?: RefCarta; cartas?: RefCarta[]; quantidade?: number}
    | {acao: 'jogar_no_banco'; carta: RefCarta}
    | {acao: 'evoluir'; carta: RefCarta; alvo: string}
    | {acao: 'ligar_energia'; carta: RefCarta; alvo: string}
    | {acao: 'jogar_treinador'; carta: RefCarta; alvo?: string}
    | {acao: 'buscar'; cartas: RefCarta[]}
    | {acao: 'descartar'; cartas: RefCarta[]}
    | {acao: 'recuar'; para: string; descartar?: RefCarta[]}
    | {acao: 'atacar'; ataque: string; dano?: number; alvo?: string}
    | {acao: 'dano'; alvo: string; valor: number}
    | {acao: 'nocaute'; alvo: string}
    | {acao: 'promover'; banco: number}
    | {acao: 'pegar_premio'; carta?: RefCarta; cartas?: RefCarta[]}
    | {acao: 'fim_de_turno'}
    | {acao: 'pausa'}
  );

export type TipoAcao = Acao['acao'];

export type CenaMesa = CenaBase & {tipo: 'mesa'; estado: EstadoInicial; acoes: Acao[]};

export type Cena =
  | CenaGancho
  | CenaCartaDestaque
  | CenaLista
  | CenaPiramide
  | CenaComparacao
  | CenaRiscado
  | CenaMesa
  | CenaDecklist
  | CenaConfronto
  | CenaImpacto
  | CenaContagem
  | CenaCombo
  | CenaRespira
  | CenaFicha
  | CenaCta;

export type TipoCena = Cena['tipo'];

// ---------- Roteiro ----------

export type Audio = string | {arquivo: string; volume?: number; transcricao?: string};

// "aula": as aulas do Do zero ao campeonato. "deck_do_dia": a série Deck do Dia (um deck do meta por episódio).
export type Formato = 'aula' | 'deck_do_dia';

// O Kai apresenta as aulas; o Deck do Dia é só cartas.
export const temApresentador = (r: {formato?: Formato; apresentador?: boolean}) => r.apresentador ?? r.formato !== 'deck_do_dia';

export type Roteiro = {
  formato?: Formato; // padrão: "aula"
  rotulo?: string; // troca a parte vermelha da etiqueta (ex.: "ESPECIAL LAIC" num episódio especial)
  serie: string;
  numero: number;
  titulo_capa: string;
  subtitulo_capa?: string;
  capa?: {cartas?: RefCarta[]};
  narracao?: Audio; // caminho de um .mp3 seu, ou "auto" para o narrador gerar a fala das legendas
  musica?: Audio;
  cartas?: Record<string, DefCarta>;
  narrador?: {motor?: 'piper' | 'kokoro'; voz?: string; velocidade?: number}; // troca a voz só neste roteiro
  apresentador?: boolean; // Kai e Faísca no vídeo (padrão: sim nas aulas, não no Deck do Dia)
  cenas: Cena[];
};

// Palavra com tempo, vinda da transcrição da narração.
export type PalavraFalada = {palavra: string; inicio: number; fim: number};

// O que a composição do Remotion recebe (montado pelo comando "npm run aula").
export type PropsAula = {
  roteiro: Roteiro;
  cartas: MapaCartas;
  audio?: {narracao?: string; narracaoVolume?: number; musica?: string; musicaVolume?: number};
  palavras?: PalavraFalada[];
  guias?: boolean; // desenha a área segura por cima, para conferência
  boca?: Boca; // movimento da boca do Kai em cada quadro, tirado da narração
};

// Valores de 0 a 1 por quadro do vídeo: quanto a boca abre e quanto ela arredonda (vogais o, u).
export type Boca = {aberta: number[]; o: number[]};

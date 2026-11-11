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
};

// ---------- Cenas ----------

export type CenaGancho = CenaBase & {tipo: 'gancho'; texto: string; subtitulo?: string};

export type CenaCartaDestaque = CenaBase & {
  tipo: 'carta_destaque';
  carta: RefCarta;
  pill?: string; // "DE VOLTA", "META"...
  pill_cor?: 'ouro' | 'vermelho';
  titulo?: string;
  texto?: string;
};

export type ItemLista = string | {texto: string; detalhe?: string; em?: number; destaque?: boolean}; // destaque: não apaga quando o próximo entra
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
  bons: ItemComparacao[];
  ruins: ItemComparacao[];
};

export type ItemRiscado = string | {texto: string; em?: number; riscar_em?: number};
export type CenaRiscado = CenaBase & {tipo: 'riscado'; titulo?: string; itens: ItemRiscado[]};

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
  | CenaCta;

export type TipoCena = Cena['tipo'];

// ---------- Roteiro ----------

export type Audio = string | {arquivo: string; volume?: number; transcricao?: string};

export type Roteiro = {
  serie: string;
  numero: number;
  titulo_capa: string;
  subtitulo_capa?: string;
  capa?: {cartas?: RefCarta[]};
  narracao?: Audio; // caminho de um .mp3 seu, ou "auto" para o narrador gerar a fala das legendas
  musica?: Audio;
  cartas?: Record<string, DefCarta>;
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
};

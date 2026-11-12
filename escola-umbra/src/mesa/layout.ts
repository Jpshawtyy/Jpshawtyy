// Onde cada carta fica na mesa, em coordenadas da base da mesa (ver BASE_MESA).

import {AREA, PROPORCAO_CARTA} from '../tema';

// A mesa é desenhada numa base fixa (x de 70 a 920, centro em 495) e depois encaixada, por escala,
// na área de conteúdo centrada da tela. Assim as medidas das zonas não dependem das margens.
export const BASE_MESA = {x0: 70, x1: 920, cx: 495, largura: 850, topo: 316, fundo: 1262} as const;
export const ENCAIXE_MESA = (() => {
  const escala = Math.min(1, AREA.largura / BASE_MESA.largura);
  const altura = (BASE_MESA.fundo - BASE_MESA.topo) * escala;
  // centra na horizontal e, na vertical, entre a etiqueta da série e a legenda
  const topoLivre = 312;
  const fundoLivre = 1262;
  const dy = topoLivre + (fundoLivre - topoLivre - altura) / 2 - BASE_MESA.topo;
  return {escala, dx: AREA.cx - BASE_MESA.cx, dy};
})();
import {acaso} from '../anim';
import type {LadoId} from '../tipos';
import type {Estado, Poke} from './motor';

export type Pose = {
  x: number; // centro
  y: number; // centro
  w: number; // largura da carta (ou diâmetro, quando é ícone de energia)
  rot: number;
  face: number; // 0 = verso, 1 = frente
  icone: number; // 0 = carta, 1 = ícone de energia
  op: number;
  z: number;
  cinza: number;
};

const pose = (x: number, y: number, w: number, extra: Partial<Pose> = {}): Pose => ({
  x,
  y,
  w,
  rot: 0,
  face: 1,
  icone: 0,
  op: 1,
  z: 10,
  cinza: 0,
  ...extra,
});

export const alturaCarta = (w: number) => w * PROPORCAO_CARTA;

const CX = BASE_MESA.cx; // 495

// Medidas de cada zona. "eu" embaixo e grande; "oponente" em cima e menor.
export const ZONAS = {
  eu: {
    ativo: {x: CX, y: 682.7, w: 190},
    banco: {y: 956.7, w: 150, vao: 22},
    mao: {y: 1175, w: 116, larguraMax: 800},
    deck: {x: 752, y: 640, w: 100},
    descarte: {x: 864, y: 640, w: 100},
    premios: {x0: 76, y0: 556, w: 58, vao: 8, colunas: 2},
  },
  oponente: {
    ativo: {x: CX, y: 421, w: 150},
    banco: {x0: 76, y: 421, w: 56, vao: 8},
    deck: {x: 762, y: 421, w: 56},
    descarte: {x: 846, y: 421, w: 56},
    premios: {x0: 590, y0: 376, w: 30, vao: 6, colunas: 3},
  },
  divisorY: 537,
  estadio: {x: 646, y: 760, w: 70},
  // pontos de destaque usados nas animações
  revelar: {x: CX, y: 950, w: 230},
  centro: {x: CX, y: 800, w: 470},
} as const;

export const poseAtivo = (lado: LadoId): Pose => {
  const z = ZONAS[lado].ativo;
  return pose(z.x, z.y, z.w, {z: 30});
};

export const poseBanco = (lado: LadoId, i: number): Pose => {
  if (lado === 'eu') {
    const z = ZONAS.eu.banco;
    const total = 5 * z.w + 4 * z.vao;
    return pose(CX - total / 2 + z.w / 2 + i * (z.w + z.vao), z.y, z.w, {z: 20});
  }
  const z = ZONAS.oponente.banco;
  return pose(z.x0 + z.w / 2 + i * (z.w + z.vao), z.y, z.w, {z: 20});
};

export const poseMao = (i: number, n: number): Pose => {
  const z = ZONAS.eu.mao;
  const passo = n > 1 ? Math.min(z.w + 12, (z.larguraMax - z.w) / (n - 1)) : 0;
  const d = i - (n - 1) / 2;
  return pose(CX + d * passo, z.y + Math.abs(d) * Math.abs(d) * 2.2, z.w, {rot: d * 2.6, z: 60 + i});
};

export const poseDeck = (lado: LadoId): Pose => {
  const z = ZONAS[lado].deck;
  return pose(z.x, z.y, z.w, {face: 0, z: 8});
};

export const poseDescarte = (lado: LadoId, i = 0): Pose => {
  const z = ZONAS[lado].descarte;
  return pose(z.x, z.y, z.w, {z: 10 + i, rot: i === 0 ? 0 : (acaso(i + 3) - 0.5) * 9});
};

export const posePremio = (lado: LadoId, i: number): Pose => {
  const z = ZONAS[lado].premios;
  const col = i % z.colunas;
  const lin = Math.floor(i / z.colunas);
  return pose(z.x0 + z.w / 2 + col * (z.w + z.vao), z.y0 + alturaCarta(z.w) / 2 + lin * (alturaCarta(z.w) + z.vao), z.w, {face: 0, z: 5});
};

export const poseEstadio = (): Pose => pose(ZONAS.estadio.x, ZONAS.estadio.y, ZONAS.estadio.w, {z: 9, rot: 90});

// Fora da tela: de onde vêm (e para onde vão) as cartas da mão escondida do oponente.
export const poseFora = (lado: LadoId): Pose =>
  lado === 'oponente' ? pose(CX, 60, 120, {op: 0, z: 90}) : pose(CX, 1560, 120, {op: 0, z: 90});

export type InfoPoke = {pid: string; lado: LadoId; base: Pose; poke: Poke};

export type Arranjo = {
  poses: Map<string, Pose>; // uid da carta -> pose
  pokes: Map<string, InfoPoke>; // pid -> onde o Pokémon está
  dono: Map<string, string>; // uid da carta -> pid do Pokémon a que ela pertence
};

// Monta o arranjo completo de um estado de jogo.
export const arranjar = (estado: Estado): Arranjo => {
  const poses = new Map<string, Pose>();
  const pokes = new Map<string, InfoPoke>();
  const dono = new Map<string, string>();

  const porPoke = (lado: LadoId, poke: Poke, base: Pose) => {
    pokes.set(poke.pid, {pid: poke.pid, lado, base, poke});
    const escala = base.w / 190;
    const n = poke.pilha.length;
    poke.pilha.forEach((c, k) => {
      // a pré-evolução fica por baixo, aparecendo um fiozinho em cima
      poses.set(c.uid, {...base, y: base.y - (n - 1 - k) * 7 * escala, z: base.z + k});
      dono.set(c.uid, poke.pid);
    });
    const d = base.w * 0.26;
    poke.energias.forEach((c, k) => {
      poses.set(c.uid, {
        ...base,
        x: base.x - base.w / 2 + d * 0.6 + k * d * 0.84,
        y: base.y + alturaCarta(base.w) / 2 - d * 0.22,
        w: d,
        icone: 1,
        z: base.z + 8 + k,
      });
      dono.set(c.uid, poke.pid);
    });
    poke.ferramentas.forEach((c, k) => {
      poses.set(c.uid, {
        ...base,
        x: base.x + base.w * 0.4,
        y: base.y - alturaCarta(base.w) * 0.16 + k * 20,
        w: base.w * 0.56,
        rot: 9,
        z: base.z - 2,
      });
      dono.set(c.uid, poke.pid);
    });
  };

  for (const lado of ['oponente', 'eu'] as LadoId[]) {
    const l = estado[lado];
    if (l.ativo) porPoke(lado, l.ativo, poseAtivo(lado));
    l.banco.forEach((p, i) => porPoke(lado, p, poseBanco(lado, i)));
    if (lado === 'eu' && !l.maoOculta) l.mao.forEach((c, i) => poses.set(c.uid, poseMao(i, l.mao.length)));
    l.descarte.forEach((c, i) => poses.set(c.uid, poseDescarte(lado, i)));
    l.premios.forEach((c, i) => {
      if (c) poses.set(c.uid, posePremio(lado, i));
    });
  }
  if (estado.estadio) poses.set(estado.estadio.inst.uid, poseEstadio());
  return {poses, pokes, dono};
};

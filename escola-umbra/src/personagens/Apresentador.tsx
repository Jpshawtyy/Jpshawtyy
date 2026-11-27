// O apresentador: Kai (e o Faísca) numa camada 3D por cima do vídeo inteiro.
// Cada tipo de cena tem uma posição (grande no gancho, no canto durante a aula, comemorando no CTA);
// na troca de cena os personagens deslizam de uma posição para a outra.

import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {VIDEO} from '../tema';
import {PALCO} from '../layout';
import {MOLA_SECA, misturar} from '../anim';
import type {Boca, Cena, TipoCena} from '../tipos';
import type {CenaPlanejada} from '../tempo';
import {LuzArena, Personagem, type Gesto} from './Personagem';

// Posição na tela: x do centro e y dos pés (em pixels), altura do corpo inteiro (em pixels) e giro.
export type Lugar = {x: number; pes: number; altura: number; giro: number; corte: number; visivel: number};

const ALTURA_KAI = 1.551; // metros, do modelo
const ALTURA_FAISCA = 0.507;

export type Preset = 'grande' | 'canto' | 'cta';

export const PRESET_DA_CENA = (cena: Cena): Preset => (cena.tipo === 'gancho' ? 'grande' : cena.tipo === 'cta' ? 'cta' : 'canto');

const LUGARES: Record<Preset, {kai: Lugar; faisca: Lugar}> = {
  // gancho: Kai grande à esquerda, cortado na cintura pela faixa de baixo; Faísca voando à direita
  grande: {
    kai: {x: 330, pes: 1760, altura: 1120, giro: 0.32, corte: PALCO.base, visivel: 1},
    faisca: {x: 800, pes: 1330, altura: 300, giro: -0.45, corte: PALCO.base, visivel: 1},
  },
  // durante a aula: Kai do peito para cima no canto de baixo à esquerda; Faísca sai de cena
  canto: {
    kai: {x: 300, pes: 1985, altura: 860, giro: 0.38, corte: PALCO.base, visivel: 1},
    faisca: {x: 1250, pes: 1300, altura: 220, giro: -0.6, corte: PALCO.base, visivel: 0},
  },
  // CTA: Kai à esquerda e Faísca à direita, embaixo do "SALVA"
  cta: {
    kai: {x: 330, pes: 1720, altura: 780, giro: 0.25, corte: PALCO.base, visivel: 1},
    faisca: {x: 790, pes: 1440, altura: 320, giro: -0.4, corte: PALCO.base, visivel: 1},
  },
};

// Gesto padrão de cada tipo de cena (pode ser trocado no roteiro com "kai": "apontando" etc.).
const GESTO_KAI: Record<TipoCena, string> = {
  gancho: 'acenando',
  lista: 'falando',
  piramide: 'falando',
  comparacao: 'pensando',
  carta_destaque: 'falando',
  riscado: 'pensando',
  mesa: 'falando',
  decklist: 'falando',
  confronto: 'pensando',
  impacto: 'falando',
  contagem: 'comemorando',
  combo: 'falando',
  respira: 'parado',
  ficha: 'falando',
  cta: 'joinha',
};
const GESTO_FAISCA: Record<TipoCena, string> = {
  gancho: 'feliz',
  lista: 'curioso',
  piramide: 'curioso',
  comparacao: 'curioso',
  carta_destaque: 'curioso',
  riscado: 'curioso',
  mesa: 'curioso',
  decklist: 'curioso',
  confronto: 'curioso',
  impacto: 'feliz',
  contagem: 'feliz',
  combo: 'curioso',
  ficha: 'curioso',
  respira: 'parado',
  cta: 'feliz',
};

// Linha do tempo de gestos (em segundos do vídeo), a partir das cenas planejadas.
export const gestosDoVideo = (cenas: CenaPlanejada[]) => {
  const kai: Gesto[] = [];
  const faisca: Gesto[] = [];
  for (const c of cenas) {
    const pedido = (c.cena as {kai?: string | Gesto[]}).kai;
    if (Array.isArray(pedido)) pedido.forEach((g) => kai.push({em: c.inicio + g.em, animacao: g.animacao}));
    else kai.push({em: c.inicio, animacao: pedido ?? GESTO_KAI[c.cena.tipo]});
    faisca.push({em: c.inicio, animacao: (c.cena as {faisca?: string}).faisca ?? GESTO_FAISCA[c.cena.tipo]});
  }
  if (kai[0]) kai[0].em = 0;
  if (faisca[0]) faisca[0].em = 0;
  return {kai, faisca};
};

const misturarLugar = (a: Lugar, b: Lugar, p: number): Lugar => ({
  x: misturar(a.x, b.x, p),
  pes: misturar(a.pes, b.pes, p),
  altura: misturar(a.altura, b.altura, p),
  giro: misturar(a.giro, b.giro, p),
  corte: misturar(a.corte, b.corte, p),
  visivel: misturar(a.visivel, b.visivel, p),
});

export const Apresentador: React.FC<{cenas: CenaPlanejada[]; boca?: Boca}> = ({cenas, boca}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;

  // lugar atual: mola entre o preset da cena anterior e o da atual
  let kai = LUGARES[PRESET_DA_CENA(cenas[0].cena)].kai;
  let faisca = LUGARES[PRESET_DA_CENA(cenas[0].cena)].faisca;
  cenas.forEach((c, i) => {
    if (i === 0) return;
    const p = spring({frame: quadro - c.de, fps, config: {...MOLA_SECA, stiffness: 140}});
    const destino = LUGARES[PRESET_DA_CENA(c.cena)];
    kai = misturarLugar(kai, destino.kai, p);
    faisca = misturarLugar(faisca, destino.faisca, p);
  });
  const {kai: gestosKai, faisca: gestosFaisca} = React.useMemo(() => gestosDoVideo(cenas), [cenas]);

  // o Faísca flutua um pouco (ele voa)
  const voo = Math.sin(t * 2.4) * 12;
  // câmera ortográfica: 1 unidade = 1 pixel, origem no centro da tela
  const mundo = (l: Lugar, alturaModelo: number, extraY = 0) => ({
    posicao: [l.x - VIDEO.largura / 2, VIDEO.altura / 2 - l.pes + extraY, 0] as [number, number, number],
    escala: l.altura / alturaModelo,
  });
  const k = mundo(kai, ALTURA_KAI);
  const f = mundo(faisca, ALTURA_FAISCA, voo);

  return (
    <AbsoluteFill style={{clipPath: `inset(0 0 ${VIDEO.altura - kai.corte}px 0)`, pointerEvents: 'none'}}>
      <ThreeCanvas
        orthographic
        width={VIDEO.largura}
        height={VIDEO.altura}
        camera={{position: [0, 0, 1500], near: 1, far: 4000, zoom: 1}}
        gl={{antialias: true, preserveDrawingBuffer: true, alpha: true}}
      >
        <LuzArena />
        <Personagem nome="kai" gestos={gestosKai} boca={boca} posicao={k.posicao} escala={k.escala} rotacaoY={kai.giro} />
        {/* o Faísca fica sempre montado (fora de cena quando não aparece), para não recarregar o modelo */}
        <Personagem nome="faisca" gestos={gestosFaisca} posicao={f.posicao} escala={f.escala * Math.max(0.001, faisca.visivel)} rotacaoY={faisca.giro} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// Clipe da Escola Umbra a partir de um vídeo horizontal (ex.: trecho de uma transmissão):
// o vídeo fica grande no meio, com ele mesmo desfocado no fundo, e por cima vão a etiqueta,
// o título, a legenda, zooms, impactos e uma tela final com o @.

import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MARCA, VIDEO} from '../tema';
import {FONTE_MONO} from '../fontes';
import {MOLA_PULO, MOLA_SECA, mola, trecho as faixa} from '../anim';
import {Etiqueta, TituloArena} from '../componentes/Arena';
import {completarLegendas} from '../tempo';
import {LegendaImpacto} from '../deckdodia/DeckDoDia';
import {Faiscas, Flash, Raios, Sfx, Tremer} from '../deckdodia/efeitos';
import type {Legenda} from '../tipos';

export type TrechoClipe = {
  de: number; // segundo no vídeo original
  ate: number;
  zoom?: {em: number; x: number; y: number; escala?: number}; // em: segundo dentro do trecho; x,y de 0 a 1 no quadro original
};

export type PropsClipe = {
  video: string; // caminho dentro de public/
  largura?: number; // proporção do vídeo original (padrão 16:9)
  altura?: number;
  rotulo?: string; // "JOGADA DO LAIC"
  serie?: string; // "São Paulo 2026"
  titulo?: string;
  trechos: TrechoClipe[];
  legendas?: Legenda[]; // tempos na linha do tempo do clipe (sem a tela final)
  impactos?: number[]; // segundos (no clipe) com flash, tremor e estrondo
  volume?: number;
};

export const FIM_CLIPE = 2.2; // segundos da tela final

export const duracaoClipe = (p: PropsClipe) => p.trechos.reduce((s, t) => s + Math.max(0, t.ate - t.de), 0) + FIM_CLIPE;

export const CLIPE_PADRAO: PropsClipe = {video: '_clipes/teste.mp4', trechos: [{de: 0, ate: 5}], titulo: 'jogada do LAIC'};

const TOPO_VIDEO = 560;

const TelaFinal: React.FC = () => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = mola(quadro, fps, 0.1, MOLA_PULO);
  const t2 = mola(quadro, fps, 0.45, MOLA_PULO);
  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
      <Raios x={VIDEO.largura / 2} y={760} forca={0.7} cor="rgba(240,193,96,0.4)" />
      <Faiscas quantidade={30} />
      <Img src={staticFile('logo.png')} style={{position: 'absolute', left: VIDEO.largura / 2 - 190, top: 570, width: 380, height: 380, objectFit: 'contain', opacity: Math.min(1, e * 2), transform: `scale(${3 - 2 * e})`, filter: 'drop-shadow(0 0 40px rgba(240,193,96,0.5))'}} />
      <div style={{position: 'absolute', left: AREA.x0, width: AREA.largura, top: 1000, display: 'flex', justifyContent: 'center', opacity: Math.min(1, t2 * 2), transform: `scale(${2 - t2})`}}>
        <TituloArena texto="segue pra mais" largura={AREA.largura} maximo={110} />
      </div>
      <div style={{position: 'absolute', left: 0, width: VIDEO.largura, top: 1150, textAlign: 'center', fontFamily: FONTE_MONO, fontWeight: 700, fontSize: 46, letterSpacing: '0.14em', color: CORES.ouro, opacity: t2}}>
        {MARCA}
      </div>
      <Flash em={[0.1]} forca={0.6} />
      <Sfx som="impacto" em={0.1} volume={0.4} />
      <Sfx som="pop" em={0.45} volume={0.3} />
    </AbsoluteFill>
  );
};

// Um trecho do vídeo: fundo desfocado + vídeo nítido no meio, com zoom opcional.
const Trecho: React.FC<{p: PropsClipe; t: TrechoClipe}> = ({p, t}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const W = VIDEO.largura;
  const H = (W * (p.altura ?? 9)) / (p.largura ?? 16);
  const z = t.zoom ? mola(quadro, fps, t.zoom.em, MOLA_SECA) : 0;
  const S = 1 + ((t.zoom?.escala ?? 1.8) - 1) * z;
  // leva o ponto escolhido para o centro do quadro do vídeo
  const ox = t.zoom ? (0.5 - t.zoom.x) * W * (S - 1) : 0;
  const oy = t.zoom ? (0.5 - t.zoom.y) * H * (S - 1) : 0;
  const inicio = Math.round(t.de * fps);
  const entra = faixa(quadro, [0, 6], [0, 1]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(p.video)} trimBefore={inicio} muted style={{position: 'absolute', height: '100%', left: '50%', transform: 'translateX(-50%) scale(1.15)', filter: 'blur(38px) brightness(0.45) saturate(1.2)'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: TOPO_VIDEO,
          width: W,
          height: H,
          overflow: 'hidden',
          boxShadow: `0 0 0 4px ${CORES.ouro}, 0 30px 80px rgba(0,0,0,0.7)`,
          transform: `scale(${0.92 + 0.08 * entra})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(p.video)}
          trimBefore={inicio}
          volume={p.volume ?? 1}
          style={{width: W, height: H, transform: `translate(${ox}px, ${oy}px) scale(${S})`, transformOrigin: 'center center'}}
        />
      </div>
    </AbsoluteFill>
  );
};

export const Clipe: React.FC<PropsClipe> = (p) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  let cursor = 0;
  const partes = p.trechos.map((tr) => {
    const de = Math.round(cursor * fps);
    const dur = Math.max(1, Math.round((tr.ate - tr.de) * fps));
    cursor += tr.ate - tr.de;
    return {tr, de, dur};
  });
  const fimConteudo = cursor;
  const legendas = completarLegendas(p.legendas ?? [], fimConteudo);
  const titulo = mola(quadro, fps, 0.1, MOLA_PULO);
  const cortes = partes.slice(1).map((x) => x.de / fps);
  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
      <Tremer impactos={p.impactos ?? []} forca={20}>
        {partes.map(({tr, de, dur}, i) => (
          <Sequence key={i} from={de} durationInFrames={dur}>
            <Trecho p={p} t={tr} />
          </Sequence>
        ))}
      </Tremer>
      {t < fimConteudo ? (
        <>
          <div style={{position: 'absolute', left: AREA.x0, width: AREA.largura, top: 256, display: 'flex', justifyContent: 'center'}}>
            <Etiqueta rotulo={p.rotulo ?? 'JOGADA DO LAIC'} complemento={p.serie} tamanho={26} />
          </div>
          {p.titulo ? (
            <div style={{position: 'absolute', left: AREA.x0, width: AREA.largura, top: 330, display: 'flex', justifyContent: 'center', opacity: Math.min(1, titulo * 2), transform: `scale(${2 - titulo})`}}>
              <TituloArena texto={p.titulo} largura={AREA.largura} maximo={96} />
            </div>
          ) : null}
          <LegendaImpacto legendas={legendas} inicioDaCena={0} />
        </>
      ) : null}
      <Sequence from={Math.round(fimConteudo * fps)} durationInFrames={Math.round(FIM_CLIPE * fps)}>
        <TelaFinal />
      </Sequence>
      <Flash em={[...cortes, ...(p.impactos ?? [])]} forca={0.5} />
      {cortes.map((c, i) => (
        <Sfx key={`c${i}`} som="whoosh" em={c} volume={0.25} />
      ))}
      {(p.impactos ?? []).map((m, i) => (
        <Sfx key={`i${i}`} som="boom" em={m} volume={0.45} />
      ))}
      <Sfx som="impacto" em={0.1} volume={0.3} />
    </AbsoluteFill>
  );
};

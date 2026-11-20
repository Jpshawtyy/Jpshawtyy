// Peças de edição da série Deck do Dia: carta em 3D (gira, vira, inclina, brilho holográfico),
// raios de luz, faíscas, tremor de câmera, flash e efeitos sonoros.

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES, PROPORCAO_CARTA, VIDEO} from '../tema';
import {acaso} from '../anim';
import {Carta, VersoCarta} from '../componentes/Carta';

// ---------- Carta 3D ----------

export type PoseCarta = {
  x: number; // centro
  y: number; // centro
  w: number; // largura
  rx?: number; // graus
  ry?: number; // graus (180 = de costas)
  rz?: number; // graus
  escala?: number;
  opacidade?: number;
  brilho?: number | null; // posição do reflexo holográfico, de 0 a 1 (null = sem reflexo)
  aura?: number; // 0 a 1: halo dourado em volta
  apagar?: number; // 0 a 1: escurece
  z?: number;
};

export const Carta3D: React.FC<PoseCarta & {imagem: string; children?: React.ReactNode}> = ({
  imagem,
  x,
  y,
  w,
  rx = 0,
  ry = 0,
  rz = 0,
  escala = 1,
  opacidade = 1,
  brilho = null,
  aura = 0,
  apagar = 0,
  z,
  children,
}) => {
  const h = w * PROPORCAO_CARTA;
  const raio = w * 0.045;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 1800, opacity: opacidade, zIndex: z}}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `scale(${escala}) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: raio,
            boxShadow: aura > 0 ? `0 0 ${w * 0.25 * aura}px ${w * 0.04 * aura}px rgba(240,193,96,${0.75 * aura})` : `0 ${w * 0.05}px ${w * 0.14}px rgba(0,0,0,0.6)`,
          }}
        >
          <Carta imagem={imagem} largura={w} sombra={false} style={apagar > 0 ? {filter: `brightness(${1 - 0.65 * apagar}) saturate(${1 - 0.6 * apagar})`} : undefined} />
          {brilho !== null ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: raio,
                overflow: 'hidden',
                mixBlendMode: 'screen',
                background: `linear-gradient(115deg, transparent ${brilho * 160 - 40}%, rgba(255,255,255,0.0) ${brilho * 160 - 30}%, rgba(255,240,200,0.65) ${brilho * 160 - 20}%, rgba(255,255,255,0.0) ${brilho * 160 - 10}%, transparent ${brilho * 160}%)`,
              }}
            />
          ) : null}
          {children}
        </div>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
          <VersoCarta largura={w} />
        </div>
      </div>
    </div>
  );
};

// Reflexo que passa pela carta a cada "periodo" segundos (posição de 0 a 1, ou null fora da passada).
export const passadaDeBrilho = (t: number, periodo = 1.8, inicio = 0.4, duracao = 0.55) => {
  if (t < inicio) return null;
  const f = ((t - inicio) % periodo) / duracao;
  return f <= 1 ? f : null;
};

// Balanço contínuo de quem está "mostrando" a carta na mão.
export const balanco = (t: number, forca = 1) => ({
  rx: Math.sin(t * 1.7) * 6 * forca,
  ry: Math.sin(t * 1.1 + 0.6) * 13 * forca,
  rz: Math.sin(t * 0.9 + 1.2) * 2.5 * forca,
  dy: Math.sin(t * 1.9) * 10 * forca,
});

// ---------- Câmera ----------

// Tremor depois de cada impacto (em segundos): decai rápido.
export const tremor = (t: number, impactos: number[], forca = 22) => {
  let dx = 0;
  let dy = 0;
  let giro = 0;
  for (const i of impactos) {
    const d = t - i;
    if (d < 0 || d > 0.45) continue;
    const a = forca * Math.exp(-d * 11);
    dx += Math.sin(d * 95 + i * 7) * a;
    dy += Math.cos(d * 83 + i * 3) * a * 0.8;
    giro += Math.sin(d * 70 + i) * a * 0.04;
  }
  return {dx, dy, giro};
};

export const Tremer: React.FC<{impactos: number[]; forca?: number; children: React.ReactNode}> = ({impactos, forca, children}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {dx, dy, giro} = tremor(quadro / fps, impactos, forca);
  return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) rotate(${giro}deg)`}}>{children}</AbsoluteFill>;
};

// Flash branco-dourado curto em cada instante da lista.
export const Flash: React.FC<{em: number[]; forca?: number}> = ({em, forca = 0.75}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  let o = 0;
  for (const e of em) {
    const d = t - e;
    if (d >= 0 && d < 0.25) o = Math.max(o, forca * (1 - d / 0.25) ** 2);
  }
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, rgba(255,250,235,${o}) 0%, rgba(240,193,96,${o * 0.6}) 45%, rgba(229,50,63,${o * 0.25}) 100%)`, pointerEvents: 'none'}} />;
};

// ---------- Fundo ----------

// Raios de luz girando atrás de um ponto (a carta em destaque).
export const Raios: React.FC<{x: number; y: number; forca?: number; raio?: number; cor?: string}> = ({x, y, forca = 1, raio = 900, cor = 'rgba(229,50,63,0.55)'}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const giro = (quadro / fps) * 14;
  if (forca <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - raio,
        top: y - raio,
        width: raio * 2,
        height: raio * 2,
        opacity: forca,
        background: `repeating-conic-gradient(from ${giro}deg, ${cor} 0deg 5deg, transparent 5deg 15deg)`,
        WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 68%)',
        maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 68%)',
      }}
    />
  );
};

// Faíscas douradas subindo pela tela.
export const Faiscas: React.FC<{quantidade?: number; forca?: number}> = ({quantidade = 38, forca = 1}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: forca}}>
      {Array.from({length: quantidade}, (_, i) => {
        const vel = 60 + acaso(i * 3.1) * 140;
        const ciclo = VIDEO.altura + 200;
        const y = VIDEO.altura + 100 - ((t * vel + acaso(i * 5.7) * ciclo) % ciclo);
        const x = acaso(i * 1.3) * VIDEO.largura + Math.sin(t * (0.8 + acaso(i) * 1.5) + i) * 30;
        const tam = 3 + acaso(i * 9.1) * 7;
        const pisca = 0.45 + 0.55 * Math.abs(Math.sin(t * (2 + acaso(i * 2.2) * 4) + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: tam,
              height: tam,
              borderRadius: '50%',
              background: i % 4 === 0 ? CORES.vermelho : CORES.ouro,
              boxShadow: `0 0 ${tam * 3}px ${i % 4 === 0 ? CORES.vermelho : CORES.ouro}`,
              opacity: pisca,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Linhas de velocidade saindo do centro (no instante de um impacto).
export const LinhasDeVelocidade: React.FC<{em: number; x?: number; y?: number}> = ({em, x = VIDEO.largura / 2, y = VIDEO.altura / 2}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = quadro / fps - em;
  if (d < 0 || d > 0.4) return null;
  const o = 1 - d / 0.4;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 26}, (_, i) => {
        const ang = (i / 26) * 360 + acaso(i) * 8;
        const ini = 260 + d * 900 + acaso(i * 4) * 120;
        const comp = 180 + acaso(i * 7) * 260;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y - 2,
              width: comp,
              height: 4 + acaso(i * 2) * 4,
              background: `linear-gradient(90deg, rgba(245,241,232,0), rgba(245,241,232,${0.7 * o}))`,
              transformOrigin: '0 50%',
              transform: `rotate(${ang}deg) translateX(${ini}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Som ----------

export type Som = 'whoosh' | 'impacto' | 'carta' | 'brilho' | 'subida' | 'boing' | 'pop' | 'ding' | 'trombone';
const VOLUME: Record<Som, number> = {whoosh: 0.32, impacto: 0.5, carta: 0.22, brilho: 0.2, subida: 0.18, boing: 0.4, pop: 0.4, ding: 0.35, trombone: 0.42};

// Efeito sonoro num segundo da cena.
export const Sfx: React.FC<{som: Som; em: number; volume?: number}> = ({som, em, volume}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(em * fps))} durationInFrames={Math.round(1.2 * fps)} layout="none">
      <Audio src={staticFile(`sfx/${som}.wav`)} volume={volume ?? VOLUME[som]} />
    </Sequence>
  );
};

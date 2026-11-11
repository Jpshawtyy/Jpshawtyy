import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES, VIDEO} from '../tema';
import {MOLA_SECA, misturar} from '../anim';
import {spring} from 'remotion';

// Lua crescente desenhada com dois arcos.
export const LuaCrescente: React.FC<{tamanho: number; cor?: string; opacidade?: number}> = ({
  tamanho,
  cor = CORES.ouro,
  opacidade = 1,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{opacity: opacidade, display: 'block'}}>
    <path d="M 58 6 A 44 44 0 1 0 94 62 A 36 36 0 1 1 58 6 Z" fill={cor} />
  </svg>
);

// Onde fica o centro dos anéis em cada cena (ele desliza de um ponto ao outro na troca de cena).
const ANCORAS: [number, number][] = [
  [495, 790],
  [190, 520],
  [495, 660],
  [820, 600],
  [495, 880],
  [240, 1050],
];

const RAIOS = [150, 262, 384, 520, 668, 830, 1004, 1190];

// Fundo preto com anéis dourados finos (10 a 25% de opacidade) e uma lua crescente pequena.
export const Fundo: React.FC<{inicios: number[]; suave?: boolean}> = ({inicios, suave = false}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();

  let cx = ANCORAS[0][0];
  let cy = ANCORAS[0][1];
  inicios.forEach((de, i) => {
    if (i === 0) return;
    const p = spring({frame: quadro - de, fps, config: {...MOLA_SECA, stiffness: 120}});
    const [ax, ay] = ANCORAS[i % ANCORAS.length];
    cx = misturar(cx, ax, p);
    cy = misturar(cy, ay, p);
  });

  const t = quadro / fps;
  const respiro = 1 + Math.sin(t * 0.9) * 0.012;
  const forca = suave ? 0.6 : 1;

  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
      <svg width={VIDEO.largura} height={VIDEO.altura} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${cx} ${cy}) scale(${respiro})`}>
          {RAIOS.map((r, i) => {
            const tracejado = i % 3 === 1;
            const opacidade = (0.1 + 0.15 * (1 - i / (RAIOS.length - 1))) * forca;
            const giro = (i % 2 === 0 ? 1 : -1) * t * (3 + i * 0.6);
            return (
              <circle
                key={r}
                r={r}
                fill="none"
                stroke={CORES.ouro}
                strokeWidth={tracejado ? 2 : 1.5}
                strokeOpacity={Math.max(0.1 * forca, opacidade)}
                strokeDasharray={tracejado ? `${r * 0.5} ${r * 0.12}` : undefined}
                transform={`rotate(${giro})`}
              />
            );
          })}
          {/* pontinho que orbita um anel, para o fundo nunca ficar parado */}
          <g transform={`rotate(${t * 22})`}>
            <circle cx={RAIOS[2]} cy={0} r={5} fill={CORES.ouro} fillOpacity={0.5 * forca} />
          </g>
          <g transform={`rotate(${-t * 14 + 140})`}>
            <circle cx={RAIOS[4]} cy={0} r={4} fill={CORES.ouro} fillOpacity={0.4 * forca} />
          </g>
        </g>
      </svg>
      {/* lua crescente pequena, fora da área do conteúdo */}
      <div style={{position: 'absolute', left: 930, top: 1530, transform: `rotate(${-18 + Math.sin(t * 0.7) * 3}deg)`}}>
        <LuaCrescente tamanho={74} opacidade={0.55} />
      </div>
      {/* escurece as bordas para o centro respirar */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 75% 60% at 46% 45%, rgba(10,10,12,0) 40%, rgba(10,10,12,0.78) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

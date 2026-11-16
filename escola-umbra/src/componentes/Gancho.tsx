import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES} from '../tema';
import {FONTE_MONO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {INCLINACAO, ListrasOuro, TituloArena, TracoOuro} from './Arena';
import type {CenaGancho} from '../tipos';

// Gancho: palavra gigante em maiúsculas, branca com sombra vermelha. Já está na tela no quadro 0.
export const Gancho: React.FC<{cena: CenaGancho}> = ({cena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;

  const batida = mola(quadro, fps, 0, MOLA_PULO);
  const escala = 1.22 - 0.22 * batida;
  // tremidinha quando a palavra "bate"
  const tremor = t < 0.3 ? Math.sin(t * 95) * 6 * (1 - t / 0.3) : 0;
  const traco = mola(quadro, fps, 0.25);
  const sub = mola(quadro, fps, 0.45, MOLA_PULO);
  const listras = trecho(t, [0, 0.35], [1, 0]);
  const centroY = 760;

  return (
    <AbsoluteFill>
      {/* palavra-fantasma do próprio gancho, enorme e em contorno */}
      <div
        style={{
          position: 'absolute',
          left: -200,
          right: -200,
          top: centroY - 300,
          textAlign: 'center',
          fontFamily: FONTE_TITULO,
          fontSize: 420,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(229,50,63,0.22)',
          transform: `skewX(${INCLINACAO}deg) translateX(${(1 - batida) * 120 - t * 10}px)`,
        }}
      >
        {cena.texto.split('\n')[0].toLocaleUpperCase('pt-BR')}
      </div>
      {/* listras douradas que cruzam a tela no começo */}
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${-listras * 900}px)`, opacity: 1 - trecho(t, [0.35, 0.6], [0, 0.65])}}>
        <ListrasOuro x={AREA.x1 - 120} y={centroY - 380} altura={760} inclinacao={260} brilho={(t * 0.5) % 1} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: centroY - 320,
          height: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{transform: `scale(${escala}) translateX(${tremor}px)`}}>
          <TituloArena texto={cena.texto} largura={AREA.largura - 30} maximo={210} />
        </div>
        <TracoOuro largura={260} progresso={traco} style={{marginTop: 34}} />
        {cena.subtitulo ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: FONTE_MONO,
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: CORES.texto,
              textAlign: 'center',
              opacity: Math.min(1, sub * 1.5),
              transform: `translateY(${(1 - sub) * 26}px)`,
            }}
          >
            {cena.subtitulo}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

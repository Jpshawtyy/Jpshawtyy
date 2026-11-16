import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, MOLDURA} from '../tema';
import {MOLA_PULO, mola} from '../anim';
import {TituloArena, TracoOuro} from './Arena';

// Título de cena: maiúsculas, branco, inclinado, com sombra vermelha e o traço dourado embaixo.
export const Titulo: React.FC<{texto: string; topo?: number; maximo?: number}> = ({texto, topo = MOLDURA.conteudoY0 + 20, maximo = 74}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = mola(quadro, fps, 0, MOLA_PULO);
  const traco = mola(quadro, fps, 0.15);
  return (
    <div
      style={{
        position: 'absolute',
        left: AREA.x0,
        width: AREA.largura,
        top: topo,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        opacity: Math.min(1, 0.4 + e),
        transform: `translateX(${(1 - e) * -40}px)`,
      }}
    >
      <TituloArena texto={texto} largura={AREA.largura - 20} maximo={maximo} />
      <TracoOuro largura={120} progresso={traco} />
    </div>
  );
};

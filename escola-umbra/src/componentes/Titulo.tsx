import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MOLDURA} from '../tema';
import {FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {TextoAjustado} from './TextoAjustado';

// Título de cena: Unbounded dourado, no alto da área de conteúdo.
export const Titulo: React.FC<{texto: string; topo?: number; maximo?: number}> = ({
  texto,
  topo = MOLDURA.conteudoY0 + 24,
  maximo = 66,
}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = mola(quadro, fps, 0, MOLA_PULO);
  return (
    <div
      style={{
        position: 'absolute',
        left: AREA.x0,
        width: AREA.largura,
        top: topo,
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(1, 0.4 + e),
        transform: `translateY(${(1 - e) * -22}px) scale(${0.9 + 0.1 * e})`,
      }}
    >
      <TextoAjustado texto={texto} largura={AREA.largura - 40} maximo={maximo} fonte={FONTE_TITULO} peso={700} style={{color: CORES.ouro}} />
    </div>
  );
};

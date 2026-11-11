import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES} from '../tema';
import {acaso} from '../anim';

// Estrelinha de quatro pontas que pisca.
export const Estrela: React.FC<{x: number; y: number; tamanho: number; semente: number; atraso?: number}> = ({
  x,
  y,
  tamanho,
  semente,
  atraso = 0,
}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps - atraso;
  if (t < 0) return null;
  const fase = acaso(semente) * Math.PI * 2;
  const ritmo = 5 + acaso(semente + 9) * 4;
  const brilho = 0.5 + 0.5 * Math.sin(t * ritmo + fase);
  const nasce = Math.min(1, t * 8);
  const escala = nasce * (0.45 + 0.55 * brilho);
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="-50 -50 100 100"
      style={{
        position: 'absolute',
        left: x - tamanho / 2,
        top: y - tamanho / 2,
        opacity: 0.35 + 0.65 * brilho,
        transform: `scale(${escala}) rotate(${t * 40 + fase * 30}deg)`,
      }}
    >
      <path d="M0 -50 C 6 -14, 14 -6, 50 0 C 14 6, 6 14, 0 50 C -6 14, -14 6, -50 0 C -14 -6, -6 -14, 0 -50 Z" fill={CORES.ouro} />
    </svg>
  );
};

// Personagem 2D: uma imagem recortada por pose, com entrada saltando de baixo, respiração e um pulinho
// a cada troca de cena. Fica por cima da cena e por baixo da legenda.
import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOLA_PULO, mola} from '../anim';

export const Mascote2D: React.FC<{pose: string; x?: number; base?: number; altura?: number; espelhar?: boolean; falando?: boolean}> = ({
  pose,
  x = 700,
  base = 1640,
  altura = 1050,
  espelhar = false,
  falando = false,
}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const entra = mola(quadro, fps, 0.05, MOLA_PULO);
  const respira = Math.sin(t * 2.2) * 0.008;
  const fala = falando ? Math.abs(Math.sin(t * 9)) * 0.012 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: base,
        height: altura,
        transform: `translate(-50%, -100%) translateY(${(1 - entra) * 500}px) scale(${espelhar ? -1 : 1}, 1) scaleY(${1 + respira + fala}) rotate(${(1 - entra) * (espelhar ? 8 : -8)}deg)`,
        transformOrigin: '50% 100%',
        opacity: Math.min(1, entra * 2),
        filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.55))',
        zIndex: 15,
      }}
    >
      <Img src={staticFile(`mascote/${pose}.png`)} style={{height: '100%', display: 'block'}} />
    </div>
  );
};

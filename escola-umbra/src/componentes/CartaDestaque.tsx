import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, PROPORCAO_CARTA} from '../tema';
import {MOLA_PULO, mola} from '../anim';
import {Titulo} from './Titulo';
import {Pill} from './Pill';
import {Carta} from './Carta';
import {Estrela} from './Estrela';
import type {CenaCartaDestaque, MapaCartas} from '../tipos';

// Carta em destaque: entra girando de leve, ganha uma pill ("DE VOLTA", "META") e estrelinhas piscando.
export const CartaDestaque: React.FC<{cena: CenaCartaDestaque; cartas: MapaCartas}> = ({cena, cartas}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const dados = cartas[cena.carta];
  if (!dados) return null;

  const largura = cena.titulo ? 480 : 540;
  const altura = largura * PROPORCAO_CARTA;
  const cy = cena.titulo ? 838 : 790;
  const e = mola(quadro, fps, 0.05, MOLA_PULO);
  const pill = mola(quadro, fps, 0.45, MOLA_PULO);
  const balanco = Math.sin(t * 1.6) * 1.2;
  const giro = -22 + 18 * e + balanco; // termina levemente inclinada
  const x0 = AREA.cx - largura / 2;
  const y0 = cy - altura / 2;

  const estrelas: [number, number, number][] = [
    [x0 - 30, y0 + 60, 58],
    [x0 + largura + 34, y0 + 150, 44],
    [x0 - 44, y0 + altura * 0.62, 36],
    [x0 + largura + 20, y0 + altura * 0.78, 60],
    [x0 + largura * 0.2, y0 + altura + 34, 34],
    [x0 + largura * 0.82, y0 - 30, 40],
    [x0 + 40, y0 - 36, 28],
  ];

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      {/* brilho atrás da carta */}
      <div
        style={{
          position: 'absolute',
          left: AREA.cx - largura,
          top: cy - largura,
          width: largura * 2,
          height: largura * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,184,74,0.22) 0%, rgba(232,184,74,0) 62%)',
          opacity: e,
          transform: `scale(${0.6 + 0.4 * e + Math.sin(t * 2.2) * 0.03})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: y0,
          opacity: Math.min(1, e * 2),
          transform: `translateY(${(1 - e) * 320}px) rotate(${giro}deg) scale(${0.55 + 0.45 * e})`,
        }}
      >
        <Carta imagem={dados.imagem} largura={largura} />
        {cena.pill ? (
          <div style={{position: 'absolute', left: -34, top: -30, transform: `rotate(-9deg) scale(${pill})`, transformOrigin: '30% 50%', opacity: pill}}>
            <Pill cor={cena.pill_cor ?? 'ouro'} tamanho={44}>
              {cena.pill}
            </Pill>
          </div>
        ) : null}
      </div>
      {estrelas.map(([x, y, tam], i) => (
        <Estrela key={i} x={x} y={y} tamanho={tam} semente={i + 11} atraso={0.35 + i * 0.09} />
      ))}
    </AbsoluteFill>
  );
};

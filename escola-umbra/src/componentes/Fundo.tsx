import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES, VIDEO} from '../tema';
import {FONTE_TITULO} from '../fontes';
import {MOLA_SECA, misturar} from '../anim';
import {INCLINACAO, ListrasOuro, fundoVermelho} from './Arena';

// Lua crescente desenhada com dois arcos (mantida para quem ainda usa).
export const LuaCrescente: React.FC<{tamanho: number; cor?: string; opacidade?: number}> = ({tamanho, cor = CORES.ouro, opacidade = 1}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{opacity: opacidade, display: 'block'}}>
    <path d="M 58 6 A 44 44 0 1 0 94 62 A 36 36 0 1 1 58 6 Z" fill={cor} />
  </svg>
);

// Altura da palavra-fantasma em cada cena (ela desliza de uma posição para outra na troca de cena).
const ALTURAS = [560, 1040, 760, 1180, 640, 900];

// Fundo "Estilo Arena": preto, grade bem fraca, palavra-fantasma em contorno, painel vermelho
// pontilhado com listras douradas nos cantos (fora da área do conteúdo) e linha ouro-vermelho no pé.
export const Fundo: React.FC<{inicios: number[]; suave?: boolean}> = ({inicios, suave = false}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;

  let y = ALTURAS[0];
  inicios.forEach((de, i) => {
    if (i === 0) return;
    const p = spring({frame: quadro - de, fps, config: {...MOLA_SECA, stiffness: 120}});
    y = misturar(y, ALTURAS[i % ALTURAS.length], p);
  });
  const brilho = (t * 0.35) % 1;
  const forca = suave ? 0.5 : 1;

  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
      {/* grade bem fraca */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,241,232,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.03) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `${-t * 6}px 0`,
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 30%, transparent 85%)',
          opacity: forca,
        }}
      />
      {/* palavra-fantasma em contorno, andando devagar */}
      <div
        style={{
          position: 'absolute',
          left: -120 - ((t * 14) % 600),
          top: y - 260,
          fontFamily: FONTE_TITULO,
          fontSize: 520,
          lineHeight: 1,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          color: 'transparent',
          WebkitTextStroke: `2px rgba(245,241,232,${0.055 * forca})`,
          transform: `skewX(${INCLINACAO}deg)`,
        }}
      >
        UMBRA UMBRA UMBRA
      </div>

      {/* canto de cima, à direita: aba vermelha com listras (como no topo das páginas do guia) */}
      <div style={{position: 'absolute', right: 0, top: 0, width: 300, height: 120, clipPath: 'polygon(46px 0, 100% 0, 100% 100%, 0 100%)', ...fundoVermelho()}} />
      <ListrasOuro x={1080 - 300 - 62} y={0} altura={120} inclinacao={46} brilho={brilho} />

      {/* pé da tela, à direita: painel vermelho grande em diagonal */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 1590,
          width: VIDEO.largura,
          height: 330,
          clipPath: 'polygon(760px 0, 100% 0, 100% 100%, 640px 100%)',
          ...fundoVermelho(160),
        }}
      />
      <ListrasOuro x={640 - 64} y={1590} altura={330} inclinacao={120} brilho={(brilho + 0.5) % 1} />

      {/* linha do pé: ouro para vermelho */}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: VIDEO.largura, height: 6, background: `linear-gradient(90deg, ${CORES.ouro}, ${CORES.vermelho})`}} />

      {/* escurece as bordas para o centro respirar */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 65% at 50% 45%, rgba(10,10,13,0) 45%, rgba(10,10,13,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

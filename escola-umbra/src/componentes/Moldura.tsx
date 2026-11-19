import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MARCA, MOLDURA, SEGURA, VIDEO} from '../tema';
import {FONTE_MONO} from '../fontes';
import {mola} from '../anim';
import {Etiqueta} from './Arena';

export const textoDaSerie = (numero: number, serie: string) => `AULA ${String(numero).padStart(2, '0')} · ${serie.toUpperCase()}`;

// Tamanho de letra da etiqueta que cabe na largura útil (Barlow Condensed maiúscula e espaçada).
export const tamanhoEtiqueta = (numero: number, serie: string, largura = AREA.largura) => {
  const caracteres = `AULA ${String(numero).padStart(2, '0')}`.length + serie.length + 3;
  return Math.max(15, Math.min(30, Math.floor((largura - 80) / (caracteres * 0.68))));
};

// Etiqueta da série no topo ([AULA 06] // DO ZERO AO CAMPEONATO) e o @ no pé. Fica por cima de todas as cenas.
// marcaADireita: com o Kai no canto, o @ vai para a direita, embaixo do balão.
export const Moldura: React.FC<{numero: number; serie: string; marcaADireita?: boolean}> = ({numero, serie, marcaADireita = false}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  // começa quase pronta: no quadro 0 a etiqueta já está legível
  const entra = 0.75 + 0.25 * mola(quadro, fps, 0);
  const tamanho = tamanhoEtiqueta(numero, serie);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: MOLDURA.etiquetaY,
          height: MOLDURA.etiquetaAltura,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: entra,
          transform: `translateY(${(1 - entra) * -16}px)`,
        }}
      >
        <Etiqueta rotulo={`AULA ${String(numero).padStart(2, '0')}`} complemento={serie} tamanho={tamanho} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: MOLDURA.rodapeY,
          display: 'flex',
          justifyContent: marcaADireita ? 'flex-end' : 'center',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONTE_MONO,
          fontWeight: 600,
          fontSize: 23,
          lineHeight: '32px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: CORES.secundario,
          opacity: entra,
        }}
      >
        <span style={{width: 22, height: 4, background: CORES.ouro, transform: 'skewX(-30deg)', display: 'inline-block'}} />
        {MARCA}
      </div>
    </AbsoluteFill>
  );
};

// Guias da área segura (só para conferência, com --guias).
export const Guias: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {[
      {left: 0, top: 0, width: VIDEO.largura, height: SEGURA.topo},
      {left: 0, top: VIDEO.altura - SEGURA.base, width: VIDEO.largura, height: SEGURA.base},
      {left: VIDEO.largura - SEGURA.direita, top: 0, width: SEGURA.direita, height: VIDEO.altura},
    ].map((r, i) => (
      <div key={i} style={{position: 'absolute', ...r, background: 'rgba(214,51,74,0.28)'}} />
    ))}
    <div
      style={{
        position: 'absolute',
        left: AREA.x0,
        top: AREA.y0,
        width: AREA.largura,
        height: AREA.y1 - AREA.y0,
        boxShadow: 'inset 0 0 0 2px rgba(80,220,140,0.9)',
      }}
    />
  </AbsoluteFill>
);

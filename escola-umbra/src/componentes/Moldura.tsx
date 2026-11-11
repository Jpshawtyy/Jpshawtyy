import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MARCA, MOLDURA, SEGURA, VIDEO} from '../tema';
import {FONTE_MONO} from '../fontes';
import {mola} from '../anim';

export const textoDaSerie = (numero: number, serie: string) =>
  `AULA ${String(numero).padStart(2, '0')} · ${serie.toUpperCase()}`;

// Etiqueta da série no topo e o @ no rodapé. Fica por cima de todas as cenas.
export const Moldura: React.FC<{numero: number; serie: string}> = ({numero, serie}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Começa quase pronta: no quadro 0 a etiqueta já está legível.
  const entra = 0.75 + 0.25 * mola(quadro, fps, 0);
  const texto = textoDaSerie(numero, serie);
  // Reduz a letra se o nome da série for comprido, para caber na área segura.
  const tamanho = Math.min(24, Math.floor((AREA.largura - 80) / (texto.length * 0.74)));

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: MOLDURA.etiquetaAltura,
            padding: '0 20px',
            borderRadius: 999,
            background: 'rgba(10,10,12,0.78)',
            boxShadow: `inset 0 0 0 1.5px rgba(232,184,74,0.55)`,
            fontFamily: FONTE_MONO,
            fontWeight: 500,
            fontSize: tamanho,
            letterSpacing: '0.1em',
            color: CORES.ouro,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{width: 9, height: 9, borderRadius: 9, background: CORES.ouro, display: 'inline-block'}} />
          {texto}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: MOLDURA.rodapeY,
          textAlign: 'center',
          fontFamily: FONTE_MONO,
          fontWeight: 500,
          fontSize: 24,
          lineHeight: '32px',
          letterSpacing: '0.06em',
          color: CORES.secundario,
          opacity: entra,
        }}
      >
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

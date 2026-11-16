import React from 'react';
import {CORES} from '../tema';
import {FONTE_MONO} from '../fontes';

// Etiqueta curta em paralelogramo: vermelha (marca, alerta) ou dourada (destaque).
export const Pill: React.FC<{
  children: React.ReactNode;
  cor?: 'ouro' | 'vermelho';
  tamanho?: number;
  contorno?: boolean;
  style?: React.CSSProperties;
}> = ({children, cor = 'ouro', tamanho = 30, contorno = false, style}) => {
  const fundo = cor === 'ouro' ? CORES.ouro : CORES.vermelho;
  const texto = cor === 'ouro' ? CORES.pillOuroTexto : CORES.pillVermelhoTexto;
  return (
    <div
      style={{
        display: 'inline-flex',
        transform: 'skewX(-14deg)',
        background: contorno ? 'rgba(10,10,13,0.78)' : fundo,
        boxShadow: contorno ? `inset 0 0 0 2px ${fundo}` : '0 6px 18px rgba(0,0,0,0.45)',
        padding: `${tamanho * 0.36}px ${tamanho * 0.8}px`,
        ...style,
      }}
    >
      <div
        style={{
          transform: 'skewX(14deg)',
          fontFamily: FONTE_MONO,
          fontWeight: 700,
          fontSize: tamanho,
          lineHeight: 1,
          letterSpacing: '0.14em',
          marginRight: '-0.14em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: contorno ? fundo : texto,
        }}
      >
        {children}
      </div>
    </div>
  );
};

import React from 'react';
import {CORES} from '../tema';
import {FONTE_MONO} from '../fontes';

// Etiqueta arredondada: dourada (bom) ou vermelha (alerta).
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
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTE_MONO,
        fontWeight: 500,
        fontSize: tamanho,
        lineHeight: 1,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        padding: `${tamanho * 0.42}px ${tamanho * 0.8}px`,
        borderRadius: 999,
        background: contorno ? 'rgba(10,10,12,0.72)' : fundo,
        color: contorno ? fundo : texto,
        boxShadow: contorno ? `inset 0 0 0 2px ${fundo}` : '0 6px 18px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

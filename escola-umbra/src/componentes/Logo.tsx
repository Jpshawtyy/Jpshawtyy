import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CORES} from '../tema';

// Logo provisória da Escola Umbra: lua crescente dourada de capelo.
// Serve só para gerar public/logo.png quando ele ainda não existe ("npm run logo").
// Se você tem a logo oficial, salve por cima de public/logo.png.
export const LogoDesenho: React.FC<{tamanho: number}> = ({tamanho}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 512 512">
    <defs>
      <mask id="crescente">
        <rect width="512" height="512" fill="black" />
        <circle cx="244" cy="296" r="184" fill="white" />
        <circle cx="322" cy="250" r="156" fill="black" />
      </mask>
    </defs>
    <rect width="512" height="512" fill={CORES.ouro} mask="url(#crescente)" />
    <g transform="translate(176 150) rotate(-17)">
      {/* copa do capelo */}
      <path d="M-80 20 L-80 72 Q0 112 80 72 L80 20 Z" fill={CORES.texto} stroke={CORES.fundo} strokeWidth="12" strokeLinejoin="round" />
      {/* tampo */}
      <path d="M-158 0 L0 -56 L158 0 L0 56 Z" fill={CORES.texto} stroke={CORES.fundo} strokeWidth="12" strokeLinejoin="round" />
      {/* cordão e borla */}
      <path d="M0 0 L116 12 L116 84" fill="none" stroke={CORES.fundo} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 0 L116 12 L116 84" fill="none" stroke={CORES.ouro} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="103" y="82" width="26" height="40" rx="6" fill={CORES.ouro} stroke={CORES.fundo} strokeWidth="6" />
      <circle cx="0" cy="0" r="11" fill={CORES.ouro} stroke={CORES.fundo} strokeWidth="5" />
    </g>
  </svg>
);

export const LogoQuadro: React.FC = () => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <LogoDesenho tamanho={1024} />
  </AbsoluteFill>
);

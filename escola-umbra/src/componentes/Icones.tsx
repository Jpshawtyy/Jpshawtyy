// Ícones simples em traço dourado, para as capas de destaque do Instagram.
import React from 'react';
import {CORES} from '../tema';

export type NomeIcone = 'aulas' | 'decks' | 'regras' | 'trofeu' | 'calendario' | 'sacola';

const traco = {fill: 'none', stroke: CORES.ouro, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

export const Icone: React.FC<{nome: NomeIcone; tamanho: number}> = ({nome, tamanho}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 120 120" style={{filter: 'drop-shadow(0 0 18px rgba(240,193,96,0.45))'}}>
    {nome === 'aulas' ? (
      <g {...traco}>
        <path d="M10 46 L60 24 L110 46 L60 68 Z" />
        <path d="M30 56 V80 C30 90 90 90 90 80 V56" />
        <path d="M110 46 V74" />
        <circle cx="110" cy="80" r="5" fill={CORES.ouro} />
      </g>
    ) : null}
    {nome === 'decks' ? (
      <g {...traco}>
        <rect x="18" y="30" width="44" height="62" rx="5" transform="rotate(-14 40 61)" />
        <rect x="38" y="26" width="44" height="62" rx="5" fill={CORES.fundo} />
        <rect x="58" y="30" width="44" height="62" rx="5" transform="rotate(14 80 61)" fill={CORES.fundo} />
        <circle cx="80" cy="61" r="9" transform="rotate(14 80 61)" />
      </g>
    ) : null}
    {nome === 'regras' ? (
      <g {...traco}>
        <rect x="26" y="16" width="68" height="90" rx="6" />
        <path d="M40 40 H80 M40 58 H80 M40 76 H66" />
        <path d="M46 8 H74 V24 H46 Z" fill={CORES.fundo} />
      </g>
    ) : null}
    {nome === 'trofeu' ? (
      <g {...traco}>
        <path d="M36 18 H84 V46 C84 62 72 72 60 72 C48 72 36 62 36 46 Z" />
        <path d="M36 28 H20 C20 46 30 52 38 52 M84 28 H100 C100 46 90 52 82 52" />
        <path d="M60 72 V88 M42 100 H78 M48 88 H72 V100 H48 Z" />
      </g>
    ) : null}
    {nome === 'calendario' ? (
      <g {...traco}>
        <rect x="16" y="24" width="88" height="80" rx="8" />
        <path d="M16 46 H104 M38 14 V32 M82 14 V32" />
        <path d="M46 74 L56 84 L76 62" />
      </g>
    ) : null}
    {nome === 'sacola' ? (
      <g {...traco}>
        <path d="M22 40 H98 L92 106 H28 Z" />
        <path d="M42 50 V32 C42 18 78 18 78 32 V50" />
      </g>
    ) : null}
  </svg>
);

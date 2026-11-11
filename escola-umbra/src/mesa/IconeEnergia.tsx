import React from 'react';

// Ícones de energia desenhados aqui (círculo na cor do tipo + símbolo simples).
const TIPOS: Record<string, {cor: string; traco: string; desenho: React.ReactNode}> = {
  Grass: {cor: '#4E9A35', traco: '#FFFFFF', desenho: <path d="M24 78 C22 42 46 20 80 20 C80 56 58 80 24 78 Z M30 72 L62 40" fillRule="evenodd" />},
  Fire: {
    cor: '#E0522A',
    traco: '#FFFFFF',
    desenho: <path d="M50 12 C58 30 74 40 74 60 C74 76 63 88 50 88 C37 88 26 76 26 60 C26 50 32 42 38 36 C40 46 46 48 48 42 C50 34 46 24 50 12 Z" />,
  },
  Water: {cor: '#2F8FD6', traco: '#FFFFFF', desenho: <path d="M50 12 C62 32 76 48 76 62 C76 77 64 88 50 88 C36 88 24 77 24 62 C24 48 38 32 50 12 Z" />},
  Lightning: {cor: '#E9C22E', traco: '#2A1E05', desenho: <path d="M58 10 L26 54 L46 54 L40 90 L74 44 L54 44 Z" />},
  Psychic: {
    cor: '#9A57C7',
    traco: '#FFFFFF',
    desenho: <path d="M12 50 Q50 14 88 50 Q50 86 12 50 Z M50 36 A14 14 0 1 0 50 64 A14 14 0 1 0 50 36 Z" fillRule="evenodd" />,
  },
  Fighting: {cor: '#C46A2B', traco: '#FFFFFF', desenho: <path d="M50 12 L60 38 L88 38 L66 56 L74 84 L50 68 L26 84 L34 56 L12 38 L40 38 Z" />},
  Darkness: {cor: '#2F4A57', traco: '#FFFFFF', desenho: <path d="M58 14 A38 38 0 1 0 88 62 A30 30 0 1 1 58 14 Z" />},
  Metal: {
    cor: '#8D99A4',
    traco: '#FFFFFF',
    desenho: <path d="M50 12 L83 31 L83 69 L50 88 L17 69 L17 31 Z M50 36 A14 14 0 1 0 50 64 A14 14 0 1 0 50 36 Z" fillRule="evenodd" />,
  },
  Dragon: {cor: '#B59A2E', traco: '#FFFFFF', desenho: <path d="M50 14 L86 70 L62 62 L50 88 L38 62 L14 70 Z" />},
  Fairy: {cor: '#D95FA5', traco: '#FFFFFF', desenho: <path d="M50 10 C55 38 62 45 90 50 C62 55 55 62 50 90 C45 62 38 55 10 50 C38 45 45 38 50 10 Z" />},
  Colorless: {
    cor: '#D9D5CC',
    traco: '#3A3833',
    desenho: <path d="M50 12 L59 39 L88 39 L64 56 L73 84 L50 67 L27 84 L36 56 L12 39 L41 39 Z" />,
  },
};

export const IconeEnergia: React.FC<{tipo: string | null; tamanho: number}> = ({tipo, tamanho}) => {
  const t = TIPOS[tipo ?? 'Colorless'] ?? TIPOS.Colorless;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{display: 'block', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))'}}>
      <circle cx="50" cy="50" r="48" fill="#0A0A0C" />
      <circle cx="50" cy="50" r="43" fill={t.cor} />
      <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
      <g transform="translate(50 50) scale(0.6) translate(-50 -50)" fill={t.traco} stroke={t.traco} strokeWidth="2" strokeLinejoin="round">
        {t.desenho}
      </g>
    </svg>
  );
};

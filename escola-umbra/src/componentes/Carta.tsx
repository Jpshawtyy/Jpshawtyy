import React from 'react';
import {Img, staticFile} from 'remotion';
import {CORES, PROPORCAO_CARTA} from '../tema';

// Verso das cartas viradas (deck, prêmios): a "sleeve" da Escola Umbra.
export const VersoCarta: React.FC<{largura: number}> = ({largura}) => {
  const altura = largura * PROPORCAO_CARTA;
  const raio = largura * 0.045;
  const borda = Math.max(1.5, largura * 0.02);
  return (
    <div
      style={{
        width: largura,
        height: altura,
        borderRadius: raio,
        // metade preta, metade vermelha, cortadas por uma listra dourada em diagonal (como o emblema)
        background: `linear-gradient(112deg, #141418 0 49%, ${CORES.ouro} 49% 53%, ${CORES.vermelho} 53% 100%)`,
        boxShadow: `inset 0 0 0 ${borda}px ${CORES.ouro}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Img src={staticFile('logo.png')} style={{width: largura * 0.66, height: largura * 0.66, objectFit: 'contain'}} />
    </div>
  );
};

// Carta real (imagem da Pokémon TCG API), com canto arredondado e sombra leve.
// O raio acompanha o canto que a própria imagem já traz (uns 4,5% da largura): menos que isso
// deixaria aparecer o canto transparente da imagem.
export const Carta: React.FC<{
  imagem: string;
  largura: number;
  sombra?: boolean;
  style?: React.CSSProperties;
}> = ({imagem, largura, sombra = true, style}) => {
  const altura = largura * PROPORCAO_CARTA;
  return (
    <div
      style={{
        width: largura,
        height: altura,
        borderRadius: largura * 0.045,
        overflow: 'hidden',
        boxShadow: sombra ? `0 ${largura * 0.03}px ${largura * 0.09}px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4)` : undefined,
        ...style,
      }}
    >
      <Img src={staticFile(imagem)} style={{width: '100%', height: '100%', display: 'block', objectFit: 'cover'}} />
    </div>
  );
};

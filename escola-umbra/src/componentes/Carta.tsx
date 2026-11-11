import React from 'react';
import {Img, staticFile} from 'remotion';
import {CORES, PROPORCAO_CARTA} from '../tema';
import {LuaCrescente} from './Fundo';

// Verso das cartas viradas (deck, prêmios): a "sleeve" da Escola Umbra.
export const VersoCarta: React.FC<{largura: number}> = ({largura}) => {
  const altura = largura * PROPORCAO_CARTA;
  const raio = largura * 0.045;
  return (
    <div
      style={{
        width: largura,
        height: altura,
        borderRadius: raio,
        background: 'linear-gradient(160deg, #1B1A1F 0%, #101014 60%, #16151A 100%)',
        boxShadow: `inset 0 0 0 ${Math.max(1.5, largura * 0.018)}px rgba(232,184,74,0.85)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: largura * 0.74,
          height: largura * 0.74,
          borderRadius: '50%',
          boxShadow: `inset 0 0 0 ${Math.max(1, largura * 0.012)}px rgba(232,184,74,0.45)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: largura * 1.16,
          height: largura * 1.16,
          borderRadius: '50%',
          boxShadow: `inset 0 0 0 ${Math.max(1, largura * 0.01)}px rgba(232,184,74,0.22)`,
        }}
      />
      <div style={{transform: 'rotate(-18deg)'}}>
        <LuaCrescente tamanho={largura * 0.34} cor={CORES.ouro} />
      </div>
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

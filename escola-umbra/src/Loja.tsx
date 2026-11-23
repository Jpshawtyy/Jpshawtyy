import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CORES, MARCA} from './tema';
import {FONTE_MONO, FONTE_TITULO} from './fontes';
import {Etiqueta, INCLINACAO, ListrasOuro, TituloArena, TracoOuro, fundoVermelho} from './componentes/Arena';

// Peças da loja no "Estilo Arena" (mesmo desenho do banner principal do manual):
// texto à esquerda sobre o preto, painel vermelho pontilhado à direita com as listras douradas e o emblema.

export type PropsBanner = {
  etiqueta: string; // caixa vermelha
  complemento: string; // "// LOJA"
  titulo: string; // texto grande (aceita "\n")
  subtitulo: string;
  rodape?: string; // linha dourada pequena
};

export const BANNER_PADRAO: PropsBanner = {
  etiqueta: 'ESCOLA UMBRA',
  complemento: 'LOJA',
  titulo: 'CARTAS AVULSAS',
  subtitulo: 'DE POKÉMON TCG',
  rodape: MARCA,
};

const Grade: React.FC<{opacidade?: number}> = ({opacidade = 0.035}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `linear-gradient(rgba(245,241,232,${opacidade}) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,${opacidade}) 1px, transparent 1px)`,
      backgroundSize: '90px 90px',
      maskImage: 'radial-gradient(ellipse 75% 70% at 35% 50%, black 30%, transparent 90%)',
    }}
  />
);

// Banner horizontal. Funciona em 3:1 (2400x800) e 16:9 (1920x1080): as medidas saem da largura e altura.
export const BannerLoja: React.FC<PropsBanner & {largura: number; altura: number}> = ({largura: L, altura: A, ...p}) => {
  const largo = L / A > 2.2;
  // painel vermelho: começa em ~58% (3:1) ou ~54% (16:9) da largura, com a borda inclinada
  const inicio = L * (largo ? 0.6 : 0.56);
  const inclina = A * 0.3;
  const emblema = A * (largo ? 0.66 : 0.56);
  const centroPainel = inicio + (L - inicio) / 2 + inclina * 0.15;
  const colunaTexto = inicio - inclina - L * 0.07; // largura útil do texto
  const margem = L * 0.06;
  const tituloMax = A * (largo ? 0.27 : p.titulo.includes('\n') ? 0.26 : 0.2);

  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
      <Grade />
      {/* palavra-fantasma em contorno, atrás do texto */}
      <div
        style={{
          position: 'absolute',
          left: margem * 0.4,
          top: A * 0.5 - A * 0.42,
          fontFamily: FONTE_TITULO,
          fontSize: A * 0.84,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(245,241,232,0.05)',
          transform: `skewX(${INCLINACAO}deg)`,
        }}
      >
        UMBRA
      </div>

      {/* painel vermelho com as listras na borda */}
      <div style={{position: 'absolute', left: inicio - inclina, top: 0, width: L - inicio + inclina, height: A, clipPath: `polygon(${inclina}px 0, 100% 0, 100% 100%, 0 100%)`, ...fundoVermelho()}} />
      <ListrasOuro x={inicio - inclina - 74} y={0} altura={A} inclinacao={inclina} brilho={0.35} escala={A / 800 + 0.6} />
      <Img
        src={staticFile('logo.png')}
        style={{
          position: 'absolute',
          left: centroPainel - emblema / 2,
          top: A / 2 - emblema / 2,
          width: emblema,
          height: emblema,
          objectFit: 'contain',
          filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))',
        }}
      />

      {/* texto */}
      <div
        style={{
          position: 'absolute',
          left: margem,
          width: colunaTexto,
          top: 0,
          height: A,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Etiqueta rotulo={p.etiqueta} complemento={p.complemento} tamanho={A * (largo ? 0.042 : 0.034)} />
        <div style={{marginTop: A * 0.04, alignSelf: 'stretch', display: 'flex'}}>
          <TituloArena texto={p.titulo} largura={colunaTexto} maximo={tituloMax} alinhar="left" style={{transformOrigin: 'left center'}} />
        </div>
        <TracoOuro largura={A * (largo ? 0.36 : 0.3)} style={{marginTop: A * 0.04}} />
        <div
          style={{
            marginTop: A * 0.035,
            fontFamily: FONTE_MONO,
            fontWeight: 700,
            fontSize: A * (largo ? 0.06 : 0.048),
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: CORES.texto,
          }}
        >
          {p.subtitulo}
        </div>
        {p.rodape ? (
          <div
            style={{
              marginTop: A * 0.02,
              fontFamily: FONTE_MONO,
              fontWeight: 700,
              fontSize: A * (largo ? 0.034 : 0.028),
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: CORES.ouro,
            }}
          >
            {p.rodape}
          </div>
        ) : null}
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: L, height: Math.max(6, A * 0.008), background: `linear-gradient(90deg, ${CORES.ouro}, ${CORES.vermelho})`}} />
    </AbsoluteFill>
  );
};

// Foto de perfil quadrada (sai bem no recorte redondo): metade preta, metade vermelha pontilhada,
// cortadas pelas listras douradas, com o emblema no centro, como o ícone do manual.
export const PerfilLoja: React.FC<{lado: number}> = ({lado: L}) => {
  const inclina = L * 0.36;
  const corte = L * 0.62; // onde o painel vermelho começa embaixo
  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
      <Grade opacidade={0.04} />
      <div style={{position: 'absolute', left: corte - inclina * 0.5, top: 0, width: L, height: L, clipPath: `polygon(${inclina}px 0, 100% 0, 100% 100%, 0 100%)`, ...fundoVermelho()}} />
      <ListrasOuro x={corte - inclina * 0.5 - L * 0.07} y={0} altura={L} inclinacao={inclina} brilho={0.4} escala={1.6} />
      <Img
        src={staticFile('logo.png')}
        style={{position: 'absolute', left: L * 0.13, top: L * 0.13, width: L * 0.74, height: L * 0.74, objectFit: 'contain', filter: 'drop-shadow(0 20px 44px rgba(0,0,0,0.6))'}}
      />
    </AbsoluteFill>
  );
};

// Foto de perfil da Liga Umbra: o emblema com "LIGA UMBRA" embaixo, tudo dentro do círculo do Instagram.
export const PerfilLiga: React.FC<{lado: number}> = ({lado: L}) => {
  const inclina = L * 0.36;
  const corte = L * 0.62;
  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
      <Grade opacidade={0.04} />
      <div style={{position: 'absolute', left: corte - inclina * 0.5, top: 0, width: L, height: L, clipPath: `polygon(${inclina}px 0, 100% 0, 100% 100%, 0 100%)`, ...fundoVermelho()}} />
      <ListrasOuro x={corte - inclina * 0.5 - L * 0.07} y={0} altura={L} inclinacao={inclina} brilho={0.4} escala={1.6} />
      <Img src={staticFile('logo.png')} style={{position: 'absolute', left: L * 0.25, top: L * 0.12, width: L * 0.5, height: L * 0.5, objectFit: 'contain', filter: 'drop-shadow(0 20px 44px rgba(0,0,0,0.6))'}} />
      <div style={{position: 'absolute', left: 0, width: L, top: L * 0.62, display: 'flex', justifyContent: 'center'}}>
        <TituloArena texto="Liga Umbra" largura={L * 0.72} maximo={L * 0.15} />
      </div>
    </AbsoluteFill>
  );
};

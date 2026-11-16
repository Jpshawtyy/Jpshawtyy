import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {PropsAula} from './tipos';
import {CORES, MARCA, VIDEO} from './tema';
import {FONTE_MONO, FONTE_TITULO} from './fontes';
import {Carta} from './componentes/Carta';
import {Etiqueta, INCLINACAO, TituloArena, TracoOuro} from './componentes/Arena';
import {tamanhoEtiqueta} from './componentes/Moldura';

// Capa do reel (imagem parada, 1080x1920) no "Estilo Arena".
// O essencial fica entre y = 240 e 1680, que é o recorte 3:4 que aparece na grade do perfil.
export const Capa: React.FC<PropsAula> = ({roteiro, cartas}) => {
  const L = VIDEO.largura;
  const refs = (roteiro.capa?.cartas ?? []).filter((r) => cartas[r]).slice(0, 3);
  const temCartas = refs.length > 0;
  const larguraCarta = 250;
  // borda de cima do painel vermelho: sobe da esquerda para a direita
  const yEsq = temCartas ? 1250 : 1330;
  const yDir = temCartas ? 1080 : 1160;
  const numero = `AULA ${String(roteiro.numero).padStart(2, '0')}`;
  const fantasma = roteiro.titulo_capa.split('\n')[0].toLocaleUpperCase('pt-BR');

  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
      {/* grade fraca */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,241,232,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.035) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 40%, black 30%, transparent 85%)',
        }}
      />
      {/* título-fantasma em contorno */}
      <div
        style={{
          position: 'absolute',
          left: -300,
          right: -300,
          top: 560,
          textAlign: 'center',
          fontFamily: FONTE_TITULO,
          fontSize: 460,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(245,241,232,0.06)',
          transform: `skewX(${INCLINACAO}deg)`,
        }}
      >
        {fantasma}
      </div>

      {/* painel vermelho pontilhado embaixo, com as listras douradas na borda */}
      <svg width={L} height={VIDEO.altura} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="vermelho" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={CORES.vermelho} />
            <stop offset="55%" stopColor="#B8202D" />
            <stop offset="100%" stopColor={CORES.vermelhoEscuro} />
          </linearGradient>
          <pattern id="pontos" width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="7.5" cy="7.5" r="1.8" fill="rgba(10,10,13,0.2)" />
          </pattern>
          <linearGradient id="ouro" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9C7024" />
            <stop offset="45%" stopColor={CORES.ouro} />
            <stop offset="55%" stopColor="#FFF3C4" />
            <stop offset="100%" stopColor="#B8862E" />
          </linearGradient>
        </defs>
        <polygon points={`0,${yEsq} ${L},${yDir} ${L},${VIDEO.altura} 0,${VIDEO.altura}`} fill="url(#vermelho)" />
        <polygon points={`0,${yEsq} ${L},${yDir} ${L},${VIDEO.altura} 0,${VIDEO.altura}`} fill="url(#pontos)" />
        <polygon points={`0,${yEsq - 34} ${L},${yDir - 34} ${L},${yDir - 12} 0,${yEsq - 12}`} fill="url(#ouro)" />
        <polygon points={`0,${yEsq - 62} ${L},${yDir - 62} ${L},${yDir - 52} 0,${yEsq - 52}`} fill="#7A5C25" />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 60,
          width: L - 120,
          top: 300,
          height: temCartas ? 700 : 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {temCartas ? <Img src={staticFile('logo.png')} style={{width: 190, height: 190, objectFit: 'contain', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.6))'}} /> : null}
        <Etiqueta
          rotulo={numero}
          complemento={roteiro.serie}
          tamanho={Math.min(30, tamanhoEtiqueta(roteiro.numero, roteiro.serie, L - 160) * 1.25)}
          style={{marginTop: 34}}
        />
        <TituloArena texto={roteiro.titulo_capa} largura={L - 130} maximo={250} style={{marginTop: 34}} />
        <TracoOuro largura={280} style={{marginTop: 30}} />
        {roteiro.subtitulo_capa ? (
          <div
            style={{
              marginTop: 26,
              fontFamily: FONTE_MONO,
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: CORES.texto,
              textAlign: 'center',
            }}
          >
            {roteiro.subtitulo_capa}
          </div>
        ) : null}
      </div>

      {/* sem cartas: o emblema grande ocupa o painel vermelho */}
      {!temCartas ? (
        <Img
          src={staticFile('logo.png')}
          style={{position: 'absolute', left: L / 2 - 150, top: 1250, width: 300, height: 300, objectFit: 'contain', filter: 'drop-shadow(0 16px 34px rgba(0,0,0,0.55))'}}
        />
      ) : null}

      {/* leque de cartas da aula, sobre o painel vermelho */}
      {refs.map((ref, i) => {
        const meio = (refs.length - 1) / 2;
        const d = i - meio;
        return (
          <div
            key={ref + i}
            style={{
              position: 'absolute',
              left: L / 2 - larguraCarta / 2 + d * 215,
              top: 1150 + Math.abs(d) * 26,
              transform: `rotate(${d * 9}deg)`,
              zIndex: 10 - Math.abs(d),
            }}
          >
            <Carta imagem={cartas[ref].imagem} largura={larguraCarta} />
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 0,
          width: L,
          top: 1585,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          fontFamily: FONTE_MONO,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: CORES.texto,
        }}
      >
        <span style={{width: 30, height: 6, background: CORES.ouro, transform: 'skewX(-30deg)', display: 'inline-block'}} />
        {MARCA}
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: L, height: 8, background: `linear-gradient(90deg, ${CORES.ouro}, ${CORES.vermelho})`}} />
    </AbsoluteFill>
  );
};

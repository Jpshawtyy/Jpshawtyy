import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {PropsAula} from './tipos';
import {CORES, MARCA, VIDEO} from './tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from './fontes';
import {LuaCrescente} from './componentes/Fundo';
import {TextoAjustado} from './componentes/TextoAjustado';
import {Carta} from './componentes/Carta';
import {textoDaSerie} from './componentes/Moldura';

// Capa do reel (imagem parada, 1080x1920).
// O essencial fica no quadrado do meio (y de 420 a 1500), que é o que aparece na grade do perfil.
export const Capa: React.FC<PropsAula> = ({roteiro, cartas}) => {
  const cx = VIDEO.largura / 2;
  const refs = (roteiro.capa?.cartas ?? []).filter((r) => cartas[r]).slice(0, 3);
  const temCartas = refs.length > 0;
  const cyAneis = temCartas ? 830 : 900;
  const larguraCarta = 250;

  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
      <svg width={VIDEO.largura} height={VIDEO.altura} style={{position: 'absolute', inset: 0}}>
        {[170, 290, 420, 560, 710, 870, 1040].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cyAneis}
            r={r}
            fill="none"
            stroke={CORES.ouro}
            strokeWidth={i % 3 === 1 ? 2 : 1.5}
            strokeOpacity={0.25 - i * 0.022}
            strokeDasharray={i % 3 === 1 ? `${r * 0.5} ${r * 0.12}` : undefined}
            transform={`rotate(${i * 37} ${cx} ${cyAneis})`}
          />
        ))}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 55% at 50% 46%, rgba(10,10,12,0) 45%, rgba(10,10,12,0.8) 100%)'}} />
      <div style={{position: 'absolute', left: 900, top: 250, transform: 'rotate(-18deg)'}}>
        <LuaCrescente tamanho={84} opacidade={0.6} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 60,
          width: VIDEO.largura - 120,
          top: 430,
          height: temCartas ? 640 : 1060,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img src={staticFile('logo.png')} style={{width: 150, height: 150, objectFit: 'contain'}} />
        <div
          style={{
            marginTop: 26,
            padding: '12px 26px',
            borderRadius: 999,
            background: CORES.ouro,
            color: CORES.pillOuroTexto,
            fontFamily: FONTE_MONO,
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}
        >
          {textoDaSerie(roteiro.numero, roteiro.serie)}
        </div>
        <div style={{marginTop: 34}}>
          <TextoAjustado
            texto={roteiro.titulo_capa}
            largura={VIDEO.largura - 150}
            maximo={250}
            fonte={FONTE_TITULO}
            peso={700}
            style={{color: CORES.ouro, textShadow: '0 12px 44px rgba(0,0,0,0.65)'}}
          />
        </div>
        {roteiro.subtitulo_capa ? (
          <div style={{marginTop: 22, fontFamily: FONTE_TEXTO, fontWeight: 500, fontSize: 56, letterSpacing: '-0.015em', color: CORES.texto, textAlign: 'center'}}>
            {roteiro.subtitulo_capa}
          </div>
        ) : null}
      </div>

      {/* leque de cartas da aula */}
      {refs.map((ref, i) => {
        const meio = (refs.length - 1) / 2;
        const d = i - meio;
        return (
          <div
            key={ref + i}
            style={{
              position: 'absolute',
              left: cx - larguraCarta / 2 + d * 215,
              top: 1110 + Math.abs(d) * 26,
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
          width: VIDEO.largura,
          top: 1560,
          textAlign: 'center',
          fontFamily: FONTE_MONO,
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: '0.08em',
          color: CORES.secundario,
        }}
      >
        {MARCA}
      </div>
    </AbsoluteFill>
  );
};

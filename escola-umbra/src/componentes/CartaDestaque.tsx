import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {MOLA_PULO, mola} from '../anim';
import {Titulo} from './Titulo';
import {Pill} from './Pill';
import {ListrasOuro, fundoVermelho} from './Arena';
import {Carta} from './Carta';
import {Estrela} from './Estrela';
import type {CenaCartaDestaque, MapaCartas} from '../tipos';

// Carta em destaque: entra girando de leve, ganha uma pill ("DE VOLTA", "META") e estrelinhas piscando.
export const CartaDestaque: React.FC<{cena: CenaCartaDestaque; cartas: MapaCartas}> = ({cena, cartas}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const dados = cartas[cena.carta];
  if (!dados) return null;

  const largura = cena.titulo ? 480 : 540;
  const altura = largura * PROPORCAO_CARTA;
  const cy = cena.titulo ? 838 : 790;
  const e = mola(quadro, fps, 0.05, MOLA_PULO);
  const pill = mola(quadro, fps, 0.45, MOLA_PULO);
  const balanco = Math.sin(t * 1.6) * 1.2;
  const giro = -22 + 18 * e + balanco; // termina levemente inclinada
  const zoom = cena.foco ? spring({frame: quadro - cena.foco.em * fps, fps, config: {damping: 20, stiffness: 120, mass: 0.8}}) : 0;
  const x0 = AREA.cx - largura / 2;
  const y0 = cy - altura / 2;
  const focoX = x0 + (cena.foco?.x ?? 0.5) * largura;
  const focoY = y0 + (cena.foco?.y ?? 0.5) * altura;

  const estrelas: [number, number, number][] = [
    [x0 - 30, y0 + 60, 58],
    [x0 + largura + 34, y0 + 150, 44],
    [x0 - 44, y0 + altura * 0.62, 36],
    [x0 + largura + 20, y0 + altura * 0.78, 60],
    [x0 + largura * 0.2, y0 + altura + 34, 34],
    [x0 + largura * 0.82, y0 - 30, 40],
    [x0 + 40, y0 - 36, 28],
  ];

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      {/* painel vermelho em diagonal atrás da carta, com as listras douradas na borda */}
      {(() => {
        const painel = mola(quadro, fps, 0, MOLA_PULO);
        const pw = largura * 1.5;
        const ph = altura * 0.74;
        const px = AREA.cx - pw / 2 + 70;
        const py = cy - ph / 2;
        const inclina = ph * 0.3;
        return (
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - painel) * 700}px)`, opacity: Math.min(1, painel * 1.5)}}>
            <div
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: pw,
                height: ph,
                clipPath: `polygon(${inclina}px 0, 100% 0, calc(100% - ${inclina}px) 100%, 0 100%)`,
                ...fundoVermelho(),
              }}
            />
            <ListrasOuro x={px - 70} y={py} altura={ph} inclinacao={inclina} brilho={(t * 0.4) % 1} />
          </div>
        );
      })()}
      {/* zoom opcional: leva um ponto da carta para o centro e amplia (ex.: a linha de fraqueza) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          // durante o zoom, a carta fica dentro de uma janela entre a etiqueta do topo e a legenda
          clipPath: zoom > 0.001 ? `inset(${330 * zoom}px ${40 * zoom}px ${(1920 - 1250) * zoom}px ${40 * zoom}px round ${18 * zoom}px)` : undefined,
        }}
      >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${focoX}px ${focoY}px`,
          transform: `translate(${(AREA.cx - focoX) * zoom}px, ${(cy - focoY) * zoom}px) scale(${1 + ((cena.foco?.escala ?? 2.6) - 1) * zoom})`,
        }}
      >
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: y0,
          opacity: Math.min(1, e * 2),
          transform: `translateY(${(1 - e) * 320}px) rotate(${giro * (1 - zoom)}deg) scale(${0.55 + 0.45 * e})`,
        }}
      >
        <Carta imagem={dados.imagem} largura={largura} />
        {cena.pill ? (
          <div style={{position: 'absolute', left: -34, top: -30, transform: `rotate(-9deg) scale(${pill})`, transformOrigin: '30% 50%', opacity: pill}}>
            <Pill cor={cena.pill_cor ?? 'ouro'} tamanho={44}>
              {cena.pill}
            </Pill>
          </div>
        ) : null}
      </div>
      </div>
      </div>
      {/* moldura dourada em volta do ponto de foco (ex.: a linha de fraqueza e resistência) */}
      {cena.foco && zoom > 0.6
        ? (() => {
            const esc = cena.foco.escala ?? 2.6;
            const w = largura * 0.62 * esc;
            const h = altura * 0.05 * esc;
            const aparece = mola(quadro, fps, cena.foco.em + 0.45, MOLA_PULO);
            const pulsa = 1 + 0.02 * Math.sin(t * 6);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: AREA.cx - w / 2,
                  top: cy - h / 2,
                  width: w,
                  height: h,
                  borderRadius: 10,
                  boxShadow: `0 0 0 4px ${CORES.ouro}, 0 0 28px rgba(240,193,96,0.55)`,
                  opacity: aparece,
                  transform: `scale(${(1.25 - 0.25 * aparece) * pulsa})`,
                }}
              />
            );
          })()
        : null}
      {estrelas.map(([x, y, tam], i) => (
        zoom > 0.3 ? null : <Estrela key={i} x={x} y={y} tamanho={tam} semente={i + 11} atraso={0.35 + i * 0.09} />
      ))}
    </AbsoluteFill>
  );
};

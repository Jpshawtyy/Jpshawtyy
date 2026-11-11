import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {FONTE_TEXTO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {Titulo} from './Titulo';
import {Pill} from './Pill';
import {Carta} from './Carta';
import type {CenaComparacao, ItemComparacao, MapaCartas} from '../tipos';

const Coluna: React.FC<{
  itens: ItemComparacao[];
  cartas: MapaCartas;
  lado: 'bons' | 'ruins';
  rotulo: string;
  x: number;
  largura: number;
  topo: number;
  atraso: number;
}> = ({itens, cartas, lado, rotulo, x, largura, topo, atraso}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pill = mola(quadro, fps, atraso, MOLA_PULO);
  const direcao = lado === 'bons' ? -1 : 1;
  const n = itens.length;
  const alturaLivre = 1240 - (topo + 110);
  const vao = 18;
  // a carta ocupa o que der na coluna, sem passar da largura
  const larguraCarta = Math.min(largura - 40, (alturaLivre - vao * (n - 1)) / n / PROPORCAO_CARTA);

  let y = topo + 110;
  return (
    <>
      <div style={{position: 'absolute', left: x, width: largura, top: topo, display: 'flex', justifyContent: 'center', transform: `scale(${pill})`, opacity: pill}}>
        <Pill cor={lado === 'bons' ? 'ouro' : 'vermelho'} tamanho={38}>
          {rotulo}
        </Pill>
      </div>
      {itens.map((item, i) => {
        const o = typeof item === 'string' ? {carta: item} : item;
        const e = mola(quadro, fps, atraso + 0.35 + i * 0.6, MOLA_PULO);
        const dados = o.carta ? cartas[o.carta] : undefined;
        const altura = dados ? larguraCarta * PROPORCAO_CARTA : 150;
        const meuY = y;
        y += altura + vao;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              width: largura,
              top: meuY,
              height: altura,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: Math.min(1, e * 1.6),
              transform: `translateX(${(1 - e) * direcao * 220}px) rotate(${(1 - e) * direcao * 14 + direcao * (i % 2 === 0 ? 1.5 : -1.5)}deg)`,
            }}
          >
            {dados ? (
              <Carta imagem={dados.imagem} largura={larguraCarta} style={lado === 'ruins' ? {filter: 'saturate(0.55) brightness(0.8)'} : undefined} />
            ) : (
              <div
                style={{
                  fontFamily: FONTE_TEXTO,
                  fontWeight: 500,
                  fontSize: 44,
                  lineHeight: 1.12,
                  textAlign: 'center',
                  color: lado === 'bons' ? CORES.texto : CORES.secundario,
                  padding: '22px 20px',
                  borderRadius: 22,
                  width: largura - 30,
                  boxSizing: 'border-box',
                  background: 'rgba(243,238,226,0.05)',
                  boxShadow: `inset 0 0 0 2px ${lado === 'bons' ? 'rgba(232,184,74,0.55)' : 'rgba(214,51,74,0.55)'}`,
                }}
              >
                {o.texto}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// Comparação bom x ruim: duas colunas, pill dourada de um lado e vermelha do outro.
export const Comparacao: React.FC<{cena: CenaComparacao; cartas: MapaCartas}> = ({cena, cartas}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const topo = cena.titulo ? 470 : 380;
  const vao = 30;
  const largura = (AREA.largura - vao) / 2;
  const divisor = mola(quadro, fps, 0.15);
  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      <div
        style={{
          position: 'absolute',
          left: AREA.cx - 1,
          top: topo,
          width: 2,
          height: (1240 - topo) * divisor,
          background: 'rgba(232,184,74,0.3)',
        }}
      />
      <Coluna itens={cena.bons} cartas={cartas} lado="bons" rotulo={cena.pill_bons ?? 'bons'} x={AREA.x0} largura={largura} topo={topo} atraso={0.25} />
      <Coluna itens={cena.ruins} cartas={cartas} lado="ruins" rotulo={cena.pill_ruins ?? 'ruins'} x={AREA.x0 + largura + vao} largura={largura} topo={topo} atraso={0.55} />
    </AbsoluteFill>
  );
};

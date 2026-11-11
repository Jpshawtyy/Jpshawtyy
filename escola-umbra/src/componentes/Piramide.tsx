import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES} from '../tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {temposDosItens} from '../tempo';
import {Titulo} from './Titulo';
import type {CenaPiramide} from '../tipos';

// Pirâmide ou ranking: barras empilhadas que sobem uma por vez, da base para o topo.
export const Piramide: React.FC<{cena: CenaPiramide; duracao: number}> = ({cena, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const n = cena.niveis.length;
  const tempos = temposDosItens(cena.niveis, duracao, 0.4, 0.8);
  const ranking = cena.modo === 'ranking';

  const base = 1230; // linha de baixo da pilha
  const topoLivre = cena.titulo ? 500 : 400;
  const vao = 14;
  const altura = Math.min(132, (base - topoLivre - vao * (n - 1)) / n);
  const larguraMax = AREA.largura - 30;

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      {cena.niveis.map((nivel, i) => {
        if (t < tempos[i]) return null;
        const e = mola(quadro, fps, tempos[i], MOLA_PULO);
        // pirâmide: a base é a mais larga; ranking: todas iguais
        const largura = ranking ? larguraMax : larguraMax * (1 - (i / Math.max(1, n - 1)) * 0.52);
        const y = base - (i + 1) * altura - i * vao;
        const destaque = nivel.destaque ?? false;
        const posicao = n - i; // no ranking, o topo é o 1º
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: AREA.cx - largura / 2,
              width: largura,
              top: y,
              height: altura,
              borderRadius: 22,
              background: destaque ? CORES.ouro : 'rgba(232,184,74,0.10)',
              boxShadow: destaque ? '0 10px 30px rgba(232,184,74,0.25)' : 'inset 0 0 0 2px rgba(232,184,74,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: ranking ? 'flex-start' : 'center',
              gap: 22,
              padding: '0 28px',
              boxSizing: 'border-box',
              opacity: Math.min(1, e * 1.6),
              transform: `translateY(${(1 - e) * 160}px) scaleX(${0.7 + 0.3 * e})`,
            }}
          >
            {ranking ? (
              <div style={{fontFamily: FONTE_TITULO, fontWeight: 700, fontSize: altura * 0.42, color: destaque ? CORES.pillOuroTexto : CORES.ouro, minWidth: altura * 0.7}}>
                {posicao}
              </div>
            ) : null}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: ranking ? 'flex-start' : 'center', minWidth: 0}}>
              <div
                style={{
                  fontFamily: FONTE_TEXTO,
                  fontWeight: 500,
                  fontSize: Math.min(46, altura * 0.38),
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  color: destaque ? CORES.pillOuroTexto : CORES.texto,
                  whiteSpace: 'nowrap',
                }}
              >
                {nivel.rotulo}
              </div>
              {nivel.detalhe ? (
                <div
                  style={{
                    fontFamily: FONTE_MONO,
                    fontWeight: 500,
                    fontSize: Math.min(24, altura * 0.2),
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: 8,
                    color: destaque ? 'rgba(42,30,5,0.75)' : CORES.secundario,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nivel.detalhe}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

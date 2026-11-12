import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {temposDosItens} from '../tempo';
import {Titulo} from './Titulo';
import {Carta} from './Carta';
import type {CenaPiramide, MapaCartas} from '../tipos';

// Pirâmide ou ranking: barras empilhadas que sobem uma por vez, da base para o topo.
// No ranking cada barra pode ter a miniatura de uma carta, um valor à direita e o preenchimento proporcional.
export const Piramide: React.FC<{cena: CenaPiramide; duracao: number; cartas: MapaCartas}> = ({cena, duracao, cartas}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const n = cena.niveis.length;
  const tempos = temposDosItens(cena.niveis, duracao, 0.4, 0.8);
  const ranking = cena.modo === 'ranking';

  const base = cena.fonte ? 1206 : 1230; // linha de baixo da pilha
  const topoLivre = cena.titulo ? 470 : 360;
  const vao = 14;
  const altura = Math.min(132, (base - topoLivre - vao * (n - 1)) / n);
  const larguraMax = AREA.largura - 10;
  // a pilha fica centrada entre o título e a base
  const sobra = base - topoLivre - (n * altura + (n - 1) * vao);
  const chao = base - Math.max(0, sobra) / 2;
  const maior = Math.max(...cena.niveis.map((x) => x.valor ?? 0));

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      {cena.niveis.map((nivel, i) => {
        if (t < tempos[i]) return null;
        const e = mola(quadro, fps, tempos[i], MOLA_PULO);
        // pirâmide: a base é a mais larga; ranking: todas iguais
        const largura = ranking ? larguraMax : larguraMax * (1 - (i / Math.max(1, n - 1)) * 0.52);
        const y = chao - (i + 1) * altura - i * vao;
        const destaque = nivel.destaque ?? false;
        const posicao = n - i; // no ranking, o topo é o 1º
        const dados = ranking && nivel.carta ? cartas[nivel.carta] : undefined;
        const fracao = ranking && nivel.valor !== undefined && maior > 0 ? nivel.valor / maior : 0;
        const enche = mola(quadro, fps, tempos[i] + 0.15);
        const corTexto = destaque ? CORES.pillOuroTexto : CORES.texto;
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
              background: destaque ? CORES.ouro : 'rgba(232,184,74,0.08)',
              boxShadow: destaque ? '0 10px 30px rgba(232,184,74,0.25)' : 'inset 0 0 0 2px rgba(232,184,74,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: ranking ? 'flex-start' : 'center',
              gap: 20,
              padding: ranking ? '0 26px 0 22px' : '0 28px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              opacity: Math.min(1, e * 1.6),
              transform: `translateY(${(1 - e) * 160}px) scaleX(${0.7 + 0.3 * e})`,
            }}
          >
            {/* preenchimento proporcional ao valor */}
            {fracao > 0 && !destaque ? (
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fracao * enche * 100}%`, background: 'rgba(232,184,74,0.26)'}} />
            ) : null}
            {ranking ? (
              <div
                style={{
                  position: 'relative',
                  fontFamily: FONTE_TITULO,
                  fontWeight: 700,
                  fontSize: altura * 0.4,
                  color: destaque ? CORES.pillOuroTexto : CORES.ouro,
                  minWidth: altura * 0.42,
                  textAlign: 'center',
                }}
              >
                {posicao}
              </div>
            ) : null}
            {dados ? (
              <div style={{position: 'relative', flex: 'none'}}>
                <Carta imagem={dados.imagem} largura={(altura - 18) / PROPORCAO_CARTA} />
              </div>
            ) : null}
            <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: ranking ? 'flex-start' : 'center', minWidth: 0, flex: ranking ? 1 : undefined}}>
              <div
                style={{
                  fontFamily: FONTE_TEXTO,
                  fontWeight: 500,
                  fontSize: Math.min(46, altura * 0.38),
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  color: corTexto,
                  whiteSpace: 'nowrap',
                }}
              >
                {nivel.rotulo}
              </div>
              {nivel.detalhe && !ranking ? (
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
            {nivel.detalhe && ranking ? (
              <div
                style={{
                  position: 'relative',
                  flex: 'none',
                  fontFamily: FONTE_TITULO,
                  fontWeight: 700,
                  fontSize: Math.min(destaque ? 46 : 38, altura * 0.36),
                  letterSpacing: '-0.02em',
                  color: destaque ? CORES.pillOuroTexto : CORES.ouro,
                  whiteSpace: 'nowrap',
                }}
              >
                {nivel.detalhe}
              </div>
            ) : null}
          </div>
        );
      })}
      {cena.fonte ? (
        <div
          style={{
            position: 'absolute',
            left: AREA.x0,
            width: AREA.largura,
            top: chao + 16,
            textAlign: 'center',
            fontFamily: FONTE_MONO,
            fontWeight: 500,
            fontSize: 18,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: CORES.secundario,
            opacity: Math.min(1, t * 3),
          }}
        >
          {cena.fonte}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

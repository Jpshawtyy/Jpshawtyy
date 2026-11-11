import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES} from '../tema';
import {FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {comoObjeto, temposDosItens} from '../tempo';
import {Titulo} from './Titulo';
import type {CenaLista} from '../tipos';

// Lista em passos: itens numerados que entram um por um, no tempo da fala.
export const ListaPassos: React.FC<{cena: CenaLista; duracao: number}> = ({cena, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const itens = cena.itens.map((i) => comoObjeto(i, 'texto'));
  const tempos = temposDosItens(itens, duracao);

  const topo = cena.titulo ? 520 : 440;
  const passo = Math.min(230, (1230 - topo) / itens.length);
  const bola = Math.min(124, passo * 0.62);
  const atual = tempos.filter((x) => t >= x).length - 1;

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      {/* linha que liga os números e cresce a cada passo */}
      {itens.length > 1 ? (
        <div
          style={{
            position: 'absolute',
            left: AREA.x0 + 20 + bola / 2 - 2,
            top: topo + bola / 2,
            width: 4,
            height: tempos.slice(1).reduce((soma, quando) => soma + passo * mola(quadro, fps, quando), 0),
            maxHeight: (itens.length - 1) * passo,
            background: 'rgba(232,184,74,0.45)',
            borderRadius: 4,
          }}
        />
      ) : null}
      {itens.map((item, i) => {
        const e = mola(quadro, fps, tempos[i], MOLA_PULO);
        if (t < tempos[i]) return null;
        const ativo = i === atual;
        // quando o próximo entra, este recua para segundo plano
        const recua = i < atual ? mola(quadro, fps, tempos[i + 1]) : 0;
        const pulso = ativo ? 1 + 0.03 * Math.sin((t - tempos[i]) * 5) * trecho(t - tempos[i], [0.4, 0.8], [0, 1]) : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: AREA.x0 + 20,
              width: AREA.largura - 40,
              top: topo + i * passo,
              height: bola,
              display: 'flex',
              alignItems: 'center',
              gap: 34,
              opacity: Math.min(1, e * 1.5) * (1 - 0.45 * recua),
              transform: `translateX(${(1 - e) * 80}px)`,
            }}
          >
            <div
              style={{
                flex: 'none',
                width: bola,
                height: bola,
                borderRadius: '50%',
                background: recua > 0.5 ? CORES.fundo : CORES.ouro,
                boxShadow: `inset 0 0 0 4px ${CORES.ouro}`,
                color: recua > 0.5 ? CORES.ouro : CORES.pillOuroTexto,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTE_TITULO,
                fontWeight: 700,
                fontSize: bola * 0.5,
                transform: `scale(${(0.5 + 0.5 * e) * pulso})`,
              }}
            >
              {i + 1}
            </div>
            <div style={{flex: 1}}>
              <div
                style={{
                  fontFamily: FONTE_TEXTO,
                  fontWeight: 500,
                  fontSize: 60,
                  lineHeight: 1.08,
                  letterSpacing: '-0.015em',
                  color: CORES.texto,
                }}
              >
                {item.texto}
              </div>
              {item.detalhe ? (
                <div style={{fontFamily: FONTE_TEXTO, fontWeight: 400, fontSize: 36, lineHeight: 1.2, color: CORES.secundario, marginTop: 8}}>
                  {item.detalhe}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

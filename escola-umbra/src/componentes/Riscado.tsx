import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES} from '../tema';
import {FONTE_TEXTO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {comoObjeto, temposDosItens} from '../tempo';
import {Titulo} from './Titulo';
import type {CenaRiscado} from '../tipos';

// Riscado ("esquece isso"): cada item aparece e logo é riscado em vermelho.
// O bloco inteiro fica centrado na tela (na horizontal e entre o título e a legenda).
export const Riscado: React.FC<{cena: CenaRiscado; duracao: number}> = ({cena, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const itens = cena.itens.map((i) => comoObjeto(i, 'texto'));
  const tempos = temposDosItens(itens, duracao, 0.4, 1.2);

  const topoBanda = cena.titulo ? 460 : 340;
  const banda = 1250 - topoBanda;
  const vao = Math.min(70, banda / itens.length - 130);

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo} /> : null}
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: topoBanda,
          height: banda,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: Math.max(24, vao), maxWidth: AREA.largura - 10}}>
          {itens.map((item, i) => {
            const e = mola(quadro, fps, tempos[i], MOLA_PULO);
            const riscaEm = item.riscar_em ?? tempos[i] + 0.8;
            const risco = trecho(t, [riscaEm, riscaEm + 0.22], [0, 1]);
            const marca = mola(quadro, fps, riscaEm + 0.1, MOLA_PULO);
            const tremor = risco > 0 && risco < 1 ? Math.sin(t * 90) * 4 : 0;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 26,
                  // quem ainda não entrou guarda o lugar, para o bloco não mudar de posição
                  visibility: t < tempos[i] ? 'hidden' : 'visible',
                  opacity: Math.min(1, e * 1.5),
                  transform: `translateY(${(1 - e) * 40}px) translateX(${tremor}px)`,
                }}
              >
                {/* X vermelho que aparece junto com o risco */}
                <svg width={72} height={72} viewBox="0 0 76 76" style={{flex: 'none', transform: `scale(${marca}) rotate(${(1 - marca) * -90}deg)`, opacity: marca}}>
                  <circle cx={38} cy={38} r={36} fill={CORES.vermelho} />
                  <path d="M25 25 L51 51 M51 25 L25 51" stroke={CORES.pillVermelhoTexto} strokeWidth={8} strokeLinecap="round" />
                </svg>
                <div style={{flex: '0 1 auto', minWidth: 0, fontFamily: FONTE_TEXTO, fontWeight: 500, fontSize: 54, lineHeight: 1.16, letterSpacing: '-0.015em'}}>
                  <span
                    style={{
                      color: risco > 0.5 ? CORES.secundario : CORES.texto,
                      backgroundImage: `linear-gradient(${CORES.vermelho}, ${CORES.vermelho})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: '0 56%',
                      backgroundSize: `${risco * 100}% 8px`,
                      padding: '0 6px',
                      margin: '0 -6px',
                    }}
                  >
                    {item.texto}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

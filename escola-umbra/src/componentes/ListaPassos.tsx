import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {comoObjeto, temposDosItens} from '../tempo';
import {Titulo} from './Titulo';
import {Carta} from './Carta';
import type {CenaLista, MapaCartas} from '../tipos';

// Lista em passos: itens numerados que entram um por um, no tempo da fala.
// O bloco inteiro fica centrado na tela (na horizontal e entre o título e a legenda).
export const ListaPassos: React.FC<{cena: CenaLista; duracao: number; cartas?: MapaCartas}> = ({cena, duracao, cartas = {}}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const itens = cena.itens.map((i) => comoObjeto(i, 'texto'));
  const tempos = temposDosItens(itens, duracao);

  const topoBanda = cena.titulo ? 460 : 340;
  const banda = 1250 - topoBanda;
  const passo = Math.min(215, banda / itens.length);
  const bola = Math.min(112, passo * 0.6);
  // com miniaturas de carta, a linha fica da altura da carta e some a linha que liga os números
  const comCartas = itens.some((it) => it.carta && cartas[it.carta]);
  const alturaCarta = Math.min(200, passo - 20);
  const linha = comCartas ? alturaCarta : bola;
  const atual = tempos.filter((x) => t >= x).length - 1;

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
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: AREA.largura - 10}}>
          {/* linha que liga os números e cresce a cada passo */}
          {itens.length > 1 && !comCartas ? (
            <div
              style={{
                position: 'absolute',
                left: bola / 2 - 2,
                top: bola / 2,
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
            const ativo = i === atual;
            // quando o próximo entra, este recua para segundo plano
            const recua = i < atual ? mola(quadro, fps, tempos[i + 1]) : 0;
            const pulso = ativo ? 1 + 0.03 * Math.sin((t - tempos[i]) * 5) * trecho(t - tempos[i], [0.4, 0.8], [0, 1]) : 1;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  height: linha,
                  marginBottom: i < itens.length - 1 ? passo - linha : 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 28,
                  // quem ainda não entrou guarda o lugar, para o bloco não mudar de posição
                  visibility: t < tempos[i] ? 'hidden' : 'visible',
                  opacity: Math.min(1, e * 1.5) * (1 - (item.destaque ? 0 : 0.45) * recua),
                  transform: `translateX(${(1 - e) * 80}px)`,
                }}
              >
                {item.carta && cartas[item.carta] ? (
                  <div style={{flex: 'none', transform: `scale(${(0.6 + 0.4 * e) * pulso}) rotate(${(1 - e) * -8}deg)`}}>
                    <Carta imagem={cartas[item.carta].imagem} largura={alturaCarta / PROPORCAO_CARTA} />
                  </div>
                ) : (
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
                )}
                <div style={{flex: '0 1 auto', minWidth: 0}}>
                  <div
                    style={{
                      fontFamily: FONTE_TEXTO,
                      fontWeight: 500,
                      fontSize: 54,
                      lineHeight: 1.08,
                      letterSpacing: '-0.015em',
                      color: CORES.texto,
                    }}
                  >
                    {item.texto}
                  </div>
                  {item.detalhe ? (
                    <div style={{fontFamily: FONTE_TEXTO, fontWeight: item.destaque ? 500 : 400, fontSize: 33, lineHeight: 1.2, color: item.destaque ? CORES.ouro : CORES.secundario, marginTop: 8}}>
                      {item.detalhe}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

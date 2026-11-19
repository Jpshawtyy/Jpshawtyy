import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLayout} from '../layout';
import {AREA, CORES, MOLDURA, PROPORCAO_CARTA} from '../tema';
import {FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, acaso} from '../anim';
import {Titulo} from './Titulo';
import {Carta} from './Carta';
import type {CenaDecklist, MapaCartas} from '../tipos';

const VAO = 12;

// Quantas colunas deixam a carta maior, cabendo na largura e na altura livres.
const melhorGrade = (n: number, largura: number, altura: number) => {
  let melhor = {colunas: 1, linhas: n, w: 0};
  for (let colunas = 3; colunas <= 8; colunas++) {
    const linhas = Math.ceil(n / colunas);
    const w = Math.min((largura - VAO * (colunas - 1)) / colunas, (altura - VAO * (linhas - 1)) / linhas / PROPORCAO_CARTA);
    if (w > melhor.w) melhor = {colunas, linhas, w};
  }
  return melhor;
};

// Lista do deck: as cartas entram em sequência rápida, cada uma com a quantidade.
// Com "destaques", a luz vai de carta em carta e o resto escurece.
export const Decklist: React.FC<{cena: CenaDecklist; cartas: MapaCartas}> = ({cena, cartas}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {fundo} = useLayout();
  const t = quadro / fps;
  const itens = cena.cartas.filter((i) => cartas[i.carta]);
  const topo = cena.titulo ? MOLDURA.conteudoY0 + 150 : MOLDURA.conteudoY0 + 20;
  const altura = fundo - 16 - topo;
  const {colunas, linhas, w} = melhorGrade(itens.length, AREA.largura, altura);
  const h = w * PROPORCAO_CARTA;
  const larguraGrade = colunas * w + (colunas - 1) * VAO;
  const alturaGrade = linhas * h + (linhas - 1) * VAO;
  const x0 = AREA.cx - larguraGrade / 2;
  const y0 = topo + (altura - alturaGrade) / 2;
  const total = itens.reduce((s, i) => s + i.qtd, 0);

  // destaque ativo: o último grupo (mesmo "em") que já começou
  const destaques = (cena.destaques ?? []).map((d) => ({...d, em: d.em ?? 1.6}));
  const inicioAtivo = destaques.filter((d) => d.em <= t).reduce((m, d) => Math.max(m, d.em), -1);
  const ativos = new Set(destaques.filter((d) => d.em === inicioAtivo).map((d) => d.carta));
  const luz = inicioAtivo >= 0 ? mola(quadro, fps, inicioAtivo) : 0;
  // entrada: uma carta a cada 1,3 quadro, todas dentro do primeiro segundo e pouco
  const passo = Math.min(0.045, 1.1 / Math.max(1, itens.length));

  return (
    <AbsoluteFill>
      {cena.titulo ? <Titulo texto={cena.titulo.replace('{total}', String(total))} /> : null}
      {itens.map((item, i) => {
        const col = i % colunas;
        const lin = Math.floor(i / colunas);
        // a última linha incompleta fica centralizada
        const naLinha = lin === linhas - 1 ? itens.length - lin * colunas : colunas;
        const deslocamento = ((colunas - naLinha) * (w + VAO)) / 2;
        const x = x0 + deslocamento + col * (w + VAO);
        const y = y0 + lin * (h + VAO);
        const e = mola(quadro, fps, 0.2 + i * passo, MOLA_PULO);
        const giro = (acaso(i + 7) - 0.5) * 16 * (1 - e);
        const ativo = ativos.has(item.carta);
        const apaga = inicioAtivo >= 0 && !ativo ? luz : 0;
        const cresce = ativo ? 1 + 0.6 * luz : 1; // a carta destacada salta para ser lida no celular
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: h,
              zIndex: ativo ? 5 : 1,
              opacity: Math.min(1, e * 1.8),
              transform: `scale(${(1.5 - 0.5 * e) * cresce}) rotate(${giro}deg)`,
            }}
          >
            <Carta
              imagem={cartas[item.carta].imagem}
              largura={w}
              style={{
                filter: apaga > 0 ? `brightness(${1 - 0.6 * apaga}) saturate(${1 - 0.5 * apaga})` : undefined,
                outline: ativo ? `${Math.max(3, w * 0.035) * luz}px solid ${CORES.ouro}` : undefined,
                boxShadow: ativo ? `0 0 ${36 * luz}px rgba(240,193,96,${0.7 * luz})` : undefined,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: -w * 0.06,
                bottom: -w * 0.05,
                background: ativo ? CORES.ouro : CORES.vermelho,
                color: ativo ? CORES.pillOuroTexto : CORES.texto,
                transform: 'skewX(-14deg)',
                padding: `${w * 0.01}px ${w * 0.09}px`,
                fontFamily: FONTE_TITULO,
                fontSize: Math.max(24, w * 0.26),
                lineHeight: 1.1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                opacity: Math.min(1, Math.max(0, e * 2 - 0.6)) * (1 - 0.55 * apaga),
              }}
            >
              <span style={{display: 'inline-block', transform: 'skewX(14deg)'}}>{item.qtd}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

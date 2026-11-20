// Composição da série Deck do Dia: sem apresentador, cortes com impacto, cartas sempre em movimento,
// legenda grande palavra por palavra e efeitos sonoros.

import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {LegendaPronta, PalavraFalada, PropsAula} from '../tipos';
import {legendasDaCena, planejar} from '../tempo';
import {AREA, CORES, VIDEO} from '../tema';

const VIDEO_FPS = VIDEO.fps;
import {FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {Fundo} from '../componentes/Fundo';
import {Guias, Moldura} from '../componentes/Moldura';
import {quebrarPalavras, temposDaFala} from '../componentes/Legenda';
import {Faiscas, Flash, Sfx} from './efeitos';
import {CartaShow, Confronto, ContagemDeck, CtaDeck, DecklistDeal, GanchoDeck, ImpactoDeck, RankingDeck} from './cenas';

// Legenda de impacto: maiúsculas grossas, a palavra que está sendo falada ganha uma tarja vermelha.
const LegendaImpacto: React.FC<{legendas: LegendaPronta[]; falas?: PalavraFalada[]; inicioDaCena: number}> = ({legendas, falas, inicioDaCena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const atual = legendas.find((l) => t >= l.em && t < l.ate);
  if (!atual) return null;
  const palavras = quebrarPalavras(atual.texto);
  const passo = Math.min(0.13, ((atual.ate - atual.em) * 0.45) / Math.max(1, palavras.length));
  const falados = falas?.length ? temposDaFala(palavras, falas, inicioDaCena + atual.em, inicioDaCena + atual.ate) : null;
  const entradas = palavras.map((_, i) => {
    const f = falados?.[i];
    return f !== null && f !== undefined ? f - inicioDaCena : atual.em + i * passo;
  });
  const some = trecho(t, [atual.ate - 0.1, atual.ate], [1, 0]);
  return (
    <div style={{position: 'absolute', left: AREA.x0 - 20, width: AREA.largura + 40, top: 1262, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: some}}>
      <div style={{textAlign: 'center', lineHeight: 1.08, fontFamily: FONTE_TITULO, fontSize: 70, textTransform: 'uppercase', textWrap: 'balance', maxWidth: AREA.largura + 40}}>
        {palavras.map((p, i) => {
          const e = mola(quadro, fps, entradas[i], MOLA_PULO);
          const fim = entradas[i + 1] ?? atual.ate;
          const falando = t >= entradas[i] && t < fim;
          if (t < entradas[i] - 0.02) return <React.Fragment key={i}>{i < palavras.length - 1 ? ' ' : null}</React.Fragment>;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block',
                  position: 'relative',
                  padding: '0 8px',
                  color: p.chave ? CORES.ouro : CORES.texto,
                  transform: `scale(${(0.6 + 0.4 * e) * (falando ? 1.08 : 1)}) rotate(${falando ? -2 : 0}deg)`,
                  WebkitTextStroke: `3px ${CORES.fundo}`,
                  paintOrder: 'stroke fill',
                  textShadow: '0 5px 0 rgba(10,10,13,0.95), 0 0 26px rgba(10,10,13,0.9)',
                }}
              >
                {falando ? (
                  <span style={{position: 'absolute', inset: '6px 0 2px', background: CORES.vermelho, transform: 'skewX(-10deg)', zIndex: -1, boxShadow: '0 6px 18px rgba(0,0,0,0.5)'}} />
                ) : null}
                {p.texto}
              </span>
              {i < palavras.length - 1 ? ' ' : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Entrada de cada cena: chega com zoom e desfoque em 5 quadros (o "corte com impacto").
const Entrada: React.FC<{quadros: number; ultima: boolean; children: React.ReactNode}> = ({quadros, ultima, children}) => {
  const quadro = useCurrentFrame();
  const e = trecho(quadro, [0, 5], [0, 1]);
  const s = ultima ? 1 : trecho(quadro, [quadros - 3, quadros], [1, 0.0]);
  return (
    <AbsoluteFill style={{transform: `scale(${1.16 - 0.16 * e + (1 - s) * 0.12})`, filter: e < 1 || s < 1 ? `blur(${(1 - e) * 14 + (1 - s) * 10}px)` : undefined, opacity: Math.min(1, 0.3 + e) * (0.2 + 0.8 * s)}}>
      {children}
    </AbsoluteFill>
  );
};

export const DeckDoDia: React.FC<PropsAula> = (props) => {
  const {roteiro, cartas, audio, palavras, guias} = props;
  const plano = useMemo(() => planejar(roteiro, cartas), [roteiro, cartas]);
  const capa = roteiro.capa?.cartas ?? [];
  return (
    <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
      <Fundo inicios={plano.cenas.map((c) => c.de)} />
      <Faiscas />
      {plano.cenas.map((c, i) => {
        const cena = c.cena;
        let corpo: React.ReactNode = null;
        if (cena.tipo === 'gancho') {
          const principal = cena.carta ?? capa[1] ?? capa[0];
          corpo = <GanchoDeck cena={cena} cartas={cartas} principal={principal} laterais={capa.filter((r) => r !== principal)} />;
        } else if (cena.tipo === 'piramide') corpo = <RankingDeck cena={cena} cartas={cartas} duracao={c.duracao} />;
        else if (cena.tipo === 'carta_destaque') corpo = <CartaShow cena={cena} cartas={cartas} duracao={c.duracao} />;
        else if (cena.tipo === 'decklist') corpo = <DecklistDeal cena={cena} cartas={cartas} duracao={c.duracao} />;
        else if (cena.tipo === 'impacto') corpo = <ImpactoDeck cena={cena} cartas={cartas} />;
        else if (cena.tipo === 'contagem') corpo = <ContagemDeck cena={cena} />;
        else if (cena.tipo === 'confronto') corpo = <Confronto cena={cena} cartas={cartas} duracao={c.duracao} />;
        else if (cena.tipo === 'cta') corpo = <CtaDeck cena={cena} cartas={cartas} refs={capa} />;
        return (
          <Sequence key={i} from={c.de} durationInFrames={c.quadros} name={`${i + 1} · ${cena.tipo}`}>
            <Entrada quadros={c.quadros} ultima={i === plano.cenas.length - 1}>
              {corpo}
            </Entrada>
            <LegendaImpacto legendas={legendasDaCena(cena, c.duracao)} falas={palavras} inicioDaCena={c.inicio} />
            {i > 0 ? <Flash em={[0]} forca={0.45} /> : null}
            {i > 0 ? <Sfx som="whoosh" em={0} volume={0.26} /> : null}
          </Sequence>
        );
      })}
      <Moldura numero={roteiro.numero} serie={roteiro.serie} formato={roteiro.formato} rotulo={roteiro.rotulo} />
      {audio?.narracao ? <Audio src={staticFile(audio.narracao)} volume={audio.narracaoVolume ?? 1} /> : null}
      {audio?.musica ? (
        <Audio
          src={staticFile(audio.musica)}
          // abaixa a música enquanto o narrador fala (palavras com tempo vindas da narração)
          volume={(q) => {
            const t = q / VIDEO_FPS;
            const falando = (palavras ?? []).some((p) => t >= p.inicio - 0.12 && t <= p.fim + 0.2);
            return (audio.musicaVolume ?? 0.15) * (falando ? 0.45 : 1);
          }}
        />
      ) : null}
      {guias ? <Guias /> : null}
    </AbsoluteFill>
  );
};

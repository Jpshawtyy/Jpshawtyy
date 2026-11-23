// Stories (1080x1920) para os destaques do Instagram, no Estilo Arena.
// Três tipos de página: capa da série, lista de regras e capa do destaque (o círculo do perfil).

import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MOLA_PULO, MOLA_SECA, mola} from './anim';
import {Faiscas, Flash, Raios, Sfx} from './deckdodia/efeitos';
import {Icone, type NomeIcone} from './componentes/Icones';
import {CORES, MARCA} from './tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from './fontes';
import {Etiqueta, ListrasOuro, TituloArena, TracoOuro, fundoVermelho, sombraTitulo} from './componentes/Arena';

export type ItemStory = {titulo: string; texto?: string};

export type PaginaStory = {
  tipo: 'capa' | 'lista' | 'destaque';
  titulo: string;
  subtitulo?: string;
  itens?: ItemStory[];
  nota?: string; // linha pequena no pé (ex.: "continua no próximo")
  icone?: NomeIcone; // só na capa de destaque: desenho no lugar do emblema
};

export type PropsStory = {
  serie: string; // "REGRAS DO TCG"
  marca?: string; // "@escolaumbratcg"
  pagina: PaginaStory;
  numero?: number; // página atual (para "2/9")
  total?: number;
};

export const STORY_PADRAO: PropsStory = {
  serie: 'REGRAS DO TCG',
  pagina: {tipo: 'capa', titulo: 'Regras do Pokémon TCG', subtitulo: 'o básico em poucos stories'},
};

// No vídeo, cada peça entra no seu tempo; na imagem parada, tudo já aparece pronto.
const Animado = createContext(false);
const useEntrada = () => {
  const animado = useContext(Animado);
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (em: number, config = MOLA_PULO) => (animado ? mola(quadro, fps, em, config) : 1);
};

// Tempo de cada página no vídeo: entrada dos itens e tempo de leitura.
export const ITEM_EM = (i: number) => 0.7 + i * 0.85;
export const duracaoStory = (pagina: PaginaStory) =>
  pagina.tipo === 'capa' ? 4.5 : pagina.tipo === 'destaque' ? 3 : ITEM_EM((pagina.itens ?? []).length) + 1.6 + (pagina.itens ?? []).length * 1.3;

const L = 1080;
// área segura do story: o topo tem a barra de progresso e o perfil; o pé tem a caixa de resposta
const TOPO = 250;
const PE = 1640;
const MARGEM = 90;

const Fundo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: CORES.fundo, overflow: 'hidden'}}>
    <AbsoluteFill
      style={{
        backgroundImage: 'linear-gradient(rgba(245,241,232,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.035) 1px, transparent 1px)',
        backgroundSize: '90px 90px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 45%, black 30%, transparent 90%)',
      }}
    />
    {/* cantos vermelhos com as listras douradas, como no manual */}
    <div style={{position: 'absolute', right: -120, top: -60, width: 560, height: 200, ...fundoVermelho(135), transform: 'skewX(-30deg)'}} />
    <div style={{position: 'absolute', left: -140, bottom: -40, width: 620, height: 230, ...fundoVermelho(315), transform: 'skewX(-30deg)'}} />
    <ListrasOuro x={640} y={0} altura={200} />
    <ListrasOuro x={430} y={1690} altura={230} />
  </AbsoluteFill>
);

const Marca: React.FC<{texto: string}> = ({texto}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: L,
      top: PE - 50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 14,
      fontFamily: FONTE_MONO,
      fontWeight: 600,
      fontSize: 28,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: CORES.secundario,
    }}
  >
    <span style={{width: 26, height: 5, background: CORES.ouro, transform: 'skewX(-30deg)', display: 'inline-block'}} />
    {texto}
  </div>
);

const Capa: React.FC<PropsStory> = ({serie, pagina, marca = MARCA}) => {
  const ent = useEntrada();
  const animado = useContext(Animado);
  const quadro = useCurrentFrame();
  const emblema = ent(0.15);
  const etiqueta = ent(0.55, MOLA_SECA);
  const titulo = ent(0.85);
  const sub = ent(1.2, MOLA_SECA);
  const toca = ent(1.8, MOLA_SECA);
  return (
    <AbsoluteFill>
      {animado ? <Raios x={L / 2} y={550} forca={Math.min(1, emblema) * 0.7} cor="rgba(240,193,96,0.35)" /> : null}
      <Img src={staticFile('logo.png')} style={{position: 'absolute', left: L / 2 - 170, top: 380, width: 340, height: 340, objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(240,193,96,0.45))', opacity: Math.min(1, emblema * 2), transform: `scale(${3 - 2 * emblema}) rotate(${(1 - emblema) * -30}deg)`}} />
      <div style={{position: 'absolute', left: 0, width: L, top: 780, display: 'flex', justifyContent: 'center', opacity: etiqueta, transform: `translateY(${(1 - etiqueta) * -30}px)`}}>
        <Etiqueta rotulo={serie} tamanho={34} />
      </div>
      <div style={{position: 'absolute', left: MARGEM, width: L - 2 * MARGEM, top: 880, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        <div style={{opacity: Math.min(1, titulo * 2), transform: `scale(${2.2 - 1.2 * titulo})`}}>
          <TituloArena texto={pagina.titulo.replace(/ do /i, '\ndo ')} largura={L - 2 * MARGEM} maximo={150} />
        </div>
        <TracoOuro largura={260} progresso={sub} />
        {pagina.subtitulo ? (
          <div style={{fontFamily: FONTE_MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.14em', textTransform: 'uppercase', color: CORES.ouro, textAlign: 'center', opacity: sub}}>{pagina.subtitulo}</div>
        ) : null}
      </div>
      <div style={{position: 'absolute', left: 0, width: L, top: 1440, textAlign: 'center', fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 36, color: CORES.texto, opacity: 0.85 * toca, transform: `translateX(${animado ? Math.sin(quadro / 6) * 8 : 0}px)`}}>
        toca pra passar →
      </div>
      <Marca texto={marca} />
      {animado ? (
        <>
          <Flash em={[0.15]} forca={0.7} />
          <Sfx som="whoosh" em={0} />
          <Sfx som="impacto" em={0.15} />
          <Sfx som="brilho" em={0.3} />
          <Sfx som="impacto" em={0.85} volume={0.35} />
          <Sfx som="pop" em={1.2} volume={0.3} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Lista: React.FC<PropsStory> = ({serie, pagina, numero, total, marca = MARCA}) => {
  const itens = pagina.itens ?? [];
  // o tamanho do texto encolhe com a quantidade de itens, para caber entre o título e o pé
  const n = Math.max(1, itens.length);
  const tituloItem = n <= 3 ? 66 : n <= 4 ? 58 : n <= 5 ? 50 : 44;
  const textoItem = n <= 3 ? 44 : n <= 4 ? 40 : n <= 5 ? 36 : 32;
  const ent = useEntrada();
  const animado = useContext(Animado);
  const titulo = ent(0.1);
  const etiqueta = ent(0, MOLA_SECA);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: L, top: TOPO + 20, display: 'flex', justifyContent: 'center', opacity: etiqueta, transform: `translateY(${(1 - etiqueta) * -30}px)`}}>
        <Etiqueta rotulo={serie} complemento={numero && total ? `${numero}/${total}` : undefined} tamanho={30} />
      </div>
      <div style={{position: 'absolute', left: MARGEM, width: L - 2 * MARGEM, top: TOPO + 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <div style={{opacity: Math.min(1, titulo * 2), transform: `scale(${2 - titulo})`}}>
          <TituloArena texto={pagina.titulo} largura={L - 2 * MARGEM} maximo={104} />
        </div>
        <TracoOuro largura={180} progresso={ent(0.35, MOLA_SECA)} />
      </div>
      <div style={{position: 'absolute', left: MARGEM, width: L - 2 * MARGEM, top: TOPO + 330, bottom: 1920 - PE + 110, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: n <= 4 ? 34 : 24}}>
        {itens.map((item, i) => {
          const e = ent(ITEM_EM(i));
          const num = ent(ITEM_EM(i) + 0.15);
          return (
          <div key={i} style={{display: 'flex', alignItems: 'stretch', gap: 26, background: 'rgba(20,20,24,0.9)', boxShadow: 'inset 0 0 0 1.5px rgba(245,241,232,0.10), 0 12px 30px rgba(0,0,0,0.45)', borderRadius: 6, overflow: 'hidden', opacity: Math.min(1, e * 2), transform: `translateX(${(1 - e) * (i % 2 ? -700 : 700)}px) rotate(${(1 - e) * (i % 2 ? -4 : 4)}deg)`}}>
            <div style={{width: 110, flexShrink: 0, ...fundoVermelho(135), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontFamily: FONTE_TITULO, fontSize: 76, color: CORES.ouro, textShadow: '0 3px 0 rgba(10,10,13,0.8)', display: 'inline-block', transform: `scale(${0.3 + 0.7 * num})`}}>{i + 1}</span>
            </div>
            <div style={{padding: '26px 30px 28px 0', display: 'flex', flexDirection: 'column', gap: 6}}>
              <div style={{fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: tituloItem, lineHeight: 1.1, color: CORES.texto}}>{item.titulo}</div>
              {item.texto ? <div style={{fontFamily: FONTE_TEXTO, fontWeight: 500, fontSize: textoItem, lineHeight: 1.25, color: CORES.secundario}}>{item.texto}</div> : null}
            </div>
          </div>
          );
        })}
      </div>
      {pagina.nota ? (
        <div style={{position: 'absolute', left: MARGEM, width: L - 2 * MARGEM, top: PE - 150, textAlign: 'center', fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 34, color: CORES.ouro, opacity: ent(ITEM_EM(itens.length), MOLA_SECA)}}>{pagina.nota}</div>
      ) : null}
      <Marca texto={marca} />
      {animado ? (
        <>
          <Sfx som="whoosh" em={0} volume={0.25} />
          <Sfx som="impacto" em={0.1} volume={0.35} />
          {itens.map((_, i) => (
            <React.Fragment key={i}>
              <Sfx som="whoosh" em={ITEM_EM(i) - 0.05} volume={0.28} />
              <Sfx som="pop" em={ITEM_EM(i) + 0.15} volume={0.3} />
            </React.Fragment>
          ))}
          {pagina.nota ? <Sfx som="ding" em={ITEM_EM(itens.length)} volume={0.25} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// Capa do destaque: o Instagram mostra um círculo no centro, então tudo fica num quadrado central de ~640 px.
const Destaque: React.FC<PropsStory> = ({pagina}) => (
  <AbsoluteFill style={{...fundoVermelho(135)}}>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(10,10,13,0) 0%, rgba(10,10,13,0.55) 60%, rgba(10,10,13,0.9) 100%)'}} />
    <div style={{position: 'absolute', left: L / 2 - 330, top: 960 - 330, width: 660, height: 660, borderRadius: '50%', background: CORES.fundo, boxShadow: `inset 0 0 0 10px ${CORES.ouro}, 0 0 80px rgba(0,0,0,0.6)`}} />
    {pagina.icone ? (
      <div style={{position: 'absolute', left: L / 2 - 140, top: 960 - 260, width: 280, height: 280}}>
        <Icone nome={pagina.icone} tamanho={280} />
      </div>
    ) : (
      <Img src={staticFile('logo.png')} style={{position: 'absolute', left: L / 2 - 140, top: 960 - 250, width: 280, height: 280, objectFit: 'contain'}} />
    )}
    <div style={{position: 'absolute', left: L / 2 - 300, width: 600, top: 960 + 60, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: FONTE_TITULO, fontSize: 120, lineHeight: 1, color: CORES.texto, textShadow: sombraTitulo(120), transform: 'skewX(-9deg)', textTransform: 'uppercase'}}>{pagina.titulo}</div>
    </div>
    {pagina.subtitulo ? (
      <div style={{position: 'absolute', left: L / 2 - 300, width: 600, top: 960 + 190, textAlign: 'center', fontFamily: FONTE_MONO, fontWeight: 700, fontSize: 34, letterSpacing: '0.16em', color: CORES.ouro, textTransform: 'uppercase'}}>{pagina.subtitulo}</div>
    ) : null}
  </AbsoluteFill>
);

export const Story: React.FC<PropsStory & {animado?: boolean}> = ({animado = false, ...props}) => (
  <Animado.Provider value={animado}>
  <AbsoluteFill style={{backgroundColor: CORES.fundo}}>
    {props.pagina.tipo === 'destaque' ? (
      <Destaque {...props} />
    ) : (
      <>
        <Fundo />
        {animado ? <Faiscas quantidade={26} forca={0.7} /> : null}
        {props.pagina.tipo === 'capa' ? <Capa {...props} /> : <Lista {...props} />}
      </>
    )}
  </AbsoluteFill>
  </Animado.Provider>
);

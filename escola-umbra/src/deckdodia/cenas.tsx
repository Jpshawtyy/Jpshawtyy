// Cenas da série Deck do Dia: tudo gira em torno das cartas se mexendo.

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, MOLA_SECA, acaso, mola, trecho} from '../anim';
import {TituloArena, sombraTitulo} from '../componentes/Arena';
import {legendasDaCena} from '../tempo';
import type {Cena, CenaCartaDestaque, CenaCta, CenaDecklist, CenaGancho, CenaPiramide, MapaCartas} from '../tipos';
import {Carta3D, Flash, LinhasDeVelocidade, Raios, Sfx, Tremer, balanco, passadaDeBrilho} from './efeitos';

const sair = Easing.out(Easing.cubic);
// progresso 0 -> 1 entre dois segundos, com saída suave
const voo = (t: number, de: number, dur: number) => interpolate(t, [de, de + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sair});

// Texto que "bate" na tela: entra grande e transparente e assenta com um pulo.
const Batida: React.FC<{em: number; children: React.ReactNode; style?: React.CSSProperties}> = ({em, children, style}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = mola(quadro, fps, em, MOLA_PULO);
  if (quadro / fps < em) return null;
  return <div style={{position: 'absolute', opacity: Math.min(1, e * 2.2), transform: `scale(${2.3 - 1.3 * e})`, ...style}}>{children}</div>;
};

// Começo de cada frase da cena (a partir da segunda): um tranco leve na câmera a cada uma.
const batidasDasFrases = (cena: Cena, duracao: number) =>
  legendasDaCena(cena, duracao)
    .slice(1)
    .map((l) => l.em);

// ---------- Gancho ----------

export const GanchoDeck: React.FC<{cena: CenaGancho; cartas: MapaCartas; principal?: string; laterais: string[]}> = ({cena, cartas, principal, laterais}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const POUSO = 0.42;
  const centro = {x: AREA.cx, y: 700};
  const w = 400;
  const p = voo(t, 0, POUSO);
  const bal = balanco(t, t > POUSO ? Math.min(1, (t - POUSO) * 2) : 0);
  const leque = mola(quadro, fps, 0.55, MOLA_PULO);
  const raios = trecho(t, [POUSO, POUSO + 0.3], [0, 1]);
  const impactos = [POUSO, 0.85];
  const dados = principal ? cartas[principal] : undefined;
  return (
    <AbsoluteFill>
      <Raios x={centro.x} y={centro.y} forca={raios} />
      <Tremer impactos={impactos}>
        {laterais.slice(0, 2).map((ref, i) => {
          const c = cartas[ref];
          if (!c) return null;
          const lado = i === 0 ? -1 : 1;
          return (
            <Carta3D
              key={ref}
              imagem={c.imagem}
              x={centro.x + lado * 250 * leque}
              y={centro.y + 60 * leque + Math.sin(t * 1.6 + i) * 8}
              w={300}
              rz={lado * 16 * leque}
              ry={lado * -18 * leque}
              opacidade={Math.min(1, leque * 2)}
              apagar={0.35}
              z={1}
            />
          );
        })}
        {dados ? (
          <Carta3D
            imagem={dados.imagem}
            x={centro.x}
            y={interpolate(p, [0, 1], [2250, centro.y]) + bal.dy}
            w={w}
            escala={interpolate(p, [0, 1], [0.35, 1])}
            ry={interpolate(p, [0, 1], [900, 0]) + bal.ry}
            rx={interpolate(p, [0, 1], [40, 0]) + bal.rx}
            rz={interpolate(p, [0, 1], [-30, 0]) + bal.rz}
            brilho={passadaDeBrilho(t, 1.6, POUSO + 0.1)}
            aura={raios}
            z={3}
          />
        ) : null}
        <Batida em={0.75} style={{left: AREA.x0, width: AREA.largura, top: 1000, display: 'flex', justifyContent: 'center'}}>
          <TituloArena texto={cena.texto} largura={AREA.largura} maximo={130} />
        </Batida>
        {cena.subtitulo ? (
          <Batida
            em={1.05}
            style={{left: AREA.x0, width: AREA.largura, top: 1150, display: 'flex', justifyContent: 'center', fontFamily: FONTE_MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.16em', color: CORES.ouro, textTransform: 'uppercase'}}
          >
            {cena.subtitulo}
          </Batida>
        ) : null}
      </Tremer>
      <LinhasDeVelocidade em={POUSO} x={centro.x} y={centro.y} />
      <Flash em={[POUSO]} forca={0.8} />
      <Sfx som="whoosh" em={0} />
      <Sfx som="impacto" em={POUSO} />
      <Sfx som="whoosh" em={0.5} volume={0.22} />
      <Sfx som="impacto" em={0.8} volume={0.32} />
      <Sfx som="brilho" em={POUSO + 0.1} />
    </AbsoluteFill>
  );
};

// ---------- Ranking ----------

const formatar = (v: number, casas: number) => v.toFixed(casas).replace('.', ',');

export const RankingDeck: React.FC<{cena: CenaPiramide; cartas: MapaCartas; duracao: number}> = ({cena, cartas, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const topo = cena.niveis.find((n) => n.destaque) ?? cena.niveis[cena.niveis.length - 1];
  const outros = cena.niveis.filter((n) => n !== topo).reverse(); // do 2º colocado para baixo
  const carta = topo.carta ? cartas[topo.carta] : undefined;
  const valor = topo.valor ?? 0;
  const casas = (topo.detalhe ?? '').includes(',') ? 1 : 0;
  const sufixo = (topo.detalhe ?? '').trim().endsWith('%') ? '%' : '';
  const CONTA = [0.35, 1.35];
  const contado = interpolate(t, CONTA, [0, valor], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const entra = voo(t, 0, 0.4);
  const bal = balanco(t, 0.8);
  const bate = mola(quadro, fps, CONTA[1], MOLA_PULO);
  const maior = Math.max(valor, ...outros.map((n) => n.valor ?? 0)) || 1;
  const frases = batidasDasFrases(cena, duracao);
  const tempoLinha = (i: number) => Math.max(1.6, outros[i]?.em ?? 1.6 + i * 0.25);
  return (
    <AbsoluteFill>
      <Raios x={300} y={640} forca={trecho(t, [CONTA[1], CONTA[1] + 0.3], [0, 0.8])} raio={700} />
      <Tremer impactos={[0.4, CONTA[1], ...frases]}>
        {cena.titulo ? (
          <Batida em={0.05} style={{left: AREA.x0, width: AREA.largura, top: 340, display: 'flex', justifyContent: 'center'}}>
            <TituloArena texto={cena.titulo} largura={AREA.largura} maximo={76} />
          </Batida>
        ) : null}
        {carta ? (
          <Carta3D
            imagem={carta.imagem}
            x={interpolate(entra, [0, 1], [-300, 320])}
            y={680 + bal.dy}
            w={290}
            ry={interpolate(entra, [0, 1], [-540, 0]) + bal.ry}
            rx={bal.rx}
            rz={interpolate(entra, [0, 1], [-40, -7]) + bal.rz}
            brilho={passadaDeBrilho(t, 1.7, 0.6)}
            aura={bate > 0 ? Math.min(1, bate) : 0}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 470,
            width: 450,
            top: 520,
            textAlign: 'center',
            fontFamily: FONTE_TITULO,
            fontSize: 150,
            lineHeight: 1,
            color: CORES.ouro,
            transform: `skewX(-9deg) scale(${t < CONTA[1] ? 0.9 + 0.1 * (contado / Math.max(1, valor)) : 1 + 0.25 * (1 - bate)})`,
            textShadow: sombraTitulo(150),
            opacity: trecho(t, [0.25, 0.4], [0, 1]),
          }}
        >
          {formatar(contado, casas)}
          {sufixo}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 470,
            width: 450,
            top: 690,
            textAlign: 'center',
            fontFamily: FONTE_MONO,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: CORES.texto,
            opacity: trecho(t, [CONTA[1], CONTA[1] + 0.2], [0, 1]),
          }}
        >
          {topo.rotulo}
        </div>
        {outros.map((n, i) => {
          const e = mola(quadro, fps, tempoLinha(i), MOLA_SECA);
          const y = 900 + i * 98;
          const barra = ((n.valor ?? 0) / maior) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: AREA.x0,
                width: AREA.largura,
                top: y,
                height: 82,
                transform: `translateX(${(1 - e) * 900}px) skewX(-9deg)`,
                opacity: Math.min(1, e * 2),
                background: 'rgba(245,241,232,0.06)',
                boxShadow: 'inset 0 0 0 1.5px rgba(245,241,232,0.10)',
                overflow: 'hidden',
              }}
            >
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barra * Math.min(1, e)}%`, background: `linear-gradient(90deg, ${CORES.vermelhoEscuro}, ${CORES.vermelho})`}} />
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px', transform: 'skewX(9deg)'}}>
                <span style={{fontFamily: FONTE_TITULO, fontSize: 50, color: CORES.ouro, width: 40}}>{i + 2}</span>
                <span style={{fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 40, color: CORES.texto, flex: 1}}>{n.rotulo}</span>
                <span style={{fontFamily: FONTE_TITULO, fontSize: 46, color: CORES.texto}}>{n.detalhe}</span>
              </div>
            </div>
          );
        })}
        {cena.fonte ? (
          <div
            style={{
              position: 'absolute',
              left: AREA.x0,
              width: AREA.largura,
              top: 900 + outros.length * 98 + 6,
              textAlign: 'center',
              fontFamily: FONTE_MONO,
              fontSize: 19,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: CORES.secundario,
              opacity: trecho(t, [2, 2.4], [0, 1]),
            }}
          >
            {cena.fonte}
          </div>
        ) : null}
      </Tremer>
      <Flash em={[CONTA[1]]} forca={0.55} />
      <Sfx som="whoosh" em={0.02} />
      <Sfx som="subida" em={CONTA[0]} />
      <Sfx som="impacto" em={CONTA[1]} />
      {outros.map((_, i) => (
        <Sfx key={i} som="whoosh" em={tempoLinha(i)} volume={0.2} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- Carta em destaque ----------

export const CartaShow: React.FC<{cena: CenaCartaDestaque; cartas: MapaCartas; duracao: number}> = ({cena, cartas, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const dados = cartas[cena.carta];
  const POUSO = 0.4;
  const w = 470;
  const h = w * PROPORCAO_CARTA;
  const c = {x: AREA.cx, y: 790};
  const entra = voo(t, 0, POUSO);
  const zoom = cena.foco ? mola(quadro, fps, cena.foco.em, MOLA_PULO) : 0;
  const bal = balanco(t, (1 - 0.8 * Math.min(1, zoom)) * Math.min(1, t / POUSO));
  const S = 1 + ((cena.foco?.escala ?? 1.9) - 1) * zoom;
  const o = cena.foco ? {x: (cena.foco.x - 0.5) * w, y: (cena.foco.y - 0.5) * h} : {x: 0, y: 0};
  const frases = batidasDasFrases(cena, duracao);
  const pill = mola(quadro, fps, 0.5, MOLA_PULO);
  const impactos = [POUSO, ...(cena.foco ? [cena.foco.em + 0.2] : []), ...frases];
  return (
    <AbsoluteFill>
      <Raios x={c.x} y={c.y} forca={trecho(t, [POUSO, POUSO + 0.3], [0, 0.9]) * (1 - 0.6 * zoom)} />
      <Tremer impactos={impactos}>
        <AbsoluteFill style={{transformOrigin: `${c.x}px ${c.y}px`, transform: `translate(${-o.x * S * zoom}px, ${-o.y * S * zoom}px) scale(${S})`}}>
          <Carta3D
            imagem={dados.imagem}
            x={interpolate(entra, [0, 1], [1500, c.x])}
            y={interpolate(entra, [0, 1], [500, c.y]) + bal.dy}
            w={w}
            ry={interpolate(entra, [0, 1], [-200, 0]) + bal.ry}
            rx={bal.rx}
            rz={interpolate(entra, [0, 1], [35, 0]) + bal.rz}
            brilho={passadaDeBrilho(t, 1.8, POUSO + 0.15)}
            aura={trecho(t, [POUSO, POUSO + 0.3], [0, 0.8])}
          />
        </AbsoluteFill>
        {cena.titulo ? (
          <Batida em={0.1} style={{left: AREA.x0, width: AREA.largura, top: 330, display: 'flex', justifyContent: 'center'}}>
            <TituloArena texto={cena.titulo} largura={AREA.largura} maximo={92} />
          </Batida>
        ) : null}
        {cena.pill ? (
          <div
            style={{
              position: 'absolute',
              left: c.x - w / 2 - 30,
              top: c.y - h / 2 - 20,
              transform: `rotate(${-10 + (1 - pill) * -40}deg) scale(${pill})`,
              background: cena.pill_cor === 'ouro' ? CORES.ouro : CORES.vermelho,
              color: cena.pill_cor === 'ouro' ? CORES.pillOuroTexto : CORES.texto,
              fontFamily: FONTE_TITULO,
              fontSize: 46,
              padding: '6px 26px',
              boxShadow: '0 10px 24px rgba(0,0,0,0.55)',
              opacity: 1 - zoom * 0.9,
              zIndex: 5,
            }}
          >
            {cena.pill}
          </div>
        ) : null}
      </Tremer>
      <LinhasDeVelocidade em={POUSO} x={c.x} y={c.y} />
      <Flash em={[POUSO]} forca={0.6} />
      <Sfx som="whoosh" em={0} />
      <Sfx som="impacto" em={POUSO} volume={0.42} />
      <Sfx som="brilho" em={POUSO + 0.15} />
      {cena.foco ? <Sfx som="whoosh" em={cena.foco.em} /> : null}
      {cena.foco ? <Sfx som="impacto" em={cena.foco.em + 0.2} volume={0.3} /> : null}
      {frases.map((f, i) => (
        <Sfx key={i} som="whoosh" em={Math.max(0, f - 0.05)} volume={0.16} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- Lista do deck, distribuída como numa mesa ----------

const VAO = 12;
const grade = (n: number, largura: number, altura: number) => {
  let melhor = {colunas: 1, linhas: n, w: 0};
  for (let colunas = 3; colunas <= 8; colunas++) {
    const linhas = Math.ceil(n / colunas);
    const w = Math.min((largura - VAO * (colunas - 1)) / colunas, (altura - VAO * (linhas - 1)) / linhas / PROPORCAO_CARTA);
    if (w > melhor.w) melhor = {colunas, linhas, w};
  }
  return melhor;
};

export const DecklistDeal: React.FC<{cena: CenaDecklist; cartas: MapaCartas; duracao: number}> = ({cena, cartas, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const itens = cena.cartas.filter((i) => cartas[i.carta]);
  const topo = cena.titulo ? 460 : 340;
  const fundo = 1240;
  const {colunas, linhas, w} = grade(itens.length, AREA.largura, fundo - topo);
  const h = w * PROPORCAO_CARTA;
  const x0 = AREA.cx - (colunas * w + (colunas - 1) * VAO) / 2;
  const y0 = topo + (fundo - topo - (linhas * h + (linhas - 1) * VAO)) / 2;
  const INICIO = 0.25;
  const PASSO = Math.min(0.06, 1.3 / Math.max(1, itens.length));
  const VOO = 0.3;
  const fimDistribuir = INICIO + (itens.length - 1) * PASSO + VOO;

  const destaques = (cena.destaques ?? []).map((d, i, l) => {
    const em = d.em ?? 1.6 + i * 1.2;
    const prox = l[i + 1]?.em;
    const fim = prox !== undefined ? prox - 0.05 : duracao - 0.35;
    return {carta: d.carta, em, fim};
  });
  const progresso = (d: {em: number; fim: number}) => Math.max(0, mola(quadro, fps, d.em, MOLA_PULO) - mola(quadro, fps, d.fim, MOLA_SECA));
  const giro = (d: {em: number; fim: number}) => 360 * voo(t, d.em, 0.45) - 360 * voo(t, d.fim, 0.35);
  const ativo = destaques.map((d) => ({...d, p: progresso(d), g: giro(d)}));
  const escurece = Math.min(1, Math.max(0, ...ativo.map((d) => d.p)));
  const centro = {x: AREA.cx, y: 820, w: 430};
  return (
    <AbsoluteFill>
      <Raios x={centro.x} y={centro.y} forca={escurece * 0.9} />
      <Tremer impactos={[fimDistribuir, ...destaques.map((d) => d.em + 0.3)]} forca={16}>
        {cena.titulo ? (
          <Batida em={0.02} style={{left: AREA.x0, width: AREA.largura, top: 340, display: 'flex', justifyContent: 'center'}}>
            <TituloArena texto={cena.titulo} largura={AREA.largura} maximo={84} />
          </Batida>
        ) : null}
        {itens.map((item, i) => {
          const col = i % colunas;
          const lin = Math.floor(i / colunas);
          const naLinha = lin === linhas - 1 ? itens.length - lin * colunas : colunas;
          const gx = x0 + ((colunas - naLinha) * (w + VAO)) / 2 + col * (w + VAO) + w / 2;
          const gy = y0 + lin * (h + VAO) + h / 2;
          const p = voo(t, INICIO + i * PASSO, VOO);
          if (t < INICIO + i * PASSO) return null;
          const d = ativo.find((a) => a.carta === item.carta);
          const sobe = d ? d.p : 0;
          const x = interpolate(p, [0, 1], [AREA.cx + (acaso(i) - 0.5) * 200, gx]);
          const y = interpolate(p, [0, 1], [2150, gy]);
          const pose = {
            x: x + (centro.x - x) * sobe,
            y: y + (centro.y - y) * sobe + (sobe > 0 ? Math.sin(t * 1.9) * 8 * sobe : 0),
            w: w + (centro.w - w) * sobe,
          };
          return (
            <React.Fragment key={i}>
              <Carta3D
                imagem={cartas[item.carta].imagem}
                x={pose.x}
                y={pose.y}
                w={pose.w}
                ry={interpolate(p, [0, 1], [180, 0]) + (d ? d.g : 0) + (sobe > 0.9 ? Math.sin(t * 1.1) * 10 : 0)}
                rz={interpolate(p, [0, 1], [(acaso(i + 3) - 0.5) * 60, 0])}
                apagar={sobe > 0 ? 0 : escurece}
                aura={sobe}
                brilho={sobe > 0.95 ? passadaDeBrilho(t, 1.4, d!.em + 0.4) : null}
                z={sobe > 0 ? 20 : 1}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: -pose.w * 0.06,
                    bottom: -pose.w * 0.05,
                    background: sobe > 0.5 ? CORES.ouro : CORES.vermelho,
                    color: sobe > 0.5 ? CORES.pillOuroTexto : CORES.texto,
                    transform: 'skewX(-14deg)',
                    padding: `0 ${pose.w * 0.09}px`,
                    fontFamily: FONTE_TITULO,
                    fontSize: Math.max(24, pose.w * 0.26),
                    lineHeight: 1.15,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                    opacity: trecho(p, [0.7, 1], [0, 1]) * (1 - 0.55 * (sobe > 0 ? 0 : escurece)),
                  }}
                >
                  <span style={{display: 'inline-block', transform: 'skewX(14deg)'}}>{sobe > 0.5 ? `${item.qtd}x` : item.qtd}</span>
                </div>
              </Carta3D>
            </React.Fragment>
          );
        })}
      </Tremer>
      <Flash em={destaques.map((d) => d.em + 0.3)} forca={0.4} />
      {itens.map((_, i) => (
        <Sfx key={i} som="carta" em={INICIO + i * PASSO} volume={0.16 + 0.08 * acaso(i)} />
      ))}
      <Sfx som="impacto" em={fimDistribuir} volume={0.3} />
      {destaques.map((d, i) => (
        <React.Fragment key={i}>
          <Sfx som="whoosh" em={d.em} />
          <Sfx som="impacto" em={d.em + 0.3} volume={0.3} />
          <Sfx som="brilho" em={d.em + 0.4} volume={0.16} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// ---------- CTA: carrossel de cartas ----------

export const CtaDeck: React.FC<{cena: CenaCta; cartas: MapaCartas; refs: string[]}> = ({cena, cartas, refs}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const abre = mola(quadro, fps, 0, MOLA_PULO);
  const lista = refs.filter((r) => cartas[r]).slice(0, 3);
  const centro = {x: AREA.cx, y: 790};
  const poses = lista.map((ref, i) => {
    const ang = ((t * 75 + (i * 360) / lista.length) * Math.PI) / 180;
    const prof = Math.cos(ang);
    return {ref, x: centro.x + Math.sin(ang) * 240 * abre, y: centro.y + prof * 20, ry: (ang * 180) / Math.PI, escala: (0.78 + 0.22 * (prof + 1) / 2) * abre, z: Math.round(prof * 10) + 10, apagar: (1 - prof) / 2 * 0.6};
  });
  return (
    <AbsoluteFill>
      <Raios x={centro.x} y={centro.y} forca={0.8} />
      <Tremer impactos={[0.3, 0.7]}>
        {[...poses]
          .sort((a, b) => a.z - b.z)
          .map((p) => (
            <Carta3D key={p.ref} imagem={cartas[p.ref].imagem} x={p.x} y={p.y} w={330} ry={p.ry} escala={p.escala} apagar={p.apagar} z={p.z} brilho={passadaDeBrilho(t, 1.2, 0.2)} />
          ))}
        <Batida em={0.3} style={{left: AREA.x0, width: AREA.largura, top: 330, display: 'flex', justifyContent: 'center', zIndex: 30}}>
          <TituloArena texto={cena.principal ?? 'SALVA'} largura={AREA.largura} maximo={170} />
        </Batida>
        {cena.complemento ? (
          <Batida em={0.7} style={{left: AREA.x0, width: AREA.largura, top: 1110, display: 'flex', justifyContent: 'center', zIndex: 30, fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: 52, color: CORES.texto, textShadow: '0 3px 14px rgba(0,0,0,0.9)'}}>
            {cena.complemento}
          </Batida>
        ) : null}
        {cena.seguir ? (
          <Batida em={1.1} style={{left: AREA.x0, width: AREA.largura, top: 1200, display: 'flex', justifyContent: 'center', zIndex: 30}}>
            <div style={{background: CORES.vermelho, transform: 'skewX(-12deg)', padding: '10px 30px', boxShadow: '0 10px 26px rgba(0,0,0,0.6)'}}>
              <div style={{transform: 'skewX(12deg)', fontFamily: FONTE_MONO, fontWeight: 700, fontSize: 36, letterSpacing: '0.12em', textTransform: 'uppercase', color: CORES.texto}}>{cena.seguir}</div>
            </div>
          </Batida>
        ) : null}
      </Tremer>
      <Flash em={[0]} forca={0.5} />
      <Sfx som="impacto" em={0.3} />
      <Sfx som="whoosh" em={0.65} volume={0.22} />
      <Sfx som="brilho" em={1.1} />
    </AbsoluteFill>
  );
};

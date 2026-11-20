// Cenas da série Deck do Dia: tudo gira em torno das cartas se mexendo.

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, PROPORCAO_CARTA} from '../tema';
import {FONTE_MONO, FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, MOLA_SECA, acaso, mola, trecho} from '../anim';
import {TituloArena, sombraTitulo} from '../componentes/Arena';
import {legendasDaCena} from '../tempo';
import type {Cena, CenaCartaDestaque, CenaConfronto, CenaCta, CenaDecklist, CenaGancho, CenaPiramide, MapaCartas} from '../tipos';
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
  const ALTURA = outros.length > 3 ? 82 : 98; // com 4 linhas, ficam mais baixas para não encostar na legenda
  // empate divide a posição (dois "3")
  const posicao = (v: number | undefined) => 1 + cena.niveis.filter((n) => (n.valor ?? 0) > (v ?? 0)).length;
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
          const y = 900 + i * ALTURA;
          const barra = ((n.valor ?? 0) / maior) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: AREA.x0,
                width: AREA.largura,
                top: y,
                height: ALTURA - 14,
                transform: `translateX(${(1 - e) * 900}px) skewX(-9deg)`,
                opacity: Math.min(1, e * 2),
                background: 'rgba(245,241,232,0.06)',
                boxShadow: 'inset 0 0 0 1.5px rgba(245,241,232,0.10)',
                overflow: 'hidden',
              }}
            >
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barra * Math.min(1, e)}%`, background: `linear-gradient(90deg, ${CORES.vermelhoEscuro}, ${CORES.vermelho})`}} />
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px', transform: 'skewX(9deg)'}}>
                <span style={{fontFamily: FONTE_TITULO, fontSize: 50, color: CORES.ouro, width: 40}}>{posicao(n.valor)}</span>
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
              top: 900 + outros.length * ALTURA + 2,
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
          <AbsoluteFill style={{opacity: 1 - Math.min(1, zoom), transform: `translateY(${-60 * Math.min(1, zoom)}px)`}}>
            <Batida em={0.1} style={{left: AREA.x0, width: AREA.largura, top: 330, display: 'flex', justifyContent: 'center'}}>
              <TituloArena texto={cena.titulo} largura={AREA.largura} maximo={92} />
            </Batida>
          </AbsoluteFill>
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
  const montagem = (cena.grupos?.length ?? 0) > 0;
  const fundo = montagem ? 1160 : 1240; // na montagem, o contador fica embaixo da grade
  const {colunas, linhas, w} = grade(itens.length, AREA.largura, fundo - topo);
  const h = w * PROPORCAO_CARTA;
  const x0 = AREA.cx - (colunas * w + (colunas - 1) * VAO) / 2;
  const y0 = topo + (fundo - topo - (linhas * h + (linhas - 1) * VAO)) / 2;
  const INICIO = 0.25;
  const PASSO = Math.min(0.06, 1.3 / Math.max(1, itens.length));
  const VOO = 0.3;
  // Montagem: cada carta entra com o seu grupo; as que não estão em grupo nenhum entram com o último.
  const grupos = (cena.grupos ?? []).map((g, j) => ({...g, em: g.em ?? 0.6 + j * 1.2}));
  const grupoDe = (ref: string) => {
    const j = grupos.findIndex((g) => g.cartas.includes(ref));
    return j >= 0 ? j : grupos.length - 1;
  };
  const inicioCarta = itens.map((item, i) => {
    if (!montagem) return INICIO + i * PASSO;
    const j = grupoDe(item.carta);
    const irmas = itens.filter((x) => grupoDe(x.carta) === j);
    const k = irmas.indexOf(item);
    return grupos[j].em + k * Math.min(0.09, 0.9 / Math.max(1, irmas.length));
  });
  const fimDistribuir = Math.max(...inicioCarta) + VOO;
  const total = itens.reduce((soma, x) => soma + x.qtd, 0);
  const contado = itens.reduce((soma, x, i) => soma + (t >= inicioCarta[i] + VOO * 0.8 ? x.qtd : 0), 0);
  const fimContagem = fimDistribuir;

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
      <Tremer impactos={[fimDistribuir, ...destaques.map((d) => d.em + 0.3), ...grupos.map((g) => g.em + VOO)]} forca={16}>
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
          const p = voo(t, inicioCarta[i], VOO);
          if (t < inicioCarta[i]) return null;
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
        {montagem ? (
          <div
            style={{
              position: 'absolute',
              left: AREA.x0,
              width: AREA.largura,
              top: 1172,
              display: 'flex',
              justifyContent: 'center',
              transform: `scale(${1 + 0.25 * (1 - mola(quadro, fps, fimContagem, MOLA_PULO)) * (t >= fimContagem ? 1 : 0)})`,
            }}
          >
            <div style={{background: contado >= total ? CORES.ouro : 'rgba(20,20,24,0.92)', boxShadow: `inset 0 0 0 3px ${CORES.ouro}, 0 10px 26px rgba(0,0,0,0.6)`, transform: 'skewX(-12deg)', padding: '4px 30px'}}>
              <div style={{transform: 'skewX(12deg)', fontFamily: FONTE_TITULO, fontSize: 54, lineHeight: 1.1, color: contado >= total ? CORES.pillOuroTexto : CORES.texto}}>
                {contado}
                <span style={{opacity: 0.6}}>/{total}</span>
              </div>
            </div>
          </div>
        ) : null}
        {grupos.map((g, j) => {
          if (!g.adesivo) return null;
          const fim = grupos[j + 1]?.em ?? duracao;
          if (t < g.em + 0.3 || t > fim) return null;
          const e = mola(quadro, fps, g.em + 0.3, MOLA_PULO);
          const sai = trecho(t, [fim - 0.12, fim], [1, 0]);
          const primeira = itens.findIndex((x) => grupoDe(x.carta) === j);
          const col = primeira % colunas;
          const lado = col < colunas / 2 ? 1 : -1;
          return (
            <div
              key={j}
              style={{
                position: 'absolute',
                left: AREA.x0,
                width: AREA.largura,
                top: 640,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 40,
                opacity: sai,
                transform: `translateX(${lado * 40}px) rotate(${-8 * lado + Math.sin(t * 9) * 3}deg) scale(${(0.2 + 0.8 * e) * sai})`,
              }}
            >
              <div style={{background: j % 2 === 0 ? CORES.ouro : CORES.vermelho, padding: '10px 34px', boxShadow: '0 16px 40px rgba(0,0,0,0.7), inset 0 0 0 4px rgba(10,10,13,0.85)'}}>
                <div style={{fontFamily: FONTE_TITULO, fontSize: 78, lineHeight: 1.05, color: j % 2 === 0 ? CORES.pillOuroTexto : CORES.texto, textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'pre-line'}}>{g.adesivo}</div>
              </div>
            </div>
          );
        })}
      </Tremer>
      <Flash em={[...destaques.map((d) => d.em + 0.3), ...(montagem ? [fimContagem] : [])]} forca={0.4} />
      {itens.map((_, i) => (
        <Sfx key={i} som="carta" em={inicioCarta[i]} volume={0.16 + 0.08 * acaso(i)} />
      ))}
      {grupos.map((g, j) => (
        <React.Fragment key={`g${j}`}>
          <Sfx som="whoosh" em={Math.max(0, g.em - 0.05)} volume={0.22} />
          {g.adesivo ? <Sfx som={j % 2 === 0 ? 'pop' : 'boing'} em={g.em + 0.3} volume={0.4} /> : null}
        </React.Fragment>
      ))}
      {montagem ? <Sfx som="ding" em={fimContagem} volume={0.35} /> : null}
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

// ---------- Confronto: o golpe e o dano que entrou de verdade ----------

export const Confronto: React.FC<{cena: CenaConfronto; cartas: MapaCartas; duracao: number}> = ({cena, cartas, duracao}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const G = cena.em ?? 1;
  const atk = cartas[cena.atacante];
  const def = cartas[cena.defensor];
  const ataque = atk.ataques.find((a) => a.nome === cena.ataque);
  const dano = ataque?.dano ?? '?';
  const entra = voo(t, 0, 0.4);
  const entraDef = voo(t, 0.12, 0.4);
  // atacante: recua e avança até o defensor no instante do golpe, depois volta
  const recua = trecho(t, [G - 0.45, G - 0.2], [0, 1]) * (1 - trecho(t, [G - 0.2, G], [0, 1]));
  const avanca = trecho(t, [G - 0.2, G], [0, 1]) * (1 - voo(t, G + 0.15, 0.4));
  const base = {x: 340, y: 640}; // atacante em cima, à esquerda
  const alvo = {x: 730, y: 1000}; // defensor embaixo, à direita
  const xa = interpolate(entra, [0, 1], [-400, base.x]) - recua * 60 + avanca * (alvo.x - 170 - base.x);
  const ya = base.y - recua * 30 + avanca * (alvo.y - 120 - base.y);
  const balA = balanco(t, 0.7);
  const balD = balanco(t + 2, 0.5);
  const escudo = trecho(t, [G, G + 0.1], [0, 1]) * (1 - trecho(t, [G + 0.25, G + 0.9], [0, 1]));
  const numero = mola(quadro, fps, G, MOLA_PULO);
  const risca = trecho(t, [G + 0.5, G + 0.7], [0, 1]);
  const vira = G + 0.85;
  const zero = mola(quadro, fps, vira, MOLA_PULO);
  const carimbo = mola(quadro, fps, G + 1.25, MOLA_SECA);
  const frases = batidasDasFrases(cena, duracao);
  return (
    <AbsoluteFill>
      <Raios x={alvo.x} y={alvo.y} forca={trecho(t, [G, G + 0.3], [0, 0.9])} cor="rgba(240,193,96,0.4)" />
      <Tremer impactos={[G, vira, G + 1.25, ...frases]}>
        <Carta3D
          imagem={def.imagem}
          x={interpolate(entraDef, [0, 1], [1450, alvo.x])}
          y={alvo.y + balD.dy}
          w={340}
          rz={interpolate(entraDef, [0, 1], [40, 6]) + balD.rz}
          ry={interpolate(entraDef, [0, 1], [160, 0]) + balD.ry * 0.6}
          rx={balD.rx}
          aura={escudo}
          brilho={passadaDeBrilho(t, 1.6, G + 0.2)}
          z={2}
        />
        {escudo > 0.01 ? (
          <div
            style={{
              position: 'absolute',
              left: alvo.x - 300,
              top: alvo.y - 330,
              width: 600,
              height: 660,
              borderRadius: '50%',
              zIndex: 3,
              opacity: escudo,
              transform: `scale(${0.85 + 0.2 * escudo})`,
              background: 'radial-gradient(ellipse, rgba(240,193,96,0) 55%, rgba(240,193,96,0.55) 68%, rgba(255,250,235,0.9) 72%, rgba(240,193,96,0) 78%)',
            }}
          />
        ) : null}
        <Carta3D
          imagem={atk.imagem}
          x={xa}
          y={ya + balA.dy * (1 - avanca)}
          w={330}
          rz={interpolate(entra, [0, 1], [-50, -8]) - avanca * 14 + balA.rz}
          ry={interpolate(entra, [0, 1], [-200, 0]) + balA.ry * (1 - avanca)}
          rx={balA.rx}
          z={4}
        />
        <div
          style={{
            position: 'absolute',
            left: AREA.x0,
            top: 340,
            opacity: trecho(t, [0.35, 0.5], [0, 1]),
            transform: `skewX(-12deg) translateX(${(1 - mola(quadro, fps, 0.35, MOLA_PULO)) * -200}px)`,
            background: CORES.vermelho,
            padding: '6px 22px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
            zIndex: 6,
          }}
        >
          <div style={{transform: 'skewX(12deg)', fontFamily: FONTE_TITULO, fontSize: 46, color: CORES.texto, textTransform: 'uppercase'}}>
            {cena.ataque} · {dano}
          </div>
        </div>
        {t >= G ? (
          <div
            style={{
              position: 'absolute',
              left: alvo.x - 260,
              width: 520,
              top: alvo.y - 330 - numero * 60,
              textAlign: 'center',
              zIndex: 8,
              fontFamily: FONTE_TITULO,
              lineHeight: 1,
              transform: `rotate(${-8 + (t < vira ? Math.sin(t * 60) * 3 * risca : 0)}deg)`,
            }}
          >
            {t < vira ? (
              <div style={{position: 'relative', display: 'inline-block', fontSize: 170, color: CORES.texto, transform: `scale(${0.3 + 0.7 * numero})`, textShadow: sombraTitulo(170)}}>
                -{dano}
                <div style={{position: 'absolute', left: -10, right: -10, top: '48%', height: 18, background: CORES.vermelho, transform: `scaleX(${risca}) rotate(-6deg)`, transformOrigin: 'left center', boxShadow: '0 4px 10px rgba(0,0,0,0.6)'}} />
              </div>
            ) : (
              <div style={{display: 'inline-block', fontSize: 230, color: CORES.ouro, transform: `scale(${2.2 - 1.2 * zero})`, textShadow: sombraTitulo(230)}}>{cena.resultado}</div>
            )}
          </div>
        ) : null}
        {cena.selo && t >= G + 1.25 ? (
          <div
            style={{
              position: 'absolute',
              left: alvo.x - 250,
              width: 500,
              top: alvo.y + 60,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 9,
              opacity: Math.min(1, carimbo * 1.5),
              transform: `rotate(-14deg) scale(${2.6 - 1.6 * carimbo})`,
            }}
          >
            <div style={{border: `8px solid ${CORES.vermelho}`, padding: '0 26px', background: 'rgba(10,10,13,0.75)', fontFamily: FONTE_TITULO, fontSize: 104, lineHeight: 1.08, color: CORES.vermelho, letterSpacing: '0.04em', textTransform: 'uppercase'}}>
              {cena.selo}
            </div>
          </div>
        ) : null}
      </Tremer>
      <LinhasDeVelocidade em={G} x={alvo.x - 120} y={alvo.y - 80} />
      <Flash em={[G]} forca={0.75} />
      <Sfx som="whoosh" em={0} />
      <Sfx som="carta" em={0.12} />
      <Sfx som="whoosh" em={Math.max(0, G - 0.25)} volume={0.4} />
      <Sfx som="impacto" em={G} />
      <Sfx som="trombone" em={vira} />
      <Sfx som="impacto" em={G + 1.25} volume={0.35} />
    </AbsoluteFill>
  );
};

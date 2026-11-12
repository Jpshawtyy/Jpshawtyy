import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES} from '../tema';
import {FONTE_MONO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, MOLA_SECA, misturar, mola, trecho} from '../anim';
import {completarLegendas} from '../tempo';
import {Carta, VersoCarta} from '../componentes/Carta';
import {Pill} from '../componentes/Pill';
import {Estrela} from '../componentes/Estrela';
import {LegendaDinamica} from '../componentes/Legenda';
import {IconeEnergia} from './IconeEnergia';
import type {CenaMesa, LadoId, Legenda, LegendaPronta, MapaCartas, PalavraFalada} from '../tipos';
import {INTRO_MESA, marcadores, simularMesa, topo, type Estado, type Passo, type Simulacao} from './motor';
import {BASE_MESA, ENCAIXE_MESA, ZONAS, alturaCarta, arranjar, poseAtivo, poseBanco, poseDeck, poseDescarte, poseFora, posePremio, type Arranjo, type Pose} from './layout';

// ---------- movimento ----------

type Ponto = {t: number; pose: Pose; modo?: 'mola' | 'bate'};

const misturarPose = (a: Pose, b: Pose, p: number): Pose => ({
  x: misturar(a.x, b.x, p),
  y: misturar(a.y, b.y, p),
  w: misturar(a.w, b.w, p),
  rot: misturar(a.rot, b.rot, p),
  face: misturar(a.face, b.face, p),
  icone: misturar(a.icone, b.icone, p),
  op: misturar(a.op, b.op, p),
  cinza: misturar(a.cinza, b.cinza, p),
  z: Math.max(a.z, b.z),
});

// Leva a carta de ponto em ponto. Cada trecho é uma mola seca; "bate" acelera até encaixar.
const percorrer = (tl: number, fps: number, pontos: Ponto[]): Pose => {
  if (tl <= pontos[0].t) return pontos[0].pose;
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    if (tl < b.t) {
      const dur = b.t - a.t;
      const u = (tl - a.t) / dur;
      const p =
        b.modo === 'bate'
          ? u * u * u
          : spring({frame: (tl - a.t) * fps, fps, config: MOLA_SECA, durationInFrames: Math.max(1, Math.round(dur * fps))});
      return misturarPose(a.pose, b.pose, p);
    }
  }
  return pontos[pontos.length - 1].pose;
};

// Subida e descida rápida (0 -> 1 -> 0) a partir de um instante.
const pulso = (tl: number, inicio: number, dur: number) => {
  const u = (tl - inicio) / dur;
  return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
};

const NO_AR = 400; // camada das cartas em movimento, acima de tudo que está na mesa

// Caminho da carta principal de cada ação.
const coreografia = (passo: Passo, j: number, a: Pose, b: Pose, chegaNaMesa: boolean, tl: number, fps: number): Pose => {
  const ar = (p: Pose, extra: Partial<Pose> = {}): Pose => ({...p, ...extra, z: NO_AR + j});
  switch (passo.tipo) {
    case 'comprar':
    case 'buscar':
    case 'pegar_premio': {
      if (!chegaNaMesa) return percorrer(tl, fps, [{t: 0.1, pose: ar(a)}, {t: 0.6, pose: ar(b)}, {t: 0.61, pose: b}]);
      const n = passo.uids.length;
      const w = n === 1 ? ZONAS.revelar.w : Math.min(210, 760 / n - 16);
      const mostra = ar(a, {x: ZONAS.revelar.x + (j - (n - 1) / 2) * (w + 16), y: ZONAS.revelar.y, w, rot: 0, face: 1, op: 1});
      const t0 = 0.1 + j * 0.2;
      const fim = 0.1 + (n - 1) * 0.2 + 0.34 + 0.55;
      return percorrer(tl, fps, [
        {t: t0, pose: ar(a)},
        {t: t0 + 0.34, pose: mostra},
        {t: fim, pose: mostra},
        {t: fim + 0.4, pose: ar(b)},
        {t: fim + 0.41, pose: b},
      ]);
    }
    case 'jogar_no_banco': {
      const alto = ar(b, {w: b.w * 1.32, y: b.y - 36});
      return percorrer(tl, fps, [
        {t: 0.08, pose: ar(a)},
        {t: 0.42, pose: alto},
        {t: 0.62, pose: alto},
        {t: 0.8, pose: ar(b), modo: 'bate'},
        {t: 0.81, pose: b},
      ]);
    }
    case 'ligar_energia': {
      const alto = ar(a, {y: a.y - 90, w: a.w * 1.3, rot: 0, op: 1});
      const pose = percorrer(tl, fps, [
        {t: 0.08, pose: ar(a)},
        {t: 0.36, pose: alto},
        {t: 0.52, pose: alto},
        {t: 0.88, pose: ar(b)},
        {t: 0.89, pose: b},
      ]);
      // o ícone chega com um pulinho
      return {...pose, w: pose.w * (1 + 0.5 * pulso(tl, 0.88, 0.28))};
    }
    case 'jogar_treinador': {
      const centro = ar(a, {x: ZONAS.centro.x, y: ZONAS.centro.y, w: ZONAS.centro.w, rot: 0, face: 1, op: 1});
      return percorrer(tl, fps, [
        {t: 0.08, pose: ar(a)},
        {t: 0.4, pose: centro},
        {t: 1.42, pose: {...centro, rot: 1.5}},
        {t: 1.82, pose: ar(b)},
        {t: 1.83, pose: b},
      ]);
    }
    case 'evoluir': {
      const alto = ar(b, {y: b.y - 74, w: b.w * 1.5, rot: -6});
      const pose = percorrer(tl, fps, [
        {t: 0.08, pose: ar(a)},
        {t: 0.45, pose: alto},
        {t: 0.75, pose: alto},
        {t: 0.9, pose: ar(b), modo: 'bate'},
        {t: 1.3, pose: ar(b)},
        {t: 1.31, pose: b},
      ]);
      return {...pose, w: pose.w * (1 + 0.1 * pulso(tl, 0.9, 0.3))};
    }
    case 'descartar': {
      const t0 = 0.08 + j * 0.12;
      return percorrer(tl, fps, [{t: t0, pose: ar(a)}, {t: t0 + 0.45, pose: ar(b)}, {t: t0 + 0.46, pose: b}]);
    }
    case 'nocaute': {
      const treme = tl < 0.85 ? Math.sin(tl * 75) * 10 * (1 - tl / 0.85) : 0;
      const cinza = trecho(tl, [0.1, 0.55], [0, 1]) * trecho(tl, [1.05, 1.4], [1, 0]);
      const pose = percorrer(tl, fps, [{t: 0.95, pose: a}, {t: 1.4, pose: {...b, z: NO_AR + j}}, {t: 1.41, pose: b}]);
      return {...pose, x: pose.x + treme, rot: pose.rot + treme * 0.25, cinza};
    }
    default:
      return percorrer(tl, fps, [{t: 0.1, pose: ar(a)}, {t: 0.6, pose: ar(b)}, {t: 0.61, pose: b}]);
  }
};

// ---------- legendas ----------

export const legendasDaMesa = (cena: CenaMesa, sim: Simulacao, duracao: number): LegendaPronta[] => {
  const brutas: Legenda[] = [
    ...(cena.legenda ? [{texto: cena.legenda, em: 0.2}] : []),
    ...(cena.legendas ?? []).map((l) => ({...l, em: l.em ?? 0.2})),
    ...sim.passos.filter((p) => p.acao.legenda).map((p) => ({texto: p.acao.legenda!, em: p.inicio})),
  ].sort((a, b) => a.em! - b.em!);
  return completarLegendas(brutas, duracao);
};

// ---------- peças fixas da mesa ----------

const Rotulo: React.FC<{x: number; y: number; children: React.ReactNode; alinhar?: 'left' | 'center' | 'right'; tamanho?: number}> = ({
  x,
  y,
  children,
  alinhar = 'center',
  tamanho = 16,
}) => (
  <div
    style={{
      position: 'absolute',
      left: alinhar === 'left' ? x : alinhar === 'center' ? x - 150 : x - 300,
      width: 300,
      top: y,
      textAlign: alinhar,
      fontFamily: FONTE_MONO,
      fontWeight: 500,
      fontSize: tamanho,
      lineHeight: 1,
      letterSpacing: '0.12em',
      color: CORES.secundario,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const Espaco: React.FC<{pose: Pose; rotulo?: string; forte?: boolean}> = ({pose, rotulo, forte}) => {
  const h = alturaCarta(pose.w);
  return (
    <div
      style={{
        position: 'absolute',
        left: pose.x - pose.w / 2,
        top: pose.y - h / 2,
        width: pose.w,
        height: h,
        borderRadius: pose.w * 0.06,
        boxSizing: 'border-box',
        border: `${pose.w > 90 ? 2 : 1.5}px dashed rgba(232,184,74,${forte ? 0.4 : 0.24})`,
        background: 'rgba(232,184,74,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTE_MONO,
        fontWeight: 500,
        fontSize: Math.max(11, pose.w * 0.115),
        letterSpacing: '0.1em',
        color: 'rgba(154,148,136,0.75)',
      }}
    >
      {rotulo}
    </div>
  );
};

const PilhaDeck: React.FC<{lado: LadoId; qtd: number}> = ({lado, qtd}) => {
  const p = poseDeck(lado);
  const h = alturaCarta(p.w);
  if (qtd <= 0) return <Espaco pose={p} rotulo={lado === 'eu' ? 'DECK' : undefined} />;
  const camadas = Math.min(3, qtd);
  return (
    <>
      {Array.from({length: camadas}, (_, i) => {
        const d = (camadas - 1 - i) * (p.w * 0.035);
        return (
          <div key={i} style={{position: 'absolute', left: p.x - p.w / 2 + d, top: p.y - h / 2 - d, boxShadow: '0 4px 10px rgba(0,0,0,0.5)', borderRadius: p.w * 0.045}}>
            <VersoCarta largura={p.w} />
          </div>
        );
      })}
    </>
  );
};

const Tabuleiro: React.FC<{estado: Estado; deckEu: number; deckOponente: number; temOponente: boolean}> = ({estado, deckEu, deckOponente, temOponente}) => {
  const ze = ZONAS.eu;
  const hAtivo = alturaCarta(ze.ativo.w);
  const hPremio = alturaCarta(ze.premios.w);
  const baseDeck = ze.deck.y + alturaCarta(ze.deck.w) / 2;
  return (
    <>
      {/* divisor entre os dois lados, com a etiqueta de quem está jogando */}
      <div style={{position: 'absolute', left: BASE_MESA.x0 + 6, width: BASE_MESA.largura - 12, top: ZONAS.divisorY, height: 1.5, background: 'rgba(232,184,74,0.22)'}} />
      <div style={{position: 'absolute', right: 1080 - (BASE_MESA.x1 - 6), top: ZONAS.divisorY - 15}}>
        <Pill tamanho={15} contorno={estado.vez !== 'eu'}>
          {estado.vez === 'eu' ? 'seu turno' : 'turno do oponente'}
        </Pill>
      </div>

      {/* seu lado */}
      <Espaco pose={poseAtivo('eu')} rotulo="ATIVO" forte />
      {Array.from({length: 5}, (_, i) => (
        <Espaco key={i} pose={poseBanco('eu', i)} rotulo="BANCO" />
      ))}
      <Espaco pose={poseDescarte('eu')} />
      {Array.from({length: 6}, (_, i) => (
        <Espaco key={i} pose={posePremio('eu', i)} />
      ))}
      <PilhaDeck lado="eu" qtd={deckEu} />
      <Rotulo x={ze.ativo.x - ze.ativo.w / 2 - 14} y={ze.ativo.y - hAtivo / 2 + 4} alinhar="right">
        ATIVO
      </Rotulo>
      <Rotulo x={ze.premios.x0} y={ze.premios.y0 + 3 * hPremio + 2 * ze.premios.vao + 11} alinhar="left">
        PRÊMIOS
      </Rotulo>
      <Rotulo x={ze.deck.x} y={baseDeck + 12}>
        DECK {deckEu}
      </Rotulo>
      <Rotulo x={ze.descarte.x} y={baseDeck + 12}>
        DESCARTE
      </Rotulo>
      <Rotulo x={BASE_MESA.x0 + 6} y={ze.mao.y - 8} alinhar="left">
        MÃO
      </Rotulo>

      {/* lado do oponente, menor */}
      {temOponente ? (
        <>
          <Rotulo x={BASE_MESA.x0 + 6} y={ZONAS.oponente.banco.y - alturaCarta(ZONAS.oponente.banco.w) / 2 - 30} alinhar="left" tamanho={15}>
            OPONENTE
          </Rotulo>
          <Espaco pose={poseAtivo('oponente')} forte />
          {Array.from({length: 5}, (_, i) => (
            <Espaco key={i} pose={poseBanco('oponente', i)} />
          ))}
          <Espaco pose={poseDescarte('oponente')} />
          <PilhaDeck lado="oponente" qtd={deckOponente} />
        </>
      ) : null}
    </>
  );
};

// Marcador de dano: 10 escuro com aro dourado, 50 dourado, 100 vermelho.
const Marcador: React.FC<{valor: number; tamanho: number}> = ({valor, tamanho}) => {
  const estilo =
    valor === 100
      ? {background: CORES.vermelho, color: CORES.pillVermelhoTexto, boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,241,242,0.5)'}
      : valor === 50
        ? {background: CORES.ouro, color: CORES.pillOuroTexto, boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(42,30,5,0.35)'}
        : {background: '#15151A', color: CORES.ouro, boxShadow: `0 3px 8px rgba(0,0,0,0.6), inset 0 0 0 2.5px ${CORES.ouro}`};
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTE_TITULO,
        fontWeight: 700,
        fontSize: tamanho * (valor === 100 ? 0.36 : 0.42),
        letterSpacing: '-0.03em',
        ...estilo,
      }}
    >
      {valor}
    </div>
  );
};

const refsDoEstado = (e: Estado, saida: Map<string, string | null>) => {
  for (const lado of ['eu', 'oponente'] as LadoId[]) {
    const l = e[lado];
    for (const p of [l.ativo, ...l.banco]) {
      if (!p) continue;
      for (const c of [...p.pilha, ...p.energias, ...p.ferramentas]) saida.set(c.uid, c.ref);
    }
    for (const c of [...l.mao, ...l.descarte]) saida.set(c.uid, c.ref);
    for (const c of l.premios) if (c) saida.set(c.uid, c.ref);
  }
  if (e.estadio) saida.set(e.estadio.inst.uid, e.estadio.inst.ref);
};

// ---------- a mesa ----------

export const Mesa: React.FC<{
  cena: CenaMesa;
  cartas: MapaCartas;
  duracao: number;
  falas?: PalavraFalada[];
  inicioDaCena: number;
}> = ({cena, cartas, duracao, falas, inicioDaCena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;

  const {sim, arranjos} = useMemo(() => {
    const s = simularMesa(cena, cartas);
    return {sim: s, arranjos: [arranjar(s.inicial), ...s.passos.map((p) => arranjar(p.depois))]};
  }, [cena, cartas]);
  const legendas = useMemo(() => legendasDaMesa(cena, sim, duracao), [cena, sim, duracao]);

  let k = -1;
  sim.passos.forEach((p, i) => {
    if (t >= p.inicio) k = i;
  });
  const passo: Passo | null = k >= 0 ? sim.passos[k] : null;
  const tl = passo ? t - passo.inicio : 0;
  const A: Arranjo = arranjos[Math.max(0, k)];
  const B: Arranjo = k >= 0 ? arranjos[k + 1] : arranjos[0];
  const antes = passo ? passo.antes : sim.inicial;
  const depois = passo ? passo.depois : sim.inicial;

  const refs = new Map<string, string | null>();
  refsDoEstado(antes, refs);
  refsDoEstado(depois, refs);

  // deslocamentos de um Pokémon inteiro (ataque, tremor, pulinho ao receber energia)
  const desloc = new Map<string, {dx: number; dy: number; escala: number}>();
  if (passo?.tipo === 'atacar') {
    const dir = passo.lado === 'eu' ? -1 : 1;
    if (passo.atacantePid) {
      const recua = trecho(tl, [0.3, 0.5], [0, 1]) * (1 - trecho(tl, [0.5, 0.56], [0, 1]));
      const avanca = trecho(tl, [0.5, 0.62], [0, 1]) * (1 - mola(quadro, fps, passo.inicio + 0.62, MOLA_SECA));
      desloc.set(passo.atacantePid, {dx: 0, dy: -dir * 24 * recua + dir * 112 * avanca, escala: 1 + 0.06 * avanca});
    }
    if (passo.defensorPid && tl > 0.62 && tl < 1.15) {
      const forca = 1 - (tl - 0.62) / 0.53;
      desloc.set(passo.defensorPid, {dx: Math.sin(tl * 80) * 12 * forca, dy: dir * 14 * forca, escala: 1});
    }
  }
  if (passo?.tipo === 'ligar_energia' && passo.alvoPid) desloc.set(passo.alvoPid, {dx: 0, dy: 0, escala: 1 + 0.07 * pulso(tl, 0.88, 0.3)});
  if (passo?.tipo === 'dano' && passo.alvoPid && tl < 0.6) {
    desloc.set(passo.alvoPid, {dx: Math.sin(tl * 80) * 9 * (1 - tl / 0.6), dy: 0, escala: 1});
  }

  // pose de cada carta neste quadro
  const uids = new Set<string>([...A.poses.keys(), ...B.poses.keys()]);
  const poses = new Map<string, Pose>();
  const intro = k < 0;
  const ordemIntro = intro ? [...uids].sort((u1, u2) => A.poses.get(u1)!.y - A.poses.get(u2)!.y || A.poses.get(u1)!.x - A.poses.get(u2)!.x) : [];

  for (const uid of uids) {
    const a0 = A.poses.get(uid);
    const b0 = B.poses.get(uid);
    let pose: Pose;
    if (!passo) {
      pose = a0!;
    } else {
      const origem = passo.origem === 'deck' ? poseDeck(passo.lado) : poseFora(passo.lado);
      const a = a0 ?? origem;
      const b = b0 ?? poseFora(passo.lado);
      const j = passo.uids.indexOf(uid);
      if (j >= 0) {
        pose = coreografia(passo, j, a, b, b0 !== undefined, tl, fps);
      } else if (a === b || (a.x === b.x && a.y === b.y && a.w === b.w && a.rot === b.rot)) {
        pose = b;
      } else {
        const p = spring({frame: (tl - 0.1) * fps, fps, config: MOLA_SECA});
        pose = misturarPose(a, b, p);
        if (p < 0.985) pose = {...pose, z: pose.z + 150};
        else pose = b;
      }
      // acompanha o Pokémon a que pertence
      const pid = A.dono.get(uid) ?? B.dono.get(uid);
      const d = pid && j < 0 ? desloc.get(pid) : undefined;
      const centro = pid ? (A.pokes.get(pid) ?? B.pokes.get(pid))?.base : undefined;
      if (d && centro) {
        pose = {
          ...pose,
          x: centro.x + (pose.x - centro.x) * d.escala + d.dx,
          y: centro.y + (pose.y - centro.y) * d.escala + d.dy,
          w: pose.w * d.escala,
          z: passo.tipo === 'atacar' && pid === passo.atacantePid ? pose.z + 100 : pose.z,
        };
      }
    }
    if (intro) {
      const e = mola(quadro, fps, 0.05 + ordemIntro.indexOf(uid) * 0.02, MOLA_PULO);
      pose = {...pose, w: pose.w * (0.55 + 0.45 * e), op: pose.op * Math.min(1, e * 1.5)};
    }
    poses.set(uid, pose);
  }

  // deck: o número muda quando a carta sai
  const deckDe = (lado: LadoId) => (passo && tl < 0.25 ? antes[lado].deck : depois[lado].deck);
  const temOponente = cena.estado.oponente !== undefined;
  const surge = trecho(t, [0, 0.25], [0.45, 1]); // a mesa já nasce visível: nada de quadro vazio na troca de cena

  // marcadores de dano por Pokémon
  const pokesVisiveis = new Map(B.pokes);
  if (passo?.tipo === 'nocaute' && passo.alvoPid && tl < 0.9 && A.pokes.has(passo.alvoPid)) pokesVisiveis.set(passo.alvoPid, A.pokes.get(passo.alvoPid)!);
  const trocaDano = passo?.tipo === 'atacar' ? 1.5 : 0.15;

  // dados do efeito da ação atual
  const alvoBase = passo?.alvoPid ? (B.pokes.get(passo.alvoPid) ?? A.pokes.get(passo.alvoPid))?.base : undefined;
  const defensor = passo?.defensorPid ? (A.pokes.get(passo.defensorPid) ?? B.pokes.get(passo.defensorPid)) : undefined;
  const dirAtaque = passo?.lado === 'eu' ? -1 : 1;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transformOrigin: `${BASE_MESA.cx}px ${BASE_MESA.topo}px`,
          transform: `translate(${ENCAIXE_MESA.dx}px, ${ENCAIXE_MESA.dy}px) scale(${ENCAIXE_MESA.escala})`,
        }}
      >
      <AbsoluteFill style={{opacity: surge}}>
        <Tabuleiro estado={depois} deckEu={deckDe('eu')} deckOponente={deckDe('oponente')} temOponente={temOponente} />
      </AbsoluteFill>

      {/* cartas */}
      {[...poses.entries()].map(([uid, p]) => {
        const ref = refs.get(uid) ?? null;
        const dados = ref ? cartas[ref] : undefined;
        const h = alturaCarta(p.w);
        const frente = p.face >= 0.5 && dados !== undefined;
        const vira = Math.abs(Math.cos(Math.PI * p.face));
        const filtro = p.cinza > 0.01 ? `grayscale(${p.cinza}) brightness(${1 - 0.4 * p.cinza})` : undefined;
        return (
          <React.Fragment key={uid}>
            {p.icone < 0.99 ? (
              <div
                style={{
                  position: 'absolute',
                  left: p.x - p.w / 2,
                  top: p.y - h / 2,
                  zIndex: Math.round(p.z),
                  opacity: p.op * (1 - p.icone),
                  transform: `rotate(${p.rot}deg) scaleX(${Math.max(0.02, vira)})`,
                  filter: filtro,
                }}
              >
                {frente ? <Carta imagem={dados.imagem} largura={p.w} sombra={p.w > 80} /> : <VersoCarta largura={p.w} />}
              </div>
            ) : null}
            {p.icone > 0.01 ? (
              <div style={{position: 'absolute', left: p.x - p.w / 2, top: p.y - p.w / 2, zIndex: Math.round(p.z) + 1, opacity: p.op * p.icone, filter: filtro}}>
                <IconeEnergia tipo={dados?.fornece ?? null} tamanho={p.w} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* marcadores de dano */}
      {[...pokesVisiveis.values()].map((info) => {
        const danoAntes = A.pokes.get(info.pid)?.poke.dano ?? 0;
        const danoDepois = B.pokes.get(info.pid)?.poke.dano ?? danoAntes;
        const mudou = passo !== null && danoAntes !== danoDepois;
        const mostra = mudou && tl < trocaDano ? danoAntes : danoDepois;
        const lista = marcadores(mostra);
        if (lista.length === 0) return null;
        const carta = poses.get(topo(info.poke).uid) ?? info.base;
        const linhas: number[][] = [];
        lista.forEach((v, i) => {
          if (i % 3 === 0) linhas.push([]);
          linhas[linhas.length - 1].push(v);
        });
        const tam = (v: number) => carta.w * (v === 100 ? 0.37 : v === 50 ? 0.33 : 0.28);
        let indice = 0;
        return (
          <div
            key={info.pid}
            style={{
              position: 'absolute',
              left: carta.x - carta.w,
              width: carta.w * 2,
              top: carta.y - alturaCarta(carta.w) * 0.34,
              zIndex: Math.round(carta.z) + 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              opacity: carta.op * (1 - carta.cinza * 0.6),
            }}
          >
            {linhas.map((linha, li) => (
              <div key={li} style={{display: 'flex', alignItems: 'center', gap: 3}}>
                {linha.map((v) => {
                  const i = indice++;
                  const e = mudou && tl >= trocaDano ? mola(quadro, fps, passo!.inicio + trocaDano + i * 0.09, MOLA_PULO) : 1;
                  return (
                    <div key={i} style={{transform: `scale(${e})`}}>
                      <Marcador valor={v} tamanho={tam(v)} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      {/* ---------- efeitos da ação atual ---------- */}

      {/* treinador: escurece a mesa enquanto a carta está grande no centro */}
      {passo?.tipo === 'jogar_treinador' ? (
        <>
          <div style={{position: 'absolute', inset: -600, background: CORES.fundo, opacity: trecho(tl, [0.1, 0.35], [0, 0.66]) * trecho(tl, [1.42, 1.72], [1, 0]), zIndex: 350}} />
          {passo.rotuloTreinador && tl > 0.28 && tl < 1.5 ? (
            <div
              style={{
                position: 'absolute',
                left: BASE_MESA.x0,
                width: BASE_MESA.largura,
                top: ZONAS.centro.y - alturaCarta(ZONAS.centro.w) / 2 - 78,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 900,
                opacity: trecho(tl, [1.38, 1.5], [1, 0]),
                transform: `scale(${mola(quadro, fps, passo.inicio + 0.28, MOLA_PULO)})`,
              }}
            >
              <Pill tamanho={34}>{passo.rotuloTreinador}</Pill>
            </div>
          ) : null}
        </>
      ) : null}

      {/* evolução: flash dourado no encaixe */}
      {passo?.tipo === 'evoluir' && alvoBase && tl >= 0.88 && tl < 1.6 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: alvoBase.x - alvoBase.w / 2,
              top: alvoBase.y - alturaCarta(alvoBase.w) / 2,
              width: alvoBase.w,
              height: alturaCarta(alvoBase.w),
              borderRadius: alvoBase.w * 0.045,
              background: 'radial-gradient(circle, #FFF6D6 0%, #E8B84A 70%)',
              opacity: interpolate(tl, [0.88, 0.94, 1.3], [0, 0.95, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              zIndex: 600,
              mixBlendMode: 'screen',
            }}
          />
          {[0, 1].map((i) => {
            const u = trecho(tl, [0.9 + i * 0.1, 1.4 + i * 0.1], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: alvoBase.x - 230,
                  top: alvoBase.y - 230,
                  width: 460,
                  height: 460,
                  borderRadius: '50%',
                  boxShadow: `inset 0 0 0 ${10 * (1 - u)}px ${CORES.ouro}`,
                  transform: `scale(${0.35 + u * 0.9})`,
                  opacity: (1 - u) * 0.9,
                  zIndex: 590,
                }}
              />
            );
          })}
          <div style={{position: 'absolute', inset: 0, zIndex: 610}}>
            {Array.from({length: 8}, (_, i) => {
              const ang = (i / 8) * Math.PI * 2 + 0.3;
              const u = trecho(tl, [0.9, 1.45], [0, 1]);
              const r = alvoBase.w * (0.5 + 0.75 * (1 - (1 - u) * (1 - u)));
              return (
                <div key={i} style={{opacity: 1 - u}}>
                  <Estrela x={alvoBase.x + Math.cos(ang) * r} y={alvoBase.y + Math.sin(ang) * r * 1.2} tamanho={30 + (i % 3) * 12} semente={i + 40} />
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* anel de chegada: Pokémon no banco e energia ligada */}
      {(passo?.tipo === 'jogar_no_banco' || passo?.tipo === 'ligar_energia') && alvoBase
        ? (() => {
            const quando = passo.tipo === 'jogar_no_banco' ? 0.8 : 0.88;
            const u = trecho(tl, [quando, quando + 0.45], [0, 1]);
            if (u <= 0 || u >= 1) return null;
            const d = alvoBase.w * 2.1;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: alvoBase.x - d / 2,
                  top: alvoBase.y - d / 2,
                  width: d,
                  height: d,
                  borderRadius: '50%',
                  boxShadow: `inset 0 0 0 ${8 * (1 - u)}px ${CORES.ouro}`,
                  transform: `scale(${0.45 + u * 0.6})`,
                  opacity: (1 - u) * 0.85,
                  zIndex: 590,
                }}
              />
            );
          })()
        : null}

      {/* busca no deck: o deck acende */}
      {(passo?.tipo === 'buscar' || passo?.tipo === 'comprar') && tl < 0.6
        ? (() => {
            const p = poseDeck(passo.lado);
            const u = trecho(tl, [0, 0.6], [0, 1]);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: p.x - p.w * 0.75,
                  top: p.y - alturaCarta(p.w) * 0.68,
                  width: p.w * 1.5,
                  height: alturaCarta(p.w) * 1.36,
                  borderRadius: p.w * 0.16,
                  boxShadow: `0 0 ${30 * (1 - u)}px ${10 * (1 - u)}px rgba(232,184,74,0.55)`,
                  opacity: 1 - u,
                  zIndex: 7,
                }}
              />
            );
          })()
        : null}

      {/* ataque: nome do ataque e dano em número grande */}
      {passo?.tipo === 'atacar' ? (
        <>
          {tl > 0.04 && tl < 2.45 ? (
            <div
              style={{
                position: 'absolute',
                left: BASE_MESA.x0,
                width: BASE_MESA.largura,
                top: ZONAS.divisorY - 34,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 950,
                opacity: trecho(tl, [2.3, 2.45], [1, 0]),
                transform: `scale(${mola(quadro, fps, passo.inicio + 0.04, MOLA_PULO)})`,
              }}
            >
              <Pill tamanho={34}>{passo.nomeAtaque}</Pill>
            </div>
          ) : null}
          {defensor && passo.dano !== undefined && passo.dano > 0 && tl >= 0.62 && tl < 2.15 ? (
            <div
              style={{
                position: 'absolute',
                left: defensor.base.x - 300,
                width: 600,
                top: defensor.base.y - 120 + dirAtaque * 10,
                height: 240,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 960,
                opacity: trecho(tl, [1.9, 2.15], [1, 0]),
                transform: `scale(${0.3 + 0.7 * mola(quadro, fps, passo.inicio + 0.62, MOLA_PULO)}) rotate(-6deg)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONTE_TITULO,
                  fontWeight: 700,
                  fontSize: 170,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: CORES.ouro,
                  WebkitTextStroke: `14px ${CORES.fundo}`,
                  paintOrder: 'stroke fill',
                  textShadow: '0 10px 30px rgba(0,0,0,0.7)',
                }}
              >
                {passo.dano}
              </div>
            </div>
          ) : null}
          {/* impacto */}
          {defensor && tl >= 0.6 && tl < 1.0 ? (
            <div
              style={{
                position: 'absolute',
                left: defensor.base.x - 200,
                top: defensor.base.y - 200,
                width: 400,
                height: 400,
                borderRadius: '50%',
                boxShadow: `inset 0 0 0 ${14 * (1 - trecho(tl, [0.6, 1.0], [0, 1]))}px ${CORES.ouro}`,
                transform: `scale(${0.3 + trecho(tl, [0.6, 1.0], [0, 1])})`,
                opacity: 1 - trecho(tl, [0.6, 1.0], [0, 1]),
                zIndex: 940,
              }}
            />
          ) : null}
        </>
      ) : null}

      {/* nocaute */}
      {passo?.tipo === 'nocaute' && passo.alvoPid && A.pokes.has(passo.alvoPid) && tl > 0.2 && tl < 1.15 ? (
        <div
          style={{
            position: 'absolute',
            left: A.pokes.get(passo.alvoPid)!.base.x - 300,
            width: 600,
            top: A.pokes.get(passo.alvoPid)!.base.y - 30,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 950,
            opacity: trecho(tl, [1.0, 1.15], [1, 0]),
            transform: `scale(${mola(quadro, fps, passo.inicio + 0.2, MOLA_PULO)}) rotate(-5deg)`,
          }}
        >
          <Pill cor="vermelho" tamanho={38}>
            nocaute
          </Pill>
        </div>
      ) : null}

      {/* fim de turno */}
      {passo?.tipo === 'fim_de_turno' && tl > 0.05 && tl < 1.15 ? (
        <div
          style={{
            position: 'absolute',
            left: BASE_MESA.x0,
            width: BASE_MESA.largura,
            top: ZONAS.eu.ativo.y - 40,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 950,
            opacity: trecho(tl, [1.0, 1.15], [1, 0]),
            transform: `scale(${mola(quadro, fps, passo.inicio + 0.05, MOLA_PULO)})`,
          }}
        >
          <Pill tamanho={46}>fim do turno</Pill>
        </div>
      ) : null}

      </AbsoluteFill>

      <AbsoluteFill style={{zIndex: 2000}}>
        <LegendaDinamica legendas={legendas} falas={falas} inicioDaCena={inicioDaCena} tamanho={50} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

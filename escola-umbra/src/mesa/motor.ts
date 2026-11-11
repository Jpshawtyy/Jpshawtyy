// Motor da mesa: aplica as ações do roteiro em cima de um estado de jogo, uma por uma,
// e confere as regras do Pokémon TCG. O mesmo código roda na validação (Node) e no vídeo.

import type {Acao, CartaDados, CenaMesa, LadoId, LadoInicial, MapaCartas, PokemonInicial, TipoAcao} from '../tipos';

export type Inst = {uid: string; ref: string | null}; // ref null = carta virada, ainda desconhecida

export type Poke = {
  pid: string;
  pilha: Inst[]; // da básica (índice 0) até a carta de cima
  energias: Inst[];
  ferramentas: Inst[];
  dano: number;
  entrouNoTurno: number;
  evoluiuNoTurno: number | null;
};

export type EstadoLado = {
  ativo: Poke | null;
  banco: Poke[];
  mao: Inst[];
  maoOculta: boolean;
  maoQtd: number;
  deck: number;
  descarte: Inst[];
  premios: (Inst | null)[];
};

export type Estado = {
  turno: number;
  quemComecou: LadoId;
  vez: LadoId;
  eu: EstadoLado;
  oponente: EstadoLado;
  estadio: {inst: Inst; dono: LadoId} | null;
  noTurno: {energia: boolean; apoiador: boolean; estadio: boolean; recuou: boolean; atacou: boolean};
};

export type Origem = 'deck' | 'mao' | 'premio' | 'fora';

export type Passo = {
  indice: number;
  acao: Acao;
  tipo: TipoAcao;
  lado: LadoId;
  inicio: number;
  duracao: number;
  antes: Estado;
  depois: Estado;
  uids: string[]; // cartas que a ação movimenta
  origem: Origem | null; // de onde elas saem
  alvoPid?: string;
  atacantePid?: string;
  defensorPid?: string;
  nomeAtaque?: string;
  dano?: number;
  rotuloTreinador?: 'APOIADOR' | 'ITEM' | 'ESTÁDIO' | 'FERRAMENTA';
  destinoTreinador?: 'descarte' | 'estadio' | 'alvo';
};

export type Problema = {nivel: 'erro' | 'aviso'; acao: number | null; mensagem: string};

export type Simulacao = {
  inicial: Estado;
  passos: Passo[];
  problemas: Problema[];
  duracaoMinima: number;
};

export const INTRO_MESA = 1.0; // segundos para a mesa se montar antes da primeira ação
const FOLGA_FINAL = 0.9;

export const DURACAO_ACAO: Record<TipoAcao, number> = {
  comprar: 1.6,
  jogar_no_banco: 1.5,
  evoluir: 1.9,
  ligar_energia: 1.6,
  jogar_treinador: 2.3,
  buscar: 2.3,
  descartar: 1.3,
  recuar: 1.7,
  atacar: 2.9,
  dano: 1.1,
  nocaute: 2.0,
  promover: 1.3,
  pegar_premio: 1.7,
  fim_de_turno: 1.3,
  pausa: 1.0,
};

const NOME_LADO: Record<LadoId, string> = {eu: 'você', oponente: 'o oponente'};
// "de você" não existe: "sua mão", "a mão do oponente".
const posse = (lado: LadoId, coisa: 'mão' | 'deck' | 'banco' | 'vez'): string => {
  const feminino = coisa === 'mão' || coisa === 'vez';
  if (lado === 'eu') return `${feminino ? 'a sua' : 'o seu'} ${coisa}`;
  return `${feminino ? 'a' : 'o'} ${coisa} do oponente`;
};
const outro = (l: LadoId): LadoId => (l === 'eu' ? 'oponente' : 'eu');

export const topo = (p: Poke): Inst => p.pilha[p.pilha.length - 1];

// Dano "70", "10+", "30×" -> número base e se é variável.
export const lerDano = (texto: string): {base: number; variavel: boolean} => {
  const m = texto.match(/\d+/);
  return {base: m ? Number(m[0]) : 0, variavel: /[+×x\-]/i.test(texto)};
};

// Marcadores de 100/50/10 para um total de dano.
export const marcadores = (dano: number): number[] => {
  const lista: number[] = [];
  let resto = Math.max(0, Math.round(dano / 10) * 10);
  for (const valor of [100, 50, 10]) {
    while (resto >= valor) {
      lista.push(valor);
      resto -= valor;
    }
  }
  return lista;
};

// O custo do ataque está pago pelas energias ligadas?
export const custoPago = (custo: string[], fornecidas: string[]): boolean => {
  const sobra = [...fornecidas];
  for (const tipo of custo.filter((c) => c !== 'Colorless')) {
    const i = sobra.indexOf(tipo);
    if (i === -1) return false;
    sobra.splice(i, 1);
  }
  return sobra.length >= custo.filter((c) => c === 'Colorless').length;
};

export const simularMesa = (cena: CenaMesa, cartas: MapaCartas): Simulacao => {
  const problemas: Problema[] = [];
  let contador = 0;
  const novoUid = (lado: LadoId) => `${lado}-c${++contador}`;
  const erro = (acao: number | null, mensagem: string) => problemas.push({nivel: 'erro', acao, mensagem});
  const aviso = (acao: number | null, mensagem: string) => problemas.push({nivel: 'aviso', acao, mensagem});

  const dados = (ref: string | null | undefined): CartaDados | undefined => (ref ? cartas[ref] : undefined);
  const nome = (ref: string | null | undefined) => dados(ref)?.nome ?? ref ?? 'carta desconhecida';
  const inst = (lado: LadoId, ref: string | null): Inst => ({uid: novoUid(lado), ref});

  // ---------- estado inicial ----------

  const montarPoke = (lado: LadoId, p: PokemonInicial, turno: number): Poke => {
    const o = typeof p === 'string' ? {carta: p} : p;
    const pilha = [...(o.evoluiu_de ?? []), o.carta].map((r) => inst(lado, r));
    for (const r of [...(o.evoluiu_de ?? []), o.carta]) {
      if (dados(r) && dados(r)!.supertipo !== 'Pokémon') erro(null, `Estado inicial: "${nome(r)}" não é um Pokémon.`);
    }
    for (const r of o.energias ?? []) {
      if (dados(r) && dados(r)!.supertipo !== 'Energy') erro(null, `Estado inicial: "${nome(r)}" não é uma Energia.`);
    }
    return {
      pid: pilha[0].uid,
      pilha,
      energias: (o.energias ?? []).map((r) => inst(lado, r)),
      ferramentas: (o.ferramentas ?? []).map((r) => inst(lado, r)),
      dano: o.dano ?? 0,
      entrouNoTurno: o.entrou_no_turno ?? Math.min(0, turno - 1),
      evoluiuNoTurno: null,
    };
  };

  const montarLado = (lado: LadoId, l: LadoInicial | undefined, turno: number): EstadoLado => {
    const fonte = l ?? {};
    const maoLista = Array.isArray(fonte.mao) ? fonte.mao : null;
    const qtdPremios = fonte.premios ?? 6;
    if ((fonte.banco ?? []).length > 5) erro(null, `Estado inicial: ${posse(lado, 'banco')} tem mais de 5 Pokémon.`);
    return {
      ativo: fonte.ativo ? montarPoke(lado, fonte.ativo, turno) : null,
      banco: (fonte.banco ?? []).map((p) => montarPoke(lado, p, turno)),
      mao: (maoLista ?? []).map((r) => inst(lado, r)),
      maoOculta: maoLista === null,
      maoQtd: maoLista ? maoLista.length : typeof fonte.mao === 'number' ? fonte.mao : 0,
      deck: fonte.deck ?? 40,
      descarte: (fonte.descarte ?? []).map((r) => inst(lado, r)),
      premios: Array.from({length: 6}, (_, i) => (i < qtdPremios ? {uid: `${lado}-premio-${i}`, ref: null} : null)),
    };
  };

  const ini = cena.estado;
  const vezCalculada: LadoId = ini.turno % 2 === 1 ? ini.quem_comecou : outro(ini.quem_comecou);
  if (ini.vez && ini.vez !== vezCalculada) {
    aviso(null, `Estado inicial: no turno ${ini.turno}, com ${NOME_LADO[ini.quem_comecou]} começando, seria ${posse(vezCalculada, 'vez')}.`);
  }
  const inicial: Estado = {
    turno: ini.turno,
    quemComecou: ini.quem_comecou,
    vez: ini.vez ?? vezCalculada,
    eu: montarLado('eu', ini.eu, ini.turno),
    oponente: montarLado('oponente', ini.oponente, ini.turno),
    estadio: ini.estadio ? {inst: inst('eu', ini.estadio), dono: 'eu'} : null,
    noTurno: {energia: false, apoiador: false, estadio: false, recuou: false, atacou: false},
  };
  if (!inicial.eu.ativo) erro(null, 'Estado inicial: você precisa ter um Pokémon Ativo.');

  // ---------- ajudantes das ações ----------

  const primeiroTurnoDe = (e: Estado, lado: LadoId) => (lado === e.quemComecou ? e.turno === 1 : e.turno === 2);

  const acharAlvo = (e: Estado, texto: string | undefined, ladoPadrao: LadoId): {lado: LadoId; poke: Poke} | null => {
    if (!texto) return null;
    let t = texto.trim().toLowerCase();
    let lado = ladoPadrao;
    const prefixo = t.match(/^(eu|oponente)[.\s:]+/);
    if (prefixo) {
      lado = prefixo[1] as LadoId;
      t = t.slice(prefixo[0].length);
    }
    if (t === 'ativo') return e[lado].ativo ? {lado, poke: e[lado].ativo!} : null;
    const m = t.match(/^banco[\s:\-]*(\d)$/);
    if (m) {
      const poke = e[lado].banco[Number(m[1]) - 1];
      return poke ? {lado, poke} : null;
    }
    return null;
  };

  // Tira a carta da mão. Com a mão escondida (oponente), a carta surge "de fora".
  const tirarDaMao = (e: Estado, lado: LadoId, ref: string, n: number): {inst: Inst; origem: Origem} => {
    const l = e[lado];
    if (l.maoOculta) {
      if (l.maoQtd <= 0) erro(n, `Não há carta em ${posse(lado, 'mão')} para jogar "${nome(ref)}".`);
      l.maoQtd = Math.max(0, l.maoQtd - 1);
      return {inst: inst(lado, ref), origem: 'fora'};
    }
    const i = l.mao.findIndex((c) => c.ref === ref);
    if (i === -1) {
      erro(n, `"${nome(ref)}" não está em ${posse(lado, 'mão')} neste momento.`);
      return {inst: inst(lado, ref), origem: 'fora'};
    }
    return {inst: l.mao.splice(i, 1)[0], origem: 'mao'};
  };

  const energiasFornecidas = (p: Poke) => p.energias.map((en) => dados(en.ref)?.fornece ?? 'Colorless');

  // ---------- simulação ----------

  const passos: Passo[] = [];
  let estado = inicial;
  let cursor = INTRO_MESA;
  const ACOES_DE_TURNO: TipoAcao[] = ['jogar_no_banco', 'evoluir', 'ligar_energia', 'jogar_treinador', 'recuar', 'atacar'];
  const LIBERADAS_APOS_ATAQUE: TipoAcao[] = ['dano', 'nocaute', 'promover', 'pegar_premio', 'fim_de_turno', 'pausa'];

  cena.acoes.forEach((acao, i) => {
    const n = i + 1;
    const antes = estado;
    const e: Estado = structuredClone(estado);
    const lado: LadoId = acao.lado ?? (acao.acao === 'promover' && !e[outro(e.vez)].ativo ? outro(e.vez) : e.vez);
    const L = e[lado];
    const passo: Passo = {
      indice: i,
      acao,
      tipo: acao.acao,
      lado,
      inicio: 0,
      duracao: 0,
      antes,
      depois: e,
      uids: [],
      origem: null,
    };

    if (ACOES_DE_TURNO.includes(acao.acao) && lado !== e.vez) {
      erro(n, `Não é ${posse(lado, 'vez')}: o turno ${e.turno} é ${posse(e.vez, 'vez')}.`);
    }
    if (e.noTurno.atacou && !LIBERADAS_APOS_ATAQUE.includes(acao.acao)) {
      erro(n, `Depois de atacar o turno acaba: "${acao.acao}" não pode vir depois do ataque no mesmo turno.`);
    }

    switch (acao.acao) {
      case 'comprar': {
        const refs = acao.cartas ?? (acao.carta ? [acao.carta] : []);
        const qtd = acao.quantidade ?? (refs.length || 1);
        if (L.deck < qtd) erro(n, `${posse(lado, 'deck')} tem ${L.deck} carta(s) e a ação compra ${qtd}.`);
        L.deck = Math.max(0, L.deck - qtd);
        if (L.maoOculta) {
          L.maoQtd += qtd;
        } else {
          if (refs.length < qtd) erro(n, 'Informe em "carta" (ou "cartas") qual carta foi comprada, para ela aparecer na mão.');
          for (const r of refs) {
            const c = inst(lado, r);
            L.mao.push(c);
            passo.uids.push(c.uid);
          }
          passo.origem = 'deck';
        }
        break;
      }

      case 'jogar_no_banco': {
        const d = dados(acao.carta);
        const {inst: c, origem} = tirarDaMao(e, lado, acao.carta, n);
        if (d && d.supertipo !== 'Pokémon') erro(n, `"${d.nome}" não é um Pokémon e não pode ir para o banco.`);
        else if (d && !d.subtipos.includes('Basic')) erro(n, `Só Pokémon Básico vai direto para o banco: "${d.nome}" é ${d.subtipos.join(' / ')}.`);
        if (L.banco.length >= 5) erro(n, 'O banco já tem 5 Pokémon.');
        L.banco.push({pid: c.uid, pilha: [c], energias: [], ferramentas: [], dano: 0, entrouNoTurno: e.turno, evoluiuNoTurno: null});
        passo.uids = [c.uid];
        passo.origem = origem;
        passo.alvoPid = c.uid;
        break;
      }

      case 'evoluir': {
        const d = dados(acao.carta);
        const alvo = acharAlvo(e, acao.alvo, lado);
        const {inst: c, origem} = tirarDaMao(e, lado, acao.carta, n);
        passo.uids = [c.uid];
        passo.origem = origem;
        if (!alvo) {
          erro(n, `Evoluir: não achei o alvo "${acao.alvo}" (use "ativo" ou "banco:1" a "banco:5").`);
          break;
        }
        const base = dados(topo(alvo.poke).ref);
        if (alvo.lado !== lado) erro(n, 'Só dá para evoluir os seus próprios Pokémon.');
        if (d && d.supertipo !== 'Pokémon') erro(n, `"${d.nome}" não é um Pokémon.`);
        if (d && base && d.evoluiDe !== base.nome) {
          erro(n, `"${d.nome}" evolui de ${d.evoluiDe ?? '(nada: é Básico)'}, não de ${base.nome}.`);
        }
        if (primeiroTurnoDe(e, lado)) erro(n, `Ninguém evolui no seu primeiro turno do jogo (turno ${e.turno}).`);
        if (alvo.poke.entrouNoTurno >= e.turno) erro(n, `${base?.nome ?? 'Esse Pokémon'} entrou em jogo neste turno e não pode evoluir agora.`);
        if (alvo.poke.evoluiuNoTurno === e.turno) erro(n, `${base?.nome ?? 'Esse Pokémon'} já evoluiu neste turno.`);
        alvo.poke.pilha.push(c);
        alvo.poke.evoluiuNoTurno = e.turno;
        passo.alvoPid = alvo.poke.pid;
        break;
      }

      case 'ligar_energia': {
        const d = dados(acao.carta);
        const alvo = acharAlvo(e, acao.alvo, lado);
        const {inst: c, origem} = tirarDaMao(e, lado, acao.carta, n);
        passo.uids = [c.uid];
        passo.origem = origem;
        if (d && d.supertipo !== 'Energy') erro(n, `"${d.nome}" não é uma carta de Energia.`);
        if (e.noTurno.energia) erro(n, 'Só pode ligar 1 Energia da mão por turno, e este turno já teve uma.');
        e.noTurno.energia = true;
        if (!alvo) {
          erro(n, `Ligar energia: não achei o alvo "${acao.alvo}" (use "ativo" ou "banco:1" a "banco:5").`);
          break;
        }
        if (alvo.lado !== lado) erro(n, 'A Energia da mão só pode ser ligada aos seus próprios Pokémon.');
        alvo.poke.energias.push(c);
        passo.alvoPid = alvo.poke.pid;
        break;
      }

      case 'jogar_treinador': {
        const d = dados(acao.carta);
        const {inst: c, origem} = tirarDaMao(e, lado, acao.carta, n);
        passo.uids = [c.uid];
        passo.origem = origem;
        if (d && d.supertipo !== 'Trainer') erro(n, `"${d.nome}" não é uma carta de Treinador.`);
        const sub = d?.subtipos ?? [];
        if (sub.includes('Supporter')) {
          passo.rotuloTreinador = 'APOIADOR';
          if (e.noTurno.apoiador) erro(n, 'Só pode jogar 1 Apoiador por turno, e este turno já teve um.');
          if (lado === e.quemComecou && e.turno === 1) erro(n, 'Quem começa o jogo não joga Apoiador no primeiro turno.');
          e.noTurno.apoiador = true;
        } else if (sub.includes('Stadium')) {
          passo.rotuloTreinador = 'ESTÁDIO';
          if (e.noTurno.estadio) erro(n, 'Só pode jogar 1 Estádio por turno, e este turno já teve um.');
          if (e.estadio && dados(e.estadio.inst.ref)?.nome === d?.nome) erro(n, `Já existe um ${d?.nome} em jogo: não dá para jogar outro Estádio com o mesmo nome.`);
          e.noTurno.estadio = true;
        } else if (sub.includes('Pokémon Tool')) {
          passo.rotuloTreinador = 'FERRAMENTA';
        } else {
          passo.rotuloTreinador = 'ITEM';
        }

        if (passo.rotuloTreinador === 'ESTÁDIO') {
          if (e.estadio) e[e.estadio.dono].descarte.push(e.estadio.inst);
          e.estadio = {inst: c, dono: lado};
          passo.destinoTreinador = 'estadio';
        } else if (passo.rotuloTreinador === 'FERRAMENTA') {
          const alvo = acharAlvo(e, acao.alvo, lado);
          if (!alvo) {
            erro(n, `Ferramenta precisa de um alvo ("ativo" ou "banco:1" a "banco:5"); recebi "${acao.alvo ?? ''}".`);
            L.descarte.push(c);
            passo.destinoTreinador = 'descarte';
          } else {
            if (alvo.poke.ferramentas.length > 0) erro(n, 'Esse Pokémon já tem uma Ferramenta ligada.');
            alvo.poke.ferramentas.push(c);
            passo.alvoPid = alvo.poke.pid;
            passo.destinoTreinador = 'alvo';
          }
        } else {
          L.descarte.push(c);
          passo.destinoTreinador = 'descarte';
        }
        break;
      }

      case 'buscar': {
        if (L.deck < acao.cartas.length) erro(n, `O deck tem ${L.deck} carta(s) e a ação busca ${acao.cartas.length}.`);
        L.deck = Math.max(0, L.deck - acao.cartas.length);
        if (L.maoOculta) {
          L.maoQtd += acao.cartas.length;
        } else {
          for (const r of acao.cartas) {
            const c = inst(lado, r);
            L.mao.push(c);
            passo.uids.push(c.uid);
          }
          passo.origem = 'deck';
        }
        break;
      }

      case 'descartar': {
        for (const r of acao.cartas) {
          const {inst: c, origem} = tirarDaMao(e, lado, r, n);
          L.descarte.push(c);
          passo.uids.push(c.uid);
          passo.origem = origem;
        }
        break;
      }

      case 'recuar': {
        const destino = acharAlvo(e, acao.para, lado);
        if (e.noTurno.recuou) erro(n, 'Só pode recuar 1 vez por turno.');
        e.noTurno.recuou = true;
        if (!L.ativo || !destino || destino.poke === L.ativo) {
          erro(n, `Recuar: informe em "para" o Pokémon do banco que sobe (ex.: "banco:1"); recebi "${acao.para}".`);
          break;
        }
        const ativo = L.ativo;
        const custo = dados(topo(ativo).ref)?.custoRecuo ?? 0;
        if (ativo.energias.length < custo) {
          erro(n, `${nome(topo(ativo).ref)} tem custo de recuo ${custo} e só ${ativo.energias.length} Energia(s) ligada(s).`);
        }
        const pagar: Inst[] = [];
        for (const r of acao.descartar ?? []) {
          const j = ativo.energias.findIndex((en) => en.ref === r);
          if (j === -1) erro(n, `Recuar: a Energia "${nome(r)}" não está ligada ao Ativo.`);
          else pagar.push(ativo.energias.splice(j, 1)[0]);
        }
        while (pagar.length < custo && ativo.energias.length > 0) pagar.push(ativo.energias.shift()!);
        L.descarte.push(...pagar);
        const posicao = L.banco.indexOf(destino.poke);
        L.banco[posicao] = ativo;
        L.ativo = destino.poke;
        passo.uids = pagar.map((c) => c.uid);
        passo.alvoPid = destino.poke.pid;
        break;
      }

      case 'atacar': {
        const atacante = L.ativo;
        const alvo = acharAlvo(e, acao.alvo ?? 'ativo', outro(lado));
        if (lado === e.quemComecou && e.turno === 1) erro(n, 'Quem começa o jogo não ataca no primeiro turno.');
        e.noTurno.atacou = true;
        if (!atacante) {
          erro(n, `${NOME_LADO[lado]} não tem Pokémon Ativo para atacar.`);
          break;
        }
        const d = dados(topo(atacante).ref);
        const ataque = d?.ataques.find((a) => a.nome.toLowerCase() === acao.ataque.trim().toLowerCase());
        passo.atacantePid = atacante.pid;
        passo.nomeAtaque = ataque?.nome ?? acao.ataque;
        if (d && !ataque) {
          erro(n, `${d.nome} (${d.colecao} ${d.numero}) não tem o ataque "${acao.ataque}". Ataques na API: ${d.ataques.map((a) => `${a.nome} (${a.dano || 'sem dano'})`).join(', ') || 'nenhum'}.`);
        }
        if (ataque && !custoPago(ataque.custo, energiasFornecidas(atacante))) {
          erro(n, `${d!.nome} não tem energia para ${ataque.nome}: custa [${ataque.custo.join(', ')}] e tem [${energiasFornecidas(atacante).join(', ') || 'nada'}].`);
        }
        let dano = 0;
        if (acao.dano !== undefined) {
          dano = acao.dano;
        } else if (ataque) {
          const lido = lerDano(ataque.dano);
          dano = lido.base;
          if (lido.variavel) aviso(n, `${ataque.nome} tem dano variável ("${ataque.dano}"). Usei ${lido.base}; informe "dano" na ação se for outro valor.`);
          const def = alvo ? dados(topo(alvo.poke).ref) : undefined;
          const noAtivo = alvo && alvo.poke === e[alvo.lado].ativo;
          if (dano > 0 && def && d && noAtivo) {
            if (def.fraquezas.some((f) => d.tipos.includes(f.tipo))) {
              dano *= 2;
              aviso(n, `${def.nome} tem fraqueza a ${d.tipos.join('/')}: o dano de ${ataque.nome} dobrou para ${dano}.`);
            } else if (def.resistencias.some((f) => d.tipos.includes(f.tipo))) {
              dano = Math.max(0, dano - 30);
              aviso(n, `${def.nome} tem resistência a ${d.tipos.join('/')}: o dano de ${ataque.nome} caiu para ${dano}.`);
            }
          }
        }
        passo.dano = dano;
        if (alvo) {
          alvo.poke.dano += dano;
          passo.defensorPid = alvo.poke.pid;
        } else {
          erro(n, 'Atacar: o alvo não existe (o oponente precisa de um Pokémon Ativo).');
        }
        break;
      }

      case 'dano': {
        const alvo = acharAlvo(e, acao.alvo, lado);
        if (!alvo) {
          erro(n, `Dano: não achei o alvo "${acao.alvo}" (ex.: "oponente.ativo").`);
          break;
        }
        alvo.poke.dano += acao.valor;
        passo.alvoPid = alvo.poke.pid;
        passo.dano = acao.valor;
        break;
      }

      case 'nocaute': {
        const alvo = acharAlvo(e, acao.alvo, outro(lado));
        if (!alvo) {
          erro(n, `Nocaute: não achei o alvo "${acao.alvo}" (ex.: "oponente.ativo").`);
          break;
        }
        const d = dados(topo(alvo.poke).ref);
        if (d?.hp && alvo.poke.dano < d.hp) aviso(n, `${d.nome} tem ${d.hp} de HP e só ${alvo.poke.dano} de dano: ainda não seria nocaute.`);
        const dono = e[alvo.lado];
        dono.descarte.push(...alvo.poke.pilha, ...alvo.poke.energias, ...alvo.poke.ferramentas);
        if (dono.ativo === alvo.poke) dono.ativo = null;
        else dono.banco.splice(dono.banco.indexOf(alvo.poke), 1);
        passo.alvoPid = alvo.poke.pid;
        passo.uids = [...alvo.poke.pilha, ...alvo.poke.energias, ...alvo.poke.ferramentas].map((c) => c.uid);
        break;
      }

      case 'promover': {
        const poke = L.banco[acao.banco - 1];
        if (L.ativo) erro(n, `${NOME_LADO[lado]} já tem um Pokémon Ativo: "promover" só vale depois de um nocaute.`);
        if (!poke) {
          erro(n, `Promover: não existe Pokémon no banco:${acao.banco} (${posse(lado, 'banco')}).`);
          break;
        }
        L.banco.splice(acao.banco - 1, 1);
        L.ativo = poke;
        passo.alvoPid = poke.pid;
        break;
      }

      case 'pegar_premio': {
        const refs = acao.cartas ?? (acao.carta ? [acao.carta] : [null]);
        for (const r of refs) {
          const pos = L.premios.findIndex((p) => p !== null);
          if (pos === -1) {
            erro(n, `${NOME_LADO[lado]} não tem mais cartas de Prêmio.`);
            break;
          }
          const premio = L.premios[pos]!;
          L.premios[pos] = null;
          if (L.maoOculta) {
            L.maoQtd += 1;
          } else {
            if (r === null) erro(n, 'Informe em "carta" qual carta saiu do Prêmio, para ela virar e ir para a mão.');
            L.mao.push({uid: premio.uid, ref: r});
          }
          passo.uids.push(premio.uid);
        }
        passo.origem = 'premio';
        break;
      }

      case 'fim_de_turno': {
        e.turno += 1;
        e.vez = outro(e.vez);
        e.noTurno = {energia: false, apoiador: false, estadio: false, recuou: false, atacou: false};
        break;
      }

      case 'pausa':
        break;

      default: {
        const desconhecida = (acao as {acao: string}).acao;
        erro(n, `Ação desconhecida: "${desconhecida}".`);
      }
    }

    // tempo
    const extra = passo.uids.length > 1 && (acao.acao === 'comprar' || acao.acao === 'buscar') ? (passo.uids.length - 1) * 0.2 : 0;
    const duracao = acao.duracao ?? (DURACAO_ACAO[acao.acao] ?? 1.5) + extra;
    const inicio = acao.em ?? cursor;
    if (inicio < cursor - 0.05) {
      aviso(n, `Começa em ${inicio.toFixed(2)}s, antes de a ação anterior terminar (${cursor.toFixed(2)}s): as animações vão se atropelar.`);
    }
    passo.inicio = inicio;
    passo.duracao = duracao;
    cursor = inicio + duracao;

    passos.push(passo);
    estado = e;
  });

  // Pokémon com dano suficiente para nocaute que ficou em jogo.
  for (const lado of ['eu', 'oponente'] as LadoId[]) {
    for (const p of [estado[lado].ativo, ...estado[lado].banco]) {
      if (!p) continue;
      const d = dados(topo(p).ref);
      if (d?.hp && p.dano >= d.hp) {
        aviso(null, `${d.nome} (${lado === 'eu' ? 'seu' : 'do oponente'}) termina a cena com ${p.dano} de dano e ${d.hp} de HP: faltou a ação "nocaute".`);
      }
    }
  }

  const duracaoMinima = cursor + FOLGA_FINAL;
  if (cena.duracao !== undefined && cena.duracao < cursor) {
    aviso(null, `A cena tem ${cena.duracao}s, mas as ações só terminam em ${cursor.toFixed(1)}s: o fim vai ser cortado.`);
  }
  return {inicial, passos, problemas, duracaoMinima};
};

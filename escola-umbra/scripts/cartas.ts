// Busca as cartas reais na Pokémon TCG API, com cache em public/cards/.
// Nada aqui inventa dado de carta: o que a API não tiver vira erro.

import fs from 'node:fs';
import path from 'node:path';
import type {CartaDados, DefCarta, MapaCartas, Roteiro} from '../src/tipos';
import {MARCAS_STANDARD} from '../src/tema';

const API = 'https://api.pokemontcg.io/v2/cards';
export const RAIZ = path.resolve(import.meta.dirname, '..');
const PASTA = path.join(RAIZ, 'public', 'cards');
const ARQUIVO_ESCOLHAS = path.join(PASTA, '_escolhas.json');

export class ErroCarta extends Error {}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A API costuma responder 500/429 de vez em quando. Tenta de novo com espera crescente.
const buscarComTentativas = async (url: string, tentativas = 8): Promise<Response> => {
  const cabecalhos: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) cabecalhos['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
  let ultimo = '';
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url, {headers: cabecalhos, signal: AbortSignal.timeout(60_000)});
      if (resposta.ok) return resposta;
      ultimo = `HTTP ${resposta.status}`;
      if (resposta.status === 404 || resposta.status === 400) break;
    } catch (erro) {
      ultimo = erro instanceof Error ? erro.message : String(erro);
    }
    await esperar(Math.min(1000 * 2 ** i, 12_000));
  }
  throw new ErroCarta(`Não consegui acessar ${new URL(url).host} (${ultimo}). Endereço: ${url}`);
};

type CartaApi = {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  attacks?: {name: string; cost?: string[]; damage?: string; text?: string}[];
  abilities?: {name: string; text: string}[];
  rules?: string[];
  retreatCost?: string[];
  weaknesses?: {type: string; value: string}[];
  resistances?: {type: string; value: string}[];
  set: {id: string; name: string; releaseDate: string};
  number: string;
  regulationMark?: string;
  rarity?: string;
  images: {small: string; large: string};
};

const consultar = async (q: string): Promise<CartaApi[]> => {
  const url = `${API}?q=${encodeURIComponent(q)}&orderBy=-set.releaseDate&pageSize=250`;
  const resposta = await buscarComTentativas(url);
  const corpo = (await resposta.json()) as {data: CartaApi[]};
  return corpo.data ?? [];
};

const ehEnergiaBasica = (c: CartaApi) => c.supertype === 'Energy' && (c.subtypes ?? []).includes('Basic');

// Standard pela marca de regulamento (o campo "legalities" da API não acompanha a rotação).
const noStandard = (c: CartaApi) =>
  ehEnergiaBasica(c) || (c.regulationMark !== undefined && MARCAS_STANDARD.includes(c.regulationMark));

const numeroOrdenavel = (n: string) => {
  const m = n.match(/\d+/);
  return m ? Number(m[0]) : 9999;
};

const rotulo = (c: CartaApi) => `${c.set.name} ${c.number} (${c.id}, marca ${c.regulationMark ?? 'sem marca'})`;

const tipoDaEnergia = (c: CartaApi, def: DefCarta): string | null => {
  if (c.supertype !== 'Energy') return null;
  if (def.fornece) return def.fornece;
  const m = c.name.match(/^(?:Basic )?(\w+) Energy$/);
  const tipos = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon'];
  if (m && tipos.includes(m[1])) return m[1];
  return 'Colorless';
};

const converter = (ref: string, c: CartaApi, def: DefCarta): CartaDados => ({
  ref,
  id: c.id,
  nome: c.name,
  supertipo: c.supertype as CartaDados['supertipo'],
  subtipos: c.subtypes ?? [],
  hp: c.hp ? Number(c.hp) : null,
  tipos: c.types ?? [],
  evoluiDe: c.evolvesFrom ?? null,
  ataques: (c.attacks ?? []).map((a) => ({nome: a.name, custo: a.cost ?? [], dano: a.damage ?? '', texto: a.text ?? ''})),
  habilidades: (c.abilities ?? []).map((a) => ({nome: a.name, texto: a.text})),
  regras: c.rules ?? [],
  custoRecuo: (c.retreatCost ?? []).length,
  fraquezas: (c.weaknesses ?? []).map((f) => ({tipo: f.type, valor: f.value})),
  resistencias: (c.resistances ?? []).map((f) => ({tipo: f.type, valor: f.value})),
  colecao: c.set.name,
  colecaoId: c.set.id,
  numero: c.number,
  marca: c.regulationMark ?? null,
  raridade: c.rarity ?? null,
  fornece: tipoDaEnergia(c, def),
  imagem: `cards/${c.id}.png`,
});

export type Escolha = {ref: string; usada: string; motivo: string; outras: string[]; aviso?: string};

// Escolhe a versão da carta. Devolve a carta e uma nota explicando a escolha.
const escolher = async (ref: string, def: DefCarta): Promise<{carta: CartaApi; escolha: Escolha}> => {
  if (def.id) {
    const achadas = await consultar(`id:${def.id}`);
    if (achadas.length === 0) throw new ErroCarta(`Carta "${ref}": a API não tem o id "${def.id}".`);
    return {carta: achadas[0], escolha: {ref, usada: rotulo(achadas[0]), motivo: 'id informado no roteiro', outras: []}};
  }

  const nome = def.nome.replace(/"/g, '');
  const candidatas = (await consultar(`name:"${nome}"`)).filter((c) => c.name.toLowerCase() === nome.toLowerCase());
  if (candidatas.length === 0) {
    throw new ErroCarta(
      `Carta "${def.nome}": a API não encontrou nenhuma carta com esse nome exato (o nome precisa estar em inglês, como na API).`,
    );
  }

  if (def.set !== undefined || def.numero !== undefined) {
    const alvoSet = def.set?.toLowerCase();
    const alvoNumero = def.numero !== undefined ? String(def.numero).toLowerCase() : undefined;
    const exatas = candidatas.filter(
      (c) =>
        (alvoSet === undefined || c.set.name.toLowerCase() === alvoSet || c.set.id.toLowerCase() === alvoSet) &&
        (alvoNumero === undefined || c.number.toLowerCase() === alvoNumero),
    );
    if (exatas.length === 0) {
      throw new ErroCarta(
        `Carta "${def.nome}" não existe em ${def.set ?? '(qualquer coleção)'} com número ${def.numero ?? '(qualquer)'}.\n` +
          `  Versões que a API tem: ${candidatas.slice(0, 12).map(rotulo).join('; ')}`,
      );
    }
    const carta = [...exatas].sort((a, b) => numeroOrdenavel(a.number) - numeroOrdenavel(b.number))[0];
    const aviso =
      !noStandard(carta) && !def.fora_do_standard
        ? `"${def.nome}" de ${rotulo(carta)} NÃO está no Standard atual (marcas ${MARCAS_STANDARD.join(', ')}).`
        : undefined;
    return {
      carta,
      escolha: {ref, usada: rotulo(carta), motivo: 'coleção e número informados no roteiro', outras: [], aviso},
    };
  }

  // Só o nome: fica com a versão comum mais recente que está no Standard atual.
  let legais = candidatas.filter(noStandard);
  if (legais.length === 0) {
    if (!def.fora_do_standard) {
      throw new ErroCarta(
        `Carta "${def.nome}": nenhuma versão está no Standard atual (marcas ${MARCAS_STANDARD.join(', ')}).\n` +
          `  Versões que a API tem: ${candidatas.slice(0, 12).map(rotulo).join('; ')}\n` +
          `  Se quiser usar mesmo assim, informe "set" e "numero" e ponha "fora_do_standard": true na carta.`,
      );
    }
    legais = candidatas;
  }
  const ordenadas = [...legais].sort((a, b) => {
    // Energia básica: prefere a coleção de energias (sve), que tem a arte normal.
    if (ehEnergiaBasica(a) && ehEnergiaBasica(b)) {
      const pa = a.set.id === 'sve' ? 0 : 1;
      const pb = b.set.id === 'sve' ? 0 : 1;
      if (pa !== pb) return pa - pb;
    }
    if (a.set.releaseDate !== b.set.releaseDate) return a.set.releaseDate < b.set.releaseDate ? 1 : -1;
    return numeroOrdenavel(a.number) - numeroOrdenavel(b.number);
  });
  const carta = ordenadas[0];
  return {
    carta,
    escolha: {
      ref,
      usada: rotulo(carta),
      motivo: ordenadas.length > 1 ? 'versão comum mais recente no Standard atual' : 'única versão no Standard atual',
      outras: ordenadas.slice(1, 8).map(rotulo),
    },
  };
};

const baixarImagem = async (carta: CartaApi) => {
  const destino = path.join(PASTA, `${carta.id}.png`);
  if (fs.existsSync(destino) && fs.statSync(destino).size > 10_000) return false;
  const resposta = await buscarComTentativas(carta.images.large);
  const bytes = Buffer.from(await resposta.arrayBuffer());
  if (bytes.length < 10_000) throw new ErroCarta(`Imagem de ${carta.name} veio vazia (${carta.images.large}).`);
  fs.writeFileSync(destino, bytes);
  return true;
};

// Todas as cartas citadas no roteiro, em qualquer cena.
export const coletarRefs = (roteiro: Roteiro): string[] => {
  const refs = new Set<string>();
  const add = (r?: string | null) => {
    if (typeof r === 'string' && r.trim()) refs.add(r);
  };
  const addPokemon = (p: unknown) => {
    if (!p) return;
    if (typeof p === 'string') return add(p);
    const o = p as {carta: string; evoluiu_de?: string[]; energias?: string[]; ferramentas?: string[]};
    add(o.carta);
    [...(o.evoluiu_de ?? []), ...(o.energias ?? []), ...(o.ferramentas ?? [])].forEach(add);
  };
  (roteiro.capa?.cartas ?? []).forEach(add);
  for (const cena of roteiro.cenas) {
    if (cena.tipo === 'carta_destaque') add(cena.carta);
    if (cena.tipo === 'comparacao') {
      for (const item of [...cena.bons, ...cena.ruins]) {
        if (typeof item === 'string') add(item);
        else add(item.carta);
      }
    }
    if (cena.tipo === 'mesa') {
      add(cena.estado.estadio);
      for (const lado of [cena.estado.eu, cena.estado.oponente]) {
        if (!lado) continue;
        addPokemon(lado.ativo);
        (lado.banco ?? []).forEach(addPokemon);
        if (Array.isArray(lado.mao)) lado.mao.forEach(add);
        (lado.descarte ?? []).forEach(add);
      }
      for (const acao of cena.acoes) {
        const a = acao as {carta?: string; cartas?: string[]; descartar?: string[]};
        add(a.carta);
        (a.cartas ?? []).forEach(add);
        (a.descartar ?? []).forEach(add);
      }
    }
  }
  return [...refs];
};

type Cache = Record<string, {assinatura: string; carta: CartaApi; escolha: Escolha}>;

const lerCache = (): Cache => {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_ESCOLHAS, 'utf8')) as Cache;
  } catch {
    return {};
  }
};

export const resolverCartas = async (
  roteiro: Roteiro,
  opcoes: {atualizar?: boolean; log?: (m: string) => void} = {},
): Promise<{cartas: MapaCartas; escolhas: Escolha[]}> => {
  const log = opcoes.log ?? (() => undefined);
  fs.mkdirSync(PASTA, {recursive: true});
  const cache = opcoes.atualizar ? {} : lerCache();
  const cartas: MapaCartas = {};
  const escolhas: Escolha[] = [];

  for (const ref of coletarRefs(roteiro)) {
    const def: DefCarta = roteiro.cartas?.[ref] ?? {nome: ref};
    const assinatura = JSON.stringify([def, MARCAS_STANDARD]);
    let entrada = cache[ref]?.assinatura === assinatura ? cache[ref] : undefined;
    if (!entrada) {
      log(`  buscando na API: ${def.nome}`);
      const {carta, escolha} = await escolher(ref, def);
      entrada = {assinatura, carta, escolha};
      cache[ref] = entrada;
      fs.writeFileSync(ARQUIVO_ESCOLHAS, JSON.stringify(cache, null, 1));
    }
    if (await baixarImagem(entrada.carta)) log(`  imagem baixada: ${entrada.carta.id}.png`);
    cartas[ref] = converter(ref, entrada.carta, def);
    escolhas.push(entrada.escolha);

    const c = cartas[ref];
    if (c.supertipo === 'Pokémon' && (c.hp === null || Number.isNaN(c.hp))) {
      throw new ErroCarta(`A API não tem o HP de ${c.nome} (${c.id}). Não vou inventar: me diga como seguir.`);
    }
  }
  return {cartas, escolhas};
};

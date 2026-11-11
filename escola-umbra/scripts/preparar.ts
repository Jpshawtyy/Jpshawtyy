// Lê o roteiro, confere a estrutura, busca as cartas, simula as mesas e monta as props do vídeo.

import fs from 'node:fs';
import path from 'node:path';
import type {Audio, Cena, PalavraFalada, PropsAula, Roteiro} from '../src/tipos';
import {RAIZ, resolverCartas, type Escolha} from './cartas';
import {simularMesa, type Problema} from '../src/mesa/motor';
import {completarLegendas, comoObjeto, legendasDaCena, planejar, temposDosItens, type Plano} from '../src/tempo';
import {AREA} from '../src/tema';
import {narrar, relatarNarracao, type Narracao} from './narracao';
import {lerConfigNarrador} from './narrador';
import {textoDaSerie} from '../src/componentes/Moldura';

export type Achado = {nivel: 'erro' | 'aviso'; onde: string; mensagem: string};

export type Preparo = {
  nome: string; // "aula-01"
  roteiro: Roteiro;
  props: PropsAula;
  plano: Plano;
  achados: Achado[];
  escolhas: Escolha[];
  narracao?: Narracao; // quando o roteiro usa "narracao": "auto"
};

const TIPOS = ['gancho', 'carta_destaque', 'lista', 'piramide', 'comparacao', 'riscado', 'mesa', 'cta'];
const EMOJI = /\p{Extended_Pictographic}/u;

const textosDe = (valor: unknown, caminho: string, saida: {caminho: string; texto: string}[]) => {
  if (typeof valor === 'string') saida.push({caminho, texto: valor});
  else if (Array.isArray(valor)) valor.forEach((v, i) => textosDe(v, `${caminho}[${i + 1}]`, saida));
  else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) textosDe(v, caminho ? `${caminho}.${k}` : k, saida);
  }
};

const conferirEstrutura = (r: Roteiro, achados: Achado[]) => {
  const erro = (onde: string, mensagem: string) => achados.push({nivel: 'erro', onde, mensagem});
  if (!r.serie) erro('roteiro', 'Falta "serie" (nome da série).');
  if (typeof r.numero !== 'number') erro('roteiro', 'Falta "numero" (número da aula).');
  if (!r.titulo_capa) erro('roteiro', 'Falta "titulo_capa" (a palavra grande da capa).');
  if (!Array.isArray(r.cenas) || r.cenas.length === 0) {
    erro('roteiro', 'Falta a lista "cenas".');
    return;
  }
  r.cenas.forEach((c, i) => {
    const onde = `cena ${i + 1} (${c.tipo})`;
    if (!TIPOS.includes(c.tipo)) return erro(onde, `Tipo de cena desconhecido: "${c.tipo}". Use um de: ${TIPOS.join(', ')}.`);
    if (c.duracao !== undefined && (typeof c.duracao !== 'number' || c.duracao <= 0)) erro(onde, '"duracao" precisa ser um número de segundos maior que zero.');
    if (c.tipo === 'gancho' && !c.texto) erro(onde, 'Falta "texto".');
    if (c.tipo === 'carta_destaque' && !c.carta) erro(onde, 'Falta "carta".');
    if (c.tipo === 'lista' && !(c.itens?.length > 0)) erro(onde, 'Falta "itens".');
    if (c.tipo === 'piramide' && !(c.niveis?.length > 0)) erro(onde, 'Falta "niveis".');
    if (c.tipo === 'comparacao' && !(c.bons?.length > 0 && c.ruins?.length > 0)) erro(onde, 'Faltam "bons" e "ruins".');
    if (c.tipo === 'riscado' && !(c.itens?.length > 0)) erro(onde, 'Falta "itens".');
    if (c.tipo === 'mesa') {
      if (!c.estado?.eu) erro(onde, 'Falta "estado.eu" (a sua mesa no começo da cena).');
      if (typeof c.estado?.turno !== 'number') erro(onde, 'Falta "estado.turno" (1 = primeiro turno do jogo).');
      if (!['eu', 'oponente'].includes(c.estado?.quem_comecou)) erro(onde, 'Falta "estado.quem_comecou" ("eu" ou "oponente").');
      if (!Array.isArray(c.acoes)) erro(onde, 'Falta a lista "acoes".');
    }
  });
  if (r.cenas[0]?.tipo !== 'gancho') {
    achados.push({nivel: 'aviso', onde: 'cena 1', mensagem: 'A primeira cena não é um gancho: o vídeo pode não prender nos primeiros 0,5 s.'});
  }
  const textos: {caminho: string; texto: string}[] = [];
  textosDe(r, '', textos);
  for (const t of textos) {
    if (EMOJI.test(t.texto)) erro(t.caminho, `Tem emoji no texto ("${t.texto}"). A identidade da Escola Umbra não usa emoji.`);
  }
  const etiqueta = textoDaSerie(r.numero ?? 0, r.serie ?? '');
  if (etiqueta.length * 0.74 * 15 > AREA.largura - 80) {
    achados.push({nivel: 'aviso', onde: 'roteiro', mensagem: `A etiqueta "${etiqueta}" é comprida e vai ficar com letra pequena. Um nome de série mais curto lê melhor.`});
  }
};

// Momentos em que algo novo entra na tela, para conferir o ritmo.
const eventosDaCena = (cena: Cena, duracao: number, temposAcoes: number[]): number[] => {
  const eventos = [0, ...legendasDaCena(cena, duracao).map((l) => l.em)];
  if (cena.tipo === 'lista') eventos.push(...temposDosItens(cena.itens.map((i) => comoObjeto(i, 'texto')), duracao));
  if (cena.tipo === 'riscado') {
    const tempos = temposDosItens(cena.itens.map((i) => comoObjeto(i, 'texto')), duracao, 0.4, 1.2);
    eventos.push(...tempos, ...tempos.map((t) => t + 0.8));
  }
  if (cena.tipo === 'piramide') eventos.push(...temposDosItens(cena.niveis, duracao, 0.4, 0.8));
  if (cena.tipo === 'comparacao') eventos.push(0.3, 0.9, 1.5, 2.1);
  if (cena.tipo === 'gancho') eventos.push(0.3, 0.55);
  if (cena.tipo === 'carta_destaque') eventos.push(0.2, 0.7, 1.4, 2.4);
  if (cena.tipo === 'cta') eventos.push(0.2, 0.8, 1.6, 2.6);
  if (cena.tipo === 'mesa') eventos.push(...temposAcoes, ...temposAcoes.map((t) => t + 0.9));
  return [...new Set(eventos)].filter((t) => t < duracao).sort((a, b) => a - b);
};

const lerTranscricao = (arquivo: string): PalavraFalada[] => {
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as unknown;
  type W = {word?: string; palavra?: string; text?: string; start?: number; inicio?: number; end?: number; fim?: number};
  const converter = (w: W): PalavraFalada => ({
    palavra: (w.palavra ?? w.word ?? w.text ?? '').trim(),
    inicio: w.inicio ?? w.start ?? 0,
    fim: w.fim ?? w.end ?? 0,
  });
  if (Array.isArray(bruto)) return (bruto as W[]).map(converter);
  const o = bruto as {words?: W[]; segments?: {words?: W[]}[]};
  if (o.words) return o.words.map(converter);
  if (o.segments) return o.segments.flatMap((s) => (s.words ?? []).map(converter));
  throw new Error(`Não entendi o formato da transcrição em ${arquivo}.`);
};

// Copia o áudio para public/_audio/ (o Remotion só enxerga o que está em public/).
const prepararAudio = (audio: Audio | undefined, pastaRoteiro: string, achados: Achado[], rotulo: string) => {
  if (!audio) return null;
  const def = typeof audio === 'string' ? {arquivo: audio} : audio;
  const candidatos = [path.resolve(RAIZ, def.arquivo), path.resolve(pastaRoteiro, def.arquivo)];
  const origem = candidatos.find((c) => fs.existsSync(c));
  if (!origem) {
    achados.push({nivel: 'erro', onde: rotulo, mensagem: `Não achei o arquivo de áudio "${def.arquivo}".`});
    return null;
  }
  const destinoRel = `_audio/${rotulo}-${path.basename(origem)}`;
  fs.mkdirSync(path.join(RAIZ, 'public', '_audio'), {recursive: true});
  fs.copyFileSync(origem, path.join(RAIZ, 'public', destinoRel));
  let palavras: PalavraFalada[] | undefined;
  if (def.transcricao) {
    const t = [path.resolve(RAIZ, def.transcricao), path.resolve(pastaRoteiro, def.transcricao)].find((c) => fs.existsSync(c));
    if (!t) achados.push({nivel: 'erro', onde: rotulo, mensagem: `Não achei a transcrição "${def.transcricao}".`});
    else palavras = lerTranscricao(t);
  }
  return {arquivo: destinoRel, volume: def.volume, palavras};
};

export const preparar = async (
  caminho: string,
  opcoes: {guias?: boolean; atualizarCartas?: boolean; refazerNarracao?: boolean; log?: (m: string) => void} = {},
): Promise<Preparo> => {
  const log = opcoes.log ?? console.log;
  const arquivo = path.resolve(process.cwd(), caminho);
  if (!fs.existsSync(arquivo)) throw new Error(`Não achei o roteiro "${caminho}".`);
  let roteiro: Roteiro;
  try {
    roteiro = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as Roteiro;
  } catch (e) {
    throw new Error(`O roteiro "${caminho}" não é um JSON válido: ${e instanceof Error ? e.message : e}`);
  }
  const nome = path.basename(arquivo).replace(/\.json$/i, '');
  const achados: Achado[] = [];
  conferirEstrutura(roteiro, achados);
  if (achados.some((a) => a.nivel === 'erro')) {
    return {nome, roteiro, props: {roteiro, cartas: {}}, plano: {cenas: [], totalQuadros: 0, totalSegundos: 0}, achados, escolhas: []};
  }

  log('Cartas (Pokémon TCG API, com cache em public/cards/):');
  const {cartas, escolhas} = await resolverCartas(roteiro, {atualizar: opcoes.atualizarCartas, log});
  for (const e of escolhas) if (e.aviso) achados.push({nivel: 'aviso', onde: `carta "${e.ref}"`, mensagem: e.aviso});

  // narrador automático: fala as legendas e ajusta o tempo das cenas ao áudio
  let narracao: Narracao | undefined;
  if (roteiro.narracao === 'auto') {
    log('Narração:');
    narracao = await narrar(roteiro, cartas, nome, {log, forcar: opcoes.refazerNarracao});
    roteiro = narracao.roteiro;
  }

  // regras da mesa
  const temposPorCena = new Map<number, number[]>();
  roteiro.cenas.forEach((cena, i) => {
    if (cena.tipo !== 'mesa') return;
    const sim = simularMesa(cena, cartas);
    temposPorCena.set(i, sim.passos.map((p) => p.inicio));
    for (const p of sim.problemas as Problema[]) {
      achados.push({nivel: p.nivel, onde: `cena ${i + 1} (mesa)${p.acao ? `, ação ${p.acao} (${cena.acoes[p.acao - 1]?.acao})` : ''}`, mensagem: p.mensagem});
    }
  });

  const plano = planejar(roteiro, cartas);

  // duração total e ritmo
  if (plano.totalSegundos < 20 || plano.totalSegundos > 45) {
    achados.push({nivel: 'aviso', onde: 'roteiro', mensagem: `O vídeo tem ${plano.totalSegundos.toFixed(1)} s. O alvo do Reels é entre 20 e 45 s.`});
  }
  for (const c of plano.cenas) {
    const eventos = [...eventosDaCena(c.cena, c.duracao, temposPorCena.get(c.indice) ?? []), c.duracao];
    for (let i = 1; i < eventos.length; i++) {
      const vao = eventos[i] - eventos[i - 1];
      if (vao > 3.05) {
        achados.push({
          nivel: 'aviso',
          onde: `cena ${c.indice + 1} (${c.cena.tipo})`,
          mensagem: `Ritmo: ${vao.toFixed(1)} s sem nada novo entre ${eventos[i - 1].toFixed(1)} s e ${eventos[i].toFixed(1)} s da cena. O ideal é uma novidade a cada 1,5 a 3 s (encurte a cena ou ponha mais uma legenda).`,
        });
      }
    }
    for (const l of completarLegendas([...(c.cena.legenda ? [{texto: c.cena.legenda}] : []), ...(c.cena.legendas ?? [])], c.duracao)) {
      if (l.texto.replace(/\*/g, '').length > 58) {
        achados.push({nivel: 'aviso', onde: `cena ${c.indice + 1} (${c.cena.tipo})`, mensagem: `Legenda comprida ("${l.texto}"): pode passar de duas linhas. Até uns 55 caracteres lê bem.`});
      }
    }
  }

  // áudio
  const pastaRoteiro = path.dirname(arquivo);
  const audioNarracao = prepararAudio(roteiro.narracao, pastaRoteiro, achados, `${nome}-narracao`);
  const musica = prepararAudio(roteiro.musica, pastaRoteiro, achados, `${nome}-musica`);

  const props: PropsAula = {
    roteiro,
    cartas,
    audio: {
      narracao: audioNarracao?.arquivo,
      narracaoVolume: audioNarracao?.volume ?? 1,
      musica: musica?.arquivo,
      musicaVolume: musica?.volume ?? 0.15,
    },
    palavras: audioNarracao?.palavras,
    guias: opcoes.guias ?? false,
  };
  return {nome, roteiro, props, plano, achados, escolhas, narracao};
};

// Imprime o relatório. Devolve true se há erro que impede o render.
export const relatar = (p: Preparo): boolean => {
  if (p.escolhas.length > 0) {
    console.log('\nCartas usadas:');
    for (const e of p.escolhas) {
      console.log(`  - ${e.ref}: ${e.usada} [${e.motivo}]`);
      if (e.outras.length > 0) console.log(`      outras versões no Standard: ${e.outras.join('; ')}`);
    }
  }
  if (p.narracao) relatarNarracao(p.narracao, lerConfigNarrador().voz);
  if (p.plano.cenas.length > 0) {
    console.log('\nCenas:');
    for (const c of p.plano.cenas) {
      console.log(`  ${String(c.indice + 1).padStart(2)}. ${c.cena.tipo.padEnd(15)} ${c.inicio.toFixed(1).padStart(5)} s -> ${(c.inicio + c.duracao).toFixed(1).padStart(5)} s  (${c.duracao.toFixed(1)} s)`);
    }
    console.log(`  Total: ${p.plano.totalSegundos.toFixed(1)} s`);
  }
  const erros = p.achados.filter((a) => a.nivel === 'erro');
  const avisos = p.achados.filter((a) => a.nivel === 'aviso');
  if (avisos.length > 0) {
    console.log(`\nAVISOS (${avisos.length}):`);
    for (const a of avisos) console.log(`  - [${a.onde}] ${a.mensagem}`);
  }
  if (erros.length > 0) {
    console.log(`\nERROS (${erros.length}) - o roteiro quebra regra ou está incompleto:`);
    for (const a of erros) console.log(`  x [${a.onde}] ${a.mensagem}`);
  } else {
    console.log('\nRegras e estrutura: tudo certo.');
  }
  return erros.length > 0;
};

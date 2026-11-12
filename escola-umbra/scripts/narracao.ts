// Narração automática: fala as legendas do roteiro com o narrador fixo e ajusta o tempo das cenas ao áudio.
// Entra o roteiro com "narracao": "auto"; sai o roteiro com os tempos ajustados, o .mp3 e os tempos das palavras.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {Cena, Legenda, MapaCartas, PalavraFalada, Roteiro} from '../src/tipos';
import {comoObjeto, completarLegendas, planejar, temposDosItens} from '../src/tempo';
import {simularMesa} from '../src/mesa/motor';
import {quebrarPalavras} from '../src/componentes/Legenda';
import {RAIZ} from './cartas';
import {ErroNarrador, falar, ffmpeg, lerConfigNarrador, prepararNarrador, tratamentoDaVoz, type ConfigNarrador} from './narrador';

const PAUSA = 0.16; // respiro entre uma frase e a próxima
const FOLGA_FIM = 0.25; // respiro entre a última frase e a troca de cena
const ANTECIPA = 0.45; // o que entra na tela até 0,45 s antes de uma frase pertence a ela

export type FraseNarrada = {
  cena: number; // índice da cena
  em: number; // segundo dentro da cena
  inicio: number; // segundo no vídeo
  legenda: string | null;
  fala: string;
  duracao: number;
  esticou: number; // segundos acrescentados à cena para a frase caber
};

export type Narracao = {
  roteiro: Roteiro; // com os tempos ajustados e "narracao" apontando para o arquivo gerado
  frases: FraseNarrada[];
  arquivo: string; // caminho relativo à raiz do projeto
  reaproveitada: boolean;
};

const limpar = (t: string) => t.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

// Escreve no roteiro todos os tempos que estavam implícitos, para poder esticá-los depois.
const materializar = (roteiro: Roteiro, cartas: MapaCartas): Roteiro => {
  const r = structuredClone(roteiro);
  const plano = planejar(r, cartas);
  r.cenas.forEach((cena, i) => {
    const dur = plano.cenas[i].duracao;
    cena.duracao = dur;
    if (cena.tipo === 'lista') {
      const itens = cena.itens.map((x) => comoObjeto(x, 'texto'));
      const t = temposDosItens(itens, dur);
      cena.itens = itens.map((it, j) => ({...it, em: t[j]}));
    }
    if (cena.tipo === 'riscado') {
      const itens = cena.itens.map((x) => comoObjeto(x, 'texto'));
      const t = temposDosItens(itens, dur, 0.4, 1.2);
      cena.itens = itens.map((it, j) => ({...it, em: t[j], riscar_em: it.riscar_em ?? t[j] + 0.8}));
    }
    if (cena.tipo === 'piramide') {
      const t = temposDosItens(cena.niveis, dur, 0.4, 0.8);
      cena.niveis = cena.niveis.map((n, j) => ({...n, em: t[j]}));
    }
    const brutas: Legenda[] = [...(cena.legenda ? [{texto: cena.legenda}] : []), ...(cena.legendas ?? [])];
    delete cena.legenda;
    if (cena.tipo === 'mesa') {
      const sim = simularMesa(cena, cartas);
      cena.acoes = cena.acoes.map((a, j) => ({...a, em: sim.passos[j].inicio, duracao: sim.passos[j].duracao}));
      cena.legendas = brutas.map((l) => ({...l, em: l.em ?? 0.2}));
    } else {
      const prontas = completarLegendas(brutas, dur);
      cena.legendas = brutas.map((l, j) => ({...l, em: prontas[j].em, ate: prontas[j].ate}));
    }
    cena.falas = (cena.falas ?? []).map((f) => ({...f, em: f.em ?? 0.1}));

    // Lista, riscado ou pirâmide com uma legenda por item e sem tempos escritos à mão:
    // cada item entra junto com a frase dele (um instante antes da fala).
    const original = roteiro.cenas[i];
    const legendas = cena.legendas ?? [];
    if ((cena.tipo === 'lista' || cena.tipo === 'riscado') && (original.tipo === 'lista' || original.tipo === 'riscado')) {
      const semTempo = original.itens.every((it) => typeof it === 'string' || it.em === undefined);
      if (semTempo && legendas.length === cena.itens.length) {
        cena.itens.forEach((it, j) => {
          if (typeof it === 'string') return;
          const em = Math.max(0.1, legendas[j].em! - 0.2);
          it.em = em;
          if ('riscar_em' in it) it.riscar_em = em + 0.9;
        });
      }
    }
    if (cena.tipo === 'piramide' && original.tipo === 'piramide') {
      const semTempo = original.niveis.every((n) => n.em === undefined);
      if (semTempo && legendas.length === cena.niveis.length) {
        cena.niveis.forEach((n, j) => {
          n.em = Math.max(0.1, legendas[j].em! - 0.2);
        });
      }
    }
  });
  return r;
};

type FraseBruta = {cena: number; em: number; legenda: string | null; fala: string};

const frasesDaCena = (cena: Cena, indice: number): FraseBruta[] => {
  const lista: FraseBruta[] = [];
  for (const l of cena.legendas ?? []) {
    const fala = l.fala ?? limpar(l.texto);
    if (fala.trim()) lista.push({cena: indice, em: l.em!, legenda: l.texto, fala: fala.trim()});
  }
  for (const f of cena.falas ?? []) {
    if (f.texto.trim()) lista.push({cena: indice, em: f.em!, legenda: null, fala: f.texto.trim()});
  }
  if (cena.tipo === 'mesa') {
    for (const a of cena.acoes) {
      const fala = a.fala ?? (a.legenda ? limpar(a.legenda) : '');
      if (fala.trim()) lista.push({cena: indice, em: a.em!, legenda: a.legenda ?? null, fala: fala.trim()});
    }
  }
  return lista.sort((a, b) => a.em - b.em);
};

// Abre espaço na cena onde a frase não cabe: tudo que vem depois é empurrado para a frente.
const esticarCena = (cena: Cena, frases: (FraseBruta & {duracao: number})[]): number[] => {
  const ancoras: {t: number; delta: number}[] = [];
  const esticou: number[] = [];
  frases.forEach((f, i) => {
    const prox = frases[i + 1];
    const limite = prox ? prox.em : cena.duracao! - FOLGA_FIM;
    const falta = f.em + f.duracao + (prox ? PAUSA : 0) - limite;
    esticou.push(Math.max(0, falta));
    if (falta > 0.01) ancoras.push({t: prox ? Math.max(f.em + 0.05, prox.em - ANTECIPA) : cena.duracao!, delta: falta});
  });
  const w = (t: number) => t + ancoras.filter((a) => a.t <= t + 1e-6).reduce((s, a) => s + a.delta, 0);
  const wOpcional = (t: number | undefined) => (t === undefined ? undefined : w(t));

  for (const l of cena.legendas ?? []) {
    l.em = wOpcional(l.em);
    l.ate = wOpcional(l.ate);
  }
  for (const f of cena.falas ?? []) f.em = wOpcional(f.em);
  if (cena.tipo === 'lista') for (const it of cena.itens) if (typeof it !== 'string') it.em = wOpcional(it.em);
  if (cena.tipo === 'riscado') {
    for (const it of cena.itens) {
      if (typeof it === 'string') continue;
      it.em = wOpcional(it.em);
      it.riscar_em = wOpcional(it.riscar_em);
    }
  }
  if (cena.tipo === 'piramide') for (const n of cena.niveis) n.em = wOpcional(n.em);
  if (cena.tipo === 'mesa') for (const a of cena.acoes) a.em = wOpcional(a.em);
  for (const f of frases) f.em = w(f.em);
  cena.duracao = w(cena.duracao!);
  return esticou;
};

// Tempo de cada palavra da legenda dentro da frase falada, proporcional ao tamanho das palavras.
const palavrasDaFrase = (legenda: string, inicio: number, duracao: number): PalavraFalada[] => {
  const palavras = quebrarPalavras(legenda);
  const pesos = palavras.map((p) => p.texto.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5 + (/[.!?]$/.test(p.texto) ? 3 : /[,;:]$/.test(p.texto) ? 2 : 0));
  const total = pesos.reduce((s, x) => s + x, 0);
  let acumulado = 0;
  return palavras.map((p, i) => {
    const de = inicio + (duracao * 0.96 * acumulado) / total;
    acumulado += pesos[i];
    return {palavra: p.texto, inicio: de, fim: inicio + (duracao * 0.96 * acumulado) / total};
  });
};

type Manifesto = {
  assinatura: string;
  voz: string;
  frases: {fala: string; duracao: number}[];
  words: PalavraFalada[];
};

export const narrar = async (
  roteiro: Roteiro,
  cartas: MapaCartas,
  nome: string,
  opcoes: {log?: (m: string) => void; forcar?: boolean} = {},
): Promise<Narracao> => {
  const log = opcoes.log ?? console.log;
  if (roteiro.cenas.some((c) => c.inicio !== undefined)) {
    throw new ErroNarrador('"narracao": "auto" calcula o tempo das cenas sozinho: tire o "inicio" das cenas.');
  }
  const config: ConfigNarrador = lerConfigNarrador();
  const pasta = path.join(RAIZ, 'audio');
  fs.mkdirSync(pasta, {recursive: true});
  const arquivoRel = `audio/${nome}-narracao.mp3`;
  const arquivoMp3 = path.join(RAIZ, arquivoRel);
  const arquivoJson = path.join(pasta, `${nome}-narracao.json`);

  const r = materializar(roteiro, cartas);
  const brutas = r.cenas.map((cena, i) => frasesDaCena(cena, i));
  const falas = brutas.flat().map((f) => f.fala);
  if (falas.length === 0) throw new ErroNarrador('O roteiro não tem nenhuma legenda nem "falas" para o narrador dizer.');

  // Se o roteiro e o narrador não mudaram, reaproveita o áudio (não precisa nem do Piper instalado).
  const assinatura = crypto.createHash('sha1').update(JSON.stringify([roteiro, config, tratamentoDaVoz(config.volume_lufs)])).digest('hex');
  let manifesto: Manifesto | null = null;
  try {
    const lido = JSON.parse(fs.readFileSync(arquivoJson, 'utf8')) as Manifesto;
    if (!opcoes.forcar && lido.assinatura === assinatura && fs.existsSync(arquivoMp3) && lido.frases.length === falas.length) manifesto = lido;
  } catch {
    manifesto = null;
  }

  let duracoes: number[];
  let arquivos: string[] = [];
  if (manifesto) {
    duracoes = manifesto.frases.map((f) => f.duracao);
  } else {
    await prepararNarrador(config, log);
    log(`  narrador ${config.voz} falando ${falas.length} frases...`);
    const faladas = falar(config, falas);
    duracoes = faladas.map((f) => f.duracao);
    arquivos = faladas.map((f) => f.arquivo);
  }

  // estica cada cena onde a fala não cabe e calcula o tempo final de cada frase
  let k = 0;
  const frases: FraseNarrada[] = [];
  const porCena = brutas.map((lista) => lista.map((f) => ({...f, duracao: duracoes[k++]})));
  const esticadas = r.cenas.map((cena, i) => esticarCena(cena, porCena[i]));
  const plano = planejar(r, cartas);
  porCena.forEach((lista, i) => {
    lista.forEach((f, j) => frases.push({...f, inicio: plano.cenas[i].inicio + f.em, esticou: esticadas[i][j]}));
  });

  const words = frases.flatMap((f) => (f.legenda ? palavrasDaFrase(f.legenda, f.inicio, f.duracao) : []));

  if (!manifesto) {
    // monta a trilha: cada frase no seu segundo, volume padronizado
    const entradas = arquivos.flatMap((a) => ['-i', a]);
    const atrasos = frases.map((f, i) => `[${i}:a]adelay=${Math.round(f.inicio * 1000)}:all=1[a${i}]`).join(';');
    const mistura = `${frases.map((_, i) => `[a${i}]`).join('')}amix=inputs=${frases.length}:normalize=0:dropout_transition=0`;
    const final = `apad=whole_dur=${plano.totalSegundos.toFixed(3)},${tratamentoDaVoz(config.volume_lufs)},aresample=44100`;
    ffmpeg([...entradas, '-filter_complex', `${atrasos};${mistura},${final}[saida]`, '-map', '[saida]', '-ac', '2', '-b:a', '192k', arquivoMp3]);
    const novo: Manifesto = {assinatura, voz: config.voz, frases: frases.map((f) => ({fala: f.fala, duracao: f.duracao})), words};
    fs.writeFileSync(arquivoJson, JSON.stringify(novo, null, 1));
  }

  r.narracao = {arquivo: arquivoRel, transcricao: `audio/${nome}-narracao.json`};
  return {roteiro: r, frases, arquivo: arquivoRel, reaproveitada: manifesto !== null};
};

export const relatarNarracao = (n: Narracao, voz: string) => {
  console.log(`\nNarração (${voz})${n.reaproveitada ? ' - reaproveitada, nada mudou' : ''}: ${n.arquivo}`);
  for (const f of n.frases) {
    const extra = f.esticou > 0.01 ? `  (+${f.esticou.toFixed(1)} s na cena)` : '';
    console.log(`  ${f.inicio.toFixed(1).padStart(5)} s  ${f.duracao.toFixed(1)} s  ${f.fala}${extra}`);
  }
};

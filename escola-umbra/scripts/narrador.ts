// O narrador da Escola Umbra: uma voz só, definida em narrador.json, usada em todas as aulas.
// Motor: Piper (voz neural que roda no próprio computador, sem custo e sem internet depois de instalado).

import {execFileSync, spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './cartas';

export type ConfigNarrador = {
  motor: 'piper';
  voz: string; // ex.: "pt_BR-faber-medium"
  velocidade: number; // 1 = normal; 1.1 = 10% mais rápido
  variacao?: number; // quanto a entonação varia (padrão do modelo se faltar)
  volume_lufs?: number; // volume final da narração (padrão -16, o usual em redes sociais)
};

const ARQUIVO_CONFIG = path.join(RAIZ, 'narrador.json');
const PASTA = path.join(RAIZ, '.narrador'); // ambiente Python, vozes baixadas e frases já geradas
const PASTA_VOZES = path.join(PASTA, 'vozes');
const PASTA_FRASES = path.join(PASTA, 'frases');

export const VOZES_PT_BR = ['pt_BR-faber-medium', 'pt_BR-cadu-medium', 'pt_BR-jeff-medium'];

export class ErroNarrador extends Error {}

export const lerConfigNarrador = (): ConfigNarrador => {
  if (!fs.existsSync(ARQUIVO_CONFIG)) throw new ErroNarrador('Falta o arquivo narrador.json na raiz do projeto.');
  const c = JSON.parse(fs.readFileSync(ARQUIVO_CONFIG, 'utf8')) as ConfigNarrador;
  if (c.motor !== 'piper') throw new ErroNarrador(`narrador.json: motor "${c.motor}" desconhecido (use "piper").`);
  if (!/^[a-z]{2}_[A-Z]{2}-[\w]+-[\w]+$/.test(c.voz)) throw new ErroNarrador(`narrador.json: voz "${c.voz}" fora do formato (ex.: "pt_BR-faber-medium").`);
  return {...c, velocidade: c.velocidade ?? 1};
};

// ---------- ffmpeg ----------

// Usa o ffmpeg do sistema; se não houver, usa o que vem com o Remotion.
const rodar = (programa: 'ffmpeg' | 'ffprobe', args: string[]): string => {
  try {
    return execFileSync(programa, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024});
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return execFileSync('npx', ['remotion', programa, ...args], {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      maxBuffer: 64 * 1024 * 1024,
    });
  }
};

export const ffmpeg = (args: string[]) => rodar('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

export const duracaoDoAudio = (arquivo: string): number =>
  Number(rodar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).trim());

// ---------- instalação ----------

const pythonDoAmbiente = () =>
  process.platform === 'win32' ? path.join(PASTA, 'venv', 'Scripts', 'python.exe') : path.join(PASTA, 'venv', 'bin', 'python');

const pythonDoSistema = (): string => {
  const candidatos = [process.env.ESCOLA_UMBRA_PYTHON, 'python3', 'python', 'py'].filter(Boolean) as string[];
  for (const c of candidatos) {
    const r = spawnSync(c, ['--version'], {encoding: 'utf8'});
    if (r.status === 0) return c;
  }
  throw new ErroNarrador(
    'O narrador precisa do Python 3 instalado (https://www.python.org/downloads/). Depois de instalar, rode de novo.',
  );
};

const arquivosDaVoz = (voz: string) => ({
  modelo: path.join(PASTA_VOZES, `${voz}.onnx`),
  config: path.join(PASTA_VOZES, `${voz}.onnx.json`),
});

const baixar = async (url: string, destino: string) => {
  const resposta = await fetch(url, {signal: AbortSignal.timeout(600_000)});
  if (!resposta.ok) throw new ErroNarrador(`Não consegui baixar ${url} (HTTP ${resposta.status}).`);
  fs.writeFileSync(destino, Buffer.from(await resposta.arrayBuffer()));
};

// Instala o Piper num ambiente Python próprio (.narrador/venv) e baixa a voz, se ainda não estiverem lá.
export const prepararNarrador = async (config: ConfigNarrador, log: (m: string) => void = console.log) => {
  fs.mkdirSync(PASTA_VOZES, {recursive: true});
  fs.mkdirSync(PASTA_FRASES, {recursive: true});
  const py = pythonDoAmbiente();
  const temPiper = fs.existsSync(py) && spawnSync(py, ['-c', 'import piper'], {encoding: 'utf8'}).status === 0;
  if (!temPiper) {
    log('  instalando o narrador (Piper) em .narrador/ - só na primeira vez...');
    const base = pythonDoSistema();
    const venv = spawnSync(base, ['-m', 'venv', path.join(PASTA, 'venv')], {encoding: 'utf8'});
    if (venv.status !== 0) throw new ErroNarrador(`Não consegui criar o ambiente Python: ${venv.stderr || venv.stdout}`);
    const pip = spawnSync(py, ['-m', 'pip', 'install', '--quiet', 'piper-tts'], {encoding: 'utf8'});
    if (pip.status !== 0) throw new ErroNarrador(`Não consegui instalar o piper-tts: ${pip.stderr || pip.stdout}`);
  }
  const {modelo, config: arquivoConfig} = arquivosDaVoz(config.voz);
  if (!fs.existsSync(modelo) || fs.statSync(modelo).size < 1_000_000 || !fs.existsSync(arquivoConfig)) {
    const [regiao, nome, qualidade] = config.voz.split('-');
    const idioma = regiao.split('_')[0];
    const base = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${idioma}/${regiao}/${nome}/${qualidade}/${config.voz}`;
    log(`  baixando a voz ${config.voz} (uns 60 MB, só na primeira vez)...`);
    await baixar(`${base}.onnx.json`, arquivoConfig);
    await baixar(`${base}.onnx`, modelo);
  }
};

// ---------- fala ----------

const assinaturaDaFrase = (config: ConfigNarrador, texto: string) =>
  crypto.createHash('sha1').update(JSON.stringify([config.motor, config.voz, config.velocidade, config.variacao ?? null, texto])).digest('hex').slice(0, 20);

// Gera (ou reaproveita) o áudio de uma frase. Devolve o arquivo WAV, já sem silêncio nas pontas.
export const falar = (config: ConfigNarrador, texto: string): {arquivo: string; duracao: number} => {
  const arquivo = path.join(PASTA_FRASES, `${assinaturaDaFrase(config, texto)}.wav`);
  if (!fs.existsSync(arquivo)) {
    const bruto = `${arquivo}.bruto.wav`;
    const {modelo} = arquivosDaVoz(config.voz);
    const args = ['-m', 'piper', '-m', modelo, '-f', bruto, '--length-scale', String(1 / config.velocidade), '--sentence-silence', '0.14'];
    if (config.variacao !== undefined) args.push('--noise-scale', String(config.variacao));
    const r = spawnSync(pythonDoAmbiente(), args, {input: texto, encoding: 'utf8'});
    if (r.status !== 0 || !fs.existsSync(bruto)) throw new ErroNarrador(`O Piper falhou na frase "${texto}": ${r.stderr || r.stdout}`);
    // tira o silêncio do começo e do fim, e padroniza em 44,1 kHz mono
    const corte = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02';
    ffmpeg(['-i', bruto, '-af', `${corte},areverse,${corte},areverse`, '-ar', '44100', '-ac', '1', arquivo]);
    fs.rmSync(bruto);
  }
  return {arquivo, duracao: duracaoDoAudio(arquivo)};
};

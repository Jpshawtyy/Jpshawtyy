// O narrador da Escola Umbra: uma voz só, definida em narrador.json, usada em todas as aulas.
// Motores: Kokoro e Piper, vozes neurais que rodam no próprio computador, sem custo e sem
// internet depois de instalados.

import {execFileSync, spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './cartas';

export type ConfigNarrador = {
  motor: 'kokoro' | 'piper';
  voz: string; // kokoro: "pf_dora", "pm_alex", "pm_santa"; piper: "pt_BR-cadu-medium"...
  velocidade: number; // 1 = normal; 1.1 = 10% mais rápido
  variacao?: number; // só no piper: quanto a entonação varia
  volume_lufs?: number; // volume final da narração (padrão -16, o usual em redes sociais)
};

const ARQUIVO_CONFIG = path.join(RAIZ, 'narrador.json');
const PASTA = path.join(RAIZ, '.narrador'); // ambiente Python, vozes baixadas e frases já geradas
const PASTA_VOZES = path.join(PASTA, 'vozes');
const PASTA_FRASES = path.join(PASTA, 'frases');

// Vozes em português do Brasil de cada motor.
export const NARRADORES: {motor: ConfigNarrador['motor']; voz: string; descricao: string}[] = [
  {motor: 'kokoro', voz: 'pf_dora', descricao: 'feminina'},
  {motor: 'kokoro', voz: 'pm_alex', descricao: 'masculina'},
  {motor: 'kokoro', voz: 'pm_santa', descricao: 'masculina, mais grave'},
  {motor: 'piper', voz: 'pt_BR-cadu-medium', descricao: 'masculina'},
  {motor: 'piper', voz: 'pt_BR-faber-medium', descricao: 'masculina'},
  {motor: 'piper', voz: 'pt_BR-jeff-medium', descricao: 'masculina'},
];

export class ErroNarrador extends Error {}

export const lerConfigNarrador = (): ConfigNarrador => {
  if (!fs.existsSync(ARQUIVO_CONFIG)) throw new ErroNarrador('Falta o arquivo narrador.json na raiz do projeto.');
  const c = JSON.parse(fs.readFileSync(ARQUIVO_CONFIG, 'utf8')) as ConfigNarrador;
  if (c.motor !== 'piper' && c.motor !== 'kokoro') throw new ErroNarrador(`narrador.json: motor "${c.motor}" desconhecido (use "kokoro" ou "piper").`);
  const formato = c.motor === 'piper' ? /^[a-z]{2}_[A-Z]{2}-\w+-\w+$/ : /^[a-z]{2}_\w+$/;
  if (!formato.test(c.voz)) {
    throw new ErroNarrador(`narrador.json: voz "${c.voz}" fora do formato do motor ${c.motor} (ex.: ${c.motor === 'piper' ? '"pt_BR-cadu-medium"' : '"pf_dora"'}).`);
  }
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

const PASTA_KOKORO = path.join(PASTA, 'kokoro');
const REPO_KOKORO = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main';

const baixar = async (url: string, destino: string) => {
  const resposta = await fetch(url, {signal: AbortSignal.timeout(1_200_000)});
  if (!resposta.ok) throw new ErroNarrador(`Não consegui baixar ${url} (HTTP ${resposta.status}).`);
  const parcial = `${destino}.parcial`;
  fs.writeFileSync(parcial, Buffer.from(await resposta.arrayBuffer()));
  fs.renameSync(parcial, destino);
};

const faltaArquivo = (arquivo: string, minimo: number) => !fs.existsSync(arquivo) || fs.statSync(arquivo).size < minimo;

// Instala o motor num ambiente Python próprio (.narrador/venv) e baixa a voz, se ainda não estiverem lá.
export const prepararNarrador = async (config: ConfigNarrador, log: (m: string) => void = console.log) => {
  fs.mkdirSync(PASTA_VOZES, {recursive: true});
  fs.mkdirSync(PASTA_FRASES, {recursive: true});
  const py = pythonDoAmbiente();
  const modulo = config.motor === 'piper' ? 'piper' : 'kokoro_onnx';
  const pacotes = config.motor === 'piper' ? ['piper-tts'] : ['kokoro-onnx', 'soundfile'];
  if (!fs.existsSync(py)) {
    const venv = spawnSync(pythonDoSistema(), ['-m', 'venv', path.join(PASTA, 'venv')], {encoding: 'utf8'});
    if (venv.status !== 0) throw new ErroNarrador(`Não consegui criar o ambiente Python: ${venv.stderr || venv.stdout}`);
  }
  if (spawnSync(py, ['-c', `import ${modulo}`], {encoding: 'utf8'}).status !== 0) {
    log(`  instalando o narrador (${config.motor}) em .narrador/ - só na primeira vez...`);
    const pip = spawnSync(py, ['-m', 'pip', 'install', '--quiet', ...pacotes], {encoding: 'utf8'});
    if (pip.status !== 0) throw new ErroNarrador(`Não consegui instalar ${pacotes.join(', ')}: ${pip.stderr || pip.stdout}`);
  }

  if (config.motor === 'piper') {
    const {modelo, config: arquivoConfig} = arquivosDaVoz(config.voz);
    if (faltaArquivo(modelo, 1_000_000) || faltaArquivo(arquivoConfig, 100)) {
      const [regiao, nome, qualidade] = config.voz.split('-');
      const idioma = regiao.split('_')[0];
      const base = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${idioma}/${regiao}/${nome}/${qualidade}/${config.voz}`;
      log(`  baixando a voz ${config.voz} (uns 60 MB, só na primeira vez)...`);
      await baixar(`${base}.onnx.json`, arquivoConfig);
      await baixar(`${base}.onnx`, modelo);
    }
    return;
  }

  fs.mkdirSync(path.join(PASTA_KOKORO, 'vozes'), {recursive: true});
  const modelo = path.join(PASTA_KOKORO, 'model.onnx');
  if (faltaArquivo(modelo, 100_000_000)) {
    log('  baixando o modelo do Kokoro (uns 325 MB, só na primeira vez)...');
    await baixar(`${REPO_KOKORO}/onnx/model.onnx`, modelo);
  }
  const voz = path.join(PASTA_KOKORO, 'vozes', `${config.voz}.bin`);
  if (faltaArquivo(voz, 100_000)) {
    log(`  baixando a voz ${config.voz}...`);
    await baixar(`${REPO_KOKORO}/voices/${config.voz}.bin`, voz);
  }
};

// ---------- fala ----------

const assinaturaDaFrase = (config: ConfigNarrador, texto: string) =>
  crypto.createHash('sha1').update(JSON.stringify([config.motor, config.voz, config.velocidade, config.variacao ?? null, texto])).digest('hex').slice(0, 20);

// Tira o silêncio do começo e do fim, e padroniza em 44,1 kHz mono.
const acabar = (bruto: string, arquivo: string) => {
  const corte = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02';
  ffmpeg(['-i', bruto, '-af', `${corte},areverse,${corte},areverse`, '-ar', '44100', '-ac', '1', arquivo]);
  fs.rmSync(bruto);
};

// Gera (ou reaproveita) o áudio de cada frase. Devolve os arquivos WAV, na mesma ordem.
export const falar = (config: ConfigNarrador, textos: string[]): {arquivo: string; duracao: number}[] => {
  const arquivos = textos.map((t) => path.join(PASTA_FRASES, `${assinaturaDaFrase(config, t)}.wav`));
  const faltam = textos.map((texto, i) => ({texto, arquivo: arquivos[i], bruto: `${arquivos[i]}.bruto.wav`})).filter((f) => !fs.existsSync(f.arquivo));
  const unicas = faltam.filter((f, i) => faltam.findIndex((g) => g.arquivo === f.arquivo) === i);

  if (unicas.length > 0 && config.motor === 'kokoro') {
    // uma chamada só para todas as frases: o modelo carrega uma vez
    const r = spawnSync(pythonDoAmbiente(), [path.join(RAIZ, 'scripts', 'kokoro_falar.py'), PASTA_KOKORO, config.voz, String(config.velocidade)], {
      input: JSON.stringify(unicas.map((f) => ({texto: f.texto, saida: f.bruto}))),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) throw new ErroNarrador(`O Kokoro falhou: ${r.stderr || r.stdout}`);
    for (const f of unicas) acabar(f.bruto, f.arquivo);
  }
  if (unicas.length > 0 && config.motor === 'piper') {
    const {modelo} = arquivosDaVoz(config.voz);
    for (const f of unicas) {
      const args = ['-m', 'piper', '-m', modelo, '-f', f.bruto, '--length-scale', String(1 / config.velocidade), '--sentence-silence', '0.14'];
      if (config.variacao !== undefined) args.push('--noise-scale', String(config.variacao));
      const r = spawnSync(pythonDoAmbiente(), args, {input: f.texto, encoding: 'utf8'});
      if (r.status !== 0 || !fs.existsSync(f.bruto)) throw new ErroNarrador(`O Piper falhou na frase "${f.texto}": ${r.stderr || r.stdout}`);
      acabar(f.bruto, f.arquivo);
    }
  }
  return arquivos.map((arquivo) => ({arquivo, duracao: duracaoDoAudio(arquivo)}));
};

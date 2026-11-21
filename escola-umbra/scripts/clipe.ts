// npm run clipe -- clipes/jogada-1.json
// Corta e edita um vídeo horizontal (ex.: clipe da transmissão) no formato da Escola Umbra.
// O roteiro diz o arquivo, os trechos (segundos do vídeo original), título, legendas, zooms e impactos.

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {garantirProxy, prepararNavegador} from './ambiente';
import type {PropsClipe, TrechoClipe} from '../src/clipe/Clipe';

garantirProxy();
const {bundle} = await import('@remotion/bundler');
const {renderMedia, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');

type Roteiro = Omit<PropsClipe, 'video' | 'largura' | 'altura'> & {arquivo: string};

const caminho = process.argv[2];
if (!caminho) {
  console.log('Uso: npm run clipe -- clipes/jogada-1.json');
  process.exit(1);
}
const roteiro = JSON.parse(fs.readFileSync(path.resolve(caminho), 'utf8')) as Roteiro;
const origem = [path.resolve(RAIZ, roteiro.arquivo), path.resolve(path.dirname(path.resolve(caminho)), roteiro.arquivo)].find((c) => fs.existsSync(c));
if (!origem) {
  console.log(`Não achei o vídeo "${roteiro.arquivo}".`);
  process.exit(2);
}
// medidas e duração do vídeo original
const info = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', origem]).toString(),
) as {streams: {width: number; height: number}[]; format: {duration: string}};
const duracao = Number(info.format.duration);
const problemas = roteiro.trechos
  .map((t: TrechoClipe, i) => (t.de < 0 || t.ate > duracao + 0.05 || t.ate <= t.de ? `trecho ${i + 1}: ${t.de}s a ${t.ate}s (o vídeo tem ${duracao.toFixed(1)}s)` : null))
  .filter(Boolean);
if (problemas.length) {
  console.log('Trechos fora do vídeo:\n  ' + problemas.join('\n  '));
  process.exit(2);
}
const nome = path.basename(caminho).replace(/\.json$/i, '');
fs.mkdirSync(path.join(RAIZ, 'public', '_clipes'), {recursive: true});
const destinoRel = `_clipes/${nome}${path.extname(origem)}`;
fs.copyFileSync(origem, path.join(RAIZ, 'public', destinoRel));

const props: PropsClipe = {...roteiro, video: destinoRel, largura: info.streams[0].width, altura: info.streams[0].height};
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const comum = {serveUrl, inputProps: props, ...navegador, logLevel: 'error' as const};
const composicao = await selectComposition({...comum, id: 'Clipe'});
fs.mkdirSync(path.join(RAIZ, 'out', 'clipes'), {recursive: true});
const saida = path.join(RAIZ, 'out', 'clipes', `${nome}.mp4`);
console.log(`Renderizando ${(composicao.durationInFrames / composicao.fps).toFixed(1)} s...`);
await renderMedia({...comum, composition: composicao, codec: 'h264', pixelFormat: 'yuv420p', outputLocation: saida, imageFormat: 'jpeg', jpegQuality: 92, crf: 18});
console.log(`  pronto: ${path.relative(process.cwd(), saida)}`);
process.exit(0);

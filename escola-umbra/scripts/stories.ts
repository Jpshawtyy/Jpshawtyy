// npm run stories -- stories/regras-tcg.json [--video]
// Com --video, cada página vira um MP4 animado (com efeitos sonoros) em vez de PNG; a capa do destaque continua PNG.
// Gera os stories (PNG 1080x1920) de um destaque em out/stories/<nome>/: 00-destaque.png (capa do círculo)
// e 01.png, 02.png... na ordem das páginas.

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';
import type {PaginaStory} from '../src/Story';

garantirProxy();
const {bundle} = await import('@remotion/bundler');
const {renderMedia, renderStill, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');

type Roteiro = {serie: string; marca?: string; destaque?: {titulo: string; subtitulo?: string}; paginas: PaginaStory[]};

const caminho = process.argv.slice(2).find((a) => !a.startsWith('--'));
const video = process.argv.includes('--video');
if (!caminho) {
  console.log('Uso: npm run stories -- stories/regras-tcg.json');
  process.exit(1);
}
const roteiro = JSON.parse(fs.readFileSync(path.resolve(caminho), 'utf8')) as Roteiro;
const EMOJI = /\p{Extended_Pictographic}/u;
const textos = JSON.stringify(roteiro);
if (EMOJI.test(textos)) {
  console.log('O roteiro tem emoji. A identidade da Escola Umbra não usa emoji.');
  process.exit(2);
}
const nome = path.basename(caminho).replace(/\.json$/i, '');
const pasta = path.join(RAIZ, 'out', 'stories', nome);
fs.mkdirSync(pasta, {recursive: true});
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});

const paginas: {arquivo: string; pagina: PaginaStory; numero?: number}[] = [];
if (roteiro.destaque) paginas.push({arquivo: '00-destaque.png', pagina: {tipo: 'destaque', ...roteiro.destaque}});
roteiro.paginas.forEach((p, i) => paginas.push({arquivo: `${String(i + 1).padStart(2, '0')}.png`, pagina: p, numero: i + 1}));

for (const {arquivo, pagina, numero} of paginas) {
  const comoVideo = video && pagina.tipo !== 'destaque';
  const inputProps = {serie: roteiro.serie, marca: roteiro.marca, pagina, numero, total: roteiro.paginas.length, animado: comoVideo};
  const comum = {serveUrl, inputProps, ...navegador, logLevel: 'error' as const};
  const composicao = await selectComposition({...comum, id: comoVideo ? 'StoryVideo' : 'Story'});
  const saida = path.join(pasta, comoVideo ? arquivo.replace(/\.png$/, '.mp4') : arquivo);
  if (comoVideo) {
    await renderMedia({...comum, composition: composicao, codec: 'h264', pixelFormat: 'yuv420p', outputLocation: saida, enforceAudioTrack: true, imageFormat: 'jpeg', jpegQuality: 92, crf: 18});
  } else {
    await renderStill({...comum, composition: composicao, output: saida, imageFormat: 'png'});
  }
  console.log(`  pronto: ${path.relative(process.cwd(), saida)}`);
}
process.exit(0);

// npm run stories -- stories/regras-tcg.json
// Gera os stories (PNG 1080x1920) de um destaque em out/stories/<nome>/: 00-destaque.png (capa do círculo)
// e 01.png, 02.png... na ordem das páginas.

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';
import type {PaginaStory} from '../src/Story';

garantirProxy();
const {bundle} = await import('@remotion/bundler');
const {renderStill, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');

type Roteiro = {serie: string; marca?: string; destaque?: {titulo: string; subtitulo?: string}; paginas: PaginaStory[]};

const caminho = process.argv[2];
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
  const inputProps = {serie: roteiro.serie, marca: roteiro.marca, pagina, numero, total: roteiro.paginas.length};
  const comum = {serveUrl, inputProps, ...navegador, logLevel: 'error' as const};
  const composicao = await selectComposition({...comum, id: 'Story'});
  const saida = path.join(pasta, arquivo);
  await renderStill({...comum, composition: composicao, output: saida, imageFormat: 'png'});
  console.log(`  pronto: ${path.relative(process.cwd(), saida)}`);
}
process.exit(0);

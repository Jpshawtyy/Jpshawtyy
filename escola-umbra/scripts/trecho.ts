// npm run trecho -- aulas/aula-09.json 300 330 [concorrencia]
// Renderiza só um pedaço do vídeo (para conferir animação e boca sem esperar o vídeo todo).
import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';
garantirProxy();
const {bundle} = await import('@remotion/bundler');
const {renderMedia, selectComposition} = await import('@remotion/renderer');
const {preparar} = await import('./preparar');
const {RAIZ} = await import('./cartas');
const [caminho, de, ate, conc] = process.argv.slice(2);
if (!caminho || !de || !ate) {
  console.log('Uso: npm run trecho -- aulas/aula-09.json <quadro inicial> <quadro final> [concorrencia]');
  process.exit(1);
}
const p = await preparar(caminho, {log: () => {}});
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const comum = {serveUrl, inputProps: p.props, ...navegador, logLevel: 'error' as const, chromiumOptions: {gl: 'swangle' as const}};
const aula = await selectComposition({...comum, id: 'Aula'});
const saida = path.join(RAIZ, 'out', 'quadros');
fs.mkdirSync(saida, {recursive: true});
const mp4 = path.join(saida, `${p.nome}-trecho-${de}-${ate}.mp4`);
await renderMedia({
  ...comum,
  composition: aula,
  codec: 'h264',
  outputLocation: mp4,
  frameRange: [Number(de), Number(ate)],
  concurrency: conc ? Number(conc) : null,
  imageFormat: 'jpeg',
  jpegQuality: 92,
});
console.log(path.relative(process.cwd(), mp4));
process.exit(0);

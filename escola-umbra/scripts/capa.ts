// npm run capa -- aulas/aula-01.json
// Gera só a capa PNG em out/ (rápido, sem renderizar o vídeo).

import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';

garantirProxy();

const {bundle} = await import('@remotion/bundler');
const {renderStill, selectComposition} = await import('@remotion/renderer');
const {preparar} = await import('./preparar');
const {RAIZ} = await import('./cartas');

const caminhos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (caminhos.length === 0) {
  console.log('Uso: npm run capa -- aulas/aula-01.json [aulas/aula-02.json ...]');
  process.exit(1);
}
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
for (const caminho of caminhos) {
  const p = await preparar(caminho, {log: () => undefined});
  const comum = {serveUrl, inputProps: p.props, ...navegador, logLevel: 'error' as const, chromiumOptions: {gl: 'swangle' as const}};
  const capa = await selectComposition({...comum, id: 'Capa'});
  const png = path.join(RAIZ, 'out', `${p.nome}-capa.png`);
  await renderStill({...comum, composition: capa, output: png, imageFormat: 'png'});
  console.log(`  pronto: ${path.relative(process.cwd(), png)}`);
}
process.exit(0);

import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';
garantirProxy();
const {bundle} = await import('@remotion/bundler');
const {renderStill, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');
const gl = (process.argv[2] ?? 'swangle') as 'swangle' | 'angle' | 'egl' | 'swiftshader';
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const comum = {serveUrl, inputProps: {kai: process.argv[3] ?? 'acenando', faisca: process.argv[4] ?? 'feliz'}, ...navegador, logLevel: 'error' as const, chromiumOptions: {gl}, onBrowserLog: (l: {type: string; text: string}) => console.log('[navegador]', l.type, l.text.slice(0, 300))};
const c = await selectComposition({...comum, id: 'TestePersonagens'});
for (const q of [0, 20, 45]) {
  await renderStill({...comum, composition: c, frame: q, output: path.join(RAIZ, 'out', 'quadros', `teste3d-${gl}-${q}.png`), imageFormat: 'png'});
}
console.log('ok', gl);
process.exit(0);

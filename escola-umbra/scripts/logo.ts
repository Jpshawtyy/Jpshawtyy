// npm run logo
// Gera a logo provisória (lua + capelo) em public/logo.png, com fundo transparente.
// Não sobrescreve uma logo que já existe: para refazer, use "npm run logo -- --forcar".

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';

garantirProxy();

const {bundle} = await import('@remotion/bundler');
const {renderStill, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');

const destino = path.join(RAIZ, 'public', 'logo.png');
if (fs.existsSync(destino) && !process.argv.includes('--forcar')) {
  console.log('public/logo.png já existe. Use "npm run logo -- --forcar" para gerar a provisória por cima.');
  process.exit(0);
}
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const comum = {serveUrl, inputProps: {}, ...navegador, logLevel: 'error' as const};
const logo = await selectComposition({...comum, id: 'Logo'});
await renderStill({...comum, composition: logo, output: destino, imageFormat: 'png'});
console.log('Logo provisória salva em public/logo.png');
process.exit(0);

// npm run loja
// Gera as peças da loja no Estilo Arena em out/loja/: banner 3:1, banner 16:9 e foto de perfil.
// O texto do banner fica em src/Loja.tsx (BANNER_PADRAO).

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';

garantirProxy();

const {bundle} = await import('@remotion/bundler');
const {renderStill, selectComposition} = await import('@remotion/renderer');
const {RAIZ} = await import('./cartas');

const pasta = path.join(RAIZ, 'out', 'loja');
fs.mkdirSync(pasta, {recursive: true});
const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const pecas: [string, string][] = [
  ['BannerLargo', 'banner-loja-2400x800.png'],
  ['Banner16x9', 'banner-loja-1920x1080.png'],
  ['Perfil', 'perfil-loja-1080x1080.png'],
  ['PerfilLiga', 'perfil-liga-umbra-1080x1080.png'],
];
for (const [id, arquivo] of pecas) {
  const comum = {serveUrl, inputProps: {}, ...navegador, logLevel: 'error' as const};
  const composicao = await selectComposition({...comum, id});
  const saida = path.join(pasta, arquivo);
  await renderStill({...comum, composition: composicao, output: saida, imageFormat: 'png'});
  console.log(`  pronto: ${path.relative(process.cwd(), saida)}`);
}
process.exit(0);

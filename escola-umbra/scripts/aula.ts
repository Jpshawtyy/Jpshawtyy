// npm run aula -- aulas/aula-01.json
// Confere o roteiro, busca as cartas, renderiza o MP4 e a capa PNG em out/.

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';

garantirProxy();

const {bundle} = await import('@remotion/bundler');
const {renderMedia, renderStill, selectComposition} = await import('@remotion/renderer');
const {preparar, relatar} = await import('./preparar');
const {RAIZ} = await import('./cartas');

const args = process.argv.slice(2);
const tem = (f: string) => args.includes(f);
const caminho = args.find((a) => !a.startsWith('--'));

if (!caminho) {
  console.log(`Uso: npm run aula -- aulas/aula-01.json [opções]

  --previa        renderiza uma prévia rápida em baixa resolução (out/<aula>-previa.mp4)
  --so-validar    só confere o roteiro e as regras, sem renderizar
  --guias         desenha a área segura do Reels por cima (para conferência)
  --forcar        renderiza mesmo com erro de regra
  --sem-capa      não gera a capa PNG
  --atualizar-cartas   ignora o cache e busca as cartas de novo na API
  --refazer-narracao   gera a narração de novo, mesmo sem mudança no roteiro`);
  process.exit(1);
}

const barra = (rotulo: string) => {
  let ultimo = -1;
  return (fracao: number) => {
    const pct = Math.floor(fracao * 100);
    if (pct === ultimo || pct % 10 !== 0) return;
    ultimo = pct;
    console.log(`  ${rotulo}: ${pct}%`);
  };
};

try {
  const p = await preparar(caminho, {guias: tem('--guias'), atualizarCartas: tem('--atualizar-cartas'), refazerNarracao: tem('--refazer-narracao')});
  const temErro = relatar(p);
  if (temErro && !tem('--forcar')) {
    console.log('\nNada foi renderizado. Corrija o roteiro (ou use --forcar para renderizar assim mesmo).');
    process.exit(2);
  }
  if (tem('--so-validar')) process.exit(temErro ? 2 : 0);

  const previa = tem('--previa');
  const saida = path.join(RAIZ, 'out');
  fs.mkdirSync(saida, {recursive: true});

  console.log('\nPreparando o navegador e o pacote do vídeo...');
  const navegador = await prepararNavegador();
  const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
  const comum = {serveUrl, inputProps: p.props, ...navegador, logLevel: 'error' as const};

  const aula = await selectComposition({...comum, id: 'Aula'});
  const mp4 = path.join(saida, `${p.nome}${previa ? '-previa' : ''}${tem('--guias') ? '-guias' : ''}.mp4`);
  console.log(`\nRenderizando ${previa ? 'a prévia' : 'o vídeo final'} (${(aula.durationInFrames / aula.fps).toFixed(1)} s, ${aula.durationInFrames} quadros)...`);
  await renderMedia({
    ...comum,
    composition: aula,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    enforceAudioTrack: true, // trilha de áudio (muda, se não houver narração) para o Instagram aceitar sem reclamar
    outputLocation: mp4,
    scale: previa ? 0.4 : 1,
    crf: previa ? 28 : 17,
    imageFormat: 'jpeg',
    jpegQuality: previa ? 80 : 95,
    onProgress: (() => {
      const b = barra('vídeo');
      return ({progress}: {progress: number}) => b(progress);
    })(),
  });
  console.log(`  pronto: ${path.relative(process.cwd(), mp4)}`);

  if (!previa && !tem('--sem-capa')) {
    const capa = await selectComposition({...comum, id: 'Capa'});
    const png = path.join(saida, `${p.nome}-capa.png`);
    await renderStill({...comum, composition: capa, output: png, imageFormat: 'png'});
    console.log(`  pronto: ${path.relative(process.cwd(), png)}`);
  }
  process.exit(0);
} catch (e) {
  console.error(`\nERRO: ${e instanceof Error ? e.message : e}`);
  if (process.env.DEBUG && e instanceof Error) console.error(e.stack);
  process.exit(1);
}

// npm run narrar -- aulas/aula-01.json      gera só a narração e mostra o tempo de cada frase
// npm run narrar -- --amostras              grava uma amostra de cada voz em português, para escolher o narrador
// npm run narrar -- --amostras "seu texto"  o mesmo, com o texto que você quiser

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy} from './ambiente';

garantirProxy();

const {preparar, relatar} = await import('./preparar');
const {RAIZ} = await import('./cartas');
const {VOZES_PT_BR, falar, ffmpeg, lerConfigNarrador, prepararNarrador} = await import('./narrador');

const args = process.argv.slice(2);
try {
  if (args.includes('--amostras')) {
    const texto =
      args.find((a) => !a.startsWith('--')) ??
      'Todo turno começa comprando uma carta. Depois vêm as ações, na ordem que quiser. Atacou? Acabou o turno.';
    const atual = lerConfigNarrador();
    const pasta = path.join(RAIZ, 'out', 'amostras');
    fs.mkdirSync(pasta, {recursive: true});
    for (const voz of VOZES_PT_BR) {
      const config = {...atual, voz};
      await prepararNarrador(config);
      const {arquivo} = falar(config, texto);
      const destino = path.join(pasta, `narrador-${voz.split('-')[1]}.mp3`);
      ffmpeg(['-i', arquivo, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-b:a', '192k', destino]);
      console.log(`  ${path.relative(process.cwd(), destino)}${voz === atual.voz ? '  (narrador atual)' : ''}`);
    }
    console.log('\nPara trocar o narrador de todas as aulas, mude "voz" em narrador.json.');
    process.exit(0);
  }

  const caminho = args.find((a) => !a.startsWith('--'));
  if (!caminho) {
    console.log('Uso: npm run narrar -- aulas/aula-01.json   |   npm run narrar -- --amostras ["texto"]');
    process.exit(1);
  }
  const p = await preparar(caminho, {refazerNarracao: args.includes('--refazer')});
  const temErro = relatar(p);
  if (!p.narracao) console.log('\nEste roteiro não usa o narrador. Ponha "narracao": "auto" nele.');
  process.exit(temErro ? 2 : 0);
} catch (e) {
  console.error(`\nERRO: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

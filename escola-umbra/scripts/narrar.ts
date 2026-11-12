// npm run narrar -- aulas/aula-01.json      gera só a narração e mostra o tempo de cada frase
// npm run narrar -- --amostras              grava uma amostra de cada voz em português, para escolher o narrador
// npm run narrar -- --amostras "seu texto"  o mesmo, com o texto que você quiser

import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy} from './ambiente';

garantirProxy();

const {preparar, relatar} = await import('./preparar');
const {RAIZ} = await import('./cartas');
const {NARRADORES, falar, ffmpeg, lerConfigNarrador, prepararNarrador, tratamentoDaVoz} = await import('./narrador');

const args = process.argv.slice(2);
try {
  if (args.includes('--amostras')) {
    const texto =
      args.find((a) => !a.startsWith('--')) ??
      'Todo turno começa comprando uma carta. Depois vêm as ações, na ordem que quiser. Atacou? Acabou o turno.';
    const atual = lerConfigNarrador();
    const pasta = path.join(RAIZ, 'out', 'amostras');
    fs.mkdirSync(pasta, {recursive: true});
    for (const n of NARRADORES) {
      const config = {...atual, motor: n.motor, voz: n.voz};
      await prepararNarrador(config);
      const [{arquivo}] = falar(config, [texto]);
      const destino = path.join(pasta, `narrador-${n.motor}-${n.voz.replace(/^pt_BR-|-medium$/g, '')}.mp3`);
      ffmpeg(['-i', arquivo, '-af', tratamentoDaVoz(atual.volume_lufs), '-b:a', '192k', destino]);
      const marca = n.motor === atual.motor && n.voz === atual.voz ? '  <- narrador atual' : '';
      console.log(`  ${path.relative(process.cwd(), destino)}  (${n.descricao}; "motor": "${n.motor}", "voz": "${n.voz}")${marca}`);
    }
    console.log('\nPara trocar o narrador de todas as aulas, copie o "motor" e a "voz" escolhidos para narrador.json.');
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

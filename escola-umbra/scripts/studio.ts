// npm run studio -- aulas/aula-01.json
// Abre o Remotion Studio (prévia interativa no navegador) com o roteiro escolhido.

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy} from './ambiente';

garantirProxy();

const {preparar, relatar} = await import('./preparar');
const {RAIZ} = await import('./cartas');

const caminho = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!caminho) {
  console.log('Uso: npm run studio -- aulas/aula-01.json');
  process.exit(1);
}
const p = await preparar(caminho, {guias: process.argv.includes('--guias')});
relatar(p);
const pasta = path.join(RAIZ, '.cache');
fs.mkdirSync(pasta, {recursive: true});
const props = path.join(pasta, `${p.nome}.props.json`);
fs.writeFileSync(props, JSON.stringify(p.props));
const filho = spawn('npx', ['remotion', 'studio', 'src/index.ts', `--props=${props}`], {cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32'});
filho.on('exit', (codigo) => process.exit(codigo ?? 0));

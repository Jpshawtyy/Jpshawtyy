// npm run quadros -- aulas/aula-01.json [--guias] [--cena N] [--tempos 1.2,3.4]
// Tira fotos dos pontos de transição (troca de cena, começo de cada ação da mesa...)
// e monta folhas de contato em out/quadros/<aula>/ para conferir quadro a quadro.

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {garantirProxy, prepararNavegador} from './ambiente';

garantirProxy();

const {bundle} = await import('@remotion/bundler');
const {openBrowser, renderStill, selectComposition} = await import('@remotion/renderer');
const {preparar, relatar} = await import('./preparar');
const {RAIZ} = await import('./cartas');
const {simularMesa} = await import('../src/mesa/motor');

const args = process.argv.slice(2);
const valor = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const opcoesComValor = ['--cena', '--tempos', '--escala', '--colunas'];
const caminho = args.find((a, i) => !a.startsWith('--') && !opcoesComValor.includes(args[i - 1]));
if (!caminho) {
  console.log('Uso: npm run quadros -- aulas/aula-01.json [--guias] [--cena N] [--tempos 1.2,3.4] [--escala 0.5] [--colunas 6]');
  process.exit(1);
}

const p = await preparar(caminho, {guias: args.includes('--guias'), log: () => undefined});
if (relatar(p)) process.exit(2);

const fps = 30;
const soCena = valor('--cena') ? Number(valor('--cena')) : null;
const escala = Number(valor('--escala') ?? 0.5);
const colunas = Number(valor('--colunas') ?? 6);

// quadros a fotografar: [quadro, rótulo]
const pontos = new Map<number, string>();
const marcar = (quadro: number, rotulo: string) => {
  const q = Math.max(0, Math.min(p.plano.totalQuadros - 1, Math.round(quadro)));
  if (!pontos.has(q)) pontos.set(q, rotulo);
};

if (valor('--tempos')) {
  for (const t of valor('--tempos')!.split(',')) marcar(Number(t) * fps, `t${t}`);
} else {
  for (const c of p.plano.cenas) {
    if (soCena !== null && c.indice + 1 !== soCena) continue;
    const r = `c${c.indice + 1}-${c.cena.tipo}`;
    for (const d of [0, 2, 5, 9, 14]) marcar(c.de + d, `${r}-entra${d}`);
    for (const d of [5, 3, 1]) marcar(c.de + c.quadros - d, `${r}-sai${d}`);
    // um quadro a cada 0,5 s no meio da cena
    for (let t = 0.75; t < c.duracao - 0.2; t += 0.5) marcar(c.de + t * fps, `${r}-${t.toFixed(2)}s`);
    if (c.cena.tipo === 'mesa') {
      for (const passo of simularMesa(c.cena, p.props.cartas).passos) {
        for (const d of [0.15, 0.4, 0.7, 1.0, 1.5]) {
          if (d < passo.duracao) marcar(c.de + (passo.inicio + d) * fps, `${r}-a${passo.indice + 1}-${passo.tipo}+${d}`);
        }
      }
    }
  }
}

const pasta = path.join(RAIZ, 'out', 'quadros', p.nome + (args.includes('--guias') ? '-guias' : ''));
fs.rmSync(pasta, {recursive: true, force: true});
fs.mkdirSync(pasta, {recursive: true});

const navegador = await prepararNavegador();
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src', 'index.ts'), publicDir: path.join(RAIZ, 'public')});
const comum = {serveUrl, inputProps: p.props, ...navegador, logLevel: 'error' as const};
const aula = await selectComposition({...comum, id: 'Aula'});
const instancia = await openBrowser('chrome', {...navegador});

const ordenados = [...pontos.entries()].sort((a, b) => a[0] - b[0]);
console.log(`\nFotografando ${ordenados.length} quadros em ${path.relative(process.cwd(), pasta)}/ ...`);
const arquivos: string[] = [];
for (const [quadro, rotulo] of ordenados) {
  const arquivo = path.join(pasta, `${String(quadro).padStart(4, '0')}-${rotulo}.jpg`);
  await renderStill({...comum, composition: aula, frame: quadro, output: arquivo, imageFormat: 'jpeg', jpegQuality: 88, scale: escala, puppeteerInstance: instancia});
  arquivos.push(arquivo);
}
await instancia.close({silent: true});

// folhas de contato: N colunas x 2 linhas, com o número do quadro escrito em cada foto
const porFolha = colunas * 2;
const largura = Math.round((1080 * escala) / 2) * 2;
for (let i = 0; i * porFolha < arquivos.length; i++) {
  const grupo = arquivos.slice(i * porFolha, (i + 1) * porFolha);
  const lista = path.join(pasta, `_lista-${i}.txt`);
  fs.writeFileSync(lista, grupo.map((a) => `file '${a}'\nduration 1`).join('\n'));
  const folha = path.join(pasta, `folha-${String(i + 1).padStart(2, '0')}.jpg`);
  const filtros = [
    `scale=${largura}:-2`,
    `tile=${colunas}x2:padding=6:color=0x333333`,
  ].join(',');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-vf', filtros, '-frames:v', '1', '-q:v', '3', folha]);
  fs.rmSync(lista);
  console.log(`  ${path.relative(process.cwd(), folha)}: quadros ${grupo.map((a) => path.basename(a).slice(0, 4)).join(', ')}`);
}
process.exit(0);

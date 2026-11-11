// Ajustes de ambiente: proxy de rede e navegador usado pelo Remotion.

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ensureBrowser} from '@remotion/renderer';

// O fetch do Node só respeita HTTPS_PROXY com NODE_USE_ENV_PROXY=1.
// Se existe proxy configurado e a variável não está ligada, roda o mesmo comando de novo com ela.
export const garantirProxy = () => {
  const temProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!temProxy || process.env.NODE_USE_ENV_PROXY === '1') return;
  const filho = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: {...process.env, NODE_USE_ENV_PROXY: '1'},
  });
  process.exit(filho.status ?? 1);
};

export type Navegador = {browserExecutable: string | null; chromeMode: 'headless-shell' | 'chrome-for-testing'};

// Procura um Chromium completo já instalado (ex.: o do Playwright). Ele é usado quando o
// download do navegador do Remotion não é possível, e também atrás de proxy corporativo,
// porque confia nos certificados instalados no sistema (o Headless Shell não confia).
const chromiumLocal = (): string | null => {
  const pasta = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!pasta || !fs.existsSync(pasta)) return null;
  for (const item of fs.readdirSync(pasta).sort().reverse()) {
    if (!/^chromium-\d+$/.test(item)) continue;
    for (const sub of fs.readdirSync(path.join(pasta, item))) {
      const candidato = path.join(pasta, item, sub, 'chrome');
      if (fs.existsSync(candidato)) return candidato;
    }
  }
  return null;
};

// Escolhe o navegador do render. Sem nada especial no ambiente, o Remotion usa o dele
// (baixa sozinho na primeira vez).
export const prepararNavegador = async (): Promise<Navegador> => {
  if (process.env.REMOTION_CHROME && fs.existsSync(process.env.REMOTION_CHROME)) {
    return {browserExecutable: process.env.REMOTION_CHROME, chromeMode: 'chrome-for-testing'};
  }
  const local = chromiumLocal();
  if (local) return {browserExecutable: local, chromeMode: 'chrome-for-testing'};
  await ensureBrowser();
  return {browserExecutable: null, chromeMode: 'headless-shell'};
};

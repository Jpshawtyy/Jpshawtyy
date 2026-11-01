// Refaz o crachá (img/cracha.svg) com os números do GitHub: repositórios, estrelas, seguidores,
// contribuições do último ano e as linguagens mais usadas. No GitHub roda sozinho todo dia
// (.github/workflows/atualizar-perfil.yml). No PC: node ferramentas/numeros.mjs <usuario>
// O desenho do cartão está em cracha-modelo.svg (sai do _scripts/montar.py, fora do repositório).
import { readFile, writeFile } from 'node:fs/promises';

const usuario = (process.env.USUARIO || process.argv[2] || '').replace(/^@/, '');
const token = process.env.GITHUB_TOKEN;
const cabecalho = { 'User-Agent': 'perfil-numeros', Accept: 'application/vnd.github+json' };
if (token) cabecalho.Authorization = `Bearer ${token}`;

async function api(caminho) {
  const r = await fetch('https://api.github.com' + caminho, { headers: cabecalho });
  if (!r.ok) throw new Error(`${caminho}: ${r.status}`);
  return r.json();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const n = { usuario: usuario || 'SEU-USUARIO', repos: '—', estrelas: '—', seguidores: '—', contrib: '—' };
let linguagens = [];
if (usuario) {
  const u = await api(`/users/${usuario}`);
  const repos = [];
  for (let p = 1; ; p++) {
    const lote = await api(`/users/${usuario}/repos?per_page=100&page=${p}`);
    repos.push(...lote);
    if (lote.length < 100) break;
  }
  const proprios = repos.filter((r) => !r.fork);
  n.repos = u.public_repos;
  n.seguidores = u.followers;
  n.estrelas = proprios.reduce((s, r) => s + r.stargazers_count, 0);
  const conta = {};
  for (const r of proprios) if (r.language) conta[r.language] = (conta[r.language] || 0) + 1;
  linguagens = Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // as contribuições só saem pelo GraphQL, que pede a chave (no GitHub ela já vem pronta)
  if (token) {
    const r = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: cabecalho,
      body: JSON.stringify({
        query: 'query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions}}}}',
        variables: { u: usuario },
      }),
    });
    const j = await r.json();
    n.contrib = j.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? '—';
  }
}
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('pt-BR') : v);
n.data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Cuiaba' });

let svg = await readFile(new URL('./cracha-modelo.svg', import.meta.url), 'utf8');
svg = svg.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(fmt(n[k] ?? '')));
svg = svg.replace(/<!--LINGUAGENS (\{.*?\})-->/, (_, json) => {
  const L = JSON.parse(json);
  if (!linguagens.length) {
    return `<text x="${L.x}" y="${L.y + 4}" class="i5" font-size="17" fill="${L.apagado}">Nenhum repositório com código ainda.</text>`;
  }
  const max = linguagens[0][1];
  return linguagens
    .map(([nome, qtd], i) => {
      const y = L.y + i * L.passo;
      const w = Math.max(8, (L.largura * qtd) / max);
      const cor = L.cores[i % L.cores.length];
      return (
        `<text x="${L.x}" y="${y + 5}" class="m" font-size="15" fill="${L.texto}">${esc(nome)}</text>` +
        `<rect x="${L.barra}" y="${y - 5}" width="${L.largura}" height="10" rx="5" fill="${L.trilho}"/>` +
        `<rect class="barra" x="${L.barra}" y="${y - 5}" width="${w.toFixed(1)}" height="10" rx="5" fill="${cor}" style="animation-delay:${(0.9 + i * 0.12).toFixed(2)}s"/>` +
        `<text x="${L.fim}" y="${y + 5}" class="m6" font-size="15" fill="${L.texto}" text-anchor="end">${qtd}</text>`
      );
    })
    .join('');
});
await writeFile(new URL('../img/cracha.svg', import.meta.url), svg);
console.log('crachá:', JSON.stringify({ ...n, linguagens }));

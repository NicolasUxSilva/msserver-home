// Verifica o roteamento de um ambiente (homologação ou produção) depois de aplicar a configuração do
// nginx (docs/ROTEAMENTO.md): cada endereço tem de ser respondido pela origem certa — o site novo
// (meta generator "Astro") ou o WordPress — e com o status esperado. Só faz GET/HEAD de leitura e um
// POST vazio no checkout da Store API (que deve ser recusado); nada é criado nem alterado.
//
// Uso: node scripts/verificar-roteamento.mjs https://homologacao.msserver.com.br
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!base) throw new Error('Uso: node scripts/verificar-roteamento.mjs <https://endereço-do-ambiente>');
const routes = (await readFile(path.resolve(import.meta.dirname, '..', 'dist', '_rotas', 'rotas.txt'), 'utf8')).split('\n').filter((r) => r.endsWith('/'));

const UA = { 'User-Agent': 'Mozilla/5.0 (MSSERVER verificação de roteamento)' };
const origin = async (url, init = {}) => {
  const res = await fetch(url, { redirect: 'manual', headers: UA, ...init });
  const type = res.headers.get('content-type') ?? '';
  const body = type.includes('html') ? await res.text() : '';
  const gen = body.match(/<meta name="generator" content="([^"]+)"/)?.[1] ?? '';
  return { status: res.status, type, origem: /Astro/.test(gen) ? 'site-novo' : /WordPress/.test(gen) ? 'wordpress' : res.headers.get('x-msserver-origem') ?? '?', location: res.headers.get('location') };
};

const checks = [
  // Site novo: amostra de cada tipo de página (todas as rotas são conferidas abaixo com HEAD).
  ['/', 200, 'site-novo'],
  ['/sobre/', 200, 'site-novo'],
  ['/servidores/', 200, 'site-novo'],
  ['/servidores/?busca=r740', 200, 'site-novo'],
  ['/carrinho/?add-to-cart=7824', 200, 'site-novo'],
  ['/finalizar-compra/', 200, 'site-novo'],
  ['/blog/', 200, 'site-novo'],
  ['/solucoes-cloud/', 200, 'site-novo'],
  ['/?utm_source=teste', 200, 'site-novo'],
  // WordPress: rotas e parâmetros que precisam continuar lá.
  ['/?s=dell&post_type=product', 200, 'wordpress'],
  ['/minha-conta/', 200, 'wordpress'],
  ['/obter-suporte/', 200, 'wordpress'],
  ['/aplicativo-ms-server/', 200, 'wordpress'],
  ['/servidores-fisicos/', 200, null],
  ['/sitemap.xml', 200, null],
  ['/wp-json/', 200, null],
  ['/wp-json/wc/store/v1/cart', 200, null],
  ['/wp-login.php', 200, 'wordpress'],
  ['/feed/', 200, null],
  ['/categoria-produto/sem-categoria/', 200, 'wordpress'],
  ['/servidor/servidor-dell-r740/?add-to-cart=4990', null, 'wordpress'],
];

let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) falhas++;
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
};

for (const [p, status, esperado] of checks) {
  const r = await origin(base + p);
  ok((status === null || r.status === status) && (esperado === null || r.origem === esperado), `${p} → ${r.status} ${r.origem}${r.location ? ` → ${r.location}` : ''}`);
}

// HTTP → HTTPS em página interna.
if (base.startsWith('https://')) {
  const r = await origin(base.replace('https://', 'http://') + '/sobre/');
  ok(r.status === 301 && (r.location ?? '').startsWith('https://'), `http /sobre/ → ${r.status} ${r.location ?? ''}`);
}

// Pagamento fechado.
const co = await fetch(`${base}/wp-json/wc/store/v1/checkout`, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/json' }, body: '{}', redirect: 'manual' });
ok(co.status === 403 || co.status === 401, `POST /wp-json/wc/store/v1/checkout → ${co.status} (deve ser recusado)`);
const cart = await (await fetch(`${base}/wp-json/wc/store/v1/cart`, { headers: UA })).json().catch(() => null);
ok(Array.isArray(cart?.payment_methods) && cart.payment_methods.length === 0, `meios de pagamento oferecidos: ${JSON.stringify(cart?.payment_methods)}`);

// Todas as rotas da lista respondem pelo site novo.
let sem = 0;
for (const r of routes) {
  const res = await fetch(base + r, { method: 'HEAD', headers: UA, redirect: 'manual' });
  if (res.status !== 200 || res.headers.get('x-msserver-origem') !== 'site-novo') {
    sem++;
    if (sem <= 10) console.log(`✗ ${r} → ${res.status} ${res.headers.get('x-msserver-origem') ?? ''}`);
  }
}
ok(sem === 0, `${routes.length - sem} de ${routes.length} rotas da lista servidas pelo site novo`);

console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nRoteamento conferido.');
process.exit(falhas ? 1 : 0);

// Testa o exemplo de configuração do nginx (docs/nginx/msserver-site.conf) com o build atual, sem
// tocar em nenhum servidor: sobe um nginx local, numa pasta temporária, servindo o dist/ como o site
// novo e um "WordPress" de mentira (toda requisição que chega ao PHP responde o texto "wordpress"; sem
// add_header no bloco do PHP, para não mudar a herança dos cabeçalhos do server). Depois confere, requisição por requisição, quem responde cada endereço,
// método e parâmetro (docs/ROTEAMENTO.md, "1. A regra"), os bloqueios de pagamento, o http → https,
// o cache dos arquivos com hash e os cabeçalhos de segurança.
//
// O que muda em relação ao exemplo (só para rodar aqui): portas locais sem TLS, os caminhos do dist/
// e do snippet de cabeçalhos, e o bloco do PHP-FPM trocado pela resposta de mentira. As regras
// (maps, locations, rewrites, bloqueios) são as do arquivo, sem alteração.
//
// Requisitos: nginx no PATH e o build completo (npm run build, que gera dist/_rotas/).
// Uso: npm run test:nginx
import { execFileSync, spawnSync } from 'node:child_process';
import { chmod, mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CONF = path.join(ROOT, 'docs', 'nginx', 'msserver-site.conf');
const SNIPPET = path.join(ROOT, 'docs', 'nginx', 'msserver-seguranca.conf');
const PORT = Number(process.env.NGINX_TEST_PORT || 8089);
const PORT_HTTP = PORT + 1;

if (spawnSync('nginx', ['-v']).error) {
  console.log('nginx não encontrado no PATH: teste do exemplo de configuração não executado.');
  process.exit(2);
}
await readFile(path.join(DIST, '_rotas', 'nginx-rotas.map')).catch(() => {
  console.error('dist/_rotas/nginx-rotas.map não existe: rode "npm run build" antes.');
  process.exit(1);
});

// ——— Configuração de teste a partir do exemplo ———
const tmp = await mkdtemp(path.join(os.tmpdir(), 'msserver-nginx-'));
const wpRoot = path.join(tmp, 'wordpress');
await mkdir(wpRoot);
await chmod(tmp, 0o755); // os workers do nginx (outro usuário) precisam ler a pasta
await writeFile(path.join(wpRoot, 'index.php'), ''); // como no WordPress: "/" cai no index.php
await mkdir(path.join(tmp, 'logs'));
let conf = await readFile(CONF, 'utf8');
const swap = (from, to) => {
  if (!conf.includes(from)) throw new Error(`Trecho esperado não encontrado no exemplo: ${from}`);
  conf = conf.split(from).join(to);
};
swap('/var/www/msserver-site/current', DIST);
swap('/var/www/wordpress', wpRoot);
swap('include snippets/msserver-seguranca.conf;', `include ${SNIPPET};`);
swap('listen [::]:443 ssl http2;\n', '');
swap('listen [::]:80;\n', '');
swap('listen 443 ssl http2;', `listen 127.0.0.1:${PORT};`);
swap('listen 80;', `listen 127.0.0.1:${PORT_HTTP};`);
swap(
  'include snippets/fastcgi-php.conf;\n        fastcgi_pass unix:/run/php/php-fpm.sock;',
  'default_type text/plain;\n        return 200 "wordpress\\n";',
);
const full = `pid ${tmp}/nginx.pid;
error_log ${tmp}/logs/error.log warn;
events { worker_connections 256; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  access_log off;
  client_body_temp_path ${tmp}/body; proxy_temp_path ${tmp}/proxy; fastcgi_temp_path ${tmp}/fcgi;
  uwsgi_temp_path ${tmp}/uwsgi; scgi_temp_path ${tmp}/scgi;
${conf}
}
`;
const file = path.join(tmp, 'nginx.conf');
await writeFile(file, full);

const nginx = (...args) => execFileSync('nginx', ['-p', tmp, '-c', file, ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
try {
  nginx('-t');
} catch (e) {
  console.error('nginx -t recusou a configuração:\n' + e.stderr);
  process.exit(1);
}
nginx();

// ——— Requisições ———
const req = (method, url, { port = PORT, host = 'msserver.com.br' } = {}) =>
  new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path: url, method, headers: { Host: host } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    r.on('error', reject);
    r.end(method === 'POST' ? 'x=1' : undefined);
  });
const origin = (res) => (res.headers['x-msserver-origem'] === 'site-novo' ? 'novo' : res.status === 200 && res.body === 'wordpress\n' ? 'wp' : `${res.status}`);

const astro = (await readdir(path.join(DIST, '_astro'))).find((f) => f.endsWith('.js'));
const cloudAstro = (await readdir(path.join(DIST, 'solucoes-cloud', '_astro')).catch(() => [])).find((f) => /\.(js|css)$/.test(f));
const blog = JSON.parse(await readFile(path.join(ROOT, 'src', 'data', 'blog.json'), 'utf8')).posts[0].slug;

// [método, endereço, esperado ('novo' | 'wp' | status), descrição]
const CASES = [
  ['GET', '/', 'novo', 'home'],
  ['HEAD', '/', 'novo', 'home (HEAD)'],
  ['GET', '/?utm_source=teste&gclid=1', 'novo', 'home com parâmetros de campanha'],
  ['GET', '/?s=r740', 'wp', 'busca do WordPress (?s=)'],
  ['GET', '/?wc-ajax=get_refreshed_fragments', 'wp', 'AJAX do WooCommerce'],
  ['POST', '/?wc-ajax=checkout', '403', 'checkout por AJAX bloqueado'],
  ['GET', '/?p=123', 'wp', 'link curto do WordPress (?p=)'],
  ['GET', '/?page_id=3&preview=true', 'wp', 'pré-visualização do WordPress'],
  ['POST', '/', 'wp', 'POST na home'],
  ['GET', '/sobre/', 'novo', 'Sobre nós'],
  ['GET', '/servidores/', 'novo', 'catálogo'],
  ['GET', '/servidores/?busca=r740&orderby=price', 'novo', 'catálogo com busca e ordenação'],
  ['GET', '/servidores/page/2/', 'novo', 'catálogo, página 2'],
  ['GET', '/servidores/?add-to-cart=7828', 'wp', '?add-to-cart= fora do carrinho'],
  ['GET', '/categoria-produto/rack/', 'novo', 'categoria Rack'],
  ['GET', '/categoria-produto/sem-categoria/', 'wp', 'categoria não reconstruída'],
  ['GET', '/servidor/servidor-dell-r740/', 'novo', 'produto'],
  ['GET', '/servidor/produto-que-nao-existe/', 'wp', 'produto fora do build'],
  ['GET', '/carrinho/', 'novo', 'carrinho'],
  ['GET', '/carrinho/?add-to-cart=7828', 'novo', 'carrinho com ?add-to-cart='],
  ['POST', '/carrinho/', 'wp', 'POST no carrinho'],
  ['GET', '/finalizar-compra/', 'novo', 'finalização de orçamento'],
  ['POST', '/finalizar-compra/', 'wp', 'POST na finalização (WordPress)'],
  ['GET', '/finalizar-compra/order-received/123/?key=wc_order_x', 'wp', 'pedido recebido (WordPress)'],
  ['GET', '/finalizar-compra/order-pay/123/?pay_for_order=true&key=x', '302', 'pagamento de pedido redirecionado'],
  ['GET', '/minha-conta/', 'wp', 'conta'],
  ['GET', '/obter-suporte/', 'wp', 'suporte'],
  ['GET', '/aplicativo-ms-server/', 'wp', 'Aplicativo de Gestão'],
  ['GET', '/servidores-fisicos/', 'wp', 'landing Servidores Físicos'],
  ['GET', '/solucoes-cloud/', 'novo', 'Soluções Cloud (landing aprovada)'],
  ['GET', '/cloud-privada/', 'wp', 'landing antiga (sem redirecionamento ativo)'],
  ['GET', '/blog/', 'novo', 'blog'],
  ['GET', '/blog/page/2/', 'novo', 'blog, página 2'],
  ['GET', `/${blog}/`, 'novo', 'artigo do blog'],
  ['GET', '/artigo-publicado-depois-do-build/', 'wp', 'postagem nova (até o próximo build)'],
  ['GET', '/category/servidores/', 'novo', 'categoria do blog'],
  ['GET', '/cases-de-sucesso/', 'novo', 'cases'],
  ['GET', '/politica-de-privacidade/', 'novo', 'política de privacidade'],
  ['GET', '/nuvem-privada/', 'novo', 'Nuvem Privada'],
  ['GET', '/orcamento/', 'novo', 'Orçamento'],
  ['GET', '/robots.txt', 'novo', 'robots.txt'],
  ['GET', '/sitemap-site.xml', 'novo', 'sitemap do site'],
  ['GET', '/busca.json', 'novo', 'índice da busca'],
  ['GET', '/sitemap.xml', 'wp', 'sitemap do All in One SEO'],
  ['GET', '/feed/', 'wp', 'feed'],
  ['GET', '/wp-json/wc/store/v1/cart', 'wp', 'Store API (carrinho)'],
  ['POST', '/wp-json/wc/store/v1/cart/add-item', 'wp', 'Store API (adicionar)'],
  ['GET', '/wp-json/wc/store/v1/checkout', 'wp', 'Store API checkout (GET)'],
  ['POST', '/wp-json/wc/store/v1/checkout', '403', 'Store API checkout (POST) bloqueado'],
  ['POST', '/wp-admin/admin-ajax.php', 'wp', 'formulários (admin-ajax)'],
  ['GET', '/wp-login.php', 'wp', 'login'],
  ['GET', '/parciais/suporte/', 'wp', 'casca do suporte não é pública'],
  ['GET', '/404.html', '404', '404.html só é usada internamente (location internal)'],
];

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failures.push(msg);
};
try {
  for (const [method, url, want, label] of CASES) {
    const res = await req(method, url);
    const got = origin(res);
    let ok = got === want;
    if (ok && want === 'novo') ok = res.status === 200 && (method === 'HEAD' || res.body.length > 0);
    if (ok && want === '302') ok = res.headers.location?.endsWith('/finalizar-compra/');
    check(ok, `${method} ${url} → ${got} ${res.status}${res.headers.location ? ` → ${res.headers.location}` : ''} (${label}; esperado: ${want})`);
  }
  // Conteúdo e tipo: a página do site novo, o JSON da busca.
  const home = await req('GET', '/');
  check(/<meta name="generator" content="Astro/.test(home.body), 'a home servida é a do build (meta generator Astro)');
  check(/application\/json/.test((await req('GET', '/busca.json')).headers['content-type'] ?? ''), '/busca.json com Content-Type application/json');
  // Arquivos com hash: cache longo e os cabeçalhos de segurança (o add_header da location não apaga os do server).
  for (const f of [`/_astro/${astro}`, cloudAstro && `/solucoes-cloud/_astro/${cloudAstro}`].filter(Boolean)) {
    const a = await req('GET', f);
    check(a.status === 200 && /immutable/.test(a.headers['cache-control'] ?? ''), `${f} → ${a.status}, cache longo`);
    check(a.headers['x-content-type-options'] === 'nosniff' && !!a.headers['strict-transport-security'], `${f}: cabeçalhos de segurança presentes`);
  }
  for (const [url, who] of [['/sobre/', 'site novo'], ['/minha-conta/', 'WordPress']]) {
    const r = await req('GET', url);
    check(r.headers['x-content-type-options'] === 'nosniff' && r.headers['x-frame-options'] === 'SAMEORIGIN' && !!r.headers['strict-transport-security'], `${url} (${who}): cabeçalhos de segurança presentes`);
  }
  // http → https em qualquer endereço, com o caminho e os parâmetros.
  const h = await req('GET', '/sobre/?utm_source=x', { port: PORT_HTTP });
  check(h.status === 301 && h.headers.location === 'https://msserver.com.br/sobre/?utm_source=x', `http://…/sobre/?utm_source=x → ${h.status} ${h.headers.location ?? ''}`);
  const w = await req('GET', '/servidores/', { host: 'www.msserver.com.br' });
  check(w.status === 301 && w.headers.location === 'https://msserver.com.br/servidores/', `www → ${w.status} ${w.headers.location ?? ''}`);
  // Todas as rotas da lista do build respondem pelo site novo.
  const routes = (await readFile(path.join(DIST, '_rotas', 'rotas.txt'), 'utf8')).split('\n').filter((l) => l.startsWith('/'));
  let bad = 0;
  for (const r of routes) {
    const res = await req('HEAD', r);
    if (origin(res) !== 'novo' || res.status !== 200) {
      bad++;
      if (bad <= 10) console.log(`  ✗ ${r} → ${origin(res)} ${res.status}`);
    }
  }
  check(bad === 0, `as ${routes.length} rotas da lista do build respondem pelo site novo (HEAD)`);
} finally {
  try {
    nginx('-s', 'stop');
  } catch {
    /* já parado */
  }
  const errors = await readFile(path.join(tmp, 'logs', 'error.log'), 'utf8').catch(() => '');
  if (/\[(emerg|alert|crit)\]/.test(errors)) console.log(errors);
  await rm(tmp, { recursive: true, force: true });
}
console.log(failures.length ? `\n${failures.length} verificação(ões) falharam.` : '\nExemplo de nginx conferido.');
process.exit(failures.length ? 1 : 0);

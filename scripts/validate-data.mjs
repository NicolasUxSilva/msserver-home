// Confere os dados sincronizados antes do build de publicação (docs/DEPLOY.md, "Atualização dos dados").
//
// Sempre (sem rede): coerência interna dos arquivos de src/data/
//  - catálogo: contagem de cada listagem igual à da categoria no WooCommerce; todos os produtos no
//    catálogo geral; imagens de card e de galeria presentes; variações com preço ou indisponíveis;
//  - blog: slugs únicos e sem colidir com páginas do site; imagem destacada presente; contagem de cada
//    categoria igual à listagem;
//  - home: os produtos das abas "Nossa linha" existem no catálogo.
// Com --online: compara com o que está publicado agora (leitura pública, nada é alterado):
//  - produtos, preços, estoque e slugs da Store API do WooCommerce × catalog.json;
//  - total de postagens publicadas e a mais recente × blog.json.
// Sai com erro (código 1) se algo não confere: o build de publicação não deve seguir com dados velhos.
//
// Uso: npm run validate:data [-- --online]   (WP_ORIGIN=http://msserver.com.br sem HTTPS)
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const online = process.argv.includes('--online');
const ORIGIN = (process.env.WP_ORIGIN || 'https://msserver.com.br').replace(/\/$/, '');
const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const json = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
const exists = (rel) => access(path.join(ROOT, rel)).then(() => true, () => false);

// ——— Catálogo ———
const catalog = await json('src/data/catalog.json');
const products = Object.values(catalog.products);
if (catalog.listings.servidores.total !== products.length) fail(`catálogo geral com ${catalog.listings.servidores.total} produtos; catalog.json tem ${products.length}`);
for (const [key, l] of Object.entries(catalog.listings)) {
  if (l.category && l.category.count !== l.total) fail(`listagem ${key}: categoria informa ${l.category.count}, listagem tem ${l.total}`);
  for (const id of l.orders.menu_order) if (!catalog.products[id]) fail(`listagem ${key}: produto ${id} não existe`);
}
for (const p of products) {
  if (p.image && !(await exists(`src/assets/catalog/${p.image}`))) fail(`produto ${p.id}: imagem de card ausente (${p.image})`);
  for (const g of p.gallery) if (!(await exists(`src/assets/gallery/${g.file}`))) fail(`produto ${p.id}: imagem de galeria ausente (${g.file})`);
  if (p.type === 'variable' && !p.variations.length) fail(`produto ${p.id}: variável sem variações`);
}
const seo = await json('src/data/product-seo.json');
for (const p of products) if (!seo[p.id]) fail(`produto ${p.id}: SEO ausente em product-seo.json`);
notes.push(`catálogo: ${products.length} produtos, ${products.reduce((n, p) => n + p.variations.length, 0)} variações, sincronizado em ${catalog.fetchedAt}`);

// ——— Blog ———
const blog = await json('src/data/blog.json');
const RESERVED = new Set(['blog', 'category', 'servidores', 'servidor', 'sobre', 'orcamento', 'carrinho', 'finalizar-compra', 'categoria-produto', 'nuvem-privada', 'extencao-de-garantia', 'backup-em-nuvem', 'consultoria-em-implantacao-de-servidores', 'solucoes-cloud', 'cases-de-sucesso', 'politica-de-privacidade', 'parciais']);
const slugs = new Set();
for (const p of blog.posts) {
  if (slugs.has(p.slug)) fail(`blog: slug repetido ${p.slug}`);
  slugs.add(p.slug);
  if (RESERVED.has(p.slug)) fail(`blog: slug ${p.slug} coincide com uma página do site`);
  if (p.image && !(await exists(`src/assets/blog/${p.image.file}`))) fail(`blog: imagem ausente da postagem ${p.slug}`);
  // Postagem vazia também no WordPress: a página sai com "noindex" e um aviso (decisão pendente da MSSERVER).
  if (!p.content?.trim()) notes.push(`aviso: a postagem ${p.slug} não tem conteúdo publicado no WordPress (página com noindex)`);
}
for (const c of blog.categories) {
  const n = blog.posts.filter((p) => p.categories.includes(c.slug)).length;
  if (n !== c.count) fail(`blog: categoria ${c.slug} informa ${c.count}, há ${n}`);
}
notes.push(`blog: ${blog.posts.length} postagens, a mais recente de ${blog.posts.map((p) => p.date).sort().at(-1)?.slice(0, 10)}, sincronizado em ${blog.fetchedAt}`);

// ——— Home ———
const home = await json('src/data/products.json');
for (const id of Object.keys(home.products)) if (!catalog.products[id]) fail(`home: produto ${id} das abas não está no catálogo`);

// ——— Comparação com o publicado ———
if (online) {
  const get = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (MSSERVER data check)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return res;
  };
  const live = [];
  for (let page = 1; ; page++) {
    const res = await get(`${ORIGIN}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    live.push(...(await res.json()));
    if (page >= Number(res.headers.get('x-wp-totalpages') || 1)) break;
  }
  const liveIds = new Set(live.map((p) => String(p.id)));
  for (const p of live) if (!catalog.products[p.id]) fail(`loja: produto novo ${p.id} (${p.name}) não está no catálogo do site`);
  for (const id of Object.keys(catalog.products)) if (!liveIds.has(id)) fail(`loja: produto ${id} não está mais publicado`);
  for (const p of live) {
    const s = catalog.products[p.id];
    if (!s) continue;
    const unit = 10 ** p.prices.currency_minor_unit;
    const r = p.prices.price_range;
    const min = Number(r ? r.min_amount : p.prices.price) / unit;
    const max = Number(r ? r.max_amount : p.prices.price) / unit;
    const snap = s.price ? [s.price.min, s.price.max] : [0, 0];
    if (Math.abs(snap[0] - min) > 0.005 || Math.abs(snap[1] - max) > 0.005) fail(`loja: preço de ${p.id} mudou (${snap.join('–')} → ${min}–${max})`);
    if (p.is_in_stock !== s.inStock) fail(`loja: estoque de ${p.id} mudou`);
    if (p.slug !== s.slug) fail(`loja: endereço de ${p.id} mudou (${s.slug} → ${p.slug})`);
  }
  const res = await get(`${ORIGIN}/wp-json/wp/v2/posts?per_page=1&_fields=id,date`);
  const total = Number(res.headers.get('x-wp-total'));
  const [last] = await res.json();
  if (total !== blog.posts.length) fail(`blog: ${total} postagens publicadas; blog.json tem ${blog.posts.length}`);
  if (last && !blog.posts.some((p) => p.id === last.id)) fail(`blog: a postagem mais recente (${last.id}, ${last.date}) não está no blog.json`);
  notes.push(`publicado agora: ${live.length} produtos e ${total} postagens`);
}

for (const n of notes) console.log(`· ${n}`);
if (problems.length) {
  console.error(`\n${problems.length} problema(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\nRode a sincronização (npm run sync:all) antes do build de publicação.');
  process.exit(1);
}
console.log(online ? '\nDados conferidos com o publicado: tudo certo.' : '\nDados coerentes (sem comparar com o publicado; use --online).');

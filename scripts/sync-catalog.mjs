// Sincroniza o catálogo de servidores (/servidores/ e categorias Dell, HP e IBM) a partir do
// WooCommerce de msserver.com.br, pela Store API pública. Nada é digitado à mão: produtos, preços,
// imagens, categorias, atributos, botões e a ordem de cada listagem vêm do próprio WooCommerce.
//
//  - Produtos: todos os publicados no catálogo (os mesmos 74 de /servidores/).
//  - Ordem de cada listagem, para cada ordenação do WooCommerce (padrão, popularidade, avaliação,
//    mais recentes, preço crescente e decrescente), calculada pelo servidor.
//  - Imagem principal de cada produto, baixada do WordPress e enquadrada como nos cards da home
//    (fundo branco aparado e área útil padronizada, sem cortar o equipamento).
//  - Barra lateral original: últimas postagens e categorias do blog.
//
// Uso: npm run sync:catalog
// Com o certificado HTTPS do site fora do ar: WP_ORIGIN=http://msserver.com.br npm run sync:catalog
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://msserver.com.br';
const ORIGIN = (process.env.WP_ORIGIN || SITE).replace(/\/$/, '');
const API = `${ORIGIN}/wp-json`;
const UA = 'Mozilla/5.0 (MSSERVER catalog build script)';
const IMG_DIR = 'src/assets/catalog';

// Listagens do catálogo. O catálogo geral usa a ordem do widget de produtos do Elementor
// (mais recentes primeiro); as categorias, a ordenação padrão do WooCommerce.
const LISTINGS = [
  { key: 'servidores', category: null, defaultOrder: 'date' },
  { key: 'dell', category: 'dell', defaultOrder: 'menu_order' },
  { key: 'hp', category: 'hp', defaultOrder: 'menu_order' },
  { key: 'ibm', category: 'ibm', defaultOrder: 'menu_order' },
];
// Ordenações do WooCommerce (valores de ?orderby=) e o equivalente na Store API.
const ORDERS = {
  menu_order: 'orderby=menu_order&order=asc',
  popularity: 'orderby=popularity&order=desc',
  rating: 'orderby=rating&order=desc',
  date: 'orderby=date&order=desc',
  price: 'orderby=price&order=asc',
  'price-desc': 'orderby=price&order=desc',
};

/** URLs do site passam pela origem configurada (ex.: http enquanto o HTTPS estiver fora do ar). */
const viaOrigin = (url) => url.replace(/^https?:\/\/msserver\.com\.br/, ORIGIN);

async function get(url) {
  const res = await fetch(viaOrigin(url), { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res;
}

async function all(endpoint) {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await get(`${API}${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out.push(...(await res.json()));
    if (page >= Number(res.headers.get('x-wp-totalpages') || 1)) return out;
  }
}

const decode = (s = '') =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#0?82;&#0?36;/g, 'R$')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

async function save(rel, buffer) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
}

/** Mesmo enquadramento das fotos de "Nossa linha" na home: 800 × 600, fundo branco. */
async function frame(raw) {
  const { data: trimmed, info } = await sharp(raw)
    .flatten({ background: '#ffffff' })
    .trim({ background: '#ffffff', threshold: 18 })
    .toBuffer({ resolveWithObject: true });
  // Ampliação de até 3× (a mesma que o card original do WordPress já aplicava às fotos pequenas,
  // exibidas em 300 px), para que nenhum equipamento fique minúsculo na grade.
  const scale = Math.min(640 / info.width, 420 / info.height, 3);
  const resized = await sharp(trimmed)
    .resize({ width: Math.round(info.width * scale), height: Math.round(info.height * scale), kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });
  const padX = 800 - resized.info.width;
  const padY = 600 - resized.info.height;
  return sharp(resized.data)
    .extend({ left: Math.floor(padX / 2), right: Math.ceil(padX / 2), top: Math.floor(padY / 2), bottom: Math.ceil(padY / 2), background: '#ffffff' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

console.log(`Origem: ${ORIGIN}`);
const categories = await all('/wc/store/v1/products/categories');
const catBySlug = new Map(categories.map((c) => [c.slug, c]));
const raw = await all('/wc/store/v1/products');
console.log(`Produtos: ${raw.length}`);

// Ordem de cada listagem em cada ordenação (o servidor decide; aqui só se guarda o resultado).
const listings = {};
for (const l of LISTINGS) {
  const cat = l.category ? catBySlug.get(l.category) : null;
  if (l.category && !cat) throw new Error(`Categoria ${l.category} não encontrada`);
  const orders = {};
  for (const [key, q] of Object.entries(ORDERS)) {
    const list = await all(`/wc/store/v1/products?${q}${cat ? `&category=${cat.id}` : ''}&_fields=id`);
    orders[key] = list.map((p) => p.id);
  }
  const ids = new Set(orders.menu_order);
  for (const o of Object.values(orders)) if (o.length !== ids.size || o.some((id) => !ids.has(id))) throw new Error(`Ordenações diferentes em ${l.key}`);
  listings[l.key] = { category: cat ? { id: cat.id, slug: cat.slug, name: decode(cat.name), link: cat.link, count: cat.count } : null, defaultOrder: l.defaultOrder, total: ids.size, orders };
  console.log(`  ${l.key}: ${ids.size} produtos`);
}
if (listings.servidores.total !== raw.length) throw new Error('O catálogo geral não tem todos os produtos');

await rm(path.join(ROOT, IMG_DIR), { recursive: true, force: true });
const products = {};
for (const p of raw) {
  const unit = 10 ** p.prices.currency_minor_unit;
  const range = p.prices.price_range;
  const min = Number(range ? range.min_amount : p.prices.price) / unit;
  const max = Number(range ? range.max_amount : p.prices.price) / unit;
  const img = p.images[0];
  let image = null;
  if (img?.src) {
    image = `${p.id}.jpg`;
    await save(`${IMG_DIR}/${image}`, await frame(Buffer.from(await (await get(img.src)).arrayBuffer())));
  }
  // Botão do card, como o WooCommerce define: produto variável → "Selecionar opções" (página do
  // produto); sem preço → página do produto; com preço → adiciona ao carrinho (?add-to-cart=ID).
  const addUrl = p.add_to_cart?.url || p.permalink;
  const button = {
    text: decode(p.add_to_cart?.text) || 'Selecionar opções',
    kind: addUrl.startsWith('?add-to-cart=') ? 'add-to-cart' : p.type === 'variable' ? 'options' : 'link',
    url: addUrl.startsWith('?') ? `${p.permalink}${addUrl}` : addUrl,
    label: decode(p.add_to_cart?.description),
  };
  products[p.id] = {
    id: p.id,
    name: decode(p.name),
    slug: p.slug,
    url: p.permalink,
    type: p.type,
    categories: p.categories.map((c) => c.slug),
    image,
    imageSrc: img?.src ?? null,
    imageCount: p.images.length,
    // Preço como o WooCommerce exibe (vazio quando o produto não tem preço publicado).
    price: p.price_html ? { min, max } : null,
    priceText: decode(p.price_html),
    onSale: p.on_sale,
    purchasable: p.is_purchasable,
    inStock: p.is_in_stock,
    rating: Number(p.average_rating || 0),
    reviews: p.review_count,
    attributes: p.attributes.map((a) => ({ name: a.name, variations: a.has_variations, terms: a.terms.map((t) => t.name) })),
    shortDescription: decode(p.short_description),
    button,
  };
}

// Barra lateral original: últimas postagens e categorias do blog (widgets do WordPress).
const posts = (await (await get(`${API}/wp/v2/posts?per_page=5&_fields=id,title,link,date`)).json()).map((p) => ({ id: p.id, title: decode(p.title.rendered), url: p.link }));
const blogCategories = (await all('/wp/v2/categories?_fields=id,name,link,count&hide_empty=true'))
  .map((c) => ({ id: c.id, name: decode(c.name), url: c.link }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

await save(
  'src/data/catalog.json',
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      source: `${SITE}/wp-json/wc/store/v1/products`,
      categories: Object.fromEntries(categories.map((c) => [c.slug, { id: c.id, name: decode(c.name), link: c.link, count: c.count }])),
      listings,
      products,
      blog: { posts, categories: blogCategories },
    },
    null,
    1,
  ) + '\n',
);
console.log(`Gravado: src/data/catalog.json (${Object.keys(products).length} produtos, ${Object.keys(products).filter((id) => products[id].image).length} imagens)`);

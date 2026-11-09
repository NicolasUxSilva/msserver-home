// Sincroniza o catálogo (/servidores/, categorias Dell, HP e IBM e as categorias de componentes:
// Componentes, Baterias, Dissipadores, Fans, Fontes, Gavetas e Placas de rede) a partir do
// WooCommerce de msserver.com.br, pela Store API pública. Nada é digitado à mão: produtos, preços,
// imagens, categorias, atributos, botões e a ordem de cada listagem vêm do próprio WooCommerce.
//
//  - Produtos: todos os publicados no catálogo (os mesmos 74 de /servidores/).
//  - Ordem de cada listagem, para cada ordenação do WooCommerce (padrão, popularidade, avaliação,
//    mais recentes, preço crescente e decrescente), calculada pelo servidor.
//  - Imagem principal de cada produto, baixada do WordPress e enquadrada como nos cards da home
//    (fundo branco aparado e área útil padronizada, sem cortar o equipamento).
//  - Página de cada produto (/servidor/slug/): todas as imagens da galeria (enquadradas em 4:3, na
//    resolução que o original permite), a descrição publicada, as variações (opções que existem de
//    fato, com preço e disponibilidade de cada uma) e os nomes dos campos do formulário do
//    WooCommerce. Título, descrição e JSON-LD (All in One SEO) vêm da página publicada do produto
//    (src/data/product-seo.json).
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
const GALLERY_DIR = 'src/assets/gallery';

// Listagens do catálogo. O catálogo geral usa a ordem do widget de produtos do Elementor
// (mais recentes primeiro); as categorias, a ordenação padrão do WooCommerce.
const LISTINGS = [
  { key: 'servidores', category: null, defaultOrder: 'date' },
  ...['dell', 'hp', 'ibm', 'componentes', 'baterias', 'dissipadores', 'fans', 'fontes', 'gavetas', 'placas-de-rede'].map((slug) => ({ key: slug, category: slug, defaultOrder: 'menu_order' })),
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
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;/g, '…')
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

/** Galeria da página do produto: o mesmo fundo branco aparado, num quadro 4:3 em que a peça ocupa
 *  até 86% da largura ou 80% da altura (todas as fotos com a mesma presença). A resolução acompanha a
 *  do original: de 1000 a 1600 px de largura, com ampliação de no máximo 3× nas fotos pequenas. */
async function frameGallery(raw) {
  const { data: trimmed, info } = await sharp(raw)
    .flatten({ background: '#ffffff' })
    .trim({ background: '#ffffff', threshold: 18 })
    .toBuffer({ resolveWithObject: true });
  const canvas = Math.max(info.width / 0.86, ((info.height / 0.8) * 4) / 3);
  const scale = Math.min(Math.min(1600, Math.max(1000, canvas)) / canvas, 3);
  const W = Math.round(canvas * scale);
  const H = Math.round((W * 3) / 4);
  const w = Math.min(W, Math.round(info.width * scale));
  const h = Math.min(H, Math.round(info.height * scale));
  const resized = await sharp(trimmed).resize({ width: w, height: h, kernel: 'lanczos3' }).toBuffer();
  return sharp(resized)
    .extend({ left: Math.floor((W - w) / 2), right: Math.ceil((W - w) / 2), top: Math.floor((H - h) / 2), bottom: Math.ceil((H - h) / 2), background: '#ffffff' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}

/** Nome do campo do atributo no formulário do WooCommerce: attribute_pa_x (atributo global) ou
 *  attribute_ + sanitize_title(nome) (atributo do próprio produto). */
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Dados de SEO da página publicada do produto (All in One SEO): título, descrição e JSON-LD. */
async function pageSeo(url) {
  const html = await (await get(url)).text();
  const pick = (re) => html.match(re)?.[1];
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const title = decode(pick(/<title>([\s\S]*?)<\/title>/));
  if (!title || !ld.length) throw new Error(`SEO não encontrado em ${url}`);
  return { title, description: decode(pick(/<meta name="description" content="([^"]*)"/) ?? ''), schema: ld.length === 1 ? ld[0] : ld };
}

console.log(`Origem: ${ORIGIN}`);
const categories = await all('/wc/store/v1/products/categories');
const catBySlug = new Map(categories.map((c) => [c.slug, c]));
const raw = await all('/wc/store/v1/products');
console.log(`Produtos: ${raw.length}`);
// Variações (preço e disponibilidade de cada opção), numa listagem só.
const variationById = new Map((await all('/wc/store/v1/products?type=variation')).map((v) => [v.id, v]));
console.log(`Variações: ${variationById.size}`);

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
  if (cat && cat.count !== ids.size) throw new Error(`${l.key}: a categoria informa ${cat.count} produtos e a listagem trouxe ${ids.size}`);
  listings[l.key] = { category: cat ? { id: cat.id, slug: cat.slug, name: decode(cat.name), link: cat.link, count: cat.count } : null, defaultOrder: l.defaultOrder, total: ids.size, orders };
  console.log(`  ${l.key}: ${ids.size} produtos`);
}
if (listings.servidores.total !== raw.length) throw new Error('O catálogo geral não tem todos os produtos');

await rm(path.join(ROOT, IMG_DIR), { recursive: true, force: true });
await rm(path.join(ROOT, GALLERY_DIR), { recursive: true, force: true });
const products = {};
const seo = {};
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
  // Galeria completa, na ordem do WooCommerce (a primeira é a imagem destacada).
  const gallery = [];
  for (const [i, im] of p.images.entries()) {
    const buf = Buffer.from(await (await get(im.src)).arrayBuffer());
    const meta = await sharp(buf).metadata();
    const file = `${p.id}-${i}.jpg`;
    await save(`${GALLERY_DIR}/${file}`, await frameGallery(buf));
    gallery.push({ file, src: im.src, alt: decode(im.alt), width: meta.width, height: meta.height });
  }
  // Atributos de variação: só as opções que têm variação (as que o formulário do WooCommerce oferece),
  // na ordem dele, com o nome do campo e o valor que o formulário envia.
  const fieldOf = (a) => `attribute_${a.taxonomy ?? slugify(a.name)}`;
  const varAttrs = p.attributes
    .filter((a) => a.has_variations)
    .map((a) => {
      const used = new Set(p.variations.flatMap((v) => v.attributes.filter((x) => x.name === a.name).map((x) => x.value)));
      if (used.has('')) throw new Error(`${p.id}: variação com "qualquer ${a.name}" (não tratada)`);
      return { name: decode(a.name), field: fieldOf(a), options: a.terms.filter((t) => used.has(t.slug)).map((t) => ({ value: t.slug, label: decode(t.name) })) };
    });
  const variations = p.variations.map((v) => {
    const d = variationById.get(v.id);
    if (!d) throw new Error(`${p.id}: variação ${v.id} não encontrada`);
    const vu = 10 ** d.prices.currency_minor_unit;
    return {
      id: v.id,
      attributes: Object.fromEntries(v.attributes.map((x) => [fieldOf(p.attributes.find((a) => a.name === x.name)), x.value])),
      price: d.prices.price === '' ? null : Number(d.prices.price) / vu,
      regularPrice: d.prices.regular_price === '' ? null : Number(d.prices.regular_price) / vu,
      inStock: d.is_in_stock,
      purchasable: d.is_purchasable,
    };
  });
  for (const a of varAttrs) if (variations.some((v) => !a.options.some((o) => o.value === v.attributes[a.field]))) throw new Error(`${p.id}: valor de variação fora das opções de ${a.name}`);
  seo[p.id] = await pageSeo(p.permalink);

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
    // Página do produto
    description: p.description.trim(),
    gallery,
    variationAttributes: varAttrs,
    variations,
    button,
  };
}

await save('src/data/product-seo.json', JSON.stringify(seo, null, 1) + '\n');

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
console.log(`Gravado: src/data/catalog.json (${Object.keys(products).length} produtos, ${Object.keys(products).filter((id) => products[id].image).length} imagens de card, ${Object.values(products).reduce((n, p) => n + p.gallery.length, 0)} de galeria, ${Object.values(products).reduce((n, p) => n + p.variations.length, 0)} variações) e src/data/product-seo.json`);

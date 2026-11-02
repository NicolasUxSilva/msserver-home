// Atualiza o conteúdo dinâmico da home a partir do WordPress/WooCommerce de msserver.com.br:
//  - produtos das abas "Nossa linha" (Store API do WooCommerce), com as mesmas IDs e a
//    mesma ordem exibidas hoje na home do WordPress;
//  - as 3 postagens mais recentes do blog (REST API do WordPress).
// Fotos de produto e imagens destacadas são baixadas para src/assets/ e otimizadas no build.
// Uso: npm run sync
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const API = 'https://msserver.com.br/wp-json';
const UA = 'Mozilla/5.0 (MSSERVER home build script)';

// Abas da seção "Nossa linha" da home atual (templates Elementor 5007, 5022 e 5428).
export const TABS = [
  { id: 'rack', label: 'Rack', products: [5668, 5642, 4990, 4935, 4881, 4866] },
  { id: 'torre', label: 'Torre', products: [4966, 4958, 4954, 4924, 4917, 4905] },
  { id: 'escala-nuvem', label: 'Escala Nuvem', products: [4990, 5614, 5642, 5649, 5655, 5662] },
];

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res;
}

async function save(rel, buffer) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
}

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\[&hellip;\]|&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

async function products() {
  const ids = [...new Set(TABS.flatMap((t) => t.products))];
  const list = await (await get(`${API}/wc/store/v1/products?include=${ids.join(',')}&per_page=50`)).json();
  const byId = new Map(list.map((p) => [p.id, p]));
  const out = {};
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) throw new Error(`Produto ${id} não encontrado na Store API`);
    const src = p.images[0]?.src;
    const file = `src/assets/products/${id}.jpg`;
    if (src) {
      const raw = Buffer.from(await (await get(src)).arrayBuffer());
      // Mesmo enquadramento das landings: fundo branco recortado e área útil padronizada.
      const { data: trimmed, info } = await sharp(raw)
        .flatten({ background: '#ffffff' })
        .trim({ background: '#ffffff', threshold: 18 })
        .toBuffer({ resolveWithObject: true });
      const scale = Math.min(640 / info.width, 420 / info.height, 1.8);
      const resized = await sharp(trimmed)
        .resize({ width: Math.round(info.width * scale), height: Math.round(info.height * scale), kernel: 'lanczos3' })
        .toBuffer({ resolveWithObject: true });
      const padX = 800 - resized.info.width;
      const padY = 600 - resized.info.height;
      const framed = await sharp(resized.data)
        .extend({ left: Math.floor(padX / 2), right: Math.ceil(padX / 2), top: Math.floor(padY / 2), bottom: Math.ceil(padY / 2), background: '#ffffff' })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
      await save(file, framed);
    }
    const unit = 10 ** p.prices.currency_minor_unit;
    const range = p.prices.price_range;
    out[id] = {
      id,
      name: decode(p.name),
      url: p.permalink,
      image: src ? `${id}.jpg` : null,
      imageAlt: p.images[0]?.alt || '',
      min: Number(range ? range.min_amount : p.prices.price) / unit,
      max: Number(range ? range.max_amount : p.prices.price) / unit,
      rating: Number(p.average_rating || 0),
      button: p.add_to_cart?.text || 'Selecionar opções',
    };
    console.log('  ✓', id, out[id].name);
  }
  await save('src/data/products.json', JSON.stringify({ fetchedAt: new Date().toISOString(), tabs: TABS, products: out }, null, 2) + '\n');
}

async function commentsLabel(postId) {
  const res = await get(`${API}/wp/v2/comments?post=${postId}&per_page=1`);
  const n = Number(res.headers.get('x-wp-total') || 0);
  return n === 0 ? 'No Comments' : n === 1 ? 'One Comment' : `${n} Comments`;
}

async function posts() {
  const list = await (await get(`${API}/wp/v2/posts?per_page=3&_embed=wp:featuredmedia`)).json();
  const out = [];
  for (const p of list) {
    const media = p._embedded?.['wp:featuredmedia']?.[0];
    let image = null;
    if (media?.source_url) {
      const raw = Buffer.from(await (await get(media.source_url)).arrayBuffer());
      image = `post-${p.id}.jpg`;
      await save(`src/assets/posts/${image}`, await sharp(raw).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
    }
    out.push({
      id: p.id,
      date: p.date,
      url: p.link,
      title: decode(p.title.rendered),
      excerpt: decode(p.excerpt.rendered).replace(/\s*…$/, ''),
      image,
      imageAlt: media?.alt_text || decode(p.title.rendered),
      // Mesmo texto do widget de posts do Elementor usado na home atual.
      comments: await commentsLabel(p.id),
    });
    console.log('  ✓ post', p.id, out.at(-1).title);
  }
  await save('src/data/posts.json', JSON.stringify({ fetchedAt: new Date().toISOString(), posts: out }, null, 2) + '\n');
}

console.log('Produtos');
await products();
console.log('Postagens');
await posts();

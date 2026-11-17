// Sincroniza o blog a partir do WordPress de msserver.com.br (REST API pública), sem nada digitado à mão:
//  - todas as postagens publicadas: título, data, última alteração, resumo, categorias, o conteúdo
//    completo (HTML como publicado; a limpeza para exibição fica em src/lib/post-html.ts) e a imagem
//    destacada (baixada para src/assets/blog/ e otimizada no build);
//  - título, descrição e dados estruturados (JSON-LD) do All in One SEO, lidos da página publicada de
//    cada postagem, como nas páginas de produto;
//  - as categorias do blog (nome, endereço e contagem) e a contagem de comentários aprovados.
// O resultado vai para src/data/blog.json, usado pelo blog (/blog/, /slug/, /category/slug/), pela
// seção de postagens da home e pela barra de postagens do catálogo.
//
// Uso: npm run sync:blog   (WP_ORIGIN=http://msserver.com.br se o HTTPS do site estiver fora do ar)
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://msserver.com.br';
const ORIGIN = (process.env.WP_ORIGIN || SITE).replace(/\/$/, '');
const API = `${ORIGIN}/wp-json`;
const UA = 'Mozilla/5.0 (MSSERVER blog build script)';
const IMG_DIR = 'src/assets/blog';

const viaOrigin = (url) => url.replace(/^https?:\/\/msserver\.com\.br/, ORIGIN);

async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(viaOrigin(url), { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
      return res;
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
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
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\[&hellip;\]|&hellip;|\[…\]/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

async function save(rel, buffer) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
}

/** SEO da página publicada (All in One SEO): título, descrição e JSON-LD. */
async function pageSeo(url) {
  const html = await (await get(url)).text();
  const pick = (re) => html.match(re)?.[1];
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const title = decode(pick(/<title>([\s\S]*?)<\/title>/));
  if (!title) throw new Error(`Título não encontrado em ${url}`);
  return { title, description: decode(pick(/<meta name="description" content="([^"]*)"/) ?? ''), schema: ld.length === 1 ? ld[0] : ld };
}

console.log(`Origem: ${ORIGIN}`);
const categories = (await all('/wp/v2/categories?_fields=id,slug,name,count,link,description')).map((c) => ({ id: c.id, slug: c.slug, name: decode(c.name), count: c.count, url: c.link }));
const catById = new Map(categories.map((c) => [c.id, c]));
const raw = await all('/wp/v2/posts?status=publish&_embed=wp:featuredmedia');
console.log(`Postagens: ${raw.length}`);
const comments = await all('/wp/v2/comments?_fields=post');
const commentsByPost = comments.reduce((m, c) => m.set(c.post, (m.get(c.post) ?? 0) + 1), new Map());

await mkdir(path.join(ROOT, IMG_DIR), { recursive: true });
const keep = new Set();
const posts = [];
for (const p of raw.sort((a, b) => b.date.localeCompare(a.date))) {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  let image = null;
  if (media?.source_url) {
    const buf = Buffer.from(await (await get(media.source_url)).arrayBuffer());
    const file = `${p.id}.jpg`;
    const out = await sharp(buf).flatten({ background: '#ffffff' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    await save(`${IMG_DIR}/${file}`, out.data);
    keep.add(file);
    image = { file, src: media.source_url, alt: decode(media.alt_text || ''), width: out.info.width, height: out.info.height };
  }
  const seo = await pageSeo(p.link);
  posts.push({
    id: p.id,
    slug: p.slug,
    url: p.link,
    date: p.date,
    modified: p.modified,
    title: decode(p.title.rendered),
    excerpt: decode(p.excerpt.rendered).replace(/\s*…$/, ''),
    categories: p.categories.map((id) => catById.get(id)?.slug).filter(Boolean),
    image,
    content: p.content.rendered,
    comments: commentsByPost.get(p.id) ?? 0,
    commentStatus: p.comment_status,
    seo,
  });
  console.log('  ✓', p.date.slice(0, 10), p.slug);
}

// Postagens no endereço /slug/ (raiz do site): o slug não pode coincidir com uma página deste site.
const RESERVED = new Set(['blog', 'category', 'servidores', 'servidor', 'sobre', 'orcamento', 'carrinho', 'finalizar-compra', 'categoria-produto', 'nuvem-privada', 'extencao-de-garantia', 'backup-em-nuvem', 'consultoria-em-implantacao-de-servidores', 'solucoes-cloud', 'cases-de-sucesso', 'politica-de-privacidade', 'busca.json', '_astro']);
const clash = posts.filter((p) => RESERVED.has(p.slug));
if (clash.length) throw new Error(`Slug de postagem igual a uma página do site: ${clash.map((p) => p.slug).join(', ')}`);
const counts = categories.map((c) => [c.slug, c.count, posts.filter((p) => p.categories.includes(c.slug)).length]).filter(([, a, b]) => a !== b);
if (counts.length) throw new Error(`Contagem de categoria diferente da listagem: ${JSON.stringify(counts)}`);

// Remove imagens de postagens que não existem mais.
for (const f of await readdir(path.join(ROOT, IMG_DIR))) if (!keep.has(f)) await rm(path.join(ROOT, IMG_DIR, f));

await save(
  'src/data/blog.json',
  JSON.stringify({ fetchedAt: new Date().toISOString(), source: `${SITE}/wp-json/wp/v2/posts`, categories: categories.filter((c) => c.count > 0), posts }, null, 1) + '\n',
);
console.log(`Gravado: src/data/blog.json (${posts.length} postagens, ${categories.filter((c) => c.count > 0).length} categorias, ${comments.length} comentários aprovados)`);

// Sitemap das páginas servidas por este site (/sitemap-site.xml): home, institucionais, catálogo
// (listagens e as 74 páginas de produto), blog (listagem, categorias e artigos, com a data da última
// alteração), cases e soluções. Ficam fora as páginas de transação e as que não devem ser indexadas
// (carrinho, finalização, política em aprovação, 404, casca do suporte). As páginas que continuam no
// WordPress (suporte, aplicativo, landings) seguem no sitemap do All in One SEO (/sitemap.xml), que o
// robots.txt também lista.
import type { APIRoute } from 'astro';
import { ROUTES, SITE, blogCategoryRoute, postRoute, productRoute } from '../config/site';
import { LISTINGS, LISTING_KEYS, PRODUCTS, pagesOf } from '../data/catalog';
import { CATEGORIES, POSTS, pagesFor, postsIn } from '../data/blog';
import { POLICY } from '../data/privacidade';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const abs = (path: string) => `${SITE.origin}${BASE && path.startsWith(BASE) ? path.slice(BASE.length) : path}`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = () => {
  const urls: { loc: string; lastmod?: string }[] = [];
  const add = (path: string, lastmod?: string) => urls.push({ loc: abs(path), lastmod });
  for (const r of [ROUTES.home, ROUTES.about, ROUTES.quote, ROUTES.cases, ROUTES.cloud, ROUTES.servidoresFisicos, ROUTES.nuvemPrivada, ROUTES.garantia, ROUTES.backup, ROUTES.consultoria]) add(r);
  if (POLICY.approved) add(ROUTES.privacy);
  for (const k of LISTING_KEYS) {
    add(LISTINGS[k].path);
    for (let n = 2; n <= pagesOf(k); n++) add(`${LISTINGS[k].path}page/${n}/`);
  }
  for (const p of Object.values(PRODUCTS)) add(productRoute(p.slug));
  const newest = POSTS[0]?.modified.slice(0, 10);
  add(ROUTES.blog, newest);
  for (let n = 2; n <= pagesFor(postsIn()); n++) add(`${ROUTES.blog}page/${n}/`, newest);
  for (const c of CATEGORIES) add(blogCategoryRoute(c.slug));
  for (const p of POSTS) add(postRoute(p.slug), p.modified.slice(0, 10));
  const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

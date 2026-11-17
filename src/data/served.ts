// Endereços servidos por este site: usados para transformar links absolutos do conteúdo vindo do
// WordPress (postagens, descrições) em links internos, e para gerar a lista de rotas do roteamento
// de produção (scripts/routes.mjs lê o build). Quando a página não é servida aqui, o link continua
// absoluto para msserver.com.br (o WordPress continua respondendo por ela).
import { ROUTES, blogCategoryRoute, postRoute, productRoute } from '../config/site';
import { PRODUCTS } from './catalog';
import { CATEGORIES, POSTS } from './blog';

const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
const strip = (p: string) => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) : p) || '/';

/** Caminhos (sem o BASE_PATH) das páginas deste site. */
const SERVED = new Set<string>([
  ...Object.values(ROUTES).map(strip),
  ...Object.values(PRODUCTS).map((p) => strip(productRoute(p.slug))),
  ...POSTS.map((p) => strip(postRoute(p.slug))),
  ...CATEGORIES.map((c) => strip(blogCategoryRoute(c.slug))),
]);

/** Link interno equivalente a uma URL de msserver.com.br servida por este site; null nos demais. */
export function internalPath(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/^(www\.)?msserver\.com\.br$/i.test(u.hostname)) return null;
  const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
  if (!SERVED.has(path)) return null;
  return `${BASE}${path}${u.search}${u.hash}`;
}

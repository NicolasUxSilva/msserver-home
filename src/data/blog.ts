// Blog: dados sincronizados do WordPress (src/data/blog.json, gerado por scripts/sync-blog.mjs) e as
// regras das listagens. Postagens, datas, categorias, imagens e o conteúdo completo vêm do WordPress;
// nada aqui é digitado à mão. Endereços iguais aos do WordPress: /blog/ (e /blog/page/N/), cada
// postagem em /slug/ e cada categoria em /category/slug/ (e /page/N/).
import data from './blog.json';
import { ROUTES, blogCategoryRoute, postRoute } from '../config/site';

export type BlogImage = { file: string; src: string; alt: string; width: number; height: number };
export type BlogPost = {
  id: number;
  slug: string;
  url: string;
  date: string;
  modified: string;
  title: string;
  excerpt: string;
  categories: string[];
  image: BlogImage | null;
  content: string;
  comments: number;
  commentStatus: string;
  seo: { title: string; description: string; schema: unknown };
};
export type BlogCategory = { id: number; slug: string; name: string; count: number; url: string };

/** Postagens da mais recente para a mais antiga. */
export const POSTS = (data.posts as BlogPost[]).slice().sort((a, b) => b.date.localeCompare(a.date));
export const CATEGORIES = (data.categories as BlogCategory[]).slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
export const BLOG_FETCHED_AT = data.fetchedAt;

/** Como no WordPress: 12 postagens por página. */
export const PER_PAGE = 12;

export const categoryOf = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const postsIn = (slug?: string) => (slug ? POSTS.filter((p) => p.categories.includes(slug)) : POSTS);
export const pagesFor = (list: BlogPost[]) => Math.max(1, Math.ceil(list.length / PER_PAGE));

/** Endereço de uma página da listagem (do blog ou de uma categoria). */
export const listingUrl = (category: string | undefined, page: number) => {
  const base = category ? blogCategoryRoute(category) : ROUTES.blog;
  return page > 1 ? `${base}page/${page}/` : base;
};

/** Categorias exibidas numa postagem ("Sem categoria" não informa nada). */
export const visibleCategories = (p: BlogPost) => p.categories.filter((c) => c !== 'sem-categoria').map(categoryOf).filter((c): c is BlogCategory => !!c);

/** Data como no WordPress em português: "14 de novembro de 2026". */
export const formatDate = (iso: string) => new Date(`${iso}${iso.endsWith('Z') ? '' : '-03:00'}`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });

/** Postagem anterior e seguinte (por data), como a navegação "Anterior / Próximo" do WordPress. */
export function neighbors(p: BlogPost) {
  const i = POSTS.findIndex((x) => x.id === p.id);
  return { newer: i > 0 ? POSTS[i - 1] : null, older: i < POSTS.length - 1 ? POSTS[i + 1] : null };
}

/** Leitura relacionada: as mais recentes das mesmas categorias (fora "Sem categoria") e, para
 *  completar, as mais recentes do blog. */
export function related(p: BlogPost, n = 3) {
  const cats = p.categories.filter((c) => c !== 'sem-categoria');
  const same = POSTS.filter((x) => x.id !== p.id && x.categories.some((c) => cats.includes(c)));
  const rest = POSTS.filter((x) => x.id !== p.id && !same.includes(x));
  return [...same, ...rest].slice(0, n);
}

export const postPath = (p: BlogPost) => postRoute(p.slug);

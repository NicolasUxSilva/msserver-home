// Índice da busca do blog (/blog/busca.json): título, resumo, categorias, data, endereço e miniatura
// de cada postagem, com o texto de busca sem acentos (título, resumo e categorias). Gerado no build a
// partir de blog.json; o navegador só baixa quando alguém busca.
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { POSTS, formatDate, postPath, visibleCategories } from '../../data/blog';
import { normalize } from '../../lib/catalog-shared';

const files = import.meta.glob<{ default: ImageMetadata }>('../../assets/blog/*.jpg', { eager: true });

export const GET: APIRoute = async () => {
  const posts = await Promise.all(
    POSTS.map(async (p) => {
      const src = p.image ? files[`../../assets/blog/${p.image.file}`]?.default : undefined;
      const img = src ? await getImage({ src, width: 640, format: 'webp', quality: 70 }) : null;
      const cats = visibleCategories(p).map((c) => c.name);
      return { t: p.title, e: p.excerpt, u: postPath(p), d: p.date, df: formatDate(p.date), c: cats, i: img?.src ?? null, s: normalize([p.title, p.excerpt, ...cats].join(' ')) };
    }),
  );
  return new Response(JSON.stringify({ posts }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};

// Índice da busca do cabeçalho (/busca.json): os produtos do catálogo com o mesmo texto de busca do
// catálogo (src/data/catalog.ts: searchIndex — nome, fabricante, categorias, atributos, opções e
// códigos de peça, sem acentos), a miniatura, o preço publicado e o endereço da página; e as
// listagens do catálogo, para sugerir a categoria. Gerado no build a partir de catalog.json: nenhum
// dado é digitado à mão. O cabeçalho só baixa este arquivo quando a pessoa começa a buscar.
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { BRANDS, LISTINGS, LISTING_KEYS, PRODUCTS, categoryName, orderOf, priceParts, searchIndex, totalOf } from '../data/catalog';
import { productRoute } from '../config/site';
import { normalize } from '../lib/catalog-shared';
import { BUY } from '../data/produto';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/catalog/*.jpg', { eager: true });

export const GET: APIRoute = async () => {
  // Ordem de desempate: a do catálogo geral (mais recentes primeiro), como em /servidores/.
  const order = orderOf('servidores', LISTINGS.servidores.defaultOrder);
  const products = await Promise.all(
    order.map(async (id) => {
      const p = PRODUCTS[String(id)];
      const src = p.image ? files[`../assets/catalog/${p.image}`]?.default : undefined;
      const img = src ? await getImage({ src, width: 112, format: 'webp', quality: 70 }) : null;
      const price = priceParts(p);
      const brand = p.categories.find((c) => c in BRANDS);
      return {
        id: p.id,
        n: p.name,
        u: productRoute(p.slug),
        i: img?.src ?? null,
        p: price ? price.join(' – ') : BUY.noPrice,
        b: brand ? BRANDS[brand] : null,
        c: p.categories.filter((c) => !(c in BRANDS) && c !== 'sem-categoria').map(categoryName),
        // Nome sem acentos (para pontuar quem tem a palavra no nome) e o texto completo de busca.
        nn: normalize(p.name),
        s: searchIndex(p),
      };
    }),
  );
  const categories = LISTING_KEYS.filter((k) => k !== 'servidores').map((k) => ({ k, t: LISTINGS[k].title, u: LISTINGS[k].path, n: totalOf(k), s: normalize(LISTINGS[k].title) }));
  return new Response(JSON.stringify({ products, categories }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};

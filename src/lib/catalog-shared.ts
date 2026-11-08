// Regras do catálogo usadas tanto na geração das páginas (Astro) quanto no navegador
// (src/scripts/catalog.ts): o mesmo texto de contagem, a mesma paginação e os mesmos endereços.

export type OrderKey = 'menu_order' | 'popularity' | 'rating' | 'date' | 'price' | 'price-desc';

/** Ordenações do WooCommerce (valores de ?orderby=), com os textos do WooCommerce em português. */
export const ORDER_OPTIONS: { key: OrderKey; label: string }[] = [
  { key: 'menu_order', label: 'Ordenação padrão' },
  { key: 'popularity', label: 'Popularidade' },
  { key: 'rating', label: 'Média de classificação' },
  { key: 'date', label: 'Mais recentes' },
  { key: 'price', label: 'Preço: menor para maior' },
  { key: 'price-desc', label: 'Preço: maior para menor' },
];

/** Texto para busca: minúsculas, sem acentos, espaços simples. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.+]+/g, ' ')
    .trim();

/** Todas as palavras da busca precisam aparecer no texto do produto. */
export const matches = (index: string, query: string) => {
  const words = normalize(query).split(' ').filter(Boolean);
  return words.every((w) => index.includes(w));
};

/** Mesmo texto do WooCommerce ("Showing 1–12 of 74 results"), em português. */
export function resultCount(first: number, last: number, total: number) {
  if (total === 0) return 'Nenhum resultado';
  if (total === 1) return 'Mostrando o único resultado';
  if (first === 1 && last === total) return `Mostrando todos os ${total} resultados`;
  return `Mostrando ${first}–${last} de ${total} resultados`;
}

export type PageItem = { type: 'page'; n: number } | { type: 'gap' };

/** Páginas exibidas: primeira, última, a atual e as vizinhas; reticências no meio. */
export function pageItems(current: number, pages: number): PageItem[] {
  const keep = new Set([1, pages, current - 1, current, current + 1].filter((n) => n >= 1 && n <= pages));
  const out: PageItem[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev === 2) out.push({ type: 'page', n: prev + 1 });
    else if (n - prev > 2) out.push({ type: 'gap' });
    out.push({ type: 'page', n });
    prev = n;
  }
  return out;
}

export type CatalogState = { page: number; orderby: OrderKey; busca: string; tipo: string };

/** Endereço de um estado: página no caminho (/page/2/, como no WooCommerce) e o resto na busca. */
export function stateUrl(base: string, s: CatalogState, defaultOrder: OrderKey) {
  const q = new URLSearchParams();
  if (s.orderby !== defaultOrder) q.set('orderby', s.orderby);
  if (s.tipo) q.set('tipo', s.tipo);
  if (s.busca.trim()) q.set('busca', s.busca.trim());
  const qs = q.toString();
  return `${base}${s.page > 1 ? `page/${s.page}/` : ''}${qs ? `?${qs}` : ''}`;
}

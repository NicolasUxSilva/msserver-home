// Catálogo de servidores: dados sincronizados do WooCommerce (src/data/catalog.json, gerado por
// scripts/sync-catalog.mjs) e a configuração das 4 listagens. Produtos, preços, imagens, categorias,
// atributos, botões e a ordem de cada ordenação vêm do WooCommerce; nada aqui é digitado à mão.
import data from './catalog.json';
import schemas from './catalog-schema.json';
import { ROUTES } from '../config/site';
import { normalize, type OrderKey } from '../lib/catalog-shared';

export type Product = {
  id: number;
  name: string;
  slug: string;
  url: string;
  type: string;
  categories: string[];
  image: string | null;
  imageSrc: string | null;
  imageCount: number;
  price: { min: number; max: number } | null;
  priceText: string;
  onSale: boolean;
  purchasable: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
  attributes: { name: string; variations: boolean; terms: string[] }[];
  shortDescription: string;
  button: { text: string; kind: 'options' | 'link' | 'add-to-cart'; url: string; label: string };
};

export type ListingKey = 'servidores' | 'dell' | 'hp' | 'ibm';

type Listing = {
  key: ListingKey;
  /** Nome exibido (título publicado em caixa de frase, como no resto do site). */
  title: string;
  /** Palavra desenhada em contorno no fundo da abertura (como nas artes da hero). */
  wordmark: string;
  /** Rótulo na navegação entre fabricantes. */
  navLabel: string;
  seoTitle: string;
  canonical: string;
  path: string;
  /** Produtos por página, como no WordPress: 12 no widget de /servidores/, 16 nas categorias. */
  perPage: number;
  defaultOrder: OrderKey;
  /** Parâmetro de página do WordPress que continua aceito (/servidores/?product-page=3). */
  legacyPageParam?: string;
};

export const LISTINGS: Record<ListingKey, Listing> = {
  servidores: {
    key: 'servidores',
    title: 'Servidores',
    wordmark: 'SERVIDORES',
    navLabel: 'Todos',
    seoTitle: 'Servidores - MSSERVER',
    canonical: 'https://msserver.com.br/servidores/',
    path: ROUTES.servers,
    perPage: 12,
    defaultOrder: 'date',
    legacyPageParam: 'product-page',
  },
  dell: { key: 'dell', title: 'Dell', wordmark: 'DELL', navLabel: 'Dell', seoTitle: 'DELL - MSSERVER', canonical: 'https://msserver.com.br/categoria-produto/dell/', path: ROUTES.dell, perPage: 16, defaultOrder: 'menu_order' },
  hp: { key: 'hp', title: 'HP', wordmark: 'HP', navLabel: 'HP', seoTitle: 'HP - MSSERVER', canonical: 'https://msserver.com.br/categoria-produto/hp/', path: ROUTES.hp, perPage: 16, defaultOrder: 'menu_order' },
  ibm: { key: 'ibm', title: 'IBM', wordmark: 'IBM', navLabel: 'IBM', seoTitle: 'IBM - MSSERVER', canonical: 'https://msserver.com.br/categoria-produto/ibm/', path: ROUTES.ibm, perPage: 16, defaultOrder: 'menu_order' },
};
export const LISTING_KEYS = Object.keys(LISTINGS) as ListingKey[];

export const PRODUCTS = data.products as unknown as Record<string, Product>;
export const product = (id: number) => PRODUCTS[String(id)];
export const SCHEMAS = schemas as unknown as Record<ListingKey, unknown>;
export const BLOG = data.blog;
export const FETCHED_AT = data.fetchedAt;

/** Ids de uma listagem numa ordenação (a ordem é a do WooCommerce). */
export const orderOf = (key: ListingKey, order: OrderKey): number[] => (data.listings as unknown as Record<ListingKey, { orders: Record<OrderKey, number[]> }>)[key].orders[order];
export const totalOf = (key: ListingKey) => orderOf(key, 'menu_order').length;
export const pagesOf = (key: ListingKey) => Math.max(1, Math.ceil(totalOf(key) / LISTINGS[key].perPage));

/** Fabricantes (categorias do WooCommerce) e como aparecem no site. */
export const BRANDS: Record<string, string> = { dell: 'Dell', hp: 'HP', ibm: 'IBM' };

/** Categorias usadas como filtro, na ordem exibida: formato/linha dos servidores e componentes.
 *  "Sem categoria" (categoria padrão do WooCommerce) não informa nada e fica de fora. */
export const FILTER_GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'Servidores', slugs: ['rack', 'torre', 'escala-nuvem'] },
  { label: 'Componentes', slugs: ['componentes', 'baterias', 'dissipadores', 'fans', 'fontes', 'gavetas', 'placas-de-rede'] },
];
export const categoryName = (slug: string) => BRANDS[slug] ?? (data.categories as Record<string, { name: string }>)[slug]?.name ?? slug;

/** Filtros com produtos nesta listagem (com a contagem). */
export function filtersFor(key: ListingKey) {
  const ids = orderOf(key, 'menu_order');
  return FILTER_GROUPS.map((g) => ({
    label: g.label,
    items: g.slugs.map((slug) => ({ slug, name: categoryName(slug), count: ids.filter((id) => product(id).categories.includes(slug)).length })).filter((x) => x.count > 0),
  })).filter((g) => g.items.length);
}

/** Texto em que a busca procura: nome, categorias, atributos e descrição curta. */
export const searchIndex = (p: Product) =>
  normalize([p.name, ...p.categories.map(categoryName), ...p.attributes.flatMap((a) => [a.name, ...a.terms]), p.shortDescription].join(' '));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** Preço como o WooCommerce mostra: valor único ou faixa "mínimo – máximo". */
export const priceParts = (p: Product) => (p.price ? (p.price.min === p.price.max ? [brl.format(p.price.min)] : [brl.format(p.price.min), brl.format(p.price.max)]) : null);

/** Valores do atributo em ordem crescente (8GB, 16GB, 32GB…), sem mudar como estão escritos. */
export const sortedTerms = (terms: string[]) => [...terms].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b));

// Catálogo: dados sincronizados do WooCommerce (src/data/catalog.json, gerado por
// scripts/sync-catalog.mjs) e a configuração das listagens — o catálogo geral, as categorias de
// fabricante (Dell, HP, IBM) e as de componentes (Componentes, Baterias, Dissipadores, Fans, Fontes,
// Gavetas, Placas de Rede). Produtos, preços, imagens, categorias, atributos, botões e a ordem de cada
// ordenação vêm do WooCommerce; nada aqui é digitado à mão.
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

export type ListingKey = 'servidores' | 'dell' | 'hp' | 'ibm' | 'componentes' | 'baterias' | 'dissipadores' | 'fans' | 'fontes' | 'gavetas' | 'placas-de-rede';

type Listing = {
  key: ListingKey;
  /** Nome exibido (título publicado em caixa de frase, como no resto do site). */
  title: string;
  /** Palavra desenhada em contorno no fundo da abertura (como nas artes da hero). */
  wordmark: string;
  /** Rótulo na navegação entre as categorias do catálogo. */
  navLabel: string;
  /** Grupo na navegação, como no menu do site: Servidores (todos e fabricantes) e Componentes. */
  group: 'servidores' | 'componentes';
  /** Caminho até a listagem, como no menu do site (Servidores › Componentes › Baterias). */
  parents: ListingKey[];
  seoTitle: string;
  canonical: string;
  path: string;
  /** Produtos por página, como no WordPress: 12 no widget de /servidores/, 16 nas categorias. */
  perPage: number;
  defaultOrder: OrderKey;
  /** Parâmetro de página do WordPress que continua aceito (/servidores/?product-page=3). */
  legacyPageParam?: string;
};

/** Categoria do WooCommerce (/categoria-produto/slug/): 16 por página, na ordenação padrão da loja,
 *  com o título e o título de SEO publicados (o nome de fabricante em caixa de marca: DELL → Dell). */
function category(key: Exclude<ListingKey, 'servidores'>, title: string, published: string, path: string, group: Listing['group']): Listing {
  return {
    key,
    title,
    wordmark: published.toUpperCase(),
    navLabel: title,
    group,
    // As subcategorias de componentes ficam sob "Componentes", como no menu do site.
    parents: group === 'servidores' || key === 'componentes' ? ['servidores'] : ['servidores', 'componentes'],
    seoTitle: `${published} - MSSERVER`,
    canonical: `https://msserver.com.br/categoria-produto/${key}/`,
    path,
    perPage: 16,
    defaultOrder: 'menu_order',
  };
}

export const LISTINGS: Record<ListingKey, Listing> = {
  servidores: {
    key: 'servidores',
    title: 'Servidores',
    wordmark: 'SERVIDORES',
    navLabel: 'Todos',
    group: 'servidores',
    parents: [],
    seoTitle: 'Servidores - MSSERVER',
    canonical: 'https://msserver.com.br/servidores/',
    path: ROUTES.servers,
    perPage: 12,
    defaultOrder: 'date',
    legacyPageParam: 'product-page',
  },
  dell: category('dell', 'Dell', 'DELL', ROUTES.dell, 'servidores'),
  hp: category('hp', 'HP', 'HP', ROUTES.hp, 'servidores'),
  ibm: category('ibm', 'IBM', 'IBM', ROUTES.ibm, 'servidores'),
  componentes: category('componentes', 'Componentes', 'Componentes', ROUTES.componentes, 'componentes'),
  baterias: category('baterias', 'Baterias', 'Baterias', ROUTES.baterias, 'componentes'),
  dissipadores: category('dissipadores', 'Dissipadores', 'Dissipadores', ROUTES.dissipadores, 'componentes'),
  fans: category('fans', 'Fans', 'Fans', ROUTES.fans, 'componentes'),
  fontes: category('fontes', 'Fontes', 'Fontes', ROUTES.fontes, 'componentes'),
  gavetas: category('gavetas', 'Gavetas', 'Gavetas', ROUTES.gavetas, 'componentes'),
  'placas-de-rede': category('placas-de-rede', 'Placas de Rede', 'Placas de Rede', ROUTES.placasDeRede, 'componentes'),
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

/** Filtros desta listagem, com a contagem: só categorias que separam parte dos produtos. Uma
 *  categoria que reúne todos eles (Fans dentro de Fans) não filtra nada e fica de fora; sem nenhuma
 *  categoria útil, a página não mostra a linha de filtros. */
export function filtersFor(key: ListingKey) {
  const ids = orderOf(key, 'menu_order');
  return FILTER_GROUPS.map((g) => ({
    label: g.label,
    items: g.slugs.map((slug) => ({ slug, name: categoryName(slug), count: ids.filter((id) => product(id).categories.includes(slug)).length })).filter((x) => x.count > 0 && x.count < ids.length),
  })).filter((g) => g.items.length);
}

/** Categorias que todos os produtos da listagem têm (a própria categoria da página, e "Componentes"
 *  dentro de Fans): no card, a etiqueta não informaria nada e não é repetida. */
export function sharedCategories(key: ListingKey) {
  const ids = orderOf(key, 'menu_order');
  return [...new Set(ids.flatMap((id) => product(id).categories))].filter((c) => ids.every((id) => product(id).categories.includes(c)));
}

/** Navegação do catálogo nos dois grupos do menu do site: Servidores e Componentes. */
export const NAV_GROUPS = (['servidores', 'componentes'] as const).map((group) => ({
  key: group,
  label: group === 'servidores' ? 'Servidores' : 'Componentes',
  items: LISTING_KEYS.filter((k) => LISTINGS[k].group === group),
}));

/** Trilha da listagem: Início › Servidores › Componentes › Baterias. */
export const trailOf = (key: ListingKey) => [...LISTINGS[key].parents, key].map((k) => ({ key: k, label: LISTINGS[k].title, href: LISTINGS[k].path }));

/** Texto em que a busca procura: nome, categorias, atributos e descrição curta. */
export const searchIndex = (p: Product) =>
  normalize([p.name, ...p.categories.map(categoryName), ...p.attributes.flatMap((a) => [a.name, ...a.terms]), p.shortDescription].join(' '));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** Preço como o WooCommerce mostra: valor único ou faixa "mínimo – máximo". */
export const priceParts = (p: Product) => (p.price ? (p.price.min === p.price.max ? [brl.format(p.price.min)] : [brl.format(p.price.min), brl.format(p.price.max)]) : null);

/** Valores do atributo em ordem crescente (8GB, 16GB, 32GB…), sem mudar como estão escritos. */
export const sortedTerms = (terms: string[]) => [...terms].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b));

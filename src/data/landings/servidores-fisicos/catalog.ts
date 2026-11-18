// Tipos e nomes do catálogo gerado por `npm run sync:catalog` (src/data/catalog.json).
import catalogJson from './catalog.json';

export type Tier = 'scalable' | 'e5v34' | 'e5v12' | 'entry' | 'legacy';

export interface CatalogVariation {
  ramGb: number;
  priceCents: number | null;
  inStock: boolean;
}

export interface CatalogModel {
  id: number;
  slug: string;
  name: string;
  brand: string;
  formFactor: 'rack' | 'torre';
  tier: Tier;
  sockets: number;
  family: string;
  url: string;
  inStock: boolean;
  minPriceCents: number | null;
  variations: CatalogVariation[];
}

export interface Catalog {
  source: string;
  fetchedAt: string;
  currency: string;
  models: CatalogModel[];
}

export const catalog = catalogJson as Catalog;

/** Nome da plataforma exibido nos cartões de modelo. */
export const TIER_TITLE: Record<Tier, string> = {
  scalable: 'Intel Xeon Scalable',
  e5v34: 'Intel Xeon E5 v3/v4',
  e5v12: 'Intel Xeon E5 v1/v2',
  entry: 'Processador único (entrada)',
  legacy: 'Gerações anteriores',
};

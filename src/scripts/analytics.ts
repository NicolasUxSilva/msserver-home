// Eventos de análise (docs/TRACKING.md). Nunca envie dados pessoais (nome, e-mail, telefone, texto
// digitado): só identificadores de produto, quantidades, valores e o lugar do clique.
//
//  - track(): evento simples no dataLayer (GTM), ex.: contact_whatsapp_click, catalog_search.
//  - trackEcommerce(): eventos de comércio no padrão do GA4 (view_item, add_to_cart,
//    remove_from_cart, view_cart, begin_checkout, generate_lead) com o objeto "ecommerce", limpo antes
//    de cada envio, como o GA4 recomenda. Para o Google Ads, view_item e add_to_cart também saem no
//    formato do plugin Google Listings & Ads do WordPress (send_to "GLA", itens "gla_<id>"), para
//    que o remarketing e o Merchant Center continuem recebendo os mesmos dados.
// Os eventos ficam na fila do dataLayer; só saem do navegador se o GTM ou o gtag.js forem carregados,
// o que depende de PUBLIC_TRACKING e do consentimento da pessoa (src/scripts/consent.ts).
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const dl = () => (window.dataLayer = window.dataLayer ?? []);

export function track(event: string, params: Record<string, string | number | boolean | undefined> = {}) {
  dl().push({ event, ...params });
}

export type EcomItem = {
  /** Id do produto no WooCommerce (o do produto pai nas variações). */
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  /** Opções escolhidas (ex.: "32GB"). */
  item_variant?: string;
  /** Id da variação no WooCommerce, quando houver. */
  variation_id?: string;
  price?: number;
  quantity?: number;
};

export type EcomEvent = 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout' | 'generate_lead';

const GLA_EVENTS = new Set<EcomEvent>(['view_item', 'add_to_cart']);

export function trackEcommerce(event: EcomEvent, data: { value: number; items: EcomItem[] }, extra: Record<string, string | number | undefined> = {}) {
  const value = Math.round(data.value * 100) / 100;
  dl().push({ ecommerce: null });
  dl().push({ event, ecommerce: { currency: 'BRL', value, items: data.items }, ...extra });
  // Google Listings & Ads (mesmo formato do WordPress).
  if (GLA_EVENTS.has(event) && typeof window.gtag === 'function') {
    window.gtag('event', event, {
      send_to: 'GLA',
      ecomm_pagetype: event === 'view_item' ? 'product' : 'cart',
      value,
      items: data.items.map((i) => ({
        id: `gla_${i.variation_id ?? i.item_id}`,
        price: i.price,
        quantity: i.quantity,
        google_business_vertical: 'retail',
        name: i.item_name,
        category: [i.item_brand, i.item_category, i.item_category2].filter(Boolean).join(' & '),
      })),
    });
  }
}

type StoreItem = { id: number; name: string; permalink: string; quantity: number; variation: { attribute: string; value: string }[]; prices: { price: string; currency_minor_unit: number } };

/** Itens do carrinho da Store API no formato do GA4 (ids, nomes, opções, preço e quantidade). O
 *  produto pai vem do endereço do item (o carrinho informa o id da variação). */
export function cartItems(items: StoreItem[], parents: Record<string, { id: number; brand?: string | null }> = {}, quantity?: (i: StoreItem) => number) {
  return items.map((i) => {
    const info = parents[i.permalink.split('?')[0]];
    const parent = info && info.id !== i.id ? info.id : undefined;
    return {
      item_id: String(parent ?? info?.id ?? i.id),
      variation_id: parent ? String(i.id) : undefined,
      item_name: decode(i.name),
      item_brand: info?.brand ?? undefined,
      item_variant: i.variation.map((v) => decode(v.value)).join(', ') || undefined,
      price: Number(i.prices.price) / 10 ** i.prices.currency_minor_unit,
      quantity: quantity ? quantity(i) : i.quantity,
    } satisfies EcomItem;
  });
}

const decode = (s: string) => {
  const t = document.createElement('textarea');
  t.innerHTML = s;
  return t.value;
};

/** Valor total de uma lista de itens (preço × quantidade). */
export const itemsValue = (items: EcomItem[]) => items.reduce((n, i) => n + (i.price ?? 0) * (i.quantity ?? 1), 0);

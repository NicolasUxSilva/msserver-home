import type { Page, Route } from '@playwright/test';
import catalog from '../../src/data/catalog.json' with { type: 'json' };

// Store API do WooCommerce simulada nos testes (nenhuma requisição chega à loja real). As respostas
// seguem o formato do WooCommerce 8.2 (packages/woocommerce-blocks/src/StoreApi: CartSchema e
// CartItemSchema): valores em unidades mínimas, a moeda como no carrinho vazio real da loja (BRL,
// "R$ ", vírgula e ponto), o cabeçalho "Nonce" em toda resposta e exigido nas alterações.

type P = {
  id: number;
  name: string;
  url: string;
  imageSrc: string | null;
  type: string;
  price: { min: number; max: number } | null;
  purchasable: boolean;
  variationAttributes: { name: string; field: string; options: { value: string; label: string }[] }[];
  variations: { id: number; attributes: Record<string, string>; price: number | null; purchasable: boolean }[];
};
const PRODUCTS = Object.values(catalog.products as unknown as Record<string, P>);

const MONEY = {
  currency_code: 'BRL',
  currency_symbol: 'R$',
  currency_minor_unit: 2,
  currency_decimal_separator: ',',
  currency_thousand_separator: '.',
  currency_prefix: 'R$ ',
  currency_suffix: '',
};

export type MockLine = { key: string; id: number; quantity: number };
export type MockRequest = { method: string; path: string; body: Record<string, unknown> | null; nonce: string | null };

/** Produto ou variação do catálogo pelo id que a Store API recebe. */
function resolve(id: number) {
  for (const p of PRODUCTS) {
    if (p.id === id) return { product: p, variation: null };
    const v = p.variations.find((x) => x.id === id);
    if (v) return { product: p, variation: v };
  }
  return null;
}

const keyOf = (id: number) => (id.toString(16) + '0'.repeat(32)).slice(0, 32);

function item(line: MockLine) {
  const r = resolve(line.id)!;
  const { product: p, variation: v } = r;
  const unit = Math.round((v ? v.price! : p.price!.min) * 100);
  const attrs = v
    ? p.variationAttributes.map((a) => ({ raw_attribute: a.field, attribute: a.name, value: a.options.find((o) => o.value === v.attributes[a.field])!.label }))
    : [];
  const query = v ? `?${Object.entries(v.attributes).map(([k, val]) => `${k}=${encodeURIComponent(val)}`).join('&')}` : '';
  return {
    key: line.key,
    id: line.id,
    quantity: line.quantity,
    quantity_limits: { minimum: 1, maximum: 9999, multiple_of: 1, editable: true },
    name: p.name.replace(/–/g, '&#8211;'),
    short_description: '',
    description: '',
    sku: '',
    low_stock_remaining: null,
    backorders_allowed: false,
    show_backorder_badge: false,
    sold_individually: false,
    permalink: `${p.url}${query}`,
    images: p.imageSrc ? [{ id: 1, src: p.imageSrc, thumbnail: p.imageSrc, srcset: '', sizes: '', name: '', alt: '' }] : [],
    variation: attrs,
    item_data: [],
    prices: { price: String(unit), regular_price: String(unit), sale_price: String(unit), price_range: null, ...MONEY, raw_prices: { precision: 6, price: String(unit * 10000), regular_price: String(unit * 10000), sale_price: String(unit * 10000) } },
    totals: { line_subtotal: String(unit * line.quantity), line_subtotal_tax: '0', line_total: String(unit * line.quantity), line_total_tax: '0', ...MONEY },
    catalog_visibility: 'visible',
    extensions: {},
  };
}

function cartOfLines(lines: MockLine[], billing: Record<string, string> = {}) {
  const items = lines.map(item);
  const sum = items.reduce((n, i) => n + Number(i.totals.line_total), 0);
  return {
    items,
    coupons: [],
    fees: [],
    totals: {
      total_items: String(sum),
      total_items_tax: '0',
      total_fees: '0',
      total_fees_tax: '0',
      total_discount: '0',
      total_discount_tax: '0',
      total_shipping: null,
      total_shipping_tax: null,
      total_price: String(sum),
      total_tax: '0',
      tax_lines: [],
      ...MONEY,
    },
    shipping_address: {},
    billing_address: billing,
    needs_payment: items.length > 0,
    needs_shipping: false,
    payment_requirements: ['products'],
    has_calculated_shipping: false,
    shipping_rates: [],
    items_count: lines.reduce((n, l) => n + l.quantity, 0),
    items_weight: 0,
    cross_sells: [],
    errors: [],
    payment_methods: ['woo_paypal_stripe_gateway_set'],
    extensions: {},
  };
}

/**
 * Liga a Store API simulada na página. `lines` é o carrinho inicial (na sessão); `requests` guarda o
 * que a página enviou. Opções: `down` (a loja não responde: página HTML 404, como em outro domínio),
 * `expireNonceOnce` (o primeiro POST recebe "Nonce is invalid.", como um nonce vencido) e `billing`
 * (dados de cobrança que a sessão do cliente já tem).
 */
export async function mockStore(page: Page, opts: { lines?: MockLine[]; down?: boolean; expireNonceOnce?: boolean; billing?: Record<string, string> } = {}) {
  const state = { lines: [...(opts.lines ?? [])], requests: [] as MockRequest[], nonce: 'n1' };
  const cartOf = (lines: MockLine[]) => cartOfLines(lines, opts.billing);
  let expired = !opts.expireNonceOnce;
  let counter = 1;
  const reply = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json; charset=UTF-8', headers: { Nonce: state.nonce, 'Nonce-Timestamp': '1794220437', 'User-ID': '0' }, body: JSON.stringify(body) });
  const error = (route: Route, status: number, code: string, message: string) => reply(route, status, { code, message, data: { status } });

  await page.route(/\/wp-json\/wc\/store\/v1\/cart(\/[a-z-]+)?(\?.*)?$/, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/wc\/store\/v1/, '');
    const body = req.postData() ? (JSON.parse(req.postData()!) as Record<string, unknown>) : null;
    state.requests.push({ method: req.method(), path, body, nonce: req.headers()['nonce'] ?? null });
    if (opts.down) return route.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>404</title>' });
    if (req.method() === 'GET' && path === '/cart') return reply(route, 200, cartOf(state.lines));
    if (req.method() !== 'POST') return error(route, 404, 'rest_no_route', 'No route was found matching the URL and request method.');
    // Alterações: o nonce é obrigatório (WooCommerce: AbstractCartRoute::check_nonce).
    const nonce = req.headers()['nonce'];
    if (!nonce) return error(route, 401, 'woocommerce_rest_missing_nonce', 'Missing the Nonce header. This endpoint requires a valid nonce.');
    if (!expired) {
      expired = true;
      state.nonce = `n${++counter}`;
      return error(route, 403, 'woocommerce_rest_invalid_nonce', 'Nonce is invalid.');
    }
    if (nonce !== state.nonce) return error(route, 403, 'woocommerce_rest_invalid_nonce', 'Nonce is invalid.');
    state.nonce = `n${++counter}`;
    if (path === '/cart/add-item') {
      const id = Number(body!.id);
      const r = resolve(id);
      const purchasable = r && (r.variation ? r.variation.purchasable : r.product.type !== 'variable' && r.product.purchasable && !!r.product.price);
      if (!r || !purchasable) return error(route, 400, 'woocommerce_rest_product_not_purchasable', 'Desculpe, este produto não pode ser comprado.');
      const qty = Number(body!.quantity ?? 1);
      const found = state.lines.find((l) => l.id === id);
      if (found) found.quantity += qty;
      else state.lines.push({ key: keyOf(id), id, quantity: qty });
      return reply(route, 201, cartOf(state.lines));
    }
    if (path === '/cart/update-item') {
      const line = state.lines.find((l) => l.key === body!.key);
      if (!line) return error(route, 409, 'woocommerce_rest_cart_invalid_key', 'Cart item no longer exists or is invalid.');
      line.quantity = Number(body!.quantity);
      return reply(route, 200, cartOf(state.lines));
    }
    if (path === '/cart/remove-item') {
      const i = state.lines.findIndex((l) => l.key === body!.key);
      if (i === -1) return error(route, 409, 'woocommerce_rest_cart_invalid_key', 'Cart item no longer exists or is invalid.');
      state.lines.splice(i, 1);
      return reply(route, 200, cartOf(state.lines));
    }
    return error(route, 404, 'rest_no_route', 'No route was found matching the URL and request method.');
  });
  return state;
}

export const line = (id: number, quantity = 1): MockLine => ({ key: keyOf(id), id, quantity });

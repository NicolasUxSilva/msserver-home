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
export type MockAddress = Record<string, string>;
/** Resultado do pagamento no POST /checkout: aprovado, recusado (400 com payment_result) ou erro da
 *  forma de pagamento (402, a exceção do process_payment). Sem isto, decide pelo número do cartão. */
export type MockPayment = 'success' | 'failure' | 'error';

/** Cupons aceitos pela loja simulada (código → desconto em centavos ou percentual). */
const COUPONS: Record<string, { type: 'percent' | 'fixed_cart'; amount: number }> = {
  desconto10: { type: 'percent', amount: 10 },
  menos50: { type: 'fixed_cart', amount: 5000 },
  gratis100: { type: 'percent', amount: 100 },
};

const EMPTY_ADDRESS = { first_name: '', last_name: '', company: '', address_1: '', address_2: '', city: '', state: '', postcode: '', country: '', phone: '' };
/** Endereço da sessão de um visitante novo: o país e o estado padrão da loja (BR/SP). */
const sessionAddress = () => ({ ...EMPTY_ADDRESS, state: 'SP', country: 'BR' });

const SHIPPING_RATES = [
  { rate_id: 'flat_rate:1', name: 'Transportadora', price: 5000 },
  { rate_id: 'local_pickup:2', name: 'Retirar na loja', price: 0 },
];

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

type MockState = {
  lines: MockLine[];
  coupons: string[];
  billing: MockAddress;
  shipping: MockAddress;
  needsShipping: boolean;
  rate: string;
};

function cartOf(lines: MockLine[], st?: Partial<MockState>) {
  const items = lines.map(item);
  const sum = items.reduce((n, i) => n + Number(i.totals.line_total), 0);
  const coupons = (st?.coupons ?? []).map((code) => {
    const c = COUPONS[code];
    const discount = Math.min(sum, c.type === 'percent' ? Math.round((sum * c.amount) / 100) : c.amount);
    return { code, discount_type: c.type, totals: { total_discount: String(discount), total_discount_tax: '0', ...MONEY } };
  });
  const discount = coupons.reduce((n, c) => n + Number(c.totals.total_discount), 0);
  const needsShipping = !!st?.needsShipping && items.length > 0;
  const rates = needsShipping ? SHIPPING_RATES.map((r) => ({ ...r, selected: r.rate_id === (st?.rate ?? SHIPPING_RATES[0].rate_id) })) : [];
  const shippingTotal = needsShipping ? rates.find((r) => r.selected)!.price : 0;
  return {
    items,
    coupons,
    fees: [],
    totals: {
      total_items: String(sum),
      total_items_tax: '0',
      total_fees: '0',
      total_fees_tax: '0',
      total_discount: String(discount),
      total_discount_tax: '0',
      total_shipping: needsShipping ? String(shippingTotal) : null,
      total_shipping_tax: needsShipping ? '0' : null,
      total_price: String(sum - discount + shippingTotal),
      total_tax: '0',
      tax_lines: [],
      ...MONEY,
    },
    shipping_address: { ...(st?.shipping ?? sessionAddress()) },
    billing_address: { ...(st?.billing ?? { ...sessionAddress(), email: '' }) },
    needs_payment: sum - discount + shippingTotal > 0,
    needs_shipping: needsShipping,
    payment_requirements: ['products'],
    has_calculated_shipping: needsShipping,
    shipping_rates: needsShipping
      ? [
          {
            package_id: 0,
            name: 'Envio 1',
            destination: {},
            items: [],
            shipping_rates: rates.map((r) => ({ rate_id: r.rate_id, name: r.name, description: '', delivery_time: '', price: String(r.price), taxes: '0', instance_id: 1, method_id: r.rate_id.split(':')[0], meta_data: [], selected: r.selected, ...MONEY })),
          },
        ]
      : [],
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
 * que a página enviou. Opções: `down` (a loja não responde: página HTML 404, como em outro domínio)
 * e `expireNonceOnce` (o primeiro POST recebe "Nonce is invalid.", como um nonce vencido).
 */
export async function mockStore(
  page: Page,
  opts: { lines?: MockLine[]; down?: boolean; expireNonceOnce?: boolean; shipping?: boolean; payment?: MockPayment; billing?: MockAddress; downOnCheckout?: boolean } = {},
) {
  const state = {
    lines: [...(opts.lines ?? [])],
    requests: [] as MockRequest[],
    nonce: 'n1',
    coupons: [] as string[],
    billing: { ...sessionAddress(), email: '', ...(opts.billing ?? {}) } as MockAddress,
    shipping: sessionAddress() as MockAddress,
    needsShipping: !!opts.shipping,
    rate: SHIPPING_RATES[0].rate_id,
    orders: [] as { id: number; status: string; body: Record<string, unknown> }[],
  };
  const cart = () => cartOf(state.lines, state);
  let expired = !opts.expireNonceOnce;
  let counter = 1;
  const reply = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json; charset=UTF-8', headers: { Nonce: state.nonce, 'Nonce-Timestamp': '1794220437', 'User-ID': '0' }, body: JSON.stringify(body) });
  const error = (route: Route, status: number, code: string, message: string) => reply(route, status, { code, message, data: { status } });

  await page.route(/\/wp-json\/wc\/store\/v1\/(cart(\/[a-z-]+)?|checkout)(\?.*)?$/, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/wc\/store\/v1/, '');
    const body = req.postData() ? (JSON.parse(req.postData()!) as Record<string, unknown>) : null;
    state.requests.push({ method: req.method(), path, body, nonce: req.headers()['nonce'] ?? null });
    if (opts.down || (opts.downOnCheckout && path === '/checkout')) return route.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>404</title>' });
    if (req.method() === 'GET' && path === '/cart') return reply(route, 200, cart());
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
      return reply(route, 201, cart());
    }
    if (path === '/cart/update-item') {
      const line = state.lines.find((l) => l.key === body!.key);
      if (!line) return error(route, 409, 'woocommerce_rest_cart_invalid_key', 'Cart item no longer exists or is invalid.');
      line.quantity = Number(body!.quantity);
      return reply(route, 200, cart());
    }
    if (path === '/cart/remove-item') {
      const i = state.lines.findIndex((l) => l.key === body!.key);
      if (i === -1) return error(route, 409, 'woocommerce_rest_cart_invalid_key', 'Cart item no longer exists or is invalid.');
      state.lines.splice(i, 1);
      return reply(route, 200, cart());
    }
    if (path === '/cart/apply-coupon') {
      const code = String(body!.code ?? '').trim().toLowerCase();
      if (!COUPONS[code]) return error(route, 400, 'woocommerce_rest_cart_coupon_error', `Coupon "${code}" does not exist!`);
      if (state.coupons.includes(code)) return error(route, 400, 'woocommerce_rest_cart_coupon_error', `Coupon code "${code}" already applied!`);
      state.coupons.push(code);
      return reply(route, 200, cart());
    }
    if (path === '/cart/remove-coupon') {
      const code = String(body!.code ?? '').toLowerCase();
      if (!state.coupons.includes(code)) return error(route, 400, 'woocommerce_rest_cart_coupon_invalid_code', 'Coupon cannot be removed because it is not already applied to the cart.');
      state.coupons = state.coupons.filter((c) => c !== code);
      return reply(route, 200, cart());
    }
    if (path === '/cart/select-shipping-rate') {
      if (!SHIPPING_RATES.some((r) => r.rate_id === body!.rate_id)) return error(route, 400, 'woocommerce_rest_cart_invalid_shipping_rate', 'Invalid shipping rate.');
      state.rate = String(body!.rate_id);
      return reply(route, 200, cart());
    }
    if (path === '/cart/update-customer') {
      // Como na Store API: o objeto de endereço precisa de todas as chaves e é validado (CEP, telefone).
      for (const [param, required] of [['billing_address', [...Object.keys(EMPTY_ADDRESS), 'email']], ['shipping_address', Object.keys(EMPTY_ADDRESS)]] as const) {
        const a = body![param] as MockAddress | undefined;
        if (!a) continue;
        const missing = required.find((k) => !(k in a));
        if (missing) return error(route, 400, 'rest_invalid_param', `Invalid parameter(s): ${param}`);
        const invalid = addressError(a);
        if (invalid) return reply(route, 400, { code: 'rest_invalid_param', message: `Invalid parameter(s): ${param}`, data: { status: 400, params: { [param]: invalid.message }, details: { [param]: { code: invalid.code, message: invalid.message, data: null } } } });
      }
      if (body!.billing_address) state.billing = { ...(body!.billing_address as MockAddress) };
      if (body!.shipping_address) state.shipping = { ...(body!.shipping_address as MockAddress) };
      return reply(route, 200, cart());
    }
    if (path === '/checkout') return checkout(route, body ?? {});
    return error(route, 404, 'rest_no_route', 'No route was found matching the URL and request method.');
  });
  /** POST /checkout como no WooCommerce 8.2 (Checkout::get_route_post_response e CheckoutTrait). */
  async function checkout(route: Route, body: Record<string, unknown>) {
    if (!state.lines.length) return error(route, 400, 'woocommerce_rest_cart_empty', 'Cannot create order from empty cart.');
    const billing = body.billing_address as MockAddress | undefined;
    if (!billing) return error(route, 400, 'rest_missing_callback_param', 'Missing parameter(s): billing_address');
    for (const [param, a] of [['billing_address', billing], ['shipping_address', body.shipping_address as MockAddress | undefined]] as const) {
      if (!a) continue;
      const invalid = addressError(a);
      if (invalid) return reply(route, 400, { code: 'rest_invalid_param', message: `Invalid parameter(s): ${param}`, data: { status: 400, params: { [param]: invalid.message }, details: { [param]: { code: invalid.code, message: invalid.message, data: null } } } });
    }
    // OrderController::validate_addresses (campos obrigatórios do Brasil).
    const labels: Record<string, string> = { first_name: 'First name', last_name: 'Last name', address_1: 'Address', city: 'City', state: 'State/County', postcode: 'Postal code', country: 'Country/Region' };
    const missing = Object.entries(labels).filter(([k]) => !billing[k]).map(([, l]) => `${l} is required`);
    if (missing.length)
      return reply(route, 400, { code: 'woocommerce_rest_invalid_address', message: `There was a problem with the provided billing address: ${missing.join(', ')}`, data: { status: 400, errors: { billing: missing } } });
    if (!billing.email) return error(route, 400, 'woocommerce_rest_invalid_email_address', 'A valid email address is required');
    const c = cart();
    if (c.needs_payment && !body.payment_method) return error(route, 400, 'woocommerce_rest_checkout_missing_payment_method', 'No payment method provided.');
    if (c.needs_payment && body.payment_method !== 'woo_paypal_stripe_gateway_set') return error(route, 400, 'woocommerce_rest_checkout_payment_method_disabled', `${body.payment_method} is not available for this order—please choose a different payment method`);
    const id = 9000 + state.orders.length + 1;
    const order = { id, status: 'pending', body };
    state.orders.push(order);
    const result = (status: number, payment_status: string, redirect: string, details: { key: string; value: string }[] = []) =>
      reply(route, status, {
        order_id: id,
        status: order.status,
        order_key: `wc_order_mock${id}`,
        order_number: String(id),
        customer_note: body.customer_note ?? '',
        customer_id: 0,
        billing_address: billing,
        shipping_address: body.shipping_address ?? billing,
        payment_method: body.payment_method ?? '',
        payment_result: { payment_status, payment_details: details, redirect_url: redirect },
        extensions: {},
      });
    if (!c.needs_payment) {
      order.status = 'processing';
      state.lines = [];
      return result(200, 'success', `/finalizar-compra/order-received/${id}/?key=wc_order_mock${id}`);
    }
    const data = Object.fromEntries(((body.payment_data ?? []) as { key: string; value: string }[]).map((d) => [d.key, d.value]));
    const number = String(data['card-number'] ?? '').replace(/\s/g, '');
    const outcome = opts.payment ?? (number === '4242424242424242' ? 'success' : number === '4000000000000002' ? 'error' : 'failure');
    if (outcome === 'error') return error(route, 402, 'woocommerce_rest_checkout_process_payment_error', 'Your card was declined.');
    if (outcome === 'failure') return result(400, 'failure', '', [{ key: 'result', value: 'failure' }, { key: 'redirect', value: '' }]);
    order.status = 'processing';
    state.lines = [];
    state.coupons = [];
    return result(200, 'success', `/finalizar-compra/order-received/${id}/?key=wc_order_mock${id}`, [{ key: 'result', value: 'success' }]);
  }

  return state;
}

/** AbstractAddressSchema::validate_callback: CEP, telefone e e-mail (quando informados). */
function addressError(a: MockAddress) {
  if (a.country === 'BR' && a.postcode && !/^\d{5}-?\d{3}$/.test(a.postcode)) return { code: 'invalid_postcode', message: 'The provided postcode / ZIP is not valid' };
  if (a.phone && /[^\s#0-9_\-+/().]/.test(a.phone)) return { code: 'invalid_phone', message: 'The provided phone number is not valid' };
  if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return { code: 'invalid_email', message: 'The provided email address is not valid' };
  return null;
}

export const line = (id: number, quantity = 1): MockLine => ({ key: keyOf(id), id, quantity });

import { STORE_API } from '../config/site';

// Cliente da Store API do WooCommerce (carrinho e finalização de compra). A sessão do carrinho é a
// mesma do WordPress (cookie do WooCommerce, mesmo domínio).
//
// Alterações (adicionar, mudar quantidade, remover, cupom, pedido) exigem o cabeçalho "Nonce", que vem em toda
// resposta do carrinho; o mais recente é sempre o usado. Nonce vencido (403) → lê o carrinho de novo
// e repete uma vez. Referência: WooCommerce 8.2 (packages/woocommerce-blocks/src/StoreApi).

export type Money = {
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

export type CartItem = {
  key: string;
  id: number;
  quantity: number;
  quantity_limits: { minimum: number; maximum: number; multiple_of: number; editable: boolean };
  name: string;
  sku: string;
  permalink: string;
  images: { src: string; thumbnail: string; alt: string }[];
  variation: { attribute: string; value: string }[];
  item_data: { name?: string; key?: string; value?: string; display?: string }[];
  prices: Money & { price: string; regular_price: string; sale_price: string };
  totals: Money & { line_subtotal: string; line_subtotal_tax: string; line_total: string; line_total_tax: string };
  low_stock_remaining: number | null;
  show_backorder_badge: boolean;
  sold_individually: boolean;
};

/** Endereço como a Store API recebe e devolve (o de cobrança tem e-mail). */
export type Address = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
};

export type ShippingRate = Money & { rate_id: string; name: string; description: string; delivery_time: string; price: string; taxes: string; selected: boolean };
export type ShippingPackage = { package_id: number | string; name: string; shipping_rates: ShippingRate[] };

export type Cart = {
  items: CartItem[];
  coupons: { code: string; discount_type?: string; totals: Money & { total_discount: string; total_discount_tax: string } }[];
  fees: { key: string; name: string; totals: Money & { total: string; total_tax: string } }[];
  totals: Money & {
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_discount: string;
    total_shipping: string | null;
    total_tax: string;
    total_price: string;
    tax_lines: { name: string; price: string; rate: string }[];
  };
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  items_count: number;
  errors: { code: string; message: string }[];
  billing_address?: Address;
  shipping_address?: Omit<Address, 'email'>;
  needs_payment?: boolean;
  payment_methods?: string[];
  shipping_rates?: ShippingPackage[];
};

/**
 * Resposta no formato da finalização clássica do WooCommerce ({result, messages, redirect}). A forma
 * de pagamento da loja (woo_paypal_stripe_gateway_set) responde assim por conta própria, encerrando a
 * resposta da Store API (visto em produção em 12/11/2026: result "failure", "Error processing checkout").
 */
export type LegacyCheckoutResult = { result: 'success' | 'failure'; messages?: string; redirect?: string; refresh?: boolean; reload?: boolean };

/** Resposta de POST /checkout (o pedido criado e o resultado do pagamento). */
export type CheckoutResult = {
  order_id: number;
  status: string;
  order_key: string;
  order_number?: string;
  payment_method: string;
  payment_result: { payment_status: 'success' | 'failure' | 'pending' | 'error'; payment_details: { key: string; value: string }[]; redirect_url: string };
};

/** A loja não respondeu como a Store API (rede, outro domínio, página de erro). */
export class StoreUnavailable extends Error {}

/** Erro devolvido pelo WooCommerce (ex.: sem estoque, quantidade inválida), com a mensagem dele. */
export class StoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    /** "data" do erro do WooCommerce (ex.: o campo inválido do endereço). */
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/** Aviso "foi adicionado ao seu carrinho", deixado pela página do produto antes de abrir o carrinho. */
export const ADDED_KEY = 'msserver:cart-added';

let nonce = '';

async function call<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown; result?: boolean } = {}, retried = false): Promise<T> {
  const method = init.method ?? 'GET';
  if (method !== 'GET' && !nonce) await call('/cart');
  let res: Response;
  try {
    res = await fetch(`${STORE_API}${path}`, {
      method,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(method !== 'GET' ? { 'Content-Type': 'application/json', Nonce: nonce } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new StoreUnavailable('Sem conexão com a loja.');
  }
  const fresh = res.headers.get('Nonce') ?? res.headers.get('X-WC-Store-API-Nonce');
  if (fresh) nonce = fresh;
  if (!(res.headers.get('Content-Type') ?? '').includes('json')) throw new StoreUnavailable(`Resposta inesperada (${res.status}).`);
  const data = await res.json().catch(() => {
    throw new StoreUnavailable('Resposta inválida.');
  });
  // POST /checkout devolve o pedido também quando o pagamento é recusado (400 com payment_result).
  if (!res.ok && init.result && data?.payment_result) return data as T;
  if (!res.ok) {
    const code = String(data?.code ?? '');
    if (!retried && (code === 'woocommerce_rest_invalid_nonce' || code === 'woocommerce_rest_missing_nonce')) {
      nonce = '';
      return call<T>(path, init, true);
    }
    if (res.status === 404 && !code.startsWith('woocommerce')) throw new StoreUnavailable('Loja indisponível.');
    throw new StoreError(decodeEntities(String(data?.message ?? 'Não foi possível concluir.')), code, res.status, (data?.data as Record<string, unknown>) ?? {});
  }
  return data as T;
}

export const getCart = () => call<Cart>('/cart');
/** Produto simples (id do produto) ou variação (id da variação: o WooCommerce completa as opções). */
export const addItem = (id: number, quantity: number) => call<Cart>('/cart/add-item', { method: 'POST', body: { id, quantity } });
export const updateItem = (key: string, quantity: number) => call<Cart>('/cart/update-item', { method: 'POST', body: { key, quantity } });
export const removeItem = (key: string) => call<Cart>('/cart/remove-item', { method: 'POST', body: { key } });
export const applyCoupon = (code: string) => call<Cart>('/cart/apply-coupon', { method: 'POST', body: { code } });
export const removeCoupon = (code: string) => call<Cart>('/cart/remove-coupon', { method: 'POST', body: { code } });
/** Endereços na sessão do cliente (o WooCommerce recalcula impostos e frete do carrinho). */
export const updateCustomer = (body: { billing_address?: Partial<Address>; shipping_address?: Partial<Address> }) => call<Cart>('/cart/update-customer', { method: 'POST', body });
export const selectShippingRate = (packageId: number | string, rateId: string) => call<Cart>('/cart/select-shipping-rate', { method: 'POST', body: { package_id: packageId, rate_id: rateId } });
/** Cria o pedido e processa o pagamento (o mesmo processamento da finalização de compra do WooCommerce). */
export const placeOrder = (body: {
  billing_address: Address;
  shipping_address?: Omit<Address, 'email'>;
  customer_note: string;
  payment_method: string;
  payment_data: { key: string; value: string }[];
}) => call<CheckoutResult | LegacyCheckoutResult>('/checkout', { method: 'POST', body, result: true });

/** Valor em unidades mínimas ("395000") no formato da loja: "R$ 3.950,00". */
export function money(value: string | number | null | undefined, m: Money) {
  const n = Number(value ?? 0) / 10 ** m.currency_minor_unit;
  const [int, dec] = Math.abs(n).toFixed(m.currency_minor_unit).split('.');
  const body = int.replace(/\B(?=(\d{3})+(?!\d))/g, m.currency_thousand_separator) + (dec ? m.currency_decimal_separator + dec : '');
  // Espaço não separável depois do "R$" (o valor não quebra de linha).
  return `${n < 0 ? '−' : ''}${m.currency_prefix.replace(/ $/, ' ')}${body}${m.currency_suffix}`;
}

/** Nomes vêm com entidades HTML do WordPress (&#8211; etc.). */
export function decodeEntities(s: string) {
  const ta = document.createElement('textarea');
  ta.innerHTML = s;
  return ta.value;
}

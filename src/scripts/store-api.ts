import { STORE_API } from '../config/site';

// Cliente da Store API do WooCommerce (carrinho). A sessão do carrinho é a mesma do WordPress (cookie
// do WooCommerce, mesmo domínio): o que se adiciona aqui aparece na finalização de compra.
//
// Alterações (adicionar, mudar quantidade, remover) exigem o cabeçalho "Nonce", que vem em toda
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

export type Cart = {
  items: CartItem[];
  coupons: { code: string; totals: Money & { total_discount: string; total_discount_tax: string } }[];
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
};

/** A loja não respondeu como a Store API (rede, outro domínio, página de erro). */
export class StoreUnavailable extends Error {}

/** Erro devolvido pelo WooCommerce (ex.: sem estoque, quantidade inválida), com a mensagem dele. */
export class StoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Aviso "foi adicionado ao seu carrinho", deixado pela página do produto antes de abrir o carrinho. */
export const ADDED_KEY = 'msserver:cart-added';

let nonce = '';

async function call<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}, retried = false): Promise<T> {
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
  if (!res.ok) {
    const code = String(data?.code ?? '');
    if (!retried && (code === 'woocommerce_rest_invalid_nonce' || code === 'woocommerce_rest_missing_nonce')) {
      nonce = '';
      return call<T>(path, init, true);
    }
    if (res.status === 404 && !code.startsWith('woocommerce')) throw new StoreUnavailable('Loja indisponível.');
    throw new StoreError(decodeEntities(String(data?.message ?? 'Não foi possível concluir.')), code, res.status);
  }
  return data as T;
}

export const getCart = () => call<Cart>('/cart');
/** Produto simples (id do produto) ou variação (id da variação: o WooCommerce completa as opções). */
export const addItem = (id: number, quantity: number) => call<Cart>('/cart/add-item', { method: 'POST', body: { id, quantity } });
export const updateItem = (key: string, quantity: number) => call<Cart>('/cart/update-item', { method: 'POST', body: { key, quantity } });
export const removeItem = (key: string) => call<Cart>('/cart/remove-item', { method: 'POST', body: { key } });

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

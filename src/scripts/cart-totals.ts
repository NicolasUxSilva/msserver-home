import { decodeEntities, money, type Cart } from './store-api';

// Linhas de total do carrinho (Subtotal, cupons, taxas, entrega, impostos e Total), com os valores que o
// WooCommerce devolve: usadas no carrinho e no resumo da finalização de compra.

export type TotalsText = {
  subtotal: string;
  coupon: string;
  shipping: string;
  shippingLater: string;
  tax: string;
  total: string;
  /** Com este texto, cada cupom ganha um botão para removê-lo (finalização de compra). */
  removeCoupon?: string;
};

/** Preços exibidos com imposto? (o WooCommerce manda a preferência embutida no preço da unidade). */
export const pricesIncludeTax = (c: Cart) =>
  c.items.some((i) => Number(i.totals.line_subtotal_tax) > 0 && Math.abs(Number(i.prices.price) * i.quantity - (Number(i.totals.line_subtotal) + Number(i.totals.line_subtotal_tax))) <= i.quantity);

export function totalsHtml(c: Cart, T: TotalsText) {
  const t = c.totals;
  const incl = pricesIncludeTax(c);
  const fill = (s: string, v: string) => s.replace('%s', v);
  const row = (dt: string, dd: string, cls = '', extra = '') => `<div class="cart-total${cls ? ` ${cls}` : ''}"><dt>${escapeHtml(dt)}${extra}</dt><dd>${escapeHtml(dd)}</dd></div>`;
  const parts = [row(T.subtotal, money(Number(t.total_items) + (incl ? Number(t.total_items_tax) : 0), t))];
  for (const cp of c.coupons) {
    const code = cp.code.toUpperCase();
    const remove = T.removeCoupon ? ` <button type="button" class="cart-coupon-remove" data-coupon="${escapeHtml(cp.code)}" aria-label="${escapeHtml(`${T.removeCoupon} ${code}`)}">${escapeHtml(T.removeCoupon)}</button>` : '';
    parts.push(row(fill(T.coupon, code), money(-(Number(cp.totals.total_discount) + (incl ? Number(cp.totals.total_discount_tax) : 0)), cp.totals), 'is-discount', remove));
  }
  for (const f of c.fees) parts.push(row(decodeEntities(f.name), money(Number(f.totals.total) + (incl ? Number(f.totals.total_tax) : 0), f.totals)));
  if (c.needs_shipping) parts.push(row(T.shipping, c.has_calculated_shipping && t.total_shipping !== null ? money(t.total_shipping, t) : T.shippingLater));
  if (!incl && Number(t.total_tax) > 0) parts.push(row(T.tax, money(t.total_tax, t)));
  parts.push(row(T.total, money(t.total_price, t), 'is-total'));
  return parts.join('');
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

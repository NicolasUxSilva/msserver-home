// Campos do cartão da finalização de compra: formatação e conferência no navegador, no mesmo formato
// que o formulário de cartão do WooCommerce (wc-credit-card-form + jquery.payment) envia à forma de
// pagamento — número em grupos ("4242 4242 4242 4242"), validade "MM / AA" e código só com números.
// Os dados do cartão nunca são guardados, registrados ou enviados a ferramentas de análise: só seguem,
// no envio do pedido, para o WooCommerce (Store API), como no formulário original.

export type Brand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'dinersclub' | 'jcb' | 'elo' | 'hipercard' | null;

export const digits = (s: string) => s.replace(/\D/g, '');

// Prefixos (os mesmos critérios do jquery.payment, mais Elo e Hipercard, comuns no Brasil). A ordem
// importa: Elo e Hipercard antes de Visa, Discover e Mastercard, cujos prefixos se sobrepõem.
const BRANDS: { brand: Exclude<Brand, null>; re: RegExp }[] = [
  { brand: 'elo', re: /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|9000)|627780|63(6297|6368)|650(03([^4])|04([0-9])|05(0|1)|4(0[5-9]|3[0-9]|8[5-9]|9[0-9])|5([0-2][0-9]|3[0-8])|9([2-6][0-9]|7[0-8])|541|700|720|901)|651652|655000|655021)/ },
  { brand: 'hipercard', re: /^(606282|3841)/ },
  { brand: 'amex', re: /^3[47]/ },
  { brand: 'dinersclub', re: /^3(0[0-5]|[689])/ },
  { brand: 'jcb', re: /^35/ },
  { brand: 'discover', re: /^(6011|65|64[4-9]|622)/ },
  { brand: 'mastercard', re: /^(5[1-5]|2[2-7])/ },
  { brand: 'visa', re: /^4/ },
];

export function brandOf(number: string): Brand {
  const n = digits(number);
  return BRANDS.find((b) => b.re.test(n))?.brand ?? null;
}

/** Número em grupos: 4-6-5 (Amex), 4-6-4 (Diners) ou de 4 em 4, até 19 dígitos. */
export function formatCardNumber(value: string) {
  const brand = brandOf(value);
  const n = digits(value).slice(0, brand === 'amex' ? 15 : brand === 'dinersclub' ? 14 : 19);
  if (brand === 'amex' || brand === 'dinersclub') return [n.slice(0, 4), n.slice(4, 10), n.slice(10)].filter(Boolean).join(' ');
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function luhn(number: string) {
  const n = digits(number);
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return n.length > 0 && sum % 10 === 0;
}

export function validCardNumber(number: string) {
  const n = digits(number);
  const brand = brandOf(n);
  const lengths = brand === 'amex' ? [15] : brand === 'dinersclub' ? [14] : null;
  return (lengths ? lengths.includes(n.length) : n.length >= 12 && n.length <= 19) && luhn(n);
}

/** Validade "MM / AA" enquanto se digita (como o jquery.payment: "1" → "01 / " só a partir do 2). */
export function formatExpiry(value: string, deleting = false) {
  let n = digits(value).slice(0, 6);
  if (/^[2-9]$/.test(n)) n = `0${n}`;
  if (n.length === 1) return n;
  const mm = n.slice(0, 2);
  const yy = n.slice(2);
  if (!yy) return deleting ? mm : `${mm} / `;
  return `${mm} / ${yy}`;
}

/** Mês e ano (4 dígitos) da validade; null se incompleta. */
export function parseExpiry(value: string) {
  const m = value.match(/^\s*(\d{1,2})\s*\/?\s*(\d{2}|\d{4})\s*$/) ?? digits(value).match(/^(\d{2})(\d{2}|\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return { month, year };
}

/** 'ok' | 'invalid' | 'expired' (vale até o último dia do mês). */
export function checkExpiry(value: string, now = new Date()): 'ok' | 'invalid' | 'expired' {
  const e = parseExpiry(value);
  if (!e || e.month < 1 || e.month > 12 || e.year > now.getFullYear() + 20) return 'invalid';
  const end = new Date(e.year, e.month, 1);
  return end <= now ? 'expired' : 'ok';
}

/** Validade no formato do formulário original ("MM / AA"). */
export function normalizeExpiry(value: string) {
  const e = parseExpiry(value);
  return e ? `${String(e.month).padStart(2, '0')} / ${String(e.year % 100).padStart(2, '0')}` : value.trim();
}

export function validCvc(cvc: string, brand: Brand) {
  const n = cvc.trim();
  if (!/^\d+$/.test(n)) return false;
  if (brand === 'amex') return n.length === 3 || n.length === 4;
  if (brand) return n.length === 3;
  return n.length === 3 || n.length === 4;
}

/**
 * Reformata o campo mantendo o cursor depois do mesmo número de dígitos (digitar no meio do número
 * não manda o cursor para o fim).
 */
export function reformat(input: HTMLInputElement, format: (v: string) => string) {
  const caret = input.selectionStart ?? input.value.length;
  const atEnd = caret >= input.value.length;
  const before = digits(input.value.slice(0, caret)).length;
  const next = format(input.value);
  if (next === input.value) return;
  input.value = next;
  if (atEnd || document.activeElement !== input) return;
  let pos = 0;
  for (let seen = 0; pos < next.length && seen < before; pos++) if (/\d/.test(next[pos])) seen++;
  input.setSelectionRange(pos, pos);
}

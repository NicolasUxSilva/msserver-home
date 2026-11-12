import { decodeEntities, getCart, money, type Cart, type CartItem, type Money } from './store-api';
import { pricesIncludeTax, totalsHtml, type TotalsText } from './cart-totals';
import { quoteMessage, whatsappLink, type QuoteContact, type QuoteSummary } from './finalizacao-mensagem';
import { track } from './analytics';
import { guardFab } from './fab-guard';

// Finalização de orçamento no navegador: lê o carrinho do WooCommerce pela Store API (a mesma sessão do
// carrinho; nada é alterado na loja), mostra o resumo, confere os dados de contato e abre o WhatsApp do
// comercial com a solicitação. Não há pagamento nem pedido.

type Config = {
  products: Record<string, { path: string; image: string | null; srcset: string | null; brand: string | null }>;
  whatsapp: string;
  texts: Record<string, string> & TotalsText;
  fields: Record<keyof QuoteContact, { label: string; missing: string }>;
};

const DRAFT_KEY = 'msserver:orcamento-contato';
const KEYS = ['name', 'company', 'email', 'phone', 'notes'] as const;
// WP is_email (simplificado).
const EMAIL_RE = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
const digits = (s: string) => s.replace(/\D/g, '');

/** WhatsApp no Brasil: (DD) 9NNNN-NNNN ou (DD) NNNN-NNNN, enquanto se digita (número com "+" fica como está). */
export function formatPhone(value: string) {
  if (value.trim().startsWith('+')) return value;
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const cut = rest.length > 8 ? 5 : 4;
  return rest.length > cut ? `(${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}` : `(${ddd}) ${rest}`;
}

export function initFinalizacao() {
  const root = document.querySelector<HTMLElement>('[data-fo]');
  const cfgEl = document.querySelector('[data-fo-config]');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-fo-row]');
  if (!root || !cfgEl || !tpl) return;
  const cfg: Config = JSON.parse(cfgEl.textContent!);
  const T = cfg.texts;
  const $ = <E extends Element = HTMLElement>(sel: string, el: ParentNode = root) => el.querySelector<E>(sel)!;
  const form = $<HTMLFormElement>('[data-fo-form]');
  const alertBox = $('[data-fo-alert]');
  const alertList = $<HTMLUListElement>('[data-fo-alert-list]');
  const sent = $('[data-fo-sent]');
  const bar = $('[data-fo-bar]');
  const live = $('[data-fo-live]');
  const fill = (s: string, v: string | number) => s.replace('%s', String(v));
  let cart: Cart | null = null;
  let viewed = false;
  /** A barra de envio do celular aparece com o resumo pronto e some quando o botão do formulário está à vista. */
  let ctaVisible = false;
  const syncBar = () => {
    bar.hidden = root.dataset.state !== 'ready' || ctaVisible;
  };

  const setState = (s: 'loading' | 'empty' | 'ready' | 'unavailable') => {
    root.dataset.state = s;
    syncBar();
  };

  const notify = (text: string) => {
    const box = document.createElement('div');
    box.className = 'cart-notice cart-notice--error';
    box.setAttribute('role', 'alert');
    const p = document.createElement('p');
    p.textContent = text;
    box.append(p);
    $('[data-fo-notices]').replaceChildren(box);
  };

  // ——— Campos de contato ———
  const control = (key: (typeof KEYS)[number]) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${key}"]`)!;
  const contact = (): QuoteContact => Object.fromEntries(KEYS.map((k) => [k, control(k).value.trim()])) as QuoteContact;

  const validate = (key: (typeof KEYS)[number]): string => {
    const value = control(key).value.trim();
    if (key === 'notes') return '';
    if (!value) return cfg.fields[key].missing;
    if (key === 'name') return value.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length >= 2 ? '' : T.invalidName;
    if (key === 'company') return '';
    if (key === 'email') return EMAIL_RE.test(value) && value.length >= 6 ? '' : T.invalidEmail;
    const d = digits(value);
    return value.startsWith('+') ? (d.length >= 8 && d.length <= 15 ? '' : T.invalidPhone) : d.length >= 10 && d.length <= 13 ? '' : T.invalidPhone;
  };

  const fieldOf = (key: string) => form.querySelector<HTMLElement>(`.fo-field[data-key="${key}"]`)!;
  const showError = (key: (typeof KEYS)[number], message: string) => {
    const f = fieldOf(key);
    f.classList.toggle('is-invalid', !!message);
    const box = f.querySelector<HTMLElement>('.fo-error');
    if (box) {
      box.hidden = !message;
      box.querySelector('[data-fo-error]')!.textContent = message;
    }
    if (message) control(key).setAttribute('aria-invalid', 'true');
    else control(key).removeAttribute('aria-invalid');
  };

  const listErrors = (errors: { key: (typeof KEYS)[number]; text: string }[]) =>
    alertList.replaceChildren(
      ...errors.map(({ key, text }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${control(key).id}`;
        a.textContent = text;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          control(key).focus();
        });
        li.append(a);
        return li;
      }),
    );
  /** A lista do alto acompanha as correções e fecha quando não sobra erro. */
  const refreshAlert = () => {
    if (alertBox.hidden) return;
    const errors = KEYS.filter((k) => fieldOf(k).classList.contains('is-invalid')).map((key) => ({ key, text: fieldOf(key).querySelector('[data-fo-error]')!.textContent! }));
    if (!errors.length) alertBox.hidden = true;
    else listErrors(errors);
  };

  // Rascunho dos dados na sessão do navegador: voltar ao carrinho ou ao catálogo não apaga o que foi digitado.
  const saveDraft = () => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, control(k).value]))));
    } catch {
      /* armazenamento indisponível */
    }
  };
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<QuoteContact>;
      for (const k of KEYS) if (draft[k] && !control(k).value) control(k).value = draft[k]!;
    } catch {
      /* sem rascunho */
    }
  };

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const key = el.name as (typeof KEYS)[number];
    if (key === 'phone') {
      const atEnd = (el.selectionStart ?? el.value.length) >= el.value.length;
      const next = formatPhone(el.value);
      if (next !== el.value && atEnd) el.value = next;
    }
    el.dataset.touched = '1';
    if (fieldOf(key)?.classList.contains('is-invalid') && !validate(key)) {
      showError(key, '');
      refreshAlert();
    }
    saveDraft();
  });
  form.addEventListener('focusout', (e) => {
    const el = e.target as HTMLInputElement;
    const key = el.name as (typeof KEYS)[number];
    if (!KEYS.includes(key) || !el.dataset.touched) return;
    if (key === 'phone') el.value = formatPhone(el.value);
    showError(key, validate(key));
    refreshAlert();
  });

  // ——— Resumo ———
  const plain = (s: string) => s.replace(/ /g, ' ').replace('−', '-');
  const productOf = (item: CartItem) => cfg.products[item.permalink.split('?')[0]];
  const optionsOf = (item: CartItem) =>
    [...item.variation.map((v) => [v.attribute, v.value]), ...item.item_data.map((d) => [d.name ?? d.key ?? '', d.display ?? d.value ?? ''])]
      .filter(([, v]) => v)
      .map(([k, v]) => (k ? `${decodeEntities(k)}: ${decodeEntities(v)}` : decodeEntities(v)));
  const lineTotal = (item: CartItem) => Number(item.prices.price) * item.quantity;

  const renderItem = (item: CartItem) => {
    const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const local = productOf(item);
    const href = local?.path ?? item.permalink;
    const name = decodeEntities(item.name);
    const thumb = li.querySelector<HTMLAnchorElement>('.fo-thumb')!;
    thumb.href = href;
    const img = thumb.querySelector('img')!;
    if (local?.image) {
      img.src = local.image;
      if (local.srcset) img.srcset = local.srcset;
      img.sizes = '112px';
    } else if (item.images[0]) img.src = item.images[0].thumbnail || item.images[0].src;
    else thumb.classList.add('is-empty');
    const link = li.querySelector<HTMLAnchorElement>('.fo-item-name a')!;
    link.href = href;
    link.textContent = name;
    // Marca (categoria do WooCommerce) e código (SKU), só quando existem.
    const meta = li.querySelector<HTMLElement>('.fo-item-meta')!;
    const tags = [local?.brand ? [T.brand, local.brand] : null, item.sku ? [T.code, item.sku] : null].filter((t): t is string[] => !!t);
    if (tags.length)
      meta.replaceChildren(
        ...tags.map(([label, value]) => {
          const span = document.createElement('span');
          span.className = 'fo-tag';
          const sr = document.createElement('span');
          sr.className = 'sr-only';
          sr.textContent = `${label}: `;
          span.append(sr, value);
          return span;
        }),
      );
    else meta.remove();
    const options = optionsOf(item);
    const opt = li.querySelector<HTMLElement>('.fo-item-options')!;
    if (options.length) opt.textContent = options.join(' · ');
    else opt.remove();
    li.querySelector('[data-unit]')!.textContent = money(item.prices.price, item.prices);
    li.querySelector('[data-qty]')!.textContent = String(item.quantity);
    li.querySelector('[data-line]')!.textContent = money(lineTotal(item), item.prices);
    return li;
  };

  /** O que vai na mensagem, com os mesmos valores do resumo. */
  const summary = (c: Cart): QuoteSummary => {
    const t = c.totals;
    const incl = pricesIncludeTax(c);
    const m = (v: number | string, money_: Money = t) => plain(money(v, money_));
    const adjustments: QuoteSummary['adjustments'] = [];
    for (const cp of c.coupons) adjustments.push({ label: fill(T.coupon, cp.code.toUpperCase()), value: m(-(Number(cp.totals.total_discount) + (incl ? Number(cp.totals.total_discount_tax) : 0)), cp.totals) });
    for (const f of c.fees) adjustments.push({ label: decodeEntities(f.name), value: m(Number(f.totals.total) + (incl ? Number(f.totals.total_tax) : 0), f.totals) });
    if (c.needs_shipping) adjustments.push({ label: T.shipping, value: c.has_calculated_shipping && t.total_shipping !== null ? m(t.total_shipping) : T.shippingLater });
    if (!incl && Number(t.total_tax) > 0) adjustments.push({ label: T.tax, value: m(t.total_tax) });
    if (adjustments.length) adjustments.unshift({ label: T.subtotal, value: m(Number(t.total_items) + (incl ? Number(t.total_items_tax) : 0)) });
    return {
      items: c.items.map((item) => {
        const local = productOf(item);
        return {
          name: decodeEntities(item.name),
          brand: local?.brand ?? null,
          code: item.sku || null,
          options: optionsOf(item),
          quantity: item.quantity,
          unitPrice: m(item.prices.price, item.prices),
          lineTotal: m(lineTotal(item), item.prices),
          link: item.permalink || null,
        };
      }),
      itemsCount: c.items_count,
      adjustments,
      total: m(t.total_price),
    };
  };

  const render = (c: Cart) => {
    cart = c;
    if (!c.items.length) {
      setState('empty');
      return;
    }
    $<HTMLUListElement>('[data-fo-items]').replaceChildren(...c.items.map(renderItem));
    $('[data-fo-totals]').innerHTML = totalsHtml(c, T);
    const total = money(c.totals.total_price, c.totals);
    $('[data-fo-total]').textContent = total;
    $('[data-fo-bar-total]').textContent = total;
    $('[data-fo-count]').textContent = c.items_count === 1 ? T.itemsOne : fill(T.itemsMany, c.items_count);
    if (c.errors?.length) notify(c.errors.map((e) => decodeEntities(e.message)).join(' '));
    setState('ready');
  };

  /** Dados que a sessão do WooCommerce já tem (pessoa conectada ou que já informou antes), sem apagar o digitado. */
  const prefill = (c: Cart) => {
    const b = (c as Cart & { billing_address?: Record<string, string> }).billing_address;
    if (!b) return;
    // O WordPress guarda os textos com entidades HTML ("&#8211;"): voltam como texto.
    const values: Partial<QuoteContact> = { name: [b.first_name, b.last_name].filter(Boolean).join(' '), company: b.company, email: b.email, phone: b.phone };
    for (const [k, raw] of Object.entries(values)) {
      const v = raw ? decodeEntities(raw).trim() : '';
      if (v && !control(k as keyof QuoteContact).value) control(k as keyof QuoteContact).value = k === 'phone' ? formatPhone(v) : v;
    }
  };

  const load = async () => {
    setState('loading');
    try {
      const c = await getCart();
      prefill(c);
      render(c);
      if (!viewed && c.items.length) {
        viewed = true;
        track('quote_view', { items: c.items_count, value: Number(c.totals.total_price) / 10 ** c.totals.currency_minor_unit });
      }
    } catch {
      setState('unavailable');
    }
  };

  // ——— Envio pelo WhatsApp ———
  const markSent = (url: string) => {
    sent.hidden = false;
    $<HTMLAnchorElement>('[data-fo-again]').href = url;
    const steps = $('[data-fo-steps]');
    steps.querySelector('[data-fo-step="review"]')!.classList.replace('is-current', 'is-done');
    steps.querySelector('[data-fo-step="review"]')!.removeAttribute('aria-current');
    const send = steps.querySelector<HTMLElement>('[data-fo-step="send"]')!;
    send.classList.add('is-current');
    send.setAttribute('aria-current', 'step');
    sent.focus();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart?.items.length) return;
    const errors = KEYS.map((key) => ({ key, text: validate(key) })).filter((x) => x.text);
    KEYS.forEach((key) => showError(key, errors.find((x) => x.key === key)?.text ?? ''));
    if (errors.length) {
      listErrors(errors);
      alertBox.hidden = false;
      alertBox.focus();
      track('quote_validation_error', { fields: errors.length });
      return;
    }
    alertBox.hidden = true;
    control('phone').value = formatPhone(control('phone').value);
    saveDraft();
    const url = whatsappLink(cfg.whatsapp, quoteMessage(contact(), summary(cart)));
    // Sem dados pessoais nos eventos: só a quantidade de itens e o valor.
    const value = Number(cart.totals.total_price) / 10 ** cart.totals.currency_minor_unit;
    track('quote_whatsapp_submit', { items: cart.items_count, value });
    track('contact_whatsapp_click', { location: 'finalizacao-orcamento' });
    // Nova aba (no celular, o aplicativo); se o navegador bloquear, abre nesta mesma aba.
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else location.assign(url);
    markSent(url);
    live.textContent = T.sentTitle;
  });

  // ——— Barra de envio (celular e tablet) ———
  const cta = $('[data-fo-cta]');
  new IntersectionObserver(([entry]) => {
    // À vista ou já passou (rolando para o rodapé): a barra sai.
    ctaVisible = entry.isIntersecting || entry.boundingClientRect.top < 0;
    syncBar();
  }).observe(cta);
  $('[data-fo-bar-cta]').addEventListener('click', () => form.requestSubmit());

  restoreDraft();
  $('[data-fo-retry]').addEventListener('click', load);
  // O WhatsApp flutuante não cobre o envio nem a barra.
  guardFab(() => [...root.querySelectorAll('.fo-send, .fo-bar:not([hidden])')]);
  load();
}

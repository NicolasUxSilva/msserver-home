import {
  applyCoupon,
  decodeEntities,
  getCart,
  money,
  placeOrder,
  removeCoupon,
  selectShippingRate,
  StoreError,
  StoreUnavailable,
  updateCustomer,
  type Address,
  type Cart,
  type CartItem,
  type CheckoutResult,
  type LegacyCheckoutResult,
} from './store-api';
import { escapeHtml, totalsHtml, type TotalsText } from './cart-totals';
import { brandOf, checkExpiry, digits, formatCardNumber, formatExpiry, normalizeExpiry, reformat, validCardNumber, validCvc } from './checkout-card';
import { track } from './analytics';
import { guardFab } from './fab-guard';
// Estados e regras de endereço de cada país (do WooCommerce): vão no JavaScript da página, que fica em
// cache, e não no HTML.
import { locale as LOCALE, states as STATES } from '../data/checkout-wc.json';

// Finalização de compra no navegador. Tudo o que é comercial fica com o WooCommerce, pela Store API, na
// mesma sessão do carrinho: itens e totais (GET /cart), cupons (apply-coupon, remove-coupon), endereço
// para impostos e frete (update-customer), forma de entrega (select-shipping-rate) e o pedido
// (POST /checkout), que cria o pedido, valida e chama a forma de pagamento da loja com os mesmos campos
// do formulário original ($_POST: card-number, card-expiry, card-cvc, billing_*…).
//
// Aqui ficam só a apresentação, as regras de endereço de cada país (as mesmas do WooCommerce) e a
// conferência dos campos antes do envio. Os dados do cartão não são guardados nem registrados.

type Rule = { label?: string; placeholder?: string; required?: boolean; hidden?: boolean; priority?: number };
type Group = 'billing' | 'shipping';
type Config = {
  products: Record<string, { path: string; image: string | null; srcset: string | null }>;
  routes: { cart: string; shop: string; checkout: string };
  labels: Record<string, string>;
  gateways: { id: string; card: boolean }[];
  coupons: boolean;
  texts: Record<string, string> & TotalsText;
};

/** Campos que mudam com o país (wc_address_i18n_params.locale_fields do WooCommerce). */
const LOCALE_KEYS = ['address_1', 'address_2', 'state', 'postcode', 'city'];
const ADDRESS_KEYS = ['first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'phone'] as const;
// WP is_email (simplificado) e WC_Validation::is_phone (só números, espaços e # _ - + / ( ) .).
const EMAIL_RE = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
const validPhone = (v: string) => !/[^\s#0-9_\-+/().]/.test(v);

/** WC_Validation::is_postcode, nos países com regra; nos outros, o WooCommerce confere no envio. */
function validPostcode(value: string, country: string) {
  const v = value.trim().toUpperCase();
  if (/[^\sA-Z0-9-]/.test(v)) return false;
  const n = v.replace(/[\s-]/g, '');
  switch (country) {
    case 'BR':
      return /^\d{8}$/.test(n);
    case 'US':
    case 'PR':
      return /^\d{5}(\d{4})?$/.test(n);
    case 'CA':
      return /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/.test(n);
    case 'PT':
      return /^\d{7}$/.test(n);
    case 'AT':
    case 'BE':
    case 'CH':
    case 'HU':
    case 'NO':
      return /^\d{4}$/.test(n);
    default:
      return true;
  }
}

/** CEP no formato do WooCommerce (wc_format_postcode): 00000-000. */
const formatCep = (v: string) => {
  const d = digits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function initCheckout() {
  const root = document.querySelector<HTMLElement>('[data-co]');
  const cfgEl = document.querySelector('[data-co-config]');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-co-row]');
  if (!root || !cfgEl || !tpl) return;
  const cfg = {
    ...(JSON.parse(cfgEl.textContent!) as Config),
    states: STATES as Record<string, Record<string, string> | unknown[]>,
    locale: LOCALE as Record<string, Record<string, Rule>>,
  };
  const T = cfg.texts;
  const $ = <E extends Element = HTMLElement>(sel: string, el: ParentNode = root) => el.querySelector<E>(sel)!;
  const form = $<HTMLFormElement>('[data-co-form]');
  const lock = $<HTMLFieldSetElement>('[data-co-lock]');
  const alertBox = $('[data-co-alert]');
  const notices = $('[data-co-notices]');
  const live = $('[data-co-live]');
  const shippingSection = $('[data-co-shipping]');
  const shipDifferent = $<HTMLInputElement>('[data-co-ship-different]');
  const fill = (s: string, v: string | number) => s.replace('%s', String(v));
  const L = (s: string) => cfg.labels[s] ?? s;
  const insecure = !window.isSecureContext;

  let cart: Cart | null = null;
  let busy = false;
  let viewed = false;

  const setState = (s: 'loading' | 'empty' | 'ready' | 'unavailable') => (root.dataset.state = s);

  // ——— Avisos do topo (como no carrinho) ———
  const notify = (type: 'success' | 'error', text: string) => {
    const box = document.createElement('div');
    box.className = `cart-notice cart-notice--${type}`;
    box.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const p = document.createElement('p');
    p.textContent = text;
    box.append(p);
    notices.replaceChildren(box);
  };

  // ——— Campos de endereço e regras de cada país ———
  const groupEl = (g: Group) => $(`[data-co-address="${g}"]`);
  const fieldOf = (g: Group, key: string) => groupEl(g).querySelector<HTMLElement>(`.co-field[data-key="${key}"]`);
  const groupOf = (f: HTMLElement) => (f.closest<HTMLElement>('[data-co-address]')?.dataset.coAddress as Group | undefined) ?? null;
  const labelOf = (f: HTMLElement) => (f.querySelector('[data-co-label]') ?? f.querySelector('.co-label'))!.textContent!.replace(/\s*\*\s*$/, '').trim();

  /** O controle em uso no campo (no Estado: a lista ou o texto, conforme o país). */
  const controlOf = (f: HTMLElement) => {
    if (f.dataset.key === 'state') return f.dataset.mode === 'text' ? f.querySelector<HTMLInputElement>('[data-co-state-text]')! : f.querySelector<HTMLSelectElement>('select')!;
    return f.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')!;
  };
  const valueOf = (g: Group, key: string) => {
    const f = fieldOf(g, key);
    if (!f || f.hidden || f.dataset.mode === 'none') return '';
    return controlOf(f).value.trim();
  };
  const countryOf = (g: Group) => valueOf(g, 'country');

  const setRequired = (f: HTMLElement, required: boolean) => {
    f.dataset.required = required ? '1' : '';
    f.querySelector<HTMLElement>('.co-req')!.hidden = !required;
    f.querySelector<HTMLElement>('.co-opt')!.hidden = required;
    f.querySelectorAll<HTMLInputElement>('input, select').forEach((c) => (c.required = required));
  };

  /** Estados do país: lista, campo de texto ou nenhum (country-select.js do WooCommerce). */
  const applyStates = (g: Group) => {
    const f = fieldOf(g, 'state');
    if (!f) return;
    const country = countryOf(g);
    const select = f.querySelector<HTMLSelectElement>('select')!;
    const text = f.querySelector<HTMLInputElement>('[data-co-state-text]')!;
    const wrap = f.querySelector<HTMLElement>('[data-co-state-select]')!;
    const label = f.querySelector<HTMLLabelElement>('label')!;
    const current = f.dataset.mode === 'text' ? text.value : f.dataset.mode === 'select' ? select.value : '';
    const list = cfg.states[country];
    if (list && Object.keys(list).length === 0) {
      f.dataset.mode = 'none';
      f.hidden = true;
      select.disabled = text.disabled = true;
      select.value = text.value = '';
      return;
    }
    f.hidden = false;
    if (list) {
      f.dataset.mode = 'select';
      const opts = [`<option value="">${escapeHtml(T.selectOption)}</option>`, ...Object.entries(list as Record<string, string>).map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(decodeEntities(name))}</option>`)];
      select.innerHTML = opts.join('');
      select.value = current && current in (list as Record<string, string>) ? current : '';
      select.disabled = false;
      select.name = select.id;
      wrap.hidden = false;
      text.hidden = text.disabled = true;
      text.removeAttribute('name');
      label.htmlFor = select.id;
    } else {
      const wasText = f.dataset.mode === 'text';
      f.dataset.mode = 'text';
      text.hidden = text.disabled = false;
      text.value = wasText ? current : '';
      text.name = select.id;
      wrap.hidden = true;
      select.disabled = true;
      select.removeAttribute('name');
      label.htmlFor = text.id;
    }
  };

  /** Nome, texto de exemplo, obrigatoriedade, ocultação e ordem dos campos (address-i18n.js). */
  const applyLocale = (g: Group) => {
    const country = countryOf(g);
    const def = cfg.locale.default ?? {};
    const loc = cfg.locale[country] ?? def;
    for (const key of LOCALE_KEYS) {
      const f = fieldOf(g, key);
      if (!f) continue;
      const rule: Rule = { ...(def[key] ?? {}), ...(loc[key] ?? {}) };
      f.querySelector('[data-co-label]')!.textContent = L(rule.label ?? f.dataset.label ?? '');
      if (key !== 'state') {
        const input = controlOf(f) as HTMLInputElement;
        input.placeholder = rule.placeholder ? L(rule.placeholder) : '';
        if (rule.hidden) {
          f.hidden = true;
          input.value = '';
        } else f.hidden = false;
      }
      setRequired(f, !!rule.required);
      if (rule.priority !== undefined) f.dataset.priority = String(rule.priority);
      clearError(f);
    }
    // A ordem dos campos segue a prioridade do país (ex.: o código postal antes da cidade).
    const fields = [...groupEl(g).querySelectorAll<HTMLElement>(':scope > .co-field')];
    fields.sort((a, b) => Number(a.dataset.priority) - Number(b.dataset.priority)).forEach((el) => groupEl(g).append(el));
  };

  const applyCountry = (g: Group) => {
    applyStates(g);
    applyLocale(g);
  };

  // ——— Conferência dos campos ———
  const errorEl = (f: HTMLElement) => f.querySelector<HTMLElement>('.co-error');
  const showError = (f: HTMLElement, message: string) => {
    f.classList.toggle('is-invalid', !!message);
    const box = errorEl(f);
    if (box) {
      box.hidden = !message;
      box.querySelector('[data-co-error]')!.textContent = message;
    }
    const c = controlOf(f);
    if (message) c.setAttribute('aria-invalid', 'true');
    else c.removeAttribute('aria-invalid');
  };
  const clearError = (f: HTMLElement) => showError(f, '');

  const cardNumberInput = () => root.querySelector<HTMLInputElement>('.co-method:not([hidden]) [data-card="number"]');

  const validate = (f: HTMLElement): string => {
    if (f.hidden || f.closest('[hidden]') || f.dataset.mode === 'none') return '';
    const key = f.dataset.key!;
    const value = controlOf(f).value.trim();
    const label = labelOf(f);
    const required = f.dataset.required === '1' || controlOf(f).required;
    if (!value) return required ? fill(T.requiredField, label) : '';
    const g = groupOf(f);
    switch (key) {
      case 'email':
        return EMAIL_RE.test(value) && value.length >= 6 ? '' : T.invalidEmail;
      case 'phone':
        return validPhone(value) ? '' : fill(T.invalidPhone, label);
      case 'postcode':
        return validPostcode(value, g ? countryOf(g) : '') ? '' : fill(T.invalidPostcode, label);
      case 'state': {
        if (f.dataset.mode !== 'select' || !g) return '';
        const list = cfg.states[countryOf(g)] as Record<string, string> | undefined;
        return list && value in list ? '' : fill(T.invalidState, label);
      }
      case 'card-number':
        return validCardNumber(value) ? '' : T.invalidCardNumber;
      case 'card-expiry': {
        const r = checkExpiry(value);
        return r === 'ok' ? '' : r === 'expired' ? T.expiredCard : T.invalidExpiry;
      }
      case 'card-cvc':
        return validCvc(value, brandOf(cardNumberInput()?.value ?? '')) ? '' : T.invalidCvc;
      default:
        return '';
    }
  };

  // Confere ao sair do campo (depois de mexer nele) e, se já tinha erro, enquanto se corrige. A lista
  // de erros do alto acompanha: perde os itens corrigidos e fecha quando não sobra nenhum.
  form.addEventListener('focusout', (e) => {
    const f = (e.target as HTMLElement).closest<HTMLElement>('.co-field');
    if (f && (f.dataset.touched || f.classList.contains('is-invalid'))) {
      showError(f, validate(f));
      refreshFieldAlert();
    }
  });
  form.addEventListener('input', (e) => {
    const f = (e.target as HTMLElement).closest<HTMLElement>('.co-field');
    if (!f) return;
    f.dataset.touched = '1';
    if (f.classList.contains('is-invalid') && !validate(f)) {
      clearError(f);
      refreshFieldAlert();
    }
  });

  // ——— Endereço na sessão (impostos e frete recalculados pelo WooCommerce, como ao trocar de país na
  // finalização original) ———
  const address = (g: Group): Address => {
    const a = Object.fromEntries(ADDRESS_KEYS.map((k) => [k, valueOf(g, k)])) as Address;
    if (g === 'billing') a.email = valueOf('billing', 'email');
    return a;
  };
  /** Para a sessão, só valores que a Store API aceita (um campo pela metade não derruba a atualização). */
  const sessionAddress = (g: Group) => {
    const a = address(g);
    if (a.postcode && !validPostcode(a.postcode, a.country)) a.postcode = '';
    if (a.phone && !validPhone(a.phone)) a.phone = '';
    if (a.email !== undefined && a.email && !EMAIL_RE.test(a.email)) a.email = '';
    if (g === 'shipping') delete a.email;
    return a;
  };
  let customerTimer = 0;
  let customerSeq = 0;
  const syncCustomer = () => {
    clearTimeout(customerTimer);
    customerTimer = window.setTimeout(async () => {
      const seq = ++customerSeq;
      const billing = sessionAddress('billing');
      const body: Parameters<typeof updateCustomer>[0] = { billing_address: billing };
      if (cart?.needs_shipping) {
        const { email: _email, ...rest } = billing;
        body.shipping_address = shipDifferent.checked ? sessionAddress('shipping') : rest;
      }
      try {
        const c = await updateCustomer(body);
        if (seq === customerSeq && !busy) renderCart(c);
      } catch {
        /* a sessão não foi atualizada; o pedido confere e recalcula tudo no envio */
      }
    }, 600);
  };

  for (const g of ['billing', 'shipping'] as Group[]) {
    const el = groupEl(g);
    el.addEventListener('change', (e) => {
      const f = (e.target as HTMLElement).closest<HTMLElement>('.co-field');
      const key = f?.dataset.key;
      if (key === 'country') {
        applyCountry(g);
        live.textContent = `${labelOf(f!)}: ${(controlOf(f!) as HTMLSelectElement).selectedOptions[0]?.text ?? ''}`;
      }
      if (key && ['country', 'state', 'postcode', 'city'].includes(key)) syncCustomer();
    });
    // CEP com máscara 00000-000 no Brasil.
    el.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.closest<HTMLElement>('.co-field')?.dataset.key === 'postcode' && countryOf(g) === 'BR') reformat(input, formatCep);
    });
  }

  shipDifferent.addEventListener('change', () => {
    groupEl('shipping').hidden = !shipDifferent.checked;
    if (shipDifferent.checked) {
      const first = groupEl('shipping').querySelector<HTMLElement>('input, select');
      first?.focus();
    }
    syncCustomer();
  });

  // ——— Cartão ———
  const brandIcons = (number: string) => {
    const brand = brandOf(number);
    root.querySelectorAll<HTMLElement>('[data-co-brands]').forEach((box) => {
      box.classList.toggle('has-brand', !!brand && !!box.querySelector(`[data-brand="${brand}"]`));
      box.querySelectorAll<HTMLImageElement>('img').forEach((img) => img.classList.toggle('is-active', img.dataset.brand === brand));
    });
  };
  root.querySelectorAll<HTMLInputElement>('[data-card]').forEach((input) => {
    let deleting = false;
    input.addEventListener('keydown', (e) => (deleting = e.key === 'Backspace' || e.key === 'Delete'));
    input.addEventListener('input', () => {
      if (input.dataset.card === 'number') {
        reformat(input, formatCardNumber);
        brandIcons(input.value);
      } else if (input.dataset.card === 'expiry') reformat(input, (v) => formatExpiry(v, deleting));
      else reformat(input, (v) => digits(v).slice(0, 4));
    });
  });

  // ——— Formas de pagamento oferecidas pelo carrinho ———
  const methods = [...root.querySelectorAll<HTMLElement>('.co-method')];
  const selectedGateway = () => methods.find((m) => !m.hidden && m.querySelector<HTMLInputElement>('input[name="payment_method"]')!.checked)?.dataset.gateway ?? '';
  const syncMethods = () => {
    for (const m of methods) m.classList.toggle('is-selected', m.querySelector<HTMLInputElement>('input[name="payment_method"]')!.checked);
  };
  methods.forEach((m) => m.querySelector('input[name="payment_method"]')!.addEventListener('change', syncMethods));

  const renderPayment = (c: Cart) => {
    const needsPayment = c.needs_payment !== false;
    const available = c.payment_methods ?? cfg.gateways.map((g) => g.id);
    let any = false;
    for (const m of methods) {
      m.hidden = !needsPayment || !available.includes(m.dataset.gateway!);
      any ||= !m.hidden;
    }
    const visible = methods.filter((m) => !m.hidden);
    if (visible.length && !visible.some((m) => m.querySelector<HTMLInputElement>('input[name="payment_method"]')!.checked)) visible[0].querySelector<HTMLInputElement>('input[name="payment_method"]')!.checked = true;
    syncMethods();
    $('[data-co-no-payment]').hidden = needsPayment;
    $('[data-co-no-gateway]').hidden = !needsPayment || any;
    $('[data-co-insecure]').hidden = !(needsPayment && any && insecure);
  };
  if (insecure) {
    const link = $<HTMLAnchorElement>('[data-co-secure-link]');
    link.href = location.href.replace(/^http:/, 'https:');
  }

  // ——— Resumo do pedido ———
  const list = $<HTMLUListElement>('[data-co-items]');
  const totalsEl = $('[data-co-totals]');
  const productOf = (item: CartItem) => cfg.products[item.permalink.split('?')[0]];
  const optionsOf = (item: CartItem) =>
    [...item.variation.map((v) => [v.attribute, v.value]), ...item.item_data.map((d) => [d.name ?? d.key ?? '', d.display ?? d.value ?? ''])].map(([k, v]) => `${decodeEntities(k)}: ${decodeEntities(v)}`);

  const renderItem = (item: CartItem) => {
    const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const local = productOf(item);
    const img = li.querySelector('img')!;
    if (local?.image) {
      img.src = local.image;
      if (local.srcset) img.srcset = local.srcset;
      img.sizes = '64px';
    } else if (item.images[0]) img.src = item.images[0].thumbnail || item.images[0].src;
    else li.querySelector('.co-thumb')!.classList.add('is-empty');
    li.querySelector('[data-co-qty]')!.textContent = String(item.quantity);
    const name = li.querySelector('.co-item-name')!;
    name.textContent = decodeEntities(item.name);
    const qty = document.createElement('span');
    qty.className = 'sr-only';
    qty.textContent = ` — quantidade: ${item.quantity}`;
    name.append(qty);
    const opts = optionsOf(item);
    const variation = li.querySelector('.co-item-variation')!;
    if (opts.length) variation.textContent = opts.join(' · ');
    else variation.remove();
    li.querySelector('.co-item-total')!.textContent = money(Number(item.prices.price) * item.quantity, item.prices);
    return li;
  };

  const renderRates = (c: Cart) => {
    shippingSection.hidden = !c.needs_shipping;
    const box = $('[data-co-rates]');
    const target = $('[data-co-rates-list]');
    if (!c.needs_shipping) return;
    const packages = c.shipping_rates ?? [];
    box.hidden = false;
    if (!packages.some((p) => p.shipping_rates.length)) {
      target.innerHTML = `<p class="co-note co-note--warn">${escapeHtml(T.noShippingRates)}</p>`;
      return;
    }
    target.innerHTML = packages
      .map(
        (p, i) =>
          `${packages.length > 1 ? `<p class="co-rates-package">${escapeHtml(decodeEntities(p.name))}</p>` : ''}` +
          p.shipping_rates
            .map(
              (r) =>
                `<label class="co-rate"><input type="radio" name="shipping_method_${i}" value="${escapeHtml(r.rate_id)}" data-package="${escapeHtml(String(p.package_id))}"${r.selected ? ' checked' : ''} /><span class="co-rate-name">${escapeHtml(decodeEntities(r.name))}${r.delivery_time ? ` <small>${escapeHtml(decodeEntities(r.delivery_time))}</small>` : ''}</span><b>${escapeHtml(Number(r.price) ? money(r.price, r) : 'Grátis')}</b></label>`,
            )
            .join(''),
      )
      .join('');
  };
  $('[data-co-rates-list]').addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.package) return;
    try {
      renderCart(await selectShippingRate(input.dataset.package, input.value));
    } catch (err) {
      if (err instanceof StoreError) notify('error', err.message);
    }
  });

  /** Números das seções (1 Cobrança, 2 Entrega quando houver, …). */
  const numberSections = () => {
    let n = 1;
    root.querySelectorAll<HTMLElement>('.co-section').forEach((s) => {
      if (s.hidden) return;
      const num = s.querySelector<HTMLElement>('.co-num');
      if (num) num.textContent = String(n);
      n++;
    });
  };

  const renderCart = (c: Cart) => {
    cart = c;
    if (!c.items.length) {
      setState('empty');
      return;
    }
    list.replaceChildren(...c.items.map(renderItem));
    totalsEl.innerHTML = totalsHtml(c, T);
    const total = money(c.totals.total_price, c.totals);
    $('[data-co-toggle-total]').textContent = total;
    $('[data-co-place-total]').textContent = total;
    $('[data-co-count]').textContent = c.items_count === 1 ? T.itemsOne : fill(T.itemsMany, c.items_count);
    renderRates(c);
    renderPayment(c);
    numberSections();
    if (c.errors?.length) notify('error', c.errors.map((e) => decodeEntities(e.message)).join(' '));
    setState('ready');
  };

  /** Preenche os campos com o que a sessão do WooCommerce já tem (país e estado padrão da loja, ou o
   *  que a pessoa informou antes), sem apagar o que já foi digitado. */
  const prefill = (g: Group, a: Partial<Address> | undefined) => {
    const country = fieldOf(g, 'country');
    if (country && a?.country && !country.dataset.touched && [...(controlOf(country) as HTMLSelectElement).options].some((o) => o.value === a.country)) controlOf(country).value = a.country;
    applyCountry(g);
    for (const [key, value] of Object.entries(a ?? {})) {
      if (key === 'country' || !value) continue;
      const f = fieldOf(g, key);
      if (!f || f.hidden || f.dataset.mode === 'none') continue;
      const c = controlOf(f);
      if (!c.value) c.value = key === 'postcode' && countryOf(g) === 'BR' ? formatCep(String(value)) : String(value);
    }
  };

  // ——— Carga ———
  const load = async () => {
    setState('loading');
    try {
      const c = await getCart();
      prefill('billing', c.billing_address);
      prefill('shipping', c.needs_shipping ? c.shipping_address : undefined);
      renderCart(c);
      if (!viewed && c.items.length) {
        viewed = true;
        track('checkout_view', { items: c.items_count, value: Number(c.totals.total_price) / 10 ** c.totals.currency_minor_unit });
      }
    } catch {
      setState('unavailable');
    }
  };

  // ——— Resumo recolhível no celular ———
  const toggle = $<HTMLButtonElement>('[data-co-summary-toggle]');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    $('[data-co-summary]').classList.toggle('is-open', open);
  });

  // ——— Cupom ———
  const couponBox = root.querySelector<HTMLElement>('[data-co-coupon]');
  if (couponBox) {
    const couponToggle = $<HTMLButtonElement>('[data-co-coupon-toggle]', couponBox);
    const couponForm = $<HTMLFormElement>('[data-co-coupon-form]', couponBox);
    const couponInput = $<HTMLInputElement>('input', couponForm);
    const couponButton = $<HTMLButtonElement>('button[type="submit"]', couponForm);
    const couponMsg = $('[data-co-coupon-msg]', couponForm);
    const say = (type: 'success' | 'error' | '', text: string) => {
      couponMsg.textContent = text;
      couponMsg.className = `co-coupon-msg${type ? ` is-${type}` : ''}`;
      if (type === 'error') couponInput.setAttribute('aria-invalid', 'true');
      else couponInput.removeAttribute('aria-invalid');
    };
    couponToggle.addEventListener('click', () => {
      const open = couponForm.hidden;
      couponForm.hidden = !open;
      couponToggle.setAttribute('aria-expanded', String(open));
      if (open) couponInput.focus();
    });
    couponForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = couponInput.value.trim();
      if (!code) return say('error', T.couponEmpty);
      couponButton.disabled = true;
      say('', '');
      try {
        renderCart(await applyCoupon(code));
        couponInput.value = '';
        say('success', T.couponApplied);
        track('coupon_applied');
      } catch (err) {
        if (err instanceof StoreError) say('error', fill(T.couponError, err.message));
        else say('error', T.unavailableText);
      } finally {
        couponButton.disabled = false;
      }
    });
  }
  totalsEl.addEventListener('click', async (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-coupon]');
    if (!button) return;
    button.disabled = true;
    try {
      renderCart(await removeCoupon(button.dataset.coupon!));
      notify('success', T.couponRemoved);
      live.textContent = T.couponRemoved;
    } catch (err) {
      button.disabled = false;
      notify('error', err instanceof StoreError ? err.message : T.unavailableText);
    }
  });

  // ——— Alerta com a lista de erros (cada item leva ao campo) ———
  const alertTitle = $('[data-co-alert-title]', alertBox);
  const alertList = $<HTMLUListElement>('[data-co-alert-list]', alertBox);
  /** A lista do alerta é a dos campos com erro (e não uma falha da loja ou do pagamento)? */
  let fieldAlert = false;
  const listItems = (items: { text: string; field?: HTMLElement }[]) =>
    alertList.replaceChildren(
      ...items.map(({ text, field }) => {
        const li = document.createElement('li');
        if (field) {
          const a = document.createElement('a');
          const c = controlOf(field);
          a.href = `#${c.id}`;
          a.textContent = text;
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            c.focus();
          });
          li.append(a);
        } else li.textContent = text;
        return li;
      }),
    );
  const showAlert = (title: string, items: { text: string; field?: HTMLElement }[] = [], fields = false) => {
    fieldAlert = fields;
    alertTitle.textContent = title;
    listItems(items);
    alertList.hidden = !items.length;
    alertBox.hidden = false;
    alertBox.focus();
  };
  const hideAlert = () => {
    alertBox.hidden = true;
    fieldAlert = false;
  };
  function refreshFieldAlert() {
    if (!fieldAlert || alertBox.hidden) return;
    const invalid = [...form.querySelectorAll<HTMLElement>('.co-field.is-invalid')].filter((f) => !f.closest('[hidden]'));
    if (!invalid.length) return hideAlert();
    listItems(invalid.map((f) => ({ text: f.querySelector('[data-co-error]')!.textContent!, field: f })));
  }

  // ——— Erros devolvidos pelo WooCommerce ———
  const FIELD_BY_CODE: Record<string, string> = { invalid_postcode: 'postcode', invalid_phone: 'phone', invalid_email: 'email', invalid_state: 'state', invalid_country: 'country' };
  const FIELD_BY_LABEL: Record<string, string> = { 'First name': 'first_name', 'Last name': 'last_name', Address: 'address_1', City: 'city', 'State/County': 'state', 'Postal code': 'postcode', 'Country/Region': 'country' };
  const fieldByServerLabel = (g: Group, label: string) => {
    if (FIELD_BY_LABEL[label]) return FIELD_BY_LABEL[label];
    const loc = cfg.locale[countryOf(g)] ?? {};
    return Object.entries(loc).find(([, r]) => r.label === label)?.[0];
  };

  const serverError = (e: StoreError) => {
    const items: { text: string; field?: HTMLElement }[] = [];
    const mark = (g: Group, key: string | undefined, text: string) => {
      const f = key ? fieldOf(g, key) : null;
      if (f && !f.hidden) {
        showError(f, text);
        items.push({ text, field: f });
      } else items.push({ text });
    };
    if (e.code === 'rest_invalid_param') {
      const details = (e.data.details ?? {}) as Record<string, { code?: string; message?: string; additional_errors?: { code: string; message: string }[] }>;
      for (const [param, d] of Object.entries(details)) {
        const g: Group = param === 'shipping_address' ? 'shipping' : 'billing';
        for (const err of [d, ...(d.additional_errors ?? [])]) {
          const key = FIELD_BY_CODE[err.code ?? ''];
          const f = key ? fieldOf(g, key) : null;
          const label = f ? labelOf(f) : '';
          const text =
            key === 'postcode' ? fill(T.invalidPostcode, label) : key === 'phone' ? fill(T.invalidPhone, label) : key === 'email' ? T.invalidEmail : key === 'state' ? fill(T.invalidState, label) : decodeEntities(err.message ?? e.message);
          mark(g, key, text);
        }
      }
      return showAlert(T.errorsTitle, items.length ? items : [{ text: e.message }], items.length > 0 && items.every((i) => i.field));
    }
    if (e.code === 'woocommerce_rest_invalid_address') {
      const errors = (e.data.errors ?? {}) as Record<string, string[]>;
      for (const [type, messages] of Object.entries(errors)) {
        const g: Group = type === 'shipping' ? 'shipping' : 'billing';
        for (const m of messages) {
          const label = m.match(/^(.+) is required$/)?.[1];
          const key = label ? fieldByServerLabel(g, label) : undefined;
          const f = key ? fieldOf(g, key) : null;
          mark(g, key, f ? fill(T.requiredField, labelOf(f)) : decodeEntities(m));
        }
      }
      return showAlert(T.errorsTitle, items.length ? items : [{ text: e.message }], items.length > 0 && items.every((i) => i.field));
    }
    if (e.code === 'woocommerce_rest_invalid_email_address') {
      mark('billing', 'email', T.invalidEmail);
      return showAlert(T.errorsTitle, items, true);
    }
    if (e.code === 'woocommerce_rest_checkout_process_payment_error') return showAlert(fill(T.paymentError, e.message));
    return showAlert(T.checkoutError, [{ text: e.message }]);
  };

  // ——— Envio do pedido ———
  const setBusy = (on: boolean) => {
    busy = on;
    lock.disabled = on;
    form.setAttribute('aria-busy', String(on));
    root.classList.toggle('is-processing', on);
    $('[data-co-submit-label]').textContent = on ? T.processing : T.placeOrder;
    if (on) live.textContent = T.processingLive;
  };

  /** O que o formulário original enviaria em $_POST: a forma de pagamento lê daqui (card-number…). */
  const paymentData = (gateway: string, billing: Address, shipping: Omit<Address, 'email'> | undefined, note: string) => {
    const data: { key: string; value: string }[] = [{ key: 'payment_method', value: gateway }];
    const method = methods.find((m) => m.dataset.gateway === gateway);
    if (cfg.gateways.find((g) => g.id === gateway)?.card && method) {
      const v = (k: string) => method.querySelector<HTMLInputElement>(`[data-card="${k}"]`)!.value.trim();
      data.push({ key: 'card-number', value: formatCardNumber(v('number')) }, { key: 'card-expiry', value: normalizeExpiry(v('expiry')) }, { key: 'card-cvc', value: v('cvc') });
    }
    for (const [k, v] of Object.entries(billing)) data.push({ key: `billing_${k}`, value: v ?? '' });
    if (shipping) for (const [k, v] of Object.entries(shipping)) data.push({ key: `shipping_${k}`, value: v ?? '' });
    if (note) data.push({ key: 'order_comments', value: note });
    return data;
  };

  /** Texto das mensagens HTML da loja (DOMParser: nada é carregado nem executado). A loja manda as
   *  tags de fechamento escapadas ("<\/li>"), como saem de um JSON duplamente codificado. */
  const plain = (html: string) => {
    const doc = new DOMParser().parseFromString(html.replace(/<\\\//g, '</').replace(/<\/li>/gi, '</li>\n'), 'text/html');
    return (doc.body.textContent ?? '').split('\n').map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  };

  /** Resposta no formato da finalização clássica (a forma de pagamento respondeu por conta própria). */
  const finishLegacy = (res: LegacyCheckoutResult) => {
    if (res.result === 'success' && res.redirect) {
      track('checkout_order_placed', { status: 'success' });
      location.assign(res.redirect);
      return true;
    }
    // A mensagem genérica do WooCommerce vai traduzida; outras mensagens da loja, como vieram.
    const messages = plain(res.messages ?? '').filter((m) => m !== 'Error processing checkout. Please try again.');
    track('checkout_payment_failed', { status: 'legacy_failure' });
    showAlert(T.checkoutError, messages.map((text) => ({ text })));
    return false;
  };

  const finish = (raw: CheckoutResult | LegacyCheckoutResult) => {
    if (!('payment_result' in raw) || !raw.payment_result) {
      if ('result' in raw) return finishLegacy(raw);
      showAlert(T.checkoutError);
      return false;
    }
    const res = raw as CheckoutResult;
    const pr = res.payment_result;
    if (pr.payment_status === 'success' || pr.payment_status === 'pending') {
      track('checkout_order_placed', { status: pr.payment_status });
      const received = `${cfg.routes.checkout}order-received/${res.order_id}/?key=${encodeURIComponent(res.order_key)}`;
      location.assign(pr.redirect_url || received);
      return true;
    }
    const detail = pr.payment_details.find((d) => /^(message|messages|error)$/.test(d.key))?.value;
    const text = detail ? decodeEntities(String(detail).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
    track('checkout_payment_failed', { status: pr.payment_status });
    showAlert(T.paymentFailed, text ? [{ text }] : []);
    return false;
  };

  /** O carrinho pode ter mudado (estoque, cupom removido…): os valores voltam da loja. */
  const refreshAfterFailure = async () => {
    if (!cart) return;
    try {
      const before = cart.totals.total_price;
      const c = await getCart();
      renderCart(c);
      if (c.items.length && c.totals.total_price !== before) notify('error', T.cartChanged);
    } catch {
      /* fica o resumo anterior */
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !cart) return;
    // Uma atualização de endereço ainda pendente não corre junto com o pedido (o pedido já leva tudo).
    clearTimeout(customerTimer);
    hideAlert();
    const needsPayment = cart.needs_payment !== false;
    const gateway = needsPayment ? selectedGateway() : '';
    const card = !!cfg.gateways.find((g) => g.id === gateway)?.card;
    const differentShipping = !!cart.needs_shipping && shipDifferent.checked;

    // Campos visíveis: cobrança, entrega (se for outro endereço) e o cartão da forma escolhida.
    const fields = [
      ...groupEl('billing').querySelectorAll<HTMLElement>('.co-field'),
      ...(differentShipping ? groupEl('shipping').querySelectorAll<HTMLElement>('.co-field') : []),
      ...(card ? methods.find((m) => m.dataset.gateway === gateway)!.querySelectorAll<HTMLElement>('.co-field') : []),
    ];
    const errors: { text: string; field: HTMLElement }[] = [];
    for (const f of fields) {
      const message = validate(f);
      showError(f, message);
      if (message) errors.push({ text: message, field: f });
    }
    if (errors.length) {
      track('checkout_validation_error', { fields: errors.length });
      return showAlert(T.errorsTitle, errors, true);
    }
    if (needsPayment && !gateway) return showAlert(T.noGateway);
    if (needsPayment && card && insecure) return showAlert(T.insecure);
    if (cart.needs_shipping && (cart.shipping_rates ?? []).some((p) => !p.shipping_rates.some((r) => r.selected))) return showAlert(T.noShippingRates);

    // Entrega como na finalização original: sem entrega, o pedido fica sem endereço de entrega; com
    // entrega no mesmo endereço, o de cobrança (sem o telefone, que não é campo de entrega).
    const billing = address('billing');
    const shipping = (
      cart.needs_shipping ? { ...(differentShipping ? address('shipping') : billing), phone: '' } : Object.fromEntries(ADDRESS_KEYS.map((k) => [k, '']))
    ) as Address;
    delete shipping.email;
    const note = root.querySelector<HTMLTextAreaElement>('#order_comments')?.value.trim() ?? '';

    setBusy(true);
    track('checkout_submit', { value: Number(cart.totals.total_price) / 10 ** cart.totals.currency_minor_unit });
    let leaving = false;
    try {
      const res = await placeOrder({
        billing_address: billing,
        shipping_address: shipping,
        customer_note: note,
        payment_method: gateway,
        payment_data: needsPayment ? paymentData(gateway, billing, cart.needs_shipping ? shipping : undefined, note) : [],
      });
      leaving = finish(res);
      // Pagamento não concluído: o carrinho e os totais voltam da loja (como o "reload" da finalização clássica).
      if (!leaving) await refreshAfterFailure();
    } catch (err) {
      if (err instanceof StoreError) {
        track('checkout_error', { code: err.code });
        serverError(err);
        await refreshAfterFailure();
      } else if (err instanceof StoreUnavailable) showAlert(T.networkError);
      else showAlert(T.checkoutError);
    } finally {
      if (!leaving) setBusy(false);
      // Depois de qualquer resposta, o alerta (se houver) recebe o foco de novo, já com o formulário liberado.
      if (!leaving && !alertBox.hidden) alertBox.focus();
    }
  });

  $('[data-co-retry]').addEventListener('click', load);
  // O WhatsApp flutuante não cobre o botão de concluir nem o resumo.
  guardFab(() => [...root.querySelectorAll('.co-place, .co-summary-toggle, .co-coupon')]);
  load();
}

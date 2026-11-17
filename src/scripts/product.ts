import { trackEcommerce, type EcomItem } from './analytics';
import { guardFab } from './fab-guard';
import { ADDED_KEY, addItem, StoreError, StoreUnavailable } from './store-api';
import { productQuoteText } from '../data/produto';

// Página de produto no navegador: galeria (miniaturas, deslizar no celular e imagem ampliada) e o
// formulário de compra (opções de variação → variação do WooCommerce, preço da opção escolhida,
// quantidade). "Orçamento" adiciona ao carrinho pela Store API e abre o carrinho deste site. O site
// não recebe pagamentos: se a loja não responder, a página mostra o aviso e oferece o mesmo pedido
// pelo WhatsApp (produto, opções e quantidade), sem nunca seguir para o checkout do WooCommerce.

type Config = {
  id: number;
  name: string;
  cart: string;
  fields: string[];
  variations: { id: number; attributes: Record<string, string>; price: number | null; inStock: boolean }[];
  messages: { makeSelection: string; unavailable: string; outOfStock: string; adding: string };
  quote: { number: string; url: string; labels: Record<string, Record<string, string>> };
  ga: { brand: string | null; category: string | null; price: number | null };
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function initProduct() {
  const root = document.querySelector<HTMLElement>('[data-product-page]');
  const cfgEl = document.querySelector('[data-pd-config]');
  if (!root || !cfgEl) return;
  const cfg: Config = JSON.parse(cfgEl.textContent!);
  initGallery(root);
  initForm(root, cfg);
  // Visualização do produto (GA4 e, no formato do WordPress, Google Listings & Ads).
  trackEcommerce('view_item', { value: cfg.ga.price ?? 0, items: [itemOf(cfg, { price: cfg.ga.price ?? undefined })] });
  // O WhatsApp flutuante não cobre as opções, a quantidade nem o botão de compra.
  guardFab(() => [...root.querySelectorAll('.pd-opts, .pd-actions, .pd-cta--solo, .pd-msg')]);
}

/** Item do produto para os eventos de análise (sem dados pessoais). */
function itemOf(cfg: Config, extra: Partial<EcomItem> = {}): EcomItem {
  return { item_id: String(cfg.id), item_name: cfg.name, item_brand: cfg.ga.brand ?? undefined, item_category: cfg.ga.category ?? undefined, quantity: 1, ...extra };
}

function initGallery(root: HTMLElement) {
  const shots = [...root.querySelectorAll<HTMLButtonElement>('.pd-shot')];
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('.pd-thumb')];
  const current = root.querySelector<HTMLElement>('[data-pd-current]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-pd-lightbox]');
  const lbImg = document.querySelector<HTMLImageElement>('[data-pd-lb-img]');
  const lbCount = document.querySelector<HTMLElement>('[data-pd-lb-count]');
  const n = shots.length;
  let cur = 0;

  const show = (i: number) => {
    cur = (i + n) % n;
    shots.forEach((s, k) => s.classList.toggle('is-active', k === cur));
    thumbs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === cur)));
    if (current) current.textContent = String(cur + 1);
    // A miniatura atual fica à vista na faixa (que desliza quando não cabe).
    thumbs[cur]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const showInDialog = () => {
    if (!lbImg) return;
    const shot = shots[cur];
    lbImg.src = shot.dataset.full!;
    lbImg.alt = shot.querySelector('img')!.alt;
    if (lbCount) lbCount.textContent = `${cur + 1} de ${n}`;
  };

  thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.index))));
  shots.forEach((s) =>
    s.addEventListener('click', () => {
      if (!dialog) return;
      showInDialog();
      dialog.showModal();
    }),
  );

  // Deslizar a foto no celular troca de imagem.
  const stage = root.querySelector<HTMLElement>('.pd-stage');
  let startX = 0;
  let startY = 0;
  stage?.addEventListener('touchstart', (e) => ((startX = e.touches[0].clientX), (startY = e.touches[0].clientY)), { passive: true });
  stage?.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (n > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );

  if (!dialog) return;
  const step = (d: number) => {
    show(cur + d);
    showInDialog();
  };
  dialog.querySelectorAll<HTMLButtonElement>('[data-pd-lb-step]').forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.pdLbStep))));
  dialog.querySelector('[data-pd-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (n > 1 && e.key === 'ArrowRight') step(1);
    if (n > 1 && e.key === 'ArrowLeft') step(-1);
  });
  // Clique fora da imagem fecha.
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  dialog.addEventListener('close', () => shots[cur]?.focus({ preventScroll: true }));
}

function initForm(root: HTMLElement, cfg: Config) {
  const form = root.querySelector<HTMLFormElement>('[data-pd-form]');
  if (!form) return;
  const qty = form.querySelector<HTMLInputElement>('input[name="quantity"]')!;
  const msg = form.querySelector<HTMLElement>('[data-pd-msg]');
  const variationInput = form.querySelector<HTMLInputElement>('[data-pd-variation]');
  const range = root.querySelector<HTMLElement>('[data-pd-range]');
  const single = root.querySelector<HTMLElement>('[data-pd-single]');
  const resets = [...form.querySelectorAll<HTMLButtonElement>('[data-pd-reset]')];
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const fallback = form.querySelector<HTMLElement>('[data-pd-fallback]');
  const fallbackLink = form.querySelector<HTMLAnchorElement>('[data-pd-fallback-link]');

  // Quantidade: números inteiros a partir de 1.
  form.querySelectorAll<HTMLButtonElement>('[data-pd-step]').forEach((b) =>
    b.addEventListener('click', () => {
      qty.value = String(Math.max(1, (parseInt(qty.value, 10) || 1) + Number(b.dataset.pdStep)));
    }),
  );
  qty.addEventListener('change', () => (qty.value = String(Math.max(1, parseInt(qty.value, 10) || 1))));

  const say = (text: string) => {
    if (!msg) return;
    msg.textContent = text;
    msg.hidden = !text;
  };

  /** Loja fora do ar: aviso e o pedido pelo WhatsApp com o que foi escolhido (nunca o checkout). */
  const showFallback = (quantity: number) => {
    if (!fallback || !fallbackLink) return;
    const s = selected();
    const options = cfg.fields.map((f) => cfg.quote.labels[f]?.[s[f]] ?? '').filter(Boolean);
    const text = productQuoteText({ name: cfg.name, url: cfg.quote.url, options, quantity });
    fallbackLink.href = `https://wa.me/${cfg.quote.number}?text=${encodeURIComponent(text)}`;
    fallback.hidden = false;
    fallback.focus?.();
  };

  /** Variação escolhida (todas as opções marcadas e uma variação disponível com elas). */
  const selected = () => Object.fromEntries(cfg.fields.map((f) => [f, form.querySelector<HTMLInputElement>(`input[name="${CSS.escape(f)}"]:checked`)?.value ?? '']));
  const match = () => {
    const s = selected();
    if (cfg.fields.some((f) => !s[f])) return { complete: false, variation: undefined };
    return { complete: true, variation: cfg.variations.find((v) => cfg.fields.every((f) => v.attributes[f] === s[f])) };
  };

  const sync = () => {
    if (!variationInput) return;
    const { complete, variation } = match();
    const any = cfg.fields.some((f) => selected()[f]);
    resets.forEach((r) => (r.hidden = !any));
    variationInput.value = variation ? String(variation.id) : '0';
    // Preço: a faixa até escolher; depois, o da opção (como o WooCommerce mostra).
    const showSingle = !!variation && variation.price !== null;
    if (single && range) {
      single.textContent = showSingle ? brl.format(variation!.price!) : '';
      single.hidden = !showSingle;
      range.hidden = showSingle;
    }
    if (complete && !variation) say(cfg.messages.unavailable);
    else if (variation && !variation.inStock) say(cfg.messages.outOfStock);
    else say('');
    submit.setAttribute('aria-disabled', String(!!variation && !variation.inStock));
  };

  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).matches('input[type="radio"]')) sync();
  });
  resets.forEach((r) =>
    r.addEventListener('click', () => {
      r.closest('fieldset')!.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((i) => (i.checked = false));
      sync();
      say('');
      r.closest('fieldset')!.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    }),
  );

  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    let id = cfg.id;
    if (variationInput) {
      const { complete, variation } = match();
      if (!complete || !variation || !variation.inStock) {
        say(!complete ? cfg.messages.makeSelection : !variation ? cfg.messages.unavailable : cfg.messages.outOfStock);
        const first = form.querySelector<HTMLInputElement>('input[type="radio"]:not(:checked)');
        if (!complete) first?.focus();
        return;
      }
      id = variation.id;
    }
    const quantity = Math.max(1, parseInt(qty.value, 10) || 1);
    const chosen = variationInput ? cfg.variations.find((v) => v.id === id) : undefined;
    const sel = selected();
    const variant = cfg.fields.map((f) => cfg.quote.labels[f]?.[sel[f]] ?? '').filter(Boolean).join(', ') || undefined;
    busy = true;
    submit.classList.add('is-busy');
    submit.setAttribute('aria-busy', 'true');
    say('');
    if (fallback) fallback.hidden = true;
    const label = submit.querySelector<HTMLElement>('[data-pd-label]');
    const original = label?.textContent;
    if (label) label.textContent = cfg.messages.adding;
    const done = () => {
      busy = false;
      submit.classList.remove('is-busy');
      submit.removeAttribute('aria-busy');
      if (label && original) label.textContent = original;
    };
    try {
      await addItem(id, quantity);
      const price = chosen?.price ?? cfg.ga.price ?? undefined;
      trackEcommerce('add_to_cart', { value: (price ?? 0) * quantity, items: [itemOf(cfg, { variation_id: chosen ? String(chosen.id) : undefined, item_variant: variant, price, quantity })] }, { location: 'produto' });
      try {
        sessionStorage.setItem(ADDED_KEY, cfg.name);
      } catch {
        /* armazenamento indisponível: o carrinho abre sem o aviso */
      }
      location.assign(cfg.cart);
    } catch (err) {
      done();
      // Loja fora deste endereço (ou fora do ar): aviso e o pedido pelo WhatsApp.
      if (err instanceof StoreUnavailable) showFallback(quantity);
      else say(err instanceof StoreError ? err.message : cfg.messages.unavailable);
    }
  });
  // Ao voltar do carrinho pelo histórico, o botão volta ao normal.
  window.addEventListener('pageshow', () => {
    busy = false;
    submit.classList.remove('is-busy');
    submit.removeAttribute('aria-busy');
  });

  // Ao voltar para a página pelo histórico, o estado do formulário é restaurado pelo navegador.
  window.addEventListener('pageshow', sync);
  sync();
}

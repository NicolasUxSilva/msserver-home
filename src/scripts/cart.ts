import { ADDED_KEY, addItem, decodeEntities, getCart, money, removeItem, StoreError, StoreUnavailable, updateItem, type Cart, type CartItem, type Money } from './store-api';
import { cartItems, itemsValue, trackEcommerce } from './analytics';
import { guardFab } from './fab-guard';
import { totalsHtml, type TotalsText } from './cart-totals';
import { productQuoteText } from '../data/produto';

// Carrinho no navegador: lê o carrinho da Store API do WooCommerce (a mesma sessão da finalização de
// compra) e permite mudar quantidades e remover itens; os totais são sempre os que o WooCommerce
// devolve. Também atende aos links "adicionar ao carrinho" do catálogo (/carrinho/?add-to-cart=ID).
// O site não recebe pagamentos: com a loja fora do ar, a página mostra o aviso e o pedido pelo
// WhatsApp; nenhum caminho daqui leva ao checkout do WooCommerce.

type Config = {
  products: Record<string, { id: number; brand: string | null; path: string; image: string | null; srcset: string | null }>;
  byId: Record<string, { name: string; url: string }>;
  quoteNumber: string;
  routes: { cart: string; shop: string };
  whatsapp: { number: string; intro: string; totalLabel: string };
  texts: Record<string, string> & TotalsText & { columns: Record<string, string> };
};

export function initCart() {
  const root = document.querySelector<HTMLElement>('[data-cart]');
  const cfgEl = document.querySelector('[data-cart-config]');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-cart-row]');
  if (!root || !cfgEl || !tpl) return;
  const cfg: Config = JSON.parse(cfgEl.textContent!);
  const T = cfg.texts;
  const list = root.querySelector<HTMLUListElement>('[data-cart-items]')!;
  const totalsEl = root.querySelector<HTMLElement>('[data-cart-totals]')!;
  const countEl = root.querySelector<HTMLElement>('[data-cart-count]')!;
  const notices = root.querySelector<HTMLElement>('[data-cart-notices]')!;
  const live = root.querySelector<HTMLElement>('[data-cart-live]')!;
  const whatsapp = root.querySelector<HTMLAnchorElement>('[data-cart-whatsapp]')!;
  const downWhatsapp = root.querySelector<HTMLAnchorElement>('[data-cart-unavailable-whatsapp]');
  const downDefault = downWhatsapp?.href ?? '';
  let cart: Cart | null = null;
  let viewed = false;

  const setState = (s: 'loading' | 'empty' | 'ready' | 'unavailable') => (root.dataset.state = s);
  const fill = (s: string, v: string | number) => s.replace('%s', String(v));

  // ——— Avisos (como os do WooCommerce: adicionado, removido com "Desfazer?", erros) ———
  const notify = (type: 'success' | 'error', text: string, action?: { label: string; run: () => void }) => {
    const box = document.createElement('div');
    box.className = `cart-notice cart-notice--${type}`;
    box.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const p = document.createElement('p');
    p.textContent = text;
    box.append(p);
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = action.label;
      b.addEventListener('click', () => {
        box.remove();
        action.run();
      });
      box.append(b);
    }
    notices.replaceChildren(box);
  };

  // ——— Item → página e foto deste site ———
  const productOf = (item: CartItem) => cfg.products[item.permalink.split('?')[0]];
  const nameOf = (item: CartItem) => decodeEntities(item.name);
  const optionsOf = (item: CartItem) => [...item.variation.map((v) => [v.attribute, v.value]), ...item.item_data.map((d) => [d.name ?? d.key ?? '', d.display ?? d.value ?? ''])].map(([k, v]) => [decodeEntities(k), decodeEntities(v)]);

  // ——— Desenho ———
  const renderRow = (item: CartItem) => {
    const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const name = nameOf(item);
    const local = productOf(item);
    const href = local?.path ?? item.permalink;
    li.dataset.key = item.key;
    const thumb = li.querySelector<HTMLAnchorElement>('.cart-thumb')!;
    thumb.href = href;
    const img = thumb.querySelector('img')!;
    if (local?.image) {
      img.src = local.image;
      if (local.srcset) img.srcset = local.srcset;
      img.sizes = '96px';
    } else if (item.images[0]) img.src = item.images[0].thumbnail || item.images[0].src;
    else thumb.classList.add('is-empty');
    const link = li.querySelector<HTMLAnchorElement>('.cart-name a')!;
    link.href = href;
    link.textContent = name;
    const opts = optionsOf(item);
    const variation = li.querySelector<HTMLElement>('.cart-variation')!;
    if (opts.length) variation.textContent = opts.map(([k, v]) => `${k}: ${v}`).join(' · ');
    else variation.remove();
    const badge = li.querySelector<HTMLElement>('.cart-badge')!;
    if (item.low_stock_remaining) badge.textContent = fill(T.lowStock, item.low_stock_remaining);
    else if (item.show_backorder_badge) badge.textContent = T.backorder;
    else badge.remove();
    li.querySelector('.cart-price [data-v]')!.textContent = money(item.prices.price, item.prices);
    li.querySelector('.cart-line [data-v]')!.textContent = money(Number(item.prices.price) * item.quantity, item.prices);

    // Quantidade, dentro dos limites do WooCommerce.
    const q = item.quantity_limits;
    const input = li.querySelector<HTMLInputElement>('.cart-qty input')!;
    input.value = String(item.quantity);
    input.min = String(q.minimum || 1);
    if (q.maximum > 0) input.max = String(q.maximum);
    input.step = String(q.multiple_of || 1);
    input.setAttribute('aria-label', `${T.columns.quantity} de ${name}`);
    const [minus, plus] = li.querySelectorAll<HTMLButtonElement>('[data-step]');
    minus.setAttribute('aria-label', `Diminuir a quantidade de ${name}`);
    plus.setAttribute('aria-label', `Aumentar a quantidade de ${name}`);
    const editable = q.editable && !item.sold_individually;
    if (!editable) li.querySelector('.cart-qty')!.classList.add('is-fixed');
    input.disabled = minus.disabled = plus.disabled = !editable;
    minus.disabled ||= item.quantity <= (q.minimum || 1);
    plus.disabled ||= q.maximum > 0 && item.quantity >= q.maximum;
    li.querySelector('.cart-remove')!.setAttribute('aria-label', `Remover ${name} do carrinho`);
    return li;
  };

  const renderTotals = (c: Cart) => {
    totalsEl.innerHTML = totalsHtml(c, T);
  };

  /** Mensagem no formato do plugin "WooCommerce Order on WhatsApp" do WordPress. */
  const whatsappText = (c: Cart) => {
    const plain = (v: number, m: Money) => money(v, m).replace(/ /g, ' ').replace('−', '-');
    const lines = c.items.map((i) => {
      const opts = optionsOf(i).map(([, v]) => v);
      return `-> ${i.quantity} x ${nameOf(i)}${opts.length ? ` - ${opts.join(', ')}` : ''} = ${plain(Number(i.prices.price), i.prices)}`;
    });
    const contents = c.items.reduce((n, i) => n + Number(i.totals.line_total), 0);
    return `${cfg.whatsapp.intro}\n\n${lines.join('\n\n')}\n\n${cfg.whatsapp.totalLabel} ${plain(contents, c.totals)}`;
  };

  const render = (c: Cart, focus?: { key: string; role: string }) => {
    cart = c;
    if (!c.items.length) {
      setState('empty');
      countEl.hidden = true;
      return;
    }
    list.replaceChildren(...c.items.map(renderRow));
    renderTotals(c);
    whatsapp.href = `https://wa.me/${cfg.whatsapp.number}?text=${encodeURIComponent(whatsappText(c))}`;
    countEl.innerHTML = `<b>${c.items_count}</b> ${c.items_count === 1 ? 'item' : 'itens'}`;
    countEl.hidden = false;
    for (const e of c.errors ?? []) notify('error', decodeEntities(e.message));
    setState('ready');
    if (focus) list.querySelector<HTMLElement>(`[data-key="${CSS.escape(focus.key)}"] ${focus.role}`)?.focus();
    if (!viewed) {
      viewed = true;
      const items = cartItems(c.items, cfg.products);
      trackEcommerce('view_cart', { value: itemsValue(items), items });
    }
  };

  const failed = (e: unknown) => {
    if (e instanceof StoreError) {
      notify('error', e.message);
      if (cart) render(cart);
      return;
    }
    setState('unavailable');
  };

  // ——— Carga (e "adicionar ao carrinho" vindo do catálogo) ———
  // Produto a adicionar (link do catálogo). Fica guardado até a loja responder: "Tentar de novo"
  // repete a adição depois de uma falha de conexão.
  const start = new URL(location.href);
  let pending = Number(start.searchParams.get('variation_id') || start.searchParams.get('add-to-cart'))
    ? { id: Number(start.searchParams.get('variation_id') || start.searchParams.get('add-to-cart')), qty: Math.max(1, Number(start.searchParams.get('quantity')) || 1) }
    : null;
  if (start.searchParams.has('add-to-cart')) history.replaceState(null, '', cfg.routes.cart);

  const load = async () => {
    setState('loading');
    const add = pending?.id ?? 0;
    const qty = pending?.qty ?? 1;
    try {
      if (add) {
        try {
          const c = await addItem(add, qty);
          pending = null;
          const item = c.items.find((i) => i.id === add);
          if (item) {
            notify('success', fill(T.added, nameOf(item)));
            const items = cartItems([item], cfg.products, () => qty);
            trackEcommerce('add_to_cart', { value: itemsValue(items), items }, { location: 'catalogo' });
          }
          render(c);
          return;
        } catch (e) {
          // Loja fora do ar: aviso e o pedido deste produto pelo WhatsApp.
          if (e instanceof StoreUnavailable) {
            const p = cfg.byId[String(add)];
            if (p && downWhatsapp) downWhatsapp.href = `https://wa.me/${cfg.quoteNumber}?text=${encodeURIComponent(productQuoteText({ name: p.name, url: p.url, quantity: qty }))}`;
            setState('unavailable');
            return;
          }
          pending = null;
          if (e instanceof StoreError) notify('error', e.message);
          else throw e;
        }
      }
      try {
        const added = sessionStorage.getItem(ADDED_KEY);
        if (added) {
          sessionStorage.removeItem(ADDED_KEY);
          notify('success', fill(T.added, added));
        }
      } catch {
        /* armazenamento indisponível */
      }
      render(await getCart());
    } catch (e) {
      failed(e);
    }
  };

  // ——— Quantidade (espera a pessoa parar de clicar) e remoção ———
  const timers = new Map<string, number>();
  const setQuantity = (li: HTMLElement, quantity: number, role: string) => {
    const key = li.dataset.key!;
    const item = cart?.items.find((i) => i.key === key);
    if (!item) return;
    const q = item.quantity_limits;
    const step = q.multiple_of || 1;
    quantity = Math.max(q.minimum || 1, Math.round(quantity / step) * step);
    if (q.maximum > 0) quantity = Math.min(q.maximum, quantity);
    li.querySelector<HTMLInputElement>('.cart-qty input')!.value = String(quantity);
    li.querySelector('.cart-line [data-v]')!.textContent = money(Number(item.prices.price) * quantity, item.prices);
    clearTimeout(timers.get(key));
    timers.set(
      key,
      window.setTimeout(async () => {
        if (quantity === item.quantity) return;
        li.classList.add('is-busy');
        try {
          const before = item.quantity;
          render(await updateItem(key, quantity), { key, role });
          live.textContent = `Carrinho atualizado. Total: ${money(cart!.totals.total_price, cart!.totals)}.`;
          // Mudança de quantidade: a diferença, como adição ou remoção (padrão do GA4).
          const items = cartItems([item], cfg.products, () => Math.abs(quantity - before));
          trackEcommerce(quantity > before ? 'add_to_cart' : 'remove_from_cart', { value: itemsValue(items), items }, { location: 'carrinho' });
        } catch (e) {
          failed(e);
        }
      }, 450),
    );
  };

  list.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const li = target.closest<HTMLElement>('.cart-item');
    if (!li) return;
    const step = target.closest<HTMLButtonElement>('[data-step]');
    if (step) {
      const input = li.querySelector<HTMLInputElement>('.cart-qty input')!;
      setQuantity(li, (Number(input.value) || 1) + Number(step.dataset.step), `[data-step="${step.dataset.step}"]`);
      return;
    }
    if (target.closest('.cart-remove')) {
      const item = cart?.items.find((i) => i.key === li.dataset.key);
      if (!item) return;
      li.classList.add('is-busy');
      try {
        render(await removeItem(item.key));
        const removed = cartItems([item], cfg.products);
        trackEcommerce('remove_from_cart', { value: itemsValue(removed), items: removed }, { location: 'carrinho' });
        const name = nameOf(item);
        live.textContent = fill(T.removed, name);
        notify('success', fill(T.removed, name), {
          label: T.undo,
          run: async () => {
            try {
              render(await addItem(item.id, item.quantity));
            } catch (err) {
              failed(err);
            }
          },
        });
        if (cart && !cart.items.length) root.querySelector<HTMLElement>('[data-cart-empty] a')?.focus();
        else list.querySelector<HTMLElement>('.cart-remove')?.focus();
      } catch (err) {
        failed(err);
      }
    }
  });
  list.addEventListener('change', (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>('.cart-qty input');
    if (input) setQuantity(input.closest('.cart-item')!, Number(input.value) || 1, '.cart-qty input');
  });

  // "Orçamento pelo WhatsApp" do carrinho: o pedido de orçamento (um evento, sem dados pessoais).
  whatsapp.addEventListener('click', () => {
    if (!cart?.items.length) return;
    const items = cartItems(cart.items, cfg.products);
    trackEcommerce('generate_lead', { value: itemsValue(items), items }, { form: 'carrinho', method: 'whatsapp' });
  });

  root.querySelector('[data-cart-retry]')!.addEventListener('click', () => {
    if (downWhatsapp) downWhatsapp.href = downDefault;
    load();
  });
  // O WhatsApp flutuante não cobre o total nem os botões de compra.
  guardFab(() => [...root.querySelectorAll('.cart-actions, .cart-remove, .cart-qty-field')]);
  load();
}

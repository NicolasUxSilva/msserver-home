import { CART_COUNT_EVENT, CART_COUNT_KEY, getCart } from './store-api';

// Atalho do carrinho no cabeçalho, com a quantidade de itens. A quantidade vem das respostas da
// Store API do WooCommerce (produto, carrinho e finalização avisam a cada alteração) e fica guardada
// para as próximas páginas. Para não consultar a loja em toda visita, a leitura só acontece quando há
// sinal de carrinho: a contagem guardada é maior que zero ou o cookie do WooCommerce indica itens
// (woocommerce_items_in_cart, de alterações feitas nas páginas do WordPress). Sem a loja neste
// endereço (preview), o atalho continua levando ao carrinho, sem número.

export function initCartBadge() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-cart-link]')];
  if (!links.length) return;

  const set = (count: number) => {
    const n = Math.max(0, Math.floor(count) || 0);
    for (const a of links) {
      const badge = a.querySelector<HTMLElement>('[data-cart-count]');
      if (badge) {
        badge.textContent = n > 99 ? '99+' : String(n);
        badge.hidden = n === 0;
      }
      a.setAttribute('aria-label', n === 0 ? 'Carrinho, vazio' : `Carrinho, ${n} ${n === 1 ? 'item' : 'itens'}`);
      a.classList.toggle('has-items', n > 0);
    }
  };

  let stored = 0;
  try {
    stored = Number(localStorage.getItem(CART_COUNT_KEY)) || 0;
  } catch {
    /* sem armazenamento */
  }
  set(stored);
  window.addEventListener(CART_COUNT_EVENT, (e) => set((e as CustomEvent<number>).detail));
  // Outra aba alterou o carrinho.
  window.addEventListener('storage', (e) => e.key === CART_COUNT_KEY && set(Number(e.newValue) || 0));

  // O carrinho e a finalização já leem a loja (e avisam o contador): não há leitura extra nelas.
  if (document.querySelector('[data-cart], [data-fo]')) return;
  const cookieSays = /(?:^|;\s*)woocommerce_items_in_cart=1/.test(document.cookie);
  if (stored > 0 || cookieSays) getCart().catch(() => {});
}

import { ORDER_OPTIONS, matches, pageItems, resultCount, stateUrl, type CatalogState, type OrderKey } from '../lib/catalog-shared';
import { track } from './analytics';

// Catálogo no navegador: busca, categoria (seletor), ordenação e paginação sobre os cards que a
// página já trouxe (nenhum card é criado aqui; só mostrados, escondidos e reordenados). O estado
// fica na URL, como no WooCommerce: página no caminho (/page/2/) e ?orderby=, além de ?tipo= e
// ?busca=. O endereço antigo de /servidores/ (?product-page=N) é convertido.

type Config = {
  key: string;
  base: string;
  perPage: number;
  defaultOrder: OrderKey;
  legacyParam: string | null;
  orders: Record<OrderKey, number[]>;
  products: Record<string, { s: string; c: string[] }>;
  searchAll: string;
};

const ORDER_KEYS = new Set<string>(ORDER_OPTIONS.map((o) => o.key));

const svg = (path: string) =>
  `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
const LEFT = svg('<path d="m15 18-6-6 6-6"/>');
const RIGHT = svg('<path d="m9 18 6-6-6-6"/>');
const X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

export function initCatalog() {
  const root = document.querySelector<HTMLElement>('[data-catalog]');
  const cfgEl = document.querySelector('[data-cat-config]');
  if (!root || !cfgEl) return;
  const cfg: Config = JSON.parse(cfgEl.textContent!);

  const grid = root.querySelector<HTMLElement>('[data-cat-grid]')!;
  const cards = new Map<number, HTMLElement>([...grid.querySelectorAll<HTMLElement>('[data-product]')].map((li) => [Number(li.dataset.product), li]));
  const countEl = root.querySelector<HTMLElement>('[data-cat-count]')!;
  const live = root.querySelector<HTMLElement>('[data-cat-live]')!;
  const empty = root.querySelector<HTMLElement>('[data-cat-empty]')!;
  const emptyText = root.querySelector<HTMLElement>('[data-cat-empty-text]')!;
  const searchAll = root.querySelector<HTMLAnchorElement>('[data-cat-search-all]')!;
  const pagesNav = root.querySelector<HTMLElement>('[data-cat-pages]')!;
  const form = root.querySelector<HTMLFormElement>('[data-cat-search]')!;
  const q = root.querySelector<HTMLInputElement>('[data-cat-q]')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-cat-clear]')!;
  const order = root.querySelector<HTMLSelectElement>('[data-cat-order]')!;
  const tipoSel = root.querySelector<HTMLSelectElement>('select[data-cat-tipo]');
  const tipoOpts = tipoSel ? [...tipoSel.options].filter((o) => o.value) : [];
  const active = root.querySelector<HTMLElement>('[data-cat-active]')!;
  const brandLinks = [...root.querySelectorAll<HTMLAnchorElement>('.cat-brand')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const tipos = new Map(tipoOpts.map((o) => [o.value, o.dataset.name!]));

  // Foto aparece suave quando termina de carregar.
  grid.querySelectorAll<HTMLImageElement>('.pc-media img').forEach((img) => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });

  const parse = (): CatalogState => {
    const url = new URL(location.href);
    const m = url.pathname.match(/\/page\/(\d+)\/?$/);
    let page = m ? Number(m[1]) : 1;
    if (cfg.legacyParam && url.searchParams.has(cfg.legacyParam)) page = Number(url.searchParams.get(cfg.legacyParam)) || 1;
    const o = url.searchParams.get('orderby') ?? '';
    const t = url.searchParams.get('tipo') ?? '';
    return { page, orderby: (ORDER_KEYS.has(o) ? o : cfg.defaultOrder) as OrderKey, busca: url.searchParams.get('busca') ?? '', tipo: tipos.has(t) ? t : '' };
  };
  let state = parse();

  const compute = (s: CatalogState) => {
    const searched = cfg.orders[s.orderby].filter((id) => !s.busca.trim() || matches(cfg.products[id].s, s.busca));
    const list = s.tipo ? searched.filter((id) => cfg.products[id].c.includes(s.tipo)) : searched;
    const pages = Math.max(1, Math.ceil(list.length / cfg.perPage));
    return { searched, list, pages, page: Math.min(Math.max(1, s.page), pages) };
  };

  const link = (n: number) => stateUrl(cfg.base, { ...state, page: n }, cfg.defaultOrder);

  const renderPages = (page: number, pages: number) => {
    pagesNav.hidden = pages <= 1;
    if (pages <= 1) return;
    const step = (n: number, enabled: boolean, label: string, html: string, rel: string) =>
      enabled ? `<a class="cat-step" href="${link(n)}" rel="${rel}" aria-label="${label}" data-page="${n}">${html}</a>` : `<span class="cat-step is-disabled" aria-hidden="true">${html}</span>`;
    pagesNav.innerHTML =
      step(page - 1, page > 1, 'Página anterior', `${LEFT}<span>Anterior</span>`, 'prev') +
      pageItems(page, pages)
        .map((it) => (it.type === 'gap' ? '<span class="cat-gap" aria-hidden="true">…</span>' : `<a href="${link(it.n)}" aria-label="Página ${it.n}" data-page="${it.n}"${it.n === page ? ' aria-current="page"' : ''}>${it.n}</a>`))
        .join('') +
      step(page + 1, page < pages, 'Próxima página', `<span>Próxima</span>${RIGHT}`, 'next') +
      `<p class="cat-pages-info">Página ${page} de ${pages}</p>`;
  };

  const renderActive = () => {
    const pills: string[] = [];
    if (state.busca.trim()) pills.push(`<button type="button" data-remove="busca" aria-label="Remover a busca ${escapeHtml(state.busca.trim())}">Busca: “${escapeHtml(state.busca.trim())}” ${X}</button>`);
    if (state.tipo) pills.push(`<button type="button" data-remove="tipo" aria-label="Remover o filtro ${escapeHtml(tipos.get(state.tipo)!)}">${escapeHtml(tipos.get(state.tipo)!)} ${X}</button>`);
    active.innerHTML = pills.join('');
  };

  const render = (opts: { history?: 'push' | 'replace' | 'none'; animate?: boolean } = {}) => {
    const { searched, list, pages, page } = compute(state);
    state.page = page;
    const start = (page - 1) * cfg.perPage;
    const visible = list.slice(start, start + cfg.perPage);
    const show = new Set(visible);
    cards.forEach((li, id) => (li.hidden = !show.has(id)));
    visible.forEach((id, i) => {
      const li = cards.get(id)!;
      li.style.setProperty('--i', String(i));
      grid.append(li);
    });
    if (opts.animate && !reduce.matches) {
      grid.classList.remove('is-changing');
      void grid.offsetWidth;
      grid.classList.add('is-changing');
    }

    const text = resultCount(start + 1, start + visible.length, list.length);
    countEl.textContent = text;
    grid.hidden = list.length === 0;
    empty.hidden = list.length > 0;
    if (!list.length) {
      const what = [state.busca.trim() && `“${state.busca.trim()}”`, state.tipo && `na categoria ${tipos.get(state.tipo)}`].filter(Boolean).join(' ');
      emptyText.textContent = `Nenhum produto ${cfg.key === 'servidores' ? 'do catálogo' : 'desta categoria'} corresponde a ${what || 'esta busca'}.`;
      searchAll.href = cfg.searchAll + encodeURIComponent(state.busca.trim());
    }

    // Categorias: a contagem de cada opção acompanha a busca; sem produtos, a opção fica indisponível.
    tipoOpts.forEach((o) => {
      const n = searched.filter((id) => cfg.products[id].c.includes(o.value)).length;
      o.textContent = `${o.dataset.name} (${n})`;
      o.disabled = n === 0 && o.value !== state.tipo;
    });
    if (tipoSel) {
      tipoSel.value = state.tipo;
      tipoSel.classList.toggle('is-set', !!state.tipo);
    }

    order.value = state.orderby;
    if (document.activeElement !== q) q.value = state.busca;
    clear.hidden = !q.value;
    renderActive();
    renderPages(page, pages);

    syncBrands(state.busca);

    const url = stateUrl(cfg.base, state, cfg.defaultOrder);
    if (opts.history === 'push' && url !== location.pathname + location.search) history.pushState(null, '', url);
    else if (opts.history === 'replace' && url !== location.pathname + location.search) history.replaceState(null, '', url);
    live.textContent = text;
  };

  /** Trocar de fabricante mantém a busca digitada (atualizado a cada tecla). */
  function syncBrands(busca: string) {
    brandLinks.forEach((a) => {
      const base = a.getAttribute('href')!.split('?')[0];
      a.setAttribute('href', busca.trim() ? `${base}?busca=${encodeURIComponent(busca.trim())}` : base);
    });
  }

  /** Depois de trocar de página: volta ao topo da lista, com o foco na contagem. */
  const toResults = () => {
    countEl.focus({ preventScroll: true });
    countEl.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
  };

  // ——— Eventos ———
  let typing = 0;
  q.addEventListener('input', () => {
    clear.hidden = !q.value;
    syncBrands(q.value);
    clearTimeout(typing);
    typing = window.setTimeout(() => {
      state = { ...state, busca: q.value, page: 1 };
      render({ history: 'replace', animate: true });
    }, 160);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(typing);
    state = { ...state, busca: q.value, page: 1 };
    render({ history: 'push', animate: true });
    track('catalog_search', { listing: cfg.key, results: compute(state).list.length });
  });
  clear.addEventListener('click', () => {
    q.value = '';
    state = { ...state, busca: '', page: 1 };
    render({ history: 'push', animate: true });
    q.focus();
  });
  order.addEventListener('change', () => {
    state = { ...state, orderby: order.value as OrderKey, page: 1 };
    render({ history: 'push', animate: true });
    track('catalog_sort', { listing: cfg.key, orderby: state.orderby });
  });
  tipoSel?.addEventListener('change', () => {
    state = { ...state, tipo: tipoSel.value, page: 1 };
    render({ history: 'push', animate: true });
    track('catalog_filter', { listing: cfg.key, tipo: state.tipo || 'todos' });
  });
  active.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-remove]');
    if (!btn) return;
    state = { ...state, [btn.dataset.remove!]: '', page: 1 };
    render({ history: 'push', animate: true });
    q.focus();
  });
  root.querySelector('[data-cat-reset]')!.addEventListener('click', () => {
    state = { ...state, busca: '', tipo: '', page: 1 };
    render({ history: 'push', animate: true });
    q.focus();
  });
  pagesNav.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-page]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    state = { ...state, page: Number(a.dataset.page) };
    render({ history: 'push', animate: true });
    toResults();
  });
  window.addEventListener('popstate', () => {
    state = parse();
    render({ history: 'none' });
  });

  // Endereço com busca, filtro, ordenação ou o parâmetro antigo de página: aplica o estado.
  const url = new URL(location.href);
  if (['orderby', 'tipo', 'busca', cfg.legacyParam].some((p) => p && url.searchParams.has(p))) render({ history: 'replace' });
  root.classList.add('is-ready');
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

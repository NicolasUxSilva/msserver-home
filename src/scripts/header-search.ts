import { matches, normalize } from '../lib/catalog-shared';
import { track } from './analytics';

// Busca do cabeçalho: o destino é o catálogo deste site (/servidores/?busca=termo), que aplica a mesma
// busca, mantém a ordenação e a paginação e guarda o estado no endereço. Enquanto a pessoa digita, a
// lista de sugestões (padrão "combobox" do WAI-ARIA) mostra as categorias e os produtos que
// correspondem, com o mesmo texto de busca do catálogo (nome, fabricante, categorias, atributos e
// códigos de peça, sem acentos). O índice (/busca.json) só é baixado no primeiro uso.

type IndexProduct = { id: number; n: string; u: string; i: string | null; p: string; b: string | null; c: string[]; nn: string; s: string };
type IndexCategory = { k: string; t: string; u: string; n: number; s: string };
type Index = { products: IndexProduct[]; categories: IndexCategory[] };

const MAX_PRODUCTS = 6;
const MAX_CATEGORIES = 2;

let indexPromise: Promise<Index> | null = null;
function loadIndex(url: string): Promise<Index> {
  indexPromise ??= fetch(url, { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<Index>;
  });
  // Uma falha não fica guardada: a próxima tecla tenta de novo.
  indexPromise.catch(() => (indexPromise = null));
  return indexPromise;
}

/** Produtos que contêm todas as palavras, com quem tem as palavras no nome (e no começo) primeiro. */
function rank(index: Index, query: string) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return { products: [], categories: [], total: 0 };
  const hits = index.products.filter((p) => matches(p.s, query));
  const score = (p: IndexProduct) =>
    words.reduce((n, w) => n + (p.nn.includes(w) ? 3 : 0) + (p.nn.split(' ').some((t) => t.startsWith(w)) ? 1 : 0), 0);
  const sorted = hits.map((p, i) => ({ p, i, sc: score(p) })).sort((a, b) => b.sc - a.sc || a.i - b.i);
  const categories = index.categories.filter((c) => words.every((w) => c.s.split(' ').some((t) => t.startsWith(w)))).slice(0, MAX_CATEGORIES);
  return { products: sorted.slice(0, MAX_PRODUCTS).map((x) => x.p), categories, total: hits.length };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Destaca no texto as palavras buscadas (sem considerar acentos). */
function highlight(text: string, query: string) {
  const words = normalize(query).split(' ').filter((w) => w.length > 1);
  if (!words.length) return esc(text);
  // Mapa da posição no texto normalizado (sem acento, um caractere por caractere) para o original.
  const plain = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (plain.length !== text.length) return esc(text);
  const marks = new Array(text.length).fill(false);
  for (const w of words) {
    let i = plain.indexOf(w);
    while (i !== -1) {
      for (let k = i; k < i + w.length; k++) marks[k] = true;
      i = plain.indexOf(w, i + w.length);
    }
  }
  let out = '';
  let open = false;
  for (let k = 0; k < text.length; k++) {
    if (marks[k] && !open) (out += '<mark>'), (open = true);
    if (!marks[k] && open) (out += '</mark>'), (open = false);
    out += esc(text[k]);
  }
  return open ? out + '</mark>' : out;
}

export function initHeaderSearch() {
  document.querySelectorAll<HTMLFormElement>('form[data-search]').forEach(setup);
}

function setup(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('[data-search-input]');
  const pop = form.querySelector<HTMLElement>('[data-search-pop]');
  const list = form.querySelector<HTMLUListElement>('[data-search-list]');
  const status = form.querySelector<HTMLElement>('[data-search-status]');
  const live = form.querySelector<HTMLElement>('[data-search-live]');
  if (!input || !pop || !list || !status) return;
  const indexUrl = form.dataset.searchIndex!;
  const catalog = form.getAttribute('action')!;
  let active = -1;
  let seq = 0;
  let timer = 0;

  const options = () => [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const resultsUrl = (q: string) => `${catalog}?busca=${encodeURIComponent(q.trim())}`;

  const open = (show: boolean) => {
    pop.hidden = !show;
    input.setAttribute('aria-expanded', String(show));
    form.classList.toggle('is-open', show);
    if (!show) setActive(-1);
  };

  const setActive = (i: number) => {
    const opts = options();
    active = opts.length ? Math.max(-1, Math.min(i, opts.length - 1)) : -1;
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === active)));
    if (active >= 0) {
      input.setAttribute('aria-activedescendant', opts[active].id);
      opts[active].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };

  const say = (text: string, kind: 'info' | 'empty' | 'error' | 'loading') => {
    status.textContent = text;
    status.dataset.kind = kind;
    status.hidden = !text;
  };

  const render = (q: string, r: ReturnType<typeof rank>) => {
    const id = (k: string) => `${input.id}-op-${k}`;
    const parts: string[] = [];
    for (const c of r.categories)
      parts.push(
        `<li role="option" id="${id(`c-${c.k}`)}" class="sg-item sg-cat" data-href="${esc(c.u)}" aria-selected="false"><span class="sg-cat-ico" aria-hidden="true">#</span><span class="sg-text"><span class="sg-name">${highlight(c.t, q)}</span><span class="sg-meta">Categoria · ${c.n} ${c.n === 1 ? 'produto' : 'produtos'}</span></span></li>`,
      );
    for (const p of r.products)
      parts.push(
        `<li role="option" id="${id(`p-${p.id}`)}" class="sg-item sg-prod" data-href="${esc(p.u)}" aria-selected="false"><span class="sg-thumb" aria-hidden="true">${p.i ? `<img src="${esc(p.i)}" alt="" width="56" height="42" loading="lazy" decoding="async">` : ''}</span><span class="sg-text"><span class="sg-name">${highlight(p.n, q)}</span><span class="sg-meta">${esc([p.b, ...p.c].filter(Boolean).slice(0, 2).join(' · '))}</span></span><span class="sg-price">${esc(p.p)}</span></li>`,
      );
    if (r.total)
      parts.push(
        `<li role="option" id="${id('all')}" class="sg-item sg-all" data-href="${esc(resultsUrl(q))}" aria-selected="false"><span class="sg-text">Ver ${r.total === 1 ? 'o resultado' : `todos os ${r.total} resultados`} para “${esc(q.trim())}” no catálogo</span><span aria-hidden="true">→</span></li>`,
      );
    list.innerHTML = parts.join('');
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (!r.total && !r.categories.length) say(`Nenhum produto encontrado para “${q.trim()}”. Tente o modelo, o fabricante ou o código da peça.`, 'empty');
    else say('', 'info');
    if (live) live.textContent = r.total ? `${r.total} ${r.total === 1 ? 'produto encontrado' : 'produtos encontrados'}. Use as setas para escolher.` : 'Nenhum produto encontrado.';
    open(true);
  };

  const update = async () => {
    const q = input.value;
    if (normalize(q).length < 2) {
      list.innerHTML = '';
      say('', 'info');
      open(false);
      return;
    }
    const mine = ++seq;
    if (!indexPromise) {
      list.innerHTML = '';
      say('Carregando sugestões…', 'loading');
      open(true);
    }
    try {
      const index = await loadIndex(indexUrl);
      if (mine !== seq || input.value !== q) return;
      render(q, rank(index, q));
    } catch {
      if (mine !== seq) return;
      list.innerHTML = '';
      say('Não foi possível carregar as sugestões agora. Pressione Enter para buscar no catálogo.', 'error');
      open(true);
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(update, 90);
  });
  input.addEventListener('focus', () => {
    // Antecipa o download do índice e reabre as sugestões do texto que já estava no campo.
    loadIndex(indexUrl).catch(() => {});
    if (normalize(input.value).length >= 2) update();
  });

  const go = (href: string, label: string) => {
    track('search_suggestion_click', { target: label });
    location.assign(href);
  };

  input.addEventListener('keydown', (e) => {
    const opts = options();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pop.hidden) update();
      else setActive(active + 1 >= opts.length ? 0 : active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active <= 0 ? opts.length - 1 : active - 1);
    } else if (e.key === 'Escape') {
      if (!pop.hidden) {
        e.preventDefault();
        e.stopPropagation();
        open(false);
      }
    } else if (e.key === 'Enter' && active >= 0 && opts[active]) {
      e.preventDefault();
      go(opts[active].dataset.href!, opts[active].classList.contains('sg-all') ? 'todos' : opts[active].classList.contains('sg-cat') ? 'categoria' : 'produto');
    } else if (e.key === 'Tab') open(false);
  });

  list.addEventListener('mousedown', (e) => e.preventDefault()); // o campo não perde o foco ao clicar
  list.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (li) go(li.dataset.href!, li.classList.contains('sg-all') ? 'todos' : li.classList.contains('sg-cat') ? 'categoria' : 'produto');
  });
  list.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (li) setActive(options().indexOf(li));
  });

  // Enviar: o catálogo com a busca (sem texto, o catálogo completo).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    track('search_submit', { from: 'cabecalho' });
    location.assign(q ? resultsUrl(q) : catalog);
  });

  document.addEventListener('pointerdown', (e) => {
    if (!form.contains(e.target as Node)) open(false);
  });
}

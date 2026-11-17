import { matches } from '../lib/catalog-shared';
import { track } from './analytics';

// Blog no navegador.
//  - Listagem: a busca procura em todos os artigos (título, resumo e categorias, sem acentos), sobre o
//    índice /blog/busca.json, baixado só quando alguém busca. O termo fica no endereço (?busca=),
//    como no catálogo; limpar a busca volta à listagem da página.
//  - Artigo: "copiar o endereço" do compartilhamento.

type IndexPost = { t: string; e: string; u: string; d: string; df: string; c: string[]; i: string | null; s: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function initBlogSearch() {
  const root = document.querySelector<HTMLElement>('[data-blog]');
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('[data-blog-search]')!;
  const q = root.querySelector<HTMLInputElement>('[data-blog-q]')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-blog-clear]')!;
  const grid = root.querySelector<HTMLElement>('[data-blog-grid]')!;
  const results = root.querySelector<HTMLElement>('[data-blog-results]')!;
  const empty = root.querySelector<HTMLElement>('[data-blog-empty]')!;
  const emptyText = root.querySelector<HTMLElement>('[data-blog-empty-text]')!;
  const pages = root.querySelector<HTMLElement>('[data-blog-pages]');
  const count = root.querySelector<HTMLElement>('[data-blog-count]')!;
  const live = root.querySelector<HTMLElement>('[data-blog-live]')!;
  const initialCount = count.textContent;
  const pagesHidden = pages?.hidden ?? true;
  let index: Promise<IndexPost[]> | null = null;
  let timer = 0;

  const load = () => {
    index ??= fetch(root.dataset.blogIndex!)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { posts: IndexPost[] }) => d.posts);
    index.catch(() => (index = null));
    return index;
  };

  const card = (p: IndexPost) =>
    `<li class="bp-card has-card-link"><div class="bp-thumb" aria-hidden="true">${p.i ? `<img src="${esc(p.i)}" alt="" loading="lazy" decoding="async">` : ''}</div><div class="bp-body">${p.c.length ? `<p class="bp-cats">${p.c.map((c) => `<span>${esc(c)}</span>`).join('')}</p>` : ''}<h2 class="bp-title"><a class="card-link" href="${esc(p.u)}">${esc(p.t)}</a></h2>${p.e ? `<p class="bp-excerpt">${esc(p.e)}</p>` : ''}<p class="bp-meta"><time datetime="${esc(p.d)}">${esc(p.df)}</time><span class="bp-more card-raise" aria-hidden="true">Ler artigo →</span></p></div></li>`;

  const show = (term: string, list: IndexPost[] | null, failed = false) => {
    const searching = !!term.trim();
    grid.hidden = searching;
    if (pages) pages.hidden = searching || pagesHidden;
    results.hidden = !searching || !list?.length;
    empty.hidden = !searching || (!!list?.length && !failed);
    clear.hidden = !q.value;
    if (!searching) {
      count.textContent = initialCount;
      results.innerHTML = '';
      live.textContent = '';
      return;
    }
    if (failed) {
      emptyText.textContent = 'Não foi possível buscar agora. Tente de novo em instantes.';
      count.textContent = 'Busca indisponível';
      return;
    }
    const n = list!.length;
    results.innerHTML = list!.map(card).join('');
    count.textContent = n ? `${n} ${n === 1 ? 'artigo encontrado' : 'artigos encontrados'} para “${term.trim()}”` : 'Nenhum artigo encontrado';
    if (!n) emptyText.textContent = `Nenhum artigo corresponde a “${term.trim()}”. Tente outro termo.`;
    live.textContent = count.textContent;
  };

  const run = async (term: string, history: 'push' | 'replace' | 'none') => {
    const url = new URL(location.href);
    if (term.trim()) url.searchParams.set('busca', term.trim());
    else url.searchParams.delete('busca');
    if (history === 'push' && url.href !== location.href) window.history.pushState(null, '', url);
    if (history === 'replace' && url.href !== location.href) window.history.replaceState(null, '', url);
    if (!term.trim()) return show('', null);
    try {
      const posts = await load();
      if (q.value.trim() !== term.trim() && history !== 'none') return;
      show(term, posts.filter((p) => matches(p.s, term)));
    } catch {
      show(term, null, true);
    }
  };

  q.addEventListener('input', () => {
    clear.hidden = !q.value;
    clearTimeout(timer);
    timer = window.setTimeout(() => run(q.value, 'replace'), 180);
  });
  q.addEventListener('focus', () => load().catch(() => {}), { once: true });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    run(q.value, 'push');
    track('blog_search', {});
  });
  const reset = () => {
    q.value = '';
    run('', 'push');
    q.focus();
  };
  clear.addEventListener('click', reset);
  root.querySelector('[data-blog-reset]')?.addEventListener('click', reset);
  window.addEventListener('popstate', () => {
    q.value = new URL(location.href).searchParams.get('busca') ?? '';
    run(q.value, 'none');
  });

  const initial = new URL(location.href).searchParams.get('busca');
  if (initial) {
    q.value = initial;
    run(initial, 'none');
  }
}

export function initPostPage() {
  const btn = document.querySelector<HTMLButtonElement>('[data-copy-link]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  btn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copyLink!);
      if (status) status.textContent = 'Endereço copiado.';
      track('share_click', { location: 'copiar-link' });
    } catch {
      if (status) status.textContent = 'Não foi possível copiar. Selecione o endereço na barra do navegador.';
    }
    window.setTimeout(() => status && (status.textContent = ''), 3000);
  });
}

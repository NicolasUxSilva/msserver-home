import { track } from './analytics';

/** Comportamentos gerais da página (mesma base das landings): header, menus, busca, entradas e rastreamento. */
export function initPage() {
  initHeader();
  initSubmenus();
  initMobileMenu();
  initSearchToggle();
  initReveal();
  initTracking();
  initFloatingWhatsApp();
}

const desktop = matchMedia('(min-width: 1180px)');

function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);
}

/** Abre/fecha um submenu e sincroniza todos os botões que o controlam. */
function setSub(panel: HTMLElement, open: boolean) {
  panel.hidden = !open;
  document.querySelectorAll<HTMLElement>(`[aria-controls="${panel.id}"]`).forEach((b) => b.setAttribute('aria-expanded', String(open)));
  panel.closest('[data-nav-item]')?.classList.toggle('is-open', open);
}

function closeDesktopSubs(except?: HTMLElement) {
  document.querySelectorAll<HTMLElement>('.nav-desktop [data-sub-panel]').forEach((p) => p !== except && !p.hidden && setSub(p, false));
}

function initSubmenus() {
  document.querySelectorAll<HTMLButtonElement>('[data-sub-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById(btn.getAttribute('aria-controls')!);
      if (!panel) return;
      // Com o mouse, o painel já abriu no hover: o clique mantém aberto em vez de fechar.
      const hovered = e.detail > 0 && !!btn.closest('[data-nav-item]')?.matches(':hover') && desktop.matches;
      const open = panel.hidden === true || hovered;
      if (btn.closest('.nav-desktop')) closeDesktopSubs(panel);
      setSub(panel, open);
    });
  });

  // Desktop: também abre ao passar o mouse (como no WordPress), com pequena tolerância ao sair.
  document.querySelectorAll<HTMLElement>('.nav-desktop [data-nav-item]').forEach((item) => {
    const panel = item.querySelector<HTMLElement>('[data-sub-panel]');
    if (!panel) return;
    let timer = 0;
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !desktop.matches) return;
      clearTimeout(timer);
      closeDesktopSubs(panel);
      setSub(panel, true);
    });
    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      timer = window.setTimeout(() => setSub(panel, false), 180);
    });
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget as Node)) setSub(panel, false);
    });
  });

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.nav-desktop')) closeDesktopSubs();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector<HTMLElement>('.nav-desktop [data-sub-panel]:not([hidden])');
    if (!open) return;
    setSub(open, false);
    open.closest('[data-nav-item]')?.querySelector<HTMLElement>('[data-sub-toggle]')?.focus({ preventScroll: true });
  });
}

function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById('menu-movel');
  const sheet = menu?.querySelector<HTMLElement>('[role="dialog"]');
  if (!toggle || !menu || !sheet) return;
  const views = [...menu.querySelectorAll<HTMLElement>('[data-m-view]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let closeTimer = 0;

  const focusables = () =>
    [...sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => !el.closest('[hidden]'));

  // Troca a camada visível do painel (raiz ou um submenu) e põe o foco no primeiro item dela.
  const showView = (id: string, dir: 'none' | 'fwd' | 'back', focus = true) => {
    for (const v of views) {
      const on = v.dataset.mView === id;
      v.hidden = !on;
      if (on) {
        v.dataset.dir = 'stop';
        void v.offsetWidth;
        v.dataset.dir = dir;
      }
    }
    if (focus) menu.querySelector<HTMLElement>(`#${id} .m-grid a, #${id} .m-grid button`)?.focus({ preventScroll: true });
  };

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.documentElement.classList.toggle('menu-open', open);
    clearTimeout(closeTimer);
    if (open) {
      closeSearch();
      showView('m-v-root', 'none', false);
      menu.hidden = false;
      // Dois quadros: o painel é exibido fora da tela e só então desce (a transição acontece).
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      setTimeout(() => focusables()[0]?.focus({ preventScroll: true }), reduce.matches ? 0 : 80);
    } else {
      menu.classList.remove('is-open');
      closeTimer = window.setTimeout(() => (menu.hidden = true), reduce.matches ? 0 : 450);
    }
  };

  // O foco volta ao botão do menu sem rolar a página (o header é fixo e, com a rolagem
  // suave, o navegador levaria a página de volta ao topo).
  const close = () => {
    setOpen(false);
    toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  menu.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const opener = t.closest<HTMLElement>('[data-m-open]');
    const back = t.closest<HTMLElement>('[data-m-back]');
    if (t.closest('[data-m-close]')) close();
    else if (opener) showView(opener.dataset.mOpen!, 'fwd');
    else if (back) {
      const from = back.closest<HTMLElement>('[data-m-view]')!.id;
      showView(back.dataset.mBack!, 'back', false);
      // Volta o foco para o item que abriu a camada.
      menu.querySelector<HTMLElement>(`[data-m-open="${from}"]`)?.focus({ preventScroll: true });
    } else if (t.closest('a')?.getAttribute('href')?.startsWith('#')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // Mantém o foco dentro do painel enquanto ele está aberto.
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  });
  desktop.addEventListener('change', (e) => e.matches && isOpen() && setOpen(false));
}

let closeSearch = () => {};

function initSearchToggle() {
  const btn = document.querySelector<HTMLButtonElement>('[data-search-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-search-panel]');
  if (!btn || !panel) return;
  const set = (open: boolean) => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fechar busca de produtos' : 'Abrir busca de produtos');
    if (open) panel.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  };
  closeSearch = () => set(false);
  btn.addEventListener('click', () => {
    const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
    if (menuBtn?.getAttribute('aria-expanded') === 'true') menuBtn.click();
    set(panel.hidden === true);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      set(false);
      btn.focus({ preventScroll: true });
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // Também revela o que já ficou acima da tela (rolagem rápida ou âncoras).
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));

  // Rede de segurança: numa rolagem muito rápida (ou ao saltar por âncora) o observer pode não
  // ser notificado; tudo o que já passou pela tela é revelado, sem deixar blocos invisíveis.
  let pending = false;
  const sweep = () => {
    pending = false;
    for (const el of items) {
      if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < innerHeight) {
        el.classList.add('is-in');
        io.unobserve(el);
      }
    }
  };
  addEventListener('scroll', () => !pending && (pending = true) && requestAnimationFrame(sweep), { passive: true });
  // O que já aparece na primeira dobra (mesmo rente à borda inferior) entra logo no carregamento.
  requestAnimationFrame(sweep);
}

function initTracking() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (!el) return;
    track(el.dataset.track!, { location: el.dataset.trackLocation });
  });
}

/** Botão flutuante de WhatsApp: visível desde o início, como o Click to Chat do WordPress; entra com uma transição curta. */
function initFloatingWhatsApp() {
  const fab = document.querySelector<HTMLElement>('[data-wa-fab]');
  if (!fab) return;
  requestAnimationFrame(() => setTimeout(() => fab.classList.add('is-visible'), 400));
}

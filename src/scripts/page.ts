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
    open.closest('[data-nav-item]')?.querySelector<HTMLElement>('[data-sub-toggle]')?.focus();
  });
}

function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById('menu-movel');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      closeSearch();
      menu.querySelector<HTMLElement>('a, button')?.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (a && a.getAttribute('href')?.startsWith('#')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  desktop.addEventListener('change', (e) => e.matches && setOpen(false));
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
      btn.focus();
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

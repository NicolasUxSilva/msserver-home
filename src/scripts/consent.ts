// Consentimento de cookies e carregamento dos rastreadores (docs/PRIVACIDADE.md e docs/TRACKING.md).
//
// Só age quando o rastreamento está ligado no build (PUBLIC_TRACKING=true): sem isso, nenhum
// rastreador existe na página e o aviso não aparece. Com o rastreamento ligado:
//  - nada de análise ou publicidade carrega antes da escolha da pessoa;
//  - cada ferramenta pertence a uma categoria (Análise ou Publicidade, configurável em
//    src/config/site.ts → CONSENT) e só carrega se a categoria for aceita;
//  - o Google recebe o estado do consentimento (Consent Mode v2: padrão "negado", atualizado na escolha);
//  - a escolha fica guardada no navegador (localStorage, chave msserver:consent) e vale para todas as
//    páginas do domínio; mudar a versão em CONSENT.version pede a escolha de novo;
//  - "Preferências de cookies" (rodapé) reabre as opções; retirar uma permissão recarrega a página
//    para que nada que já carregou continue ativo.

type Tools = { gtm: string; googleAds: string; metaPixel: string; clarity: string; rdStation: string };
type Config = { enabled: boolean; version: string; tools: Tools; categories: Record<keyof Tools, 'analytics' | 'marketing'> };
type Choice = { v: string; analytics: boolean; marketing: boolean; at: string };

const KEY = 'msserver:consent';

const read = (): Choice | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
};

const write = (c: Choice) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* sem armazenamento: a escolha vale só nesta página */
  }
};

function script(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.append(s);
}

const loaded = new Set<string>();

/** Carregadores das ferramentas (os mesmos códigos oficiais usados no WordPress). */
const LOADERS: Record<keyof Tools, (id: string) => void> = {
  gtm: (id) => {
    window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    script(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`, { 'data-consent-tool': 'gtm' });
  },
  googleAds: (id) => {
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, { 'data-consent-tool': 'googleAds' });
    window.gtag!('js', new Date());
    window.gtag!('config', id);
    // Grupo "GLA" (Google Listings & Ads): os eventos view_item e add_to_cart no formato do WordPress.
    window.gtag!('config', id, { groups: 'GLA', send_page_view: false });
  },
  metaPixel: (id) => {
    /* eslint-disable */
    const w = window as unknown as { fbq?: any; _fbq?: any };
    if (!w.fbq) {
      const n: any = (w.fbq = function (...args: unknown[]) {
        n.callMethod ? n.callMethod(...args) : n.queue.push(args);
      });
      if (!w._fbq) w._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      script('https://connect.facebook.net/en_US/fbevents.js', { 'data-consent-tool': 'metaPixel' });
    }
    w.fbq('init', id);
    w.fbq('track', 'PageView');
    /* eslint-enable */
  },
  clarity: (id) => {
    const w = window as unknown as { clarity?: ((...a: unknown[]) => void) & { q?: unknown[] } };
    w.clarity = w.clarity ?? Object.assign((...a: unknown[]) => (w.clarity!.q = w.clarity!.q ?? []).push(a), { q: [] as unknown[] });
    script(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`, { 'data-consent-tool': 'clarity' });
  },
  rdStation: (src) => script(src, { 'data-consent-tool': 'rdStation' }),
};

function apply(cfg: Config, c: Choice) {
  window.gtag!('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied',
    ad_user_data: c.marketing ? 'granted' : 'denied',
    ad_personalization: c.marketing ? 'granted' : 'denied',
  });
  window.dataLayer!.push({ event: 'consent_update', consent_analytics: c.analytics, consent_marketing: c.marketing });
  for (const tool of Object.keys(cfg.tools) as (keyof Tools)[]) {
    const id = cfg.tools[tool];
    // O GTM carrega com qualquer categoria aceita; as tags dentro dele respeitam o Consent Mode.
    const allowed = tool === 'gtm' ? c.analytics || c.marketing : c[cfg.categories[tool]];
    if (allowed && id && !loaded.has(tool)) {
      loaded.add(tool);
      LOADERS[tool](id);
    }
  }
}

export function initConsent() {
  const cfgEl = document.querySelector('[data-consent-config]');
  const root = document.querySelector<HTMLElement>('[data-consent]');
  const openers = [...document.querySelectorAll<HTMLElement>('[data-consent-open]')];
  if (!cfgEl || !root) return;
  const cfg: Config = JSON.parse(cfgEl.textContent!);
  if (!cfg.enabled) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function (...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
    void args;
  };

  const panel = root.querySelector<HTMLElement>('[data-consent-panel]')!;
  const details = root.querySelector<HTMLElement>('[data-consent-details]')!;
  const toggles = {
    analytics: root.querySelector<HTMLInputElement>('[data-consent-toggle="analytics"]')!,
    marketing: root.querySelector<HTMLInputElement>('[data-consent-toggle="marketing"]')!,
  };
  let current = read();
  if (current && current.v !== cfg.version) current = null;

  const show = (customize: boolean) => {
    toggles.analytics.checked = !!current?.analytics;
    toggles.marketing.checked = !!current?.marketing;
    details.hidden = !customize;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    panel.focus();
  };
  const hide = () => {
    root.classList.remove('is-open');
    root.hidden = true;
  };
  const decide = (analytics: boolean, marketing: boolean) => {
    const revoked = !!current && ((current.analytics && !analytics) || (current.marketing && !marketing));
    current = { v: cfg.version, analytics, marketing, at: new Date().toISOString() };
    write(current);
    hide();
    if (revoked) location.reload();
    else apply(cfg, current);
  };

  root.querySelector('[data-consent-accept]')!.addEventListener('click', () => decide(true, true));
  root.querySelector('[data-consent-reject]')!.addEventListener('click', () => decide(false, false));
  root.querySelector('[data-consent-customize]')!.addEventListener('click', () => {
    details.hidden = false;
    toggles.analytics.focus();
  });
  root.querySelector('[data-consent-save]')!.addEventListener('click', () => decide(toggles.analytics.checked, toggles.marketing.checked));
  root.addEventListener('keydown', (e) => {
    // Esc fecha as opções reabertas pelo rodapé (na primeira visita, a escolha é necessária).
    if (e.key === 'Escape' && current) hide();
  });

  openers.forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => show(true));
  });

  if (current) apply(cfg, current);
  else show(false);
}

// Eventos para o dataLayer (GTM). Nunca envie dados pessoais: apenas
// identificadores de etapa, modelo e local do clique.
// (Na integração ao site, o tipo do dataLayer é o declarado em src/scripts/analytics.ts.)
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type Params = Record<string, string | number | boolean | undefined>;

const sent = new Set<string>();

/** Libera os eventos "uma vez" para uma nova simulação. */
export function resetTracking() {
  sent.clear();
}

export function track(event: string, params: Params = {}, opts: { once?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  const key = opts.once ? `${event}:${JSON.stringify(params)}` : '';
  if (opts.once) {
    if (sent.has(key)) return;
    sent.add(key);
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}

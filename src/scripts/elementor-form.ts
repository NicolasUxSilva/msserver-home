// Envio para um formulário do Elementor Pro no WordPress, como o widget publicado faz: POST para o
// admin-ajax.php com action, post_id, form_id, referer_title, queried_id, form_fields[...] e referrer,
// e a resposta { success, data: { message, errors, data: { redirect_url } } }. Quem recebe e o que
// acontece depois (e-mail, integrações) continua configurado no Elementor de cada página.
// O mesmo protocolo do formulário de orçamento (src/scripts/quote-form.ts).

export type ElementorTarget = { endpoint: string; action: string; postId: string; formId: string; refererTitle: string };
/** Valor de um campo; caixas de seleção mandam uma lista (form_fields[id][]). */
export type ElementorFields = Record<string, string | string[]>;

export type ElementorResult =
  | { ok: true; message: string; redirect: string | null }
  | { ok: false; reason: 'network' | 'response' | 'server'; message: string; errors: Record<string, string> };

type Response = {
  success?: boolean;
  data?: { message?: string; errors?: Record<string, string> | unknown[]; data?: { redirect_url?: string } | unknown[] };
};

const TIMEOUT = 30000;

/** Mesma regra de telefone do Elementor no servidor (PHP: /^[0-9()#&+*-=.]+$/; "*-=" é um intervalo). */
export const ELEMENTOR_TEL = /^[0-9()#&+*-=.]+$/;
export const ELEMENTOR_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Texto puro de uma mensagem do servidor (o Elementor permite HTML nas mensagens). */
export const plainText = (html: unknown) => (typeof html === 'string' ? (new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '') : '');

export async function sendElementorForm(target: ElementorTarget, fields: ElementorFields): Promise<ElementorResult> {
  const data = new FormData();
  data.append('post_id', target.postId);
  data.append('form_id', target.formId);
  data.append('referer_title', target.refererTitle);
  data.append('queried_id', target.postId);
  for (const [id, value] of Object.entries(fields)) {
    if (Array.isArray(value)) value.forEach((v) => data.append(`form_fields[${id}][]`, v));
    else data.append(`form_fields[${id}]`, value);
  }
  data.append('action', target.action);
  data.append('referrer', location.toString());

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT);
  let body: Response | null = null;
  try {
    // O cabeçalho é o mesmo que o jQuery do Elementor envia. Fora do domínio do site, ele exige uma
    // verificação prévia (CORS) que o WordPress recusa: nada é enviado sem confirmação.
    const res = await fetch(target.endpoint, { method: 'POST', body: data, headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', signal: controller.signal });
    body = await res.json().catch(() => null);
  } catch {
    return { ok: false, reason: 'network', message: '', errors: {} };
  } finally {
    clearTimeout(timer);
  }
  if (!body || typeof body.success !== 'boolean') return { ok: false, reason: 'response', message: '', errors: {} };
  if (body.success) {
    const redirect = body.data?.data && !Array.isArray(body.data.data) ? (body.data.data.redirect_url ?? null) : null;
    return { ok: true, message: plainText(body.data?.message), redirect };
  }
  const errors = body.data?.errors && !Array.isArray(body.data.errors) ? Object.fromEntries(Object.entries(body.data.errors).map(([k, v]) => [k, plainText(v)])) : {};
  return { ok: false, reason: 'server', message: plainText(body.data?.message), errors };
}

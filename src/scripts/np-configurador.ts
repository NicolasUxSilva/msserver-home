import { ELEMENTOR_EMAIL, ELEMENTOR_TEL, sendElementorForm, type ElementorFields } from './elementor-form';
import { FORM_TEXTS as T } from '../data/solucoes';
import { track } from './analytics';

// Configurador da Nuvem Privada: o formulário em etapas do Elementor (Processador, Memória,
// Armazenamento, IP e Contato). Como no widget, as etapas de configuração não são obrigatórias e
// "Anterior" volta sem conferir; os dados de contato são conferidos antes do envio. O envio usa o
// widget que a pessoa veria naquela tela: 1b2c23a no desktop e no tablet (uma opção por etapa) e
// 74046a9 no celular (várias), com os valores originais das opções.

type Config = { endpoint: string; action: string; postId: string; refererTitle: string; formIds: { desktop: string; mobile: string }; mobileQuery: string };

export function initNpConfigurator(root: HTMLElement) {
  const cfg: Config = JSON.parse(root.dataset.config!);
  const form = root.querySelector<HTMLFormElement>('[data-np-form]')!;
  const panels = [...root.querySelectorAll<HTMLFieldSetElement>('[data-np-step]')];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-np-go]')];
  const bar = root.querySelector<HTMLElement>('[data-np-bar]')!;
  const prev = root.querySelector<HTMLButtonElement>('[data-np-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-np-next]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-np-submit]')!;
  const submitLabel = root.querySelector<HTMLElement>('[data-np-submit-label]')!;
  const alertBox = root.querySelector<HTMLElement>('[data-np-alert]')!;
  const alertText = root.querySelector<HTMLElement>('[data-np-alert-text]')!;
  const success = root.querySelector<HTMLElement>('[data-np-success]')!;
  const live = root.querySelector<HTMLElement>('[data-np-live]')!;
  const contact = [...root.querySelectorAll<HTMLInputElement>('input[name^="form_fields"]')];
  const mobile = matchMedia(cfg.mobileQuery);
  const last = panels.length - 1;
  const idle = submitLabel.textContent ?? '';
  let step = 0;
  let reached = 0;

  // ——— Escolhas: as da tela atual (desktop/tablet ou celular) ———
  const set = () => (mobile.matches ? 'mobile' : 'desktop');
  const chosen = (id: string) =>
    [...root.querySelectorAll<HTMLInputElement>(`.np-opts--${set()} input[data-np-field="${id}"]:checked`)].map((i) => i.value);
  const fieldIds = [...new Set([...root.querySelectorAll<HTMLInputElement>('input[data-np-field]')].map((i) => i.dataset.npField!))];

  const summary = (flash?: string) => {
    for (const id of fieldIds) {
      const row = root.querySelector<HTMLElement>(`[data-np-sum="${id}"]`)!;
      const values = chosen(id).map((v) => v.replace(/\s+/g, ' ').trim());
      row.querySelector('[data-np-sum-value]')!.textContent = values.length ? values.join(' · ') : '—';
      row.classList.toggle('is-set', values.length > 0);
      if (flash === id) {
        row.classList.remove('is-flash');
        void row.offsetWidth;
        row.classList.add('is-flash');
        window.setTimeout(() => row.classList.remove('is-flash'), 600);
      }
    }
  };
  root.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.dataset.npField) summary(input.dataset.npField);
  });
  mobile.addEventListener('change', () => summary());

  // ——— Etapas ———
  const go = (to: number, focus = true) => {
    step = Math.max(0, Math.min(last, to));
    reached = Math.max(reached, step);
    panels.forEach((p, i) => (p.hidden = i !== step));
    tabs.forEach((t, i) => {
      t.disabled = i > reached;
      t.classList.toggle('is-done', i < step || (i <= reached && i !== step));
      if (i === step) t.setAttribute('aria-current', 'step');
      else t.removeAttribute('aria-current');
    });
    bar.style.width = `${((step + 1) / panels.length) * 100}%`;
    prev.hidden = step === 0;
    next.hidden = step === last;
    submit.hidden = step !== last;
    live.textContent = `Etapa ${step + 1} de ${panels.length}: ${panels[step].querySelector('.np-panel-name')?.textContent ?? ''}`;
    if (focus) {
      const first = panels[step].querySelector<HTMLInputElement>('.np-opts:not([style*="none"]) input:checked, input:not([type="hidden"])');
      // Primeiro campo visível da etapa (no celular, as opções do celular).
      const target = [...panels[step].querySelectorAll<HTMLInputElement>('input')].find((i) => i.offsetParent !== null && (i.type !== 'radio' || i.checked)) ?? first;
      target?.focus({ preventScroll: true });
      const top = root.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6) root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  };
  next.addEventListener('click', () => go(step + 1));
  prev.addEventListener('click', () => go(step - 1));
  tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  // Enter num campo de contato envia; nas opções, avança.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && step < last && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      go(step + 1);
    }
  });

  // ——— Contato e envio ———
  const check = (input: HTMLInputElement) => {
    const v = input.value.trim();
    if (!v) return T.required;
    if (input.dataset.type === 'email' && !ELEMENTOR_EMAIL.test(v)) return T.email;
    if (input.dataset.type === 'tel' && !ELEMENTOR_TEL.test(v.replace(/\s+/g, ''))) return T.tel;
    return '';
  };
  const show = (input: HTMLInputElement, message: string) => {
    const box = input.closest('.sol-field')!;
    box.classList.toggle('is-invalid', !!message);
    const err = box.querySelector<HTMLElement>('.sol-error')!;
    err.hidden = !message;
    err.querySelector('[data-error]')!.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };
  for (const input of contact) {
    input.addEventListener('blur', () => input.value && show(input, check(input)));
    input.addEventListener('input', () => input.getAttribute('aria-invalid') && !check(input) && show(input, ''));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (step !== last) return go(step + 1);
    alertBox.hidden = true;
    const invalid = contact.map((i) => [i, check(i)] as const).filter(([, m]) => m);
    contact.forEach((i) => show(i, invalid.find(([x]) => x === i)?.[1] ?? ''));
    if (invalid.length) {
      invalid[0][0].focus();
      return;
    }
    const phone = mobile.matches;
    const fields: ElementorFields = {};
    // Desktop/tablet: um valor por etapa (lista suspensa); celular: a lista marcada (caixas de seleção).
    for (const id of fieldIds) fields[id] = phone ? chosen(id) : (chosen(id)[0] ?? '');
    for (const i of contact) fields[i.name.replace(/^form_fields\[|\]$/g, '')] = i.dataset.type === 'tel' ? i.value.replace(/\s+/g, '') : i.value.replace(/\s+/g, ' ').trim();
    const formId = phone ? cfg.formIds.mobile : cfg.formIds.desktop;

    submit.disabled = true;
    root.classList.add('is-sending');
    submitLabel.textContent = T.sending;
    track('solution_form_submit', { form_id: formId });
    const result = await sendElementorForm({ endpoint: cfg.endpoint, action: cfg.action, postId: cfg.postId, formId, refererTitle: cfg.refererTitle }, fields);
    submit.disabled = false;
    root.classList.remove('is-sending');
    submitLabel.textContent = idle;

    if (result.ok) {
      track('solution_form_success', { form_id: formId });
      if (result.redirect) {
        location.href = result.redirect;
        return;
      }
      root.querySelector('[data-np-success-message]')!.textContent = result.message || T.successFallback;
      form.hidden = true;
      success.hidden = false;
      success.focus();
      return;
    }
    for (const [id, message] of Object.entries(result.errors)) {
      const input = contact.find((i) => i.name === `form_fields[${id}]`);
      if (input) show(input, message || T.required);
    }
    track('solution_form_error', { form_id: formId, reason: result.reason });
    alertText.textContent = result.reason === 'network' ? T.networkError : [result.message, T.serverError].filter(Boolean).join(' ');
    alertBox.hidden = false;
    alertBox.focus();
  });

  root.querySelector('[data-np-again]')!.addEventListener('click', () => {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    reached = 0;
    summary();
    go(0);
  });

  summary();
  go(0, false);
}

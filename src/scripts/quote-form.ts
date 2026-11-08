import { track } from './analytics';
import { QUOTE } from '../data/orcamento';

// Formulário de orçamento em 5 etapas. Reproduz o comportamento do widget de formulário do
// Elementor Pro (validar a etapa ao avançar, voltar sem validar, enviar por POST para o
// admin-ajax.php com action/referrer e tratar success/errors/redirect_url da resposta) com a
// interface nova: progresso ligado ao estado real dos campos, mensagens de erro em português,
// rascunho guardado na sessão e estados de envio, sucesso e falha.

type Field = (typeof QUOTE.steps)[number]['fields'][number];
type Control = HTMLInputElement | HTMLTextAreaElement;
type ElementorResponse = {
  success?: boolean;
  data?: { message?: string; errors?: Record<string, string> | unknown[]; data?: { redirect_url?: string } | unknown[] };
};

// Mesma regra de telefone do Elementor no servidor (PHP: /^[0-9()#&+*-=.]+$/; "*-=" é um intervalo).
const TEL = /^[0-9()#&+*-=.]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DRAFT_KEY = 'msserver:orcamento';
const TIMEOUT = 30000;

/** Texto puro de uma mensagem do servidor (o Elementor permite HTML nas mensagens). */
const plain = (html: unknown) => (typeof html === 'string' ? new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '' : '');

export function initQuoteForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-quote-form]')!;
  const stepsWrap = root.querySelector<HTMLElement>('[data-steps]')!;
  const stepEls = [...root.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const tlItems = [...root.querySelectorAll<HTMLElement>('[data-tl-item]')];
  const tlButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-tl-go]')];
  const segs = [...root.querySelectorAll<HTMLElement>('[data-seg]')];
  const bar = root.querySelector<HTMLElement>('[data-bar]')!;
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const nextLabel = root.querySelector<HTMLElement>('[data-next-label]')!;
  const live = root.querySelector<HTMLElement>('[data-live]')!;
  const alertBox = root.querySelector<HTMLElement>('[data-alert]')!;
  const alertText = root.querySelector<HTMLElement>('[data-alert-text]')!;
  const actions = root.querySelector<HTMLElement>('[data-actions]')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const submitBtn = root.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = root.querySelector<HTMLElement>('[data-submit-label]')!;
  const success = root.querySelector<HTMLElement>('[data-success]')!;
  const successMessage = root.querySelector<HTMLElement>('[data-success-message]')!;
  const successSummary = root.querySelector<HTMLElement>('[data-success-summary]')!;
  const formIdInput = form.querySelector<HTMLInputElement>('input[name="form_id"]')!;

  const steps = QUOTE.steps;
  const last = steps.length - 1;
  const fields: Field[] = steps.flatMap((s) => [...s.fields]);
  const stepOf = (f: Field) => steps.findIndex((s) => (s.fields as readonly Field[]).includes(f));
  const control = (f: Field) => form.querySelector<Control>(`#form-field-${f.id}`)!;
  const mobile = matchMedia(QUOTE.mobileQuery);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');

  let current = 0;
  let furthest = 0;
  let sending = false;
  let sent = false;
  /** Erros devolvidos pelo servidor, até o campo ser editado. */
  const serverErrors = new Map<string, string>();

  // ——— Validação ———
  const errorFor = (f: Field): string => {
    const value = control(f).value.trim();
    if (serverErrors.has(f.id)) return serverErrors.get(f.id)!;
    if (!value) return f.messages.required;
    if (f.type === 'email' && !EMAIL.test(value)) return f.messages.format ?? '';
    if (f.type === 'tel' && !TEL.test(value.replace(/\s+/g, ''))) return f.messages.format ?? '';
    return '';
  };
  const stepValid = (i: number) => steps[i].fields.every((f) => !errorFor(f));

  const paint = (f: Field, message: string) => {
    const el = control(f);
    const wrap = el.closest<HTMLElement>('[data-field]')!;
    const box = wrap.querySelector<HTMLElement>('[data-error]')!;
    wrap.classList.toggle('is-invalid', !!message);
    wrap.classList.toggle('is-valid', !message && !!el.value.trim());
    el.setAttribute('aria-invalid', String(!!message));
    box.querySelector<HTMLElement>('[data-error-text]')!.textContent = message;
    box.hidden = !message;
  };
  /** Mostra só o estado "válido" (sem acusar erro de campo que a pessoa ainda não terminou). */
  const paintQuiet = (f: Field) => {
    const message = errorFor(f);
    const wrap = control(f).closest<HTMLElement>('[data-field]')!;
    if (wrap.classList.contains('is-invalid') || !message) paint(f, message);
  };
  const validateStep = (i: number, focus: boolean) => {
    let first: Field | null = null;
    for (const f of steps[i].fields) {
      const message = errorFor(f);
      paint(f, message);
      if (message && !first) first = f;
    }
    if (first && focus) control(first).focus();
    return !first;
  };

  // ——— Progresso: cada etapa é concluída quando os campos dela estão válidos ———
  const state = (i: number) => (sent ? 'done' : i === current ? 'current' : i <= furthest && stepValid(i) ? 'done' : 'upcoming');
  const canGo = (i: number) => !sending && !sent && i !== current && i <= furthest && (i < current || steps.slice(0, i).every((_, j) => stepValid(j)));
  const summary = (i: number) =>
    steps[i].fields
      .map((f) => control(f).value.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .join(' · ');

  const render = () => {
    const states = steps.map((_, i) => state(i));
    const done = states.filter((s) => s === 'done').length;
    tlItems.forEach((li, i) => {
      li.dataset.state = states[i];
      li.querySelector<HTMLElement>('[data-tl-value]')!.textContent = states[i] === 'done' ? summary(i) : '';
      li.querySelector<HTMLElement>('[data-tl-status]')!.textContent = states[i] === 'current' ? ', etapa atual' : states[i] === 'done' ? ', concluída' : ', pendente';
    });
    tlButtons.forEach((b, i) => {
      b.disabled = !canGo(i);
      if (states[i] === 'current') b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    segs.forEach((s, i) => (s.dataset.state = states[i]));
    bar.setAttribute('aria-valuenow', String(done));
    bar.setAttribute('aria-valuetext', `Etapa ${current + 1} de ${steps.length}: ${steps[current].label}. ${done === 0 ? 'Nenhuma etapa concluída' : done === 1 ? '1 etapa concluída' : `${done} etapas concluídas`}.`);
    count.textContent = String(current + 1);
    nextLabel.textContent = current < last ? `A seguir: ${steps[current + 1].label}` : 'Última etapa';
    prevBtn.hidden = current === 0;
    nextBtn.hidden = current === last;
    submitBtn.hidden = current !== last;
    actions.dataset.hint = current === last || steps[current].fields.some((f) => f.control === 'textarea') ? 'off' : 'on';
    requestAnimationFrame(guardFab);
  };

  // O WhatsApp flutuante sai da frente enquanto cobriria os botões do formulário (ou enquanto a
  // pessoa digita numa tela de toque) e volta em seguida. O botão e o número continuam no bloco
  // "Prefere falar com a equipe?".
  const fab = document.querySelector<HTMLElement>('[data-wa-fab]');
  const successActions = root.querySelector<HTMLElement>('.success-actions');
  let typing = false;
  const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const guardFab = () => {
    if (!fab) return;
    const area = (form.hidden ? successActions : actions)?.getBoundingClientRect();
    const tuck = typing || (!!area && area.height > 0 && overlaps(fab.getBoundingClientRect(), area));
    fab.style.opacity = tuck ? '0' : '';
    fab.style.transform = tuck ? 'translateY(14px) scale(0.92)' : '';
    fab.style.pointerEvents = tuck ? 'none' : '';
    fab.inert = tuck;
  };
  let fabFrame = 0;
  const scheduleGuard = () => {
    cancelAnimationFrame(fabFrame);
    fabFrame = requestAnimationFrame(guardFab);
  };
  window.addEventListener('scroll', scheduleGuard, { passive: true });
  window.addEventListener('resize', scheduleGuard);

  // ——— Rascunho na sessão (nada é perdido se a página recarregar); some depois do envio ———
  let saveTimer = 0;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ v: Object.fromEntries(fields.map((f) => [f.id, control(f).value])), c: current, f: furthest }));
      } catch {
        /* armazenamento indisponível: o formulário segue funcionando */
      }
    }, 150);
  };
  const clearDraft = () => {
    clearTimeout(saveTimer);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* sem armazenamento */
    }
  };

  // ——— Troca de etapa ———
  const setStep = (i: number, opts: { focus?: boolean; announce?: boolean } = {}) => {
    const dir = i >= current ? 'next' : 'prev';
    stepEls.forEach((el, j) => {
      const on = j === i;
      el.toggleAttribute('data-active', on);
      el.inert = !on;
    });
    stepsWrap.dataset.dir = dir;
    current = i;
    furthest = Math.max(furthest, i);
    render();
    save();
    if (opts.announce !== false) live.textContent = `Etapa ${i + 1} de ${steps.length}: ${steps[i].label}`;
    if (opts.focus !== false) {
      const el = control(steps[i].fields[0]);
      el.focus({ preventScroll: true });
      keepInView(el);
    }
  };

  const next = () => {
    if (!validateStep(current, true)) return;
    setStep(current + 1);
    track('quote_step', { step: current + 1 });
  };
  const prev = () => current > 0 && setStep(current - 1);

  // Celular: com o teclado aberto, o campo e os botões ficam visíveis.
  const keepInView = (el: Control) => {
    const vv = window.visualViewport;
    const top = (vv?.offsetTop ?? 0) + (document.querySelector('[data-header]')?.getBoundingClientRect().height ?? 72) + 12;
    const bottom = (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight) - 12;
    const fieldTop = el.closest('[data-field]')!.getBoundingClientRect().top;
    const actionsBottom = actions.getBoundingClientRect().bottom;
    let delta = 0;
    if (actionsBottom > bottom) delta = actionsBottom - bottom;
    if (fieldTop - delta < top) delta = fieldTop - top;
    if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: reduce.matches ? 'auto' : 'smooth' });
  };

  // ——— Envio (mesmo pedido do Elementor Pro) ———
  const showAlert = (message: string) => {
    alertText.textContent = message;
    alertBox.hidden = false;
    alertBox.focus({ preventScroll: true });
    alertBox.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  const setBusy = (busy: boolean) => {
    sending = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.disabled = busy;
    prevBtn.disabled = busy;
    form.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? QUOTE.buttons.sending : QUOTE.buttons.submit;
    render();
  };

  const showSuccess = (message: string, answers: [string, string][]) => {
    successMessage.textContent = message || QUOTE.status.successFallback;
    successSummary.replaceChildren(
      ...answers.map(([label, value]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = value;
        row.append(dt, dd);
        return row;
      }),
    );
    // Como no Elementor, o formulário volta ao início, limpo.
    form.reset();
    serverErrors.clear();
    fields.forEach((f) => paint(f, ''));
    current = 0;
    furthest = 0;
    stepEls.forEach((el, j) => {
      el.toggleAttribute('data-active', j === 0);
      el.inert = j !== 0;
    });
    form.hidden = true;
    success.hidden = false;
    render();
    success.focus({ preventScroll: true });
    success.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
  };

  const send = async () => {
    setBusy(true);
    alertBox.hidden = true;
    // Widget do Elementor que a pessoa veria nesta tela (cada um com as próprias ações no servidor).
    formIdInput.value = mobile.matches ? QUOTE.formIds.mobile : QUOTE.formIds.desktop;
    const data = new FormData(form);
    for (const f of fields) {
      const value = control(f).value;
      // Telefone sem espaços (o servidor recusa espaços); demais campos sem espaços sobrando.
      data.set(f.name, f.type === 'tel' ? value.replace(/\s+/g, '') : value.replace(/\s+/g, ' ').trim());
    }
    data.append('action', QUOTE.action);
    data.append('referrer', location.toString());
    const answers: [string, string][] = steps.flatMap((s) => s.fields.map((f): [string, string] => [f.label.length > 40 ? s.label : f.label, String(data.get(f.name))]));
    track('quote_submit', { form_id: formIdInput.value });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT);
    let body: ElementorResponse | null = null;
    let failure: 'network' | 'response' | null = null;
    try {
      // O cabeçalho é o mesmo que o jQuery do Elementor envia. Fora do domínio do site, ele exige
      // uma verificação prévia (CORS) que o WordPress recusa: nada é enviado sem confirmação.
      const res = await fetch(QUOTE.endpoint, {
        method: 'POST',
        body: data,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        signal: controller.signal,
      });
      body = await res.json().catch(() => null);
      if (!body || typeof body.success !== 'boolean') failure = 'response';
    } catch {
      failure = 'network';
    } finally {
      clearTimeout(timer);
    }
    setBusy(false);

    if (!failure && body?.success === true) {
      clearDraft();
      track('quote_submit_success', { form_id: formIdInput.value });
      const redirect = body.data?.data && !Array.isArray(body.data.data) ? body.data.data.redirect_url : undefined;
      if (redirect) {
        location.href = redirect;
        return;
      }
      sent = true;
      showSuccess(plain(body.data?.message), answers);
      return;
    }

    if (!failure && body?.success === false) {
      // Erros por campo (chave = id do campo no Elementor): leva até a primeira etapa com erro.
      const errors = body.data?.errors && !Array.isArray(body.data.errors) ? body.data.errors : {};
      serverErrors.clear();
      for (const [id, message] of Object.entries(errors)) {
        const f = fields.find((x) => x.id === id);
        if (f) serverErrors.set(f.id, plain(message) || f.messages.required);
      }
      track('quote_submit_error', { reason: serverErrors.size ? 'validation' : 'server' });
      const firstWithError = fields.find((f) => serverErrors.has(f.id));
      showAlert([plain(body.data?.message), QUOTE.status.serverError].filter(Boolean).join(' '));
      if (firstWithError) {
        setStep(stepOf(firstWithError), { focus: false });
        validateStep(current, false);
      }
      return;
    }

    track('quote_submit_error', { reason: failure ?? 'response' });
    showAlert(QUOTE.status.networkError);
  };

  // ——— Eventos ———
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  tlButtons.forEach((b, i) => b.addEventListener('click', () => canGo(i) && setStep(i)));

  // Enter avança (em vez de enviar o formulário inteiro); na última etapa, envia.
  form.addEventListener('keydown', (e) => {
    const el = e.target;
    if (e.key !== 'Enter' || e.isComposing || !(el instanceof HTMLInputElement)) return;
    e.preventDefault();
    const f = fields.find((x) => control(x) === el);
    if (!f) return;
    const message = errorFor(f);
    paint(f, message);
    if (message) return;
    const inStep = steps[current].fields as readonly Field[];
    const idx = inStep.indexOf(f);
    if (idx < inStep.length - 1) control(inStep[idx + 1]).focus();
    else if (current === last) form.requestSubmit(submitBtn);
    else next();
  });

  form.addEventListener('input', (e) => {
    const f = fields.find((x) => control(x) === e.target);
    if (!f) return;
    serverErrors.delete(f.id);
    paintQuiet(f);
    render();
    save();
  });

  // Ao sair de um campo preenchido, o formato já é conferido (email, telefone).
  form.addEventListener('focusout', (e) => {
    const f = fields.find((x) => control(x) === e.target);
    if (f && control(f).value.trim()) paint(f, errorFor(f));
  });

  form.addEventListener('focusin', (e) => {
    const el = e.target;
    if (coarse.matches && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
      typing = true;
      scheduleGuard();
      window.setTimeout(() => keepInView(el), 320);
    }
  });
  form.addEventListener('focusout', () => {
    typing = false;
    window.setTimeout(scheduleGuard, 50);
  });
  window.visualViewport?.addEventListener('resize', () => {
    const el = document.activeElement;
    if (coarse.matches && form.contains(el) && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) keepInView(el);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    if (current !== last) return next();
    const invalid = steps.findIndex((_, i) => !stepValid(i));
    if (invalid !== -1) {
      if (invalid !== current) setStep(invalid, { focus: false });
      validateStep(invalid, true);
      return;
    }
    void send();
  });

  root.querySelector('[data-again]')!.addEventListener('click', () => {
    sent = false;
    success.hidden = true;
    form.hidden = false;
    setStep(0);
  });

  // ——— Início: etapas inativas fora da navegação; rascunho restaurado, se houver ———
  stepEls.forEach((el, j) => (el.inert = j !== 0));
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    if (draft && typeof draft === 'object') {
      for (const f of fields) if (typeof draft.v?.[f.id] === 'string') control(f).value = draft.v[f.id];
      furthest = Math.min(last, Math.max(0, Number(draft.f) || 0));
      let target = Math.min(furthest, Math.max(0, Number(draft.c) || 0));
      const firstInvalid = steps.findIndex((_, i) => i < target && !stepValid(i));
      if (firstInvalid !== -1) target = firstInvalid;
      fields.forEach((f) => control(f).value.trim() && paint(f, errorFor(f)));
      if (target) setStep(target, { focus: false, announce: false });
    }
  } catch {
    /* sem rascunho */
  }
  render();
  root.classList.add('is-ready');
}

import { whatsappUrl } from '../../../data/landings/solucoes-cloud/site';
import { resetTracking, track } from './analytics';
import {
  CRITICALITY,
  ipOptions,
  memoryOptions,
  MODELS,
  processorOptions,
  ROLES,
  roleTitle,
  SCENARIOS,
  scenarioTitle,
  SERVICES,
  STEPS,
  STORAGE_PROFILES,
  storageOptions,
  WORKLOADS,
  workloadTitle,
} from './options';
import { applyChange, firstIncompleteStep, isComplete, tipsFor, validateStep } from './rules';
import { configLines, plainSummary, servicesText, summarize, type SummaryRow, whatsappMessage } from './summary';
import type { Notice, Option, SimState, Workload } from './types';
import { emptyState, NOTES_MAX, OTHER, UNSURE } from './types';

export const STORAGE_KEY = 'msserver-cloud-simulador-v3';
/** Evento disparado no documento a cada mudança; a página usa para os CTAs de WhatsApp. */
export const CHANGE_EVENT = 'cloudsim:change';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const RESTART_CONFIRM = 'Recomeçar? O levantamento atual será apagado.';

// ——— Pequeno utilitário de DOM ———

type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

function icon(name: string, size = 20, cls = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icon ${name === 'whatsapp' ? 'si--fill' : ''} ${cls}`.trim());
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#sim-i-${name}`);
  svg.append(use);
  return svg;
}

let uid = 0;
const nextId = (p: string) => `${p}-${++uid}`;

// ——— Persistência local (somente a configuração; o simulador não pede dados pessoais) ———

interface Saved {
  state: SimState;
  step: number;
  maxStep: number;
}

export function loadSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!saved?.state || typeof saved.step !== 'number') return null;
    return { state: { ...emptyState(), ...saved.state }, step: saved.step, maxStep: saved.maxStep ?? saved.step };
  } catch {
    return null;
  }
}

function persist(data: Saved | null) {
  try {
    if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* armazenamento indisponível: o simulador segue funcionando em memória */
  }
}

// ——— Controlador ———

export function initSimulator(root: HTMLElement) {
  const els = {
    steps: root.querySelector<HTMLOListElement>('[data-steps]')!,
    progressText: root.querySelector<HTMLElement>('[data-progress-text]')!,
    progressBar: root.querySelector<HTMLElement>('[data-progress-bar]')!,
    stage: root.querySelector<HTMLElement>('[data-stage]')!,
    nav: root.querySelector<HTMLElement>('[data-nav]')!,
    prev: root.querySelector<HTMLButtonElement>('[data-prev]')!,
    next: root.querySelector<HTMLButtonElement>('[data-next]')!,
    nextMobile: root.querySelector<HTMLButtonElement>('[data-next-mobile]')!,
    summaryRoot: root.querySelector<HTMLElement>('[data-summary-root]')!,
    summaryList: root.querySelector<HTMLElement>('[data-summary-list]')!,
    summaryCount: root.querySelector<HTMLElement>('[data-summary-count]')!,
    mobileCount: root.querySelector<HTMLElement>('[data-mobile-count]')!,
    price: root.querySelector<HTMLElement>('[data-price]')!,
    summaryActions: root.querySelector<HTMLElement>('[data-summary-actions]')!,
    sheet: root.querySelector<HTMLDialogElement>('[data-sheet]')!,
    sheetBody: root.querySelector<HTMLElement>('[data-sheet-body]')!,
    main: root.querySelector<HTMLElement>('.sim-main')!,
  };

  const saved = loadSaved();
  let state: SimState = saved?.state ?? emptyState();
  let current = saved ? Math.min(saved.step, firstIncompleteStep(saved.state)) : 0;
  let maxStep = saved ? Math.max(current, Math.min(saved.maxStep, firstIncompleteStep(saved.state))) : 0;
  let pendingNotices: Notice[] = saved && (saved.state.workloads.length > 0 || saved.step > 0) ? [{ tone: 'info', text: 'Retomamos o levantamento de onde você parou.' }] : [];
  let started = !!saved;

  const step = () => STEPS[current];
  const save = () => {
    persist({ state, step: current, maxStep });
    broadcast();
  };

  function broadcast() {
    const complete = isComplete(state);
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { complete, filled: configLines(state).length, message: whatsappMessage(state, complete) } }));
  }

  function markStarted(entry: string) {
    if (started) return;
    started = true;
    track('simulation_start', { entry });
  }

  function update(patch: Partial<SimState>, opts: { render?: boolean } = {}) {
    markStarted('interacao');
    const { state: next, notices } = applyChange(state, patch);
    state = next;
    if (notices.length) pendingNotices.push(...notices);
    save();
    if (opts.render === false) return;
    syncStep();
    renderSummary();
    renderProgress();
  }

  // ——— Progresso ———

  const canVisit = (i: number) => i <= maxStep && STEPS.slice(0, i).every((s) => validateStep(s.id, state) === null);

  function renderProgress() {
    els.steps.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((btn) => {
      const i = Number(btn.dataset.goto);
      const done = i !== current && i < STEPS.length - 1 && validateStep(STEPS[i].id, state) === null && i <= maxStep;
      btn.disabled = i !== current && !canVisit(i);
      btn.classList.toggle('is-current', i === current);
      btn.classList.toggle('is-done', done);
      if (i === current) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
      const status = btn.querySelector('[data-step-status]');
      if (status) status.textContent = done ? ', concluída' : '';
    });
    els.progressText.textContent = `Etapa ${current + 1} de ${STEPS.length} · ${step().label}`;
    els.progressBar.style.width = `${((current + 1) / STEPS.length) * 100}%`;
  }

  // ——— Navegação ———

  function goTo(i: number, opts: { focus?: boolean; scroll?: boolean } = {}) {
    current = Math.max(0, Math.min(STEPS.length - 1, i));
    maxStep = Math.max(maxStep, current);
    save();
    renderStep();
    renderProgress();
    renderSummary();
    if (opts.scroll !== false) scrollToSim();
    if (opts.focus !== false) els.stage.querySelector<HTMLElement>('.sim-step-title')?.focus({ preventScroll: true });
    if (step().id === 'resumo' && isComplete(state)) track('simulation_complete', { cloud_model: state.model ?? '' }, { once: true });
  }

  function scrollToSim() {
    const top = els.main.getBoundingClientRect().top;
    const header = 88;
    if (top < header || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + top - header, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function next() {
    const error = validateStep(step().id, state);
    const box = els.stage.querySelector<HTMLElement>('[data-error]');
    if (error) {
      if (box) {
        box.textContent = error;
        box.hidden = false;
      }
      focusMissing();
      return;
    }
    track('simulation_step_complete', { step_id: step().id, step_number: current + 1 }, { once: true });
    goTo(current + 1);
  }

  /** Leva o foco ao primeiro controle que falta preencher na etapa atual. */
  function focusMissing() {
    for (const el of els.stage.querySelectorAll<HTMLInputElement>('[data-text-key]')) {
      if (!el.closest('[hidden]') && validateStep(step().id, state) !== null && el.value.trim().length < 1) {
        el.focus();
        return;
      }
    }
    for (const fs of els.stage.querySelectorAll<HTMLElement>('fieldset[data-group-key][data-required]:not([hidden])')) {
      const val = state[fs.dataset.groupKey as keyof SimState];
      if (val === null || (Array.isArray(val) && val.length === 0)) {
        fs.querySelector<HTMLInputElement>('input')?.focus();
        return;
      }
    }
    els.stage.querySelector<HTMLInputElement>('[data-text-key]:not([hidden])')?.focus();
  }

  els.prev.addEventListener('click', () => goTo(current - 1));
  els.next.addEventListener('click', next);
  els.nextMobile.addEventListener('click', next);
  els.steps.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-goto]');
    if (btn && !btn.disabled) goTo(Number(btn.dataset.goto));
  });

  // ——— Etapas ———

  function renderStep() {
    const s = step();
    const titleId = nextId('sim-title');
    const head = h(
      'header',
      { class: 'sim-step-head' },
      h('p', { class: 'sim-step-kicker' }, `Etapa ${current + 1} de ${STEPS.length}`),
      h('h3', { class: 'sim-step-title', id: titleId, tabindex: -1 }, s.title),
      s.lead ? h('p', { class: 'sim-step-lead' }, s.lead) : null,
    );
    const notices = h('div', { class: 'sim-notices', 'data-notices': true, role: 'status', 'aria-live': 'polite' });
    const body = h('div', { class: 'sim-step-body' });

    switch (s.id) {
      case 'objetivo':
        body.append(...buildObjective());
        break;
      case 'modelo':
        body.append(
          buildChoice('model', 'Modelo de Cloud', MODELS, 'cards', { required: true }),
          buildChoice('criticality', 'Criticidade do ambiente', CRITICALITY, 'chips', { showLegend: true, required: true, hint: 'Quanto a operação depende deste ambiente no dia a dia.' }),
        );
        break;
      case 'processamento':
        body.append(buildChoice('processor', 'Processamento', processorOptions(), 'chips', { required: true }));
        break;
      case 'memoria':
        body.append(
          buildChoice('memory', 'Memória RAM', memoryOptions(), 'chips', { required: true }),
          customField('memory', 'memoryOther', 'Memória desejada, em GB', 'Ex.: 128', 'GB'),
        );
        break;
      case 'armazenamento':
        body.append(
          buildChoice('storage', 'Capacidade de armazenamento', storageOptions(), 'chips', { required: true }),
          customField('storage', 'storageOther', 'Capacidade desejada', 'Ex.: 4', null),
          buildChoice('storageProfile', 'O que pesa mais no armazenamento? (opcional)', STORAGE_PROFILES, 'cards', { showLegend: true }),
        );
        break;
      case 'rede': {
        const ips = buildChoice('ips', 'Quantidade de IPs', ipOptions(), 'chips', { showLegend: true, required: true, hint: 'De 1 a 6 IPs, conforme o configurador da MSSERVER.' });
        ips.classList.add('sim-group--ips');
        body.append(ips, buildChoice('services', 'Itens para incluir na avaliação (opcionais)', SERVICES, 'cards', { multiple: true, showLegend: true }));
        break;
      }
      case 'resumo':
        body.append(buildReview());
        break;
    }

    const extras = h(
      'div',
      { class: 'sim-extras' },
      h('div', { class: 'sim-tips', 'data-tips': true }),
      h('p', { class: 'sim-error', 'data-error': true, role: 'alert', hidden: true }),
    );

    const panel = h('div', { class: 'sim-panel', role: 'group', 'aria-labelledby': titleId }, head, notices, body, extras);
    if (!reducedMotion()) panel.classList.add('is-entering');
    els.stage.replaceChildren(panel);
    requestAnimationFrame(() => panel.classList.remove('is-entering'));

    els.nav.hidden = false;
    els.prev.hidden = current === 0;
    const last = s.id === 'resumo';
    els.next.hidden = last;
    els.nextMobile.hidden = last;
    root.classList.toggle('is-last-step', last);
    root.classList.toggle('is-first-step', current === 0);
    syncStep();
  }

  /** Atualiza o estado visual da etapa atual sem recriar o DOM (mantém o foco). */
  function syncStep() {
    const s = step();
    els.stage.querySelectorAll<HTMLInputElement>('input[data-key]').forEach((input) => {
      const val = state[input.dataset.key as keyof SimState];
      if (input.type === 'checkbox') input.checked = Array.isArray(val) && (val as string[]).includes(input.value);
      else if (input.type === 'radio') input.checked = val === input.value;
    });
    els.stage.querySelectorAll<HTMLElement>('[data-show-when]').forEach((el) => {
      const [key, value] = el.dataset.showWhen!.split('=');
      const val = state[key as keyof SimState];
      el.hidden = !(Array.isArray(val) ? (val as string[]).includes(value) : val === value);
    });
    els.stage.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-text-key]').forEach((el) => {
      if (document.activeElement !== el) el.value = String(state[el.dataset.textKey as keyof SimState] ?? '');
    });

    const noticesBox = els.stage.querySelector<HTMLElement>('[data-notices]');
    if (noticesBox && pendingNotices.length) {
      noticesBox.replaceChildren(...pendingNotices.map(noticeEl));
      pendingNotices = [];
    }
    els.stage.querySelector<HTMLElement>('[data-tips]')?.replaceChildren(...tipsFor(s.id, state).map((t) => h('p', { class: 'sim-tip' }, icon('lightbulb', 18), h('span', {}, t))));
    const err = els.stage.querySelector<HTMLElement>('[data-error]');
    if (err && !err.hidden && validateStep(s.id, state) === null) err.hidden = true;
    if (s.id === 'resumo') refreshWhatsAppLinks();
  }

  function noticeEl(n: Notice) {
    return h('p', { class: `sim-notice sim-notice--${n.tone}` }, icon(n.tone === 'warning' ? 'triangle-alert' : 'info', 18), h('span', {}, n.text));
  }

  // Grupo de opções (radio ou checkbox) com cartões acessíveis.
  function buildChoice(
    key: keyof SimState,
    legend: string,
    options: Option[],
    variant: 'cards' | 'chips' = 'cards',
    opts: { multiple?: boolean; showLegend?: boolean; hint?: string; required?: boolean } = {},
  ) {
    const name = nextId(String(key));
    const fieldset = h('fieldset', { class: `sim-group sim-group--${variant}`, 'data-group-key': String(key), 'data-required': opts.required || undefined });
    fieldset.append(h('legend', { class: opts.showLegend ? 'sim-legend' : 'sr-only' }, legend));
    if (opts.hint) fieldset.append(h('p', { class: 'sim-hint' }, opts.hint));
    const wrap = h('div', { class: 'sim-options' });
    for (const o of options) wrap.append(optionEl(key, name, o, !!opts.multiple));
    fieldset.append(wrap);
    return fieldset;
  }

  function optionEl(key: keyof SimState, name: string, o: Option, multiple: boolean) {
    const id = nextId('opt');
    const descId = o.description || o.meta ? `${id}-d` : undefined;
    const input = h('input', { class: 'opt-input', type: multiple ? 'checkbox' : 'radio', name, id, value: o.value, 'data-key': String(key), 'aria-describedby': descId }) as HTMLInputElement;
    input.addEventListener('change', () => {
      if (multiple) {
        const list = new Set(state[key] as string[]);
        if (input.checked) list.add(o.value);
        else list.delete(o.value);
        update({ [key]: [...list] } as Partial<SimState>);
      } else if (input.checked) {
        update({ [key]: o.value } as Partial<SimState>);
        // Ao escolher "Outro", o campo de digitação recebe o foco.
        if (o.value === OTHER) requestAnimationFrame(() => els.stage.querySelector<HTMLInputElement>(`[data-other-for="${String(key)}"]`)?.focus());
      }
    });
    return h(
      'label',
      { class: 'opt', for: id },
      input,
      h(
        'span',
        { class: 'opt-box' },
        o.icon ? h('span', { class: 'opt-icon' }, icon(o.icon, 20)) : null,
        h(
          'span',
          { class: 'opt-text' },
          h('span', { class: 'opt-title' }, o.title),
          o.description || o.meta ? h('span', { id: descId }, o.description ? h('span', { class: 'opt-desc' }, o.description) : null, o.meta ? h('span', { class: 'opt-meta' }, o.meta) : null) : null,
        ),
        h('span', { class: 'opt-check', 'aria-hidden': 'true' }, icon('check', 14)),
      ),
    );
  }

  /** Campo exibido quando a opção "Outro" está marcada. */
  function customField(key: 'memory' | 'storage', textKey: 'memoryOther' | 'storageOther', label: string, placeholder: string, fixedUnit: string | null) {
    const id = nextId('custom');
    const input = h('input', {
      id,
      type: 'text',
      inputmode: 'decimal',
      maxlength: 9,
      placeholder,
      autocomplete: 'off',
      'data-text-key': textKey,
      'data-other-for': key,
      value: state[textKey],
      oninput: (e: Event) => update({ [textKey]: (e.target as HTMLInputElement).value } as Partial<SimState>),
    });
    const unit = fixedUnit
      ? h('span', { class: 'sim-unit', 'aria-hidden': 'true' }, fixedUnit)
      : h(
          'select',
          {
            'aria-label': 'Unidade',
            'data-text-key': 'storageOtherUnit',
            onchange: (e: Event) => update({ storageOtherUnit: (e.target as HTMLSelectElement).value as SimState['storageOtherUnit'] }),
          },
          h('option', { value: 'GB' }, 'GB'),
          h('option', { value: 'TB' }, 'TB'),
        );
    return h('div', { class: 'sim-field sim-custom', 'data-show-when': `${key}=${OTHER}` }, h('label', { for: id }, label), h('div', { class: 'sim-custom-row' }, input, unit));
  }

  function buildObjective() {
    const otherId = nextId('other');
    const other = h(
      'div',
      { class: 'sim-field sim-other', 'data-show-when': 'workloads=other' },
      h('label', { for: otherId }, 'Descreva a outra necessidade'),
      h('input', {
        id: otherId,
        type: 'text',
        'data-text-key': 'otherWorkload',
        'data-other-for': 'workloads',
        maxlength: 120,
        value: state.otherWorkload,
        placeholder: 'Ex.: área de trabalho remota, sistema de telefonia',
        oninput: (e: Event) => update({ otherWorkload: (e.target as HTMLInputElement).value }),
      }),
    );
    return [
      h('div', { class: 'sim-stack' }, buildChoice('workloads', 'Sistemas e cargas de trabalho', WORKLOADS, 'cards', { multiple: true, required: true }), other),
      buildChoice('scenario', 'Momento do projeto', SCENARIOS, 'cards', { showLegend: true, required: true }),
    ];
  }

  // ——— Resumo final ———

  function buildReview() {
    const review = h('div', { class: 'sim-review' }, h('p', { class: 'sim-review-title' }, 'Levantamento preliminar'));
    const list = h('dl', { class: 'sim-review-list' });
    const rows: SummaryRow[] = [...summarize(state), { step: 'rede', label: 'Itens para avaliar', value: servicesText(state), status: 'set' }];
    for (const row of rows) {
      const i = STEPS.findIndex((s) => s.id === row.step);
      list.append(
        h(
          'div',
          { class: `sim-review-row is-${row.status}` },
          h('dt', {}, row.label),
          h(
            'dd',
            {},
            h('span', { class: 'sim-review-value' }, row.value, row.detail ? h('small', {}, row.detail) : null),
            h('button', { type: 'button', class: 'sim-edit', onclick: () => goTo(i) }, icon('pencil', 15), 'Alterar', h('span', { class: 'sr-only' }, ` ${row.label.toLowerCase()}`)),
          ),
        ),
      );
    }
    review.append(list);

    const status = h('div', { class: 'sim-submit-status', 'data-submit-status': true, 'aria-live': 'polite' });
    const copyBtn = h('button', { type: 'button', class: 'btn btn--outline btn--lg', 'data-copy-summary': true }, icon('copy', 18), 'Copiar resumo');
    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(plainSummary(state));
        ok = true;
      } catch {
        ok = false;
      }
      track('simulation_summary_copy', { ok });
      status.replaceChildren(
        ok
          ? h('p', { class: 'sim-notice sim-notice--info' }, icon('check', 18), h('span', {}, 'Resumo copiado. Compartilhe com a sua equipe ou cole em um e-mail para a equipe comercial.'))
          : h('p', { class: 'sim-notice sim-notice--warning' }, icon('triangle-alert', 18), h('span', {}, 'Não foi possível copiar automaticamente. Use o WhatsApp para enviar o levantamento.')),
      );
    });

    const send = h(
      'div',
      { class: 'sim-send' },
      buildContext(),
      h(
        'div',
        { class: 'sim-disclaimer', role: 'note' },
        icon('info', 18),
        h(
          'p',
          {},
          h('strong', {}, 'Sem preço calculado. '),
          'A MSSERVER não publica tabela de preços de Cloud. A equipe analisa o levantamento, confirma a arquitetura e retorna com a proposta. Este levantamento não é uma cotação nem uma proposta comercial.',
        ),
      ),
      h('div', { class: 'sim-form-actions' }, waLink('Enviar levantamento pelo WhatsApp', 'simulador-envio', 'btn btn--primary btn--lg'), copyBtn),
      status,
      h('p', { class: 'sim-privacy' }, 'O simulador não pede dados pessoais. A mensagem do WhatsApp leva só o levantamento; você conversa direto com a equipe. Atendimento comercial das 8h às 18h.'),
      h('button', { type: 'button', class: 'btn btn--text sim-restart', onclick: () => confirm(RESTART_CONFIRM) && reset() }, icon('rotate-ccw', 16), 'Fazer outro levantamento'),
    );
    return h('div', { class: 'sim-contact' }, review, send);
  }

  /** Contexto opcional para a equipe: como a pessoa atua na TI e observações livres. */
  function buildContext() {
    const notesId = nextId('notes');
    const hintId = `${notesId}-h`;
    const roles = buildChoice('role', 'Como você atua na TI da empresa? (opcional)', ROLES, 'cards', { showLegend: true });
    roles.classList.add('sim-group--roles');
    const notes = h(
      'div',
      { class: 'sim-field sim-notes' },
      h('label', { for: notesId }, 'Observações para a equipe (opcional)'),
      h('p', { class: 'sim-hint', id: hintId }, 'Como o ambiente está hoje, quantidade de usuários, prazo e o que ainda precisa ser avaliado. Não inclua senhas nem dados pessoais.'),
      h('textarea', {
        id: notesId,
        rows: 3,
        maxlength: NOTES_MAX,
        'aria-describedby': hintId,
        'data-text-key': 'notes',
        placeholder: 'Ex.: 25 usuários, ERP e banco no mesmo servidor físico, migração até o fim do trimestre',
        oninput: (e: Event) => update({ notes: (e.target as HTMLTextAreaElement).value }),
      }),
    );
    return h('div', { class: 'sim-context' }, h('p', { class: 'sim-context-title' }, 'Antes de enviar'), roles, notes);
  }

  function waLink(label: string, location: string, cls = 'btn btn--outline-dark') {
    const a = h(
      'a',
      { class: cls, href: currentWaHref(), target: '_blank', rel: 'noopener', 'data-wa-dynamic': true, 'data-track': 'contact_whatsapp_click', 'data-track-location': location },
      icon('whatsapp', 18, 'wa-icon'),
      label,
    );
    a.addEventListener('click', () => {
      const status = els.stage.querySelector<HTMLElement>('[data-submit-status]');
      if (status && location === 'simulador-envio') {
        status.replaceChildren(h('p', { class: 'sim-notice sim-notice--info' }, icon('info', 18), h('span', {}, 'Abrimos o WhatsApp com o levantamento. Para concluir, envie a mensagem por lá.')));
      }
    });
    return a;
  }

  const currentWaHref = () => whatsappUrl(whatsappMessage(state, isComplete(state)));

  function refreshWhatsAppLinks() {
    const href = currentWaHref();
    root.querySelectorAll<HTMLAnchorElement>('[data-wa-dynamic]').forEach((a) => (a.href = href));
  }

  function reset() {
    resetTracking();
    started = false;
    state = emptyState();
    maxStep = 0;
    persist(null);
    goTo(0);
  }

  // ——— Resumo lateral ———

  function renderSummary() {
    const rows = summarize(state);
    const filled = rows.filter((r) => r.status !== 'pending').length;
    const countText = `${filled} de ${rows.length}`;
    els.summaryCount.textContent = countText;
    els.mobileCount.textContent = countText;

    els.summaryList.replaceChildren(
      ...rows.map((r) => {
        const i = STEPS.findIndex((s) => s.id === r.step);
        return h(
          'div',
          { class: `sum-row is-${r.status}` },
          h('dt', {}, r.label),
          h(
            'dd',
            {},
            canVisit(i) && r.status !== 'pending'
              ? h('button', { type: 'button', class: 'sum-value', onclick: () => { els.sheet.open && els.sheet.close(); goTo(i); }, 'aria-label': `${r.label}: ${r.value}. Alterar` }, r.value)
              : h('span', { class: 'sum-value' }, r.value),
            r.detail ? h('small', {}, r.detail) : null,
          ),
        );
      }),
    );
    if (state.services.length) {
      els.summaryList.append(h('div', { class: 'sum-row is-set' }, h('dt', {}, 'Itens'), h('dd', {}, h('span', { class: 'sum-value' }, servicesText(state)))));
    }
    if (state.role) {
      els.summaryList.append(h('div', { class: 'sum-row is-set' }, h('dt', {}, 'Atuação'), h('dd', {}, h('span', { class: 'sum-value' }, roleTitle(state.role)))));
    }
    els.price.replaceChildren(
      h('p', { class: 'price-kicker' }, 'Proposta'),
      h('p', { class: 'price-quote' }, 'Sob avaliação'),
      h('p', { class: 'price-note' }, 'Sem tabela pública de preços de Cloud. A equipe da MSSERVER analisa o levantamento e retorna com arquitetura e proposta.'),
    );

    const actions: Node[] = [waLink(filled > 0 ? 'Falar sobre este projeto' : 'Prefere conversar? WhatsApp', 'simulador-resumo', 'btn btn--outline-dark sim-wa')];
    if (filled > 0) {
      actions.push(h('button', { type: 'button', class: 'sim-reset', onclick: () => confirm(RESTART_CONFIRM) && reset() }, icon('rotate-ccw', 15), 'Recomeçar'));
    }
    els.summaryActions.replaceChildren(...actions);
    refreshWhatsAppLinks();
    if (els.sheet.open) fillSheet();
  }

  // ——— Resumo no celular (bottom sheet) ———

  function fillSheet() {
    const clone = els.summaryRoot.cloneNode(true) as HTMLElement;
    clone.querySelector('.sim-summary-head')?.remove();
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    els.sheetBody.replaceChildren(clone);
  }

  root.querySelector('[data-open-sheet]')?.addEventListener('click', () => {
    fillSheet();
    els.sheet.showModal();
  });
  root.querySelector('[data-close-sheet]')?.addEventListener('click', () => els.sheet.close());
  els.sheet.addEventListener('click', (e) => {
    if (e.target === els.sheet) els.sheet.close();
    const target = e.target as HTMLElement;
    const value = target.closest<HTMLButtonElement>('.sum-value');
    if (value && value.tagName === 'BUTTON') {
      const label = value.closest('.sum-row')?.querySelector('dt')?.textContent;
      const row = summarize(state).find((r) => r.label === label);
      if (row) {
        els.sheet.close();
        goTo(STEPS.findIndex((s) => s.id === row.step));
      }
    }
    if (target.closest('.sim-reset')) {
      els.sheet.close();
      if (confirm(RESTART_CONFIRM)) reset();
    }
  });

  // ——— Atalhos vindos da página (CTAs e cartões) ———

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-sim-preset], [data-sim-start]');
    if (!el || root.contains(el)) return;
    const preset = el.dataset.simPreset;
    if (preset) {
      markStarted(`atalho-${el.dataset.trackLocation ?? 'pagina'}`);
      // Um atalho pode marcar vários itens: "workload:erp scenario:migrate service:backup".
      const marked: string[] = [];
      let model = '';
      for (const token of preset.split(/\s+/)) {
        const [kind, value] = token.split(':');
        if (kind === 'workload') {
          const w = value as Workload;
          const workloads = w === UNSURE ? ([UNSURE] as Workload[]) : [...new Set([...state.workloads.filter((x) => x !== UNSURE), w])];
          update({ workloads }, { render: false });
          if (w !== UNSURE) marked.push(workloadTitle(w));
        } else if (kind === 'scenario') {
          update({ scenario: value as SimState['scenario'] }, { render: false });
          marked.push(scenarioTitle(value));
        } else if (kind === 'service') {
          update({ services: [...new Set([...state.services, value])] }, { render: false });
        } else if (kind === 'model') {
          update({ model: value as SimState['model'] }, { render: false });
          model = MODELS.find((m) => m.value === value)?.title ?? '';
        }
      }
      const objectiveDone = validateStep('objetivo', state) === null;
      if (model) {
        pendingNotices.push({ tone: 'info', text: `"${model}" já está selecionado. ${objectiveDone ? 'Confira o modelo e a criticidade.' : 'Comece pela necessidade do ambiente.'}` });
        goTo(objectiveDone ? 1 : 0, { scroll: false });
      } else {
        pendingNotices.push({
          tone: 'info',
          text: marked.length ? `Marcamos no levantamento: ${marked.join(' · ')}. Ajuste e complete o que faltar.` : 'Tudo bem começar sem todos os dados: as etapas aceitam "não sei".',
        });
        goTo(0, { scroll: false });
      }
    } else {
      markStarted(el.dataset.trackLocation ?? 'cta');
    }
    // Deixa a rolagem nativa da âncora acontecer e leva o foco para a etapa.
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active === el || active === document.body || active === null) els.stage.querySelector<HTMLElement>('.sim-step-title')?.focus({ preventScroll: true });
    }, reducedMotion() ? 0 : 600);
  });

  // ——— Barra fixa no celular: só aparece com o simulador na tela ———

  new IntersectionObserver(([entry]) => root.classList.toggle('is-in-view', entry.isIntersecting), { rootMargin: '-30% 0px -30% 0px' }).observe(root);

  renderStep();
  renderProgress();
  renderSummary();
  broadcast();
  root.classList.add('is-ready');
}

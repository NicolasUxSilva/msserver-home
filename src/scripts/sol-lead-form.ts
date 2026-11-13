import { ELEMENTOR_EMAIL, ELEMENTOR_TEL, sendElementorForm, type ElementorTarget } from './elementor-form';
import { FORM_TEXTS as T } from '../data/solucoes';
import { track } from './analytics';

// Formulários de contato das páginas de soluções: confere os campos como o Elementor (obrigatórios,
// e-mail e telefone), envia ao WordPress e mostra o resultado que o servidor confirmar. Nada é dado
// como enviado sem a confirmação do servidor; em caso de falha, os dados continuam preenchidos.

export function initLeadForms() {
  document.querySelectorAll<HTMLElement>('[data-sol-lead]').forEach((root) => {
    if (root.dataset.ready) return;
    root.dataset.ready = '1';
    const target: ElementorTarget = JSON.parse(root.dataset.config!);
    const form = root.querySelector<HTMLFormElement>('[data-sol-form]')!;
    const inputs = [...form.querySelectorAll<HTMLInputElement>('input[name^="form_fields"]')];
    const alertBox = root.querySelector<HTMLElement>('[data-alert]')!;
    const alertText = root.querySelector<HTMLElement>('[data-alert-text]')!;
    const success = root.querySelector<HTMLElement>('[data-success]')!;
    const submit = root.querySelector<HTMLButtonElement>('[data-submit]')!;
    const label = root.querySelector<HTMLElement>('[data-submit-label]')!;
    const live = root.querySelector<HTMLElement>('[data-live]')!;
    const idle = label.textContent ?? '';
    const fieldId = (input: HTMLInputElement) => input.name.replace(/^form_fields\[|\]$/g, '');

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

    for (const input of inputs) {
      input.addEventListener('blur', () => input.value && show(input, check(input)));
      input.addEventListener('input', () => input.getAttribute('aria-invalid') && !check(input) && show(input, ''));
    }

    const busy = (on: boolean) => {
      submit.disabled = on;
      root.classList.toggle('is-sending', on);
      label.textContent = on ? T.sending : idle;
      inputs.forEach((i) => (i.readOnly = on));
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.hidden = true;
      const invalid = inputs.map((i) => [i, check(i)] as const).filter(([, m]) => m);
      inputs.forEach((i) => show(i, invalid.find(([x]) => x === i)?.[1] ?? ''));
      if (invalid.length) {
        invalid[0][0].focus();
        track('solution_form_invalid', { form_id: target.formId, fields: invalid.length });
        return;
      }
      // Telefone sem espaços (o servidor recusa espaços); demais campos sem espaços sobrando.
      const fields = Object.fromEntries(inputs.map((i) => [fieldId(i), i.dataset.type === 'tel' ? i.value.replace(/\s+/g, '') : i.value.replace(/\s+/g, ' ').trim()]));
      busy(true);
      live.textContent = T.sending;
      track('solution_form_submit', { form_id: target.formId });
      const result = await sendElementorForm(target, fields);
      busy(false);
      if (result.ok) {
        track('solution_form_success', { form_id: target.formId });
        if (result.redirect) {
          location.href = result.redirect;
          return;
        }
        root.querySelector('[data-success-message]')!.textContent = result.message || T.successFallback;
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }
      // Erros por campo (chave = id do campo no Elementor).
      for (const [id, message] of Object.entries(result.ok ? {} : result.errors)) {
        const input = inputs.find((i) => fieldId(i) === id);
        if (input) show(input, message || T.required);
      }
      track('solution_form_error', { form_id: target.formId, reason: result.reason });
      alertText.textContent = result.reason === 'network' ? T.networkError : [result.message, T.serverError].filter(Boolean).join(' ');
      alertBox.hidden = false;
      alertBox.focus();
    });

    root.querySelector('[data-again]')!.addEventListener('click', () => {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      inputs[0]?.focus();
    });
  });
}

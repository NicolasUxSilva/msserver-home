import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-orcamento.json' with { type: 'json' };

// Página "Orçamento": o formulário de 5 etapas do Elementor Pro reconstruído. O envio nunca sai
// para o servidor real: todo pedido ao admin-ajax.php é respondido aqui, e qualquer outro acesso
// ao site de produção é bloqueado.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const fields = original.steps.flatMap((s) => s.fields);
const byId = (id: string) => `#${id}`;
const VALUES: Record<string, string> = {
  'form-field-name': 'Pessoa de Teste',
  'form-field-field_ba71415': 'Empresa de Teste Ltda',
  'form-field-field_f66ed12': 'teste@example.com',
  'form-field-field_2e1002c': '(11) 90000-0000',
  'form-field-field_1d74bd8': 'Servidor para teste automatizado',
  'form-field-field_9919f95': 'Não',
};

/** Responde o endpoint do formulário localmente e guarda os pedidos recebidos. */
async function mockEndpoint(page: Page, reply: (route: Route, n: number) => Promise<void>) {
  const calls: Request[] = [];
  await page.route(/admin-ajax\.php/, async (route) => {
    calls.push(route.request());
    await reply(route, calls.length);
  });
  return calls;
}
const ok = (message = 'Seu envio foi bem-sucedido.', data: unknown = []) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { message, data } }) });

/** Partes do corpo multipart, na ordem. */
const parts = (req: Request) => [...(req.postDataBuffer()?.toString('utf8') ?? '').matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)].map((m) => [m[1], m[2]]);

const step = (page: Page) => page.locator('[data-step][data-active]');
const next = (page: Page) => page.getByRole('button', { name: original.buttons.next });

async function fillAll(page: Page, values = VALUES) {
  for (const [i, s] of original.steps.entries()) {
    await expect(step(page).locator('legend')).toHaveText(s.label);
    for (const f of s.fields) await page.fill(byId(f.id), values[f.id]);
    if (i < original.steps.length - 1) await next(page).click();
  }
}

test.describe('orçamento: preservação do formulário original', () => {
  test('mesmas etapas, perguntas, campos e textos', async ({ page }) => {
    await page.goto('/orcamento/');
    await expect(page).toHaveTitle(original.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', original.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', original.canonical);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('h1')).toHaveText('Orçamento');
    // Cinco etapas, com os mesmos nomes e na mesma ordem.
    await expect(page.locator('[data-step] legend')).toHaveText(original.steps.map((s) => s.label));
    for (const f of fields) {
      const el = page.locator(byId(f.id));
      await expect(el).toHaveAttribute('name', f.name);
      await expect(el).toHaveAttribute('placeholder', f.placeholder!);
      expect(await el.evaluate((e: HTMLInputElement) => e.required)).toBe(f.required);
      // "Aplicação" virou área de texto (resposta descritiva); os demais mantêm o tipo.
      if (f.id !== 'form-field-field_1d74bd8') await expect(el).toHaveAttribute('type', f.type!);
      await expect(page.locator(`label[for="${f.id}"]`)).toHaveText(f.label);
    }
    // Campos ocultos do widget do Elementor.
    for (const [name, value] of Object.entries(original.hidden)) await expect(page.locator(`input[type=hidden][name="${name}"]`)).toHaveValue(value);
    await expect(next(page)).toBeVisible();
  });

  test('envio igual ao do Elementor (mesmos campos, ordem, ação e widget da tela)', async ({ page, isMobile }) => {
    const calls = await mockEndpoint(page, (r) => r.fulfill(ok()));
    await page.goto('/orcamento/');
    await fillAll(page);
    await page.getByRole('button', { name: 'Enviar solicitação de orçamento' }).click();
    await expect(page.locator('[data-success]')).toBeVisible();
    expect(calls).toHaveLength(1);
    const req = calls[0];
    expect(req.method()).toBe('POST');
    expect(req.url()).toBe(original.endpoint);
    expect(req.headers()['content-type']).toMatch(/^multipart\/form-data/);
    expect(req.headers()['x-requested-with']).toBe('XMLHttpRequest');
    expect(parts(req)).toEqual([
      ['post_id', original.hidden.post_id],
      ['form_id', isMobile ? original.formIds.mobile : original.formIds.desktop],
      ['referer_title', original.hidden.referer_title],
      ['queried_id', original.hidden.queried_id],
      ...fields.map((f) => [f.name, f.id === 'form-field-field_2e1002c' ? '(11)90000-0000' : VALUES[f.id]]),
      ['action', original.action],
      ['referrer', page.url()],
    ]);
  });
});

test.describe('orçamento: etapas e validação', () => {
  test('Próximo valida, Anterior volta sem perder dados e o progresso acompanha', async ({ page, isMobile }) => {
    await page.goto('/orcamento/');
    const bar = page.locator('[data-bar]');
    await expect(page.locator('[data-count]')).toHaveText('1');
    await expect(page.getByRole('button', { name: original.buttons.previous })).toBeHidden();
    // Vazio: não avança e explica o que falta.
    await next(page).click();
    await expect(step(page).locator('legend')).toHaveText('Dados Pessoais');
    await expect(page.locator('#form-field-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Informe seu nome e sobrenome.')).toBeVisible();
    await expect(page.locator('#form-field-name')).toBeFocused();
    // Preenchido: o erro some e Enter avança.
    await page.fill('#form-field-name', 'Pessoa de Teste');
    await expect(page.getByText('Informe seu nome e sobrenome.')).toBeHidden();
    await page.locator('#form-field-name').press('Enter');
    await expect(step(page).locator('legend')).toHaveText('Dados da Empresa');
    await expect(page.locator('#form-field-field_ba71415')).toBeFocused();
    await expect(page.locator('[data-count]')).toHaveText('2');
    await expect(bar).toHaveAttribute('aria-valuenow', '1');
    await expect(page.locator('[data-seg]').nth(0)).toHaveAttribute('data-state', 'done');
    await expect(page.locator('[data-seg]').nth(1)).toHaveAttribute('data-state', 'current');
    if (!isMobile) {
      const first = page.locator('[data-tl-item]').first();
      await expect(first).toHaveAttribute('data-state', 'done');
      await expect(first.locator('[data-tl-value]')).toHaveText('Pessoa de Teste');
    } else {
      await expect(page.locator('[data-next-label]')).toHaveText('A seguir: Email e Telefone');
    }
    // Voltar não valida e mantém o que foi digitado.
    await page.getByRole('button', { name: original.buttons.previous }).click();
    await expect(page.locator('#form-field-name')).toHaveValue('Pessoa de Teste');
    // Se a etapa concluída for apagada, o progresso deixa de contá-la.
    await page.fill('#form-field-name', '');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await page.fill('#form-field-name', 'Pessoa de Teste');
    await next(page).click();
    await page.fill('#form-field-field_ba71415', 'Empresa de Teste Ltda');
    await next(page).click();

    // Email e telefone: formato conferido; espaços no telefone são aceitos.
    await page.fill('#form-field-field_f66ed12', 'teste@');
    await page.fill('#form-field-field_2e1002c', '11 9abc');
    await next(page).click();
    await expect(page.getByText('Informe um email válido, como nome@empresa.com.br.')).toBeVisible();
    await expect(page.getByText('Use apenas números e caracteres de telefone, como ( ) - + # *.')).toBeVisible();
    await page.fill('#form-field-field_f66ed12', 'teste@example.com');
    await page.fill('#form-field-field_2e1002c', '(11) 90000-0000');
    await next(page).click();
    await expect(step(page).locator('legend')).toHaveText('Aplicação');
    await expect(page.locator('#form-field-field_1d74bd8')).toHaveJSProperty('tagName', 'TEXTAREA');
    await page.fill('#form-field-field_1d74bd8', 'Servidor para teste');
    await next(page).click();
    await expect(step(page).locator('legend')).toHaveText('Serviço especializado');
    await expect(page.getByRole('button', { name: 'Enviar solicitação de orçamento' })).toBeVisible();
    await expect(next(page)).toBeHidden();

    // Desktop: a linha do tempo leva de volta a qualquer etapa já feita, sem perder nada.
    if (!isMobile) {
      await page.locator('[data-tl-go="0"]').click();
      await expect(step(page).locator('legend')).toHaveText('Dados Pessoais');
      await page.locator('[data-tl-go="3"]').click();
      await expect(page.locator('#form-field-field_1d74bd8')).toHaveValue('Servidor para teste');
      await expect(page.locator('[data-tl-go="4"]')).toBeEnabled();
    }
    for (const id of ['#form-field-name', '#form-field-field_ba71415', '#form-field-field_f66ed12', '#form-field-field_2e1002c']) await expect(page.locator(id)).not.toHaveValue('');
  });

  test('enviar com etapa incompleta leva até ela', async ({ page }) => {
    await mockEndpoint(page, (r) => r.fulfill(ok()));
    await page.goto('/orcamento/');
    await fillAll(page);
    // Apaga a razão social direto no campo (etapa 2) e tenta enviar.
    await page.locator('#form-field-field_ba71415').evaluate((e: HTMLInputElement) => (e.value = ''));
    await page.getByRole('button', { name: 'Enviar solicitação de orçamento' }).click();
    await expect(step(page).locator('legend')).toHaveText('Dados da Empresa');
    await expect(page.getByText('Informe a razão social da empresa.')).toBeVisible();
    await expect(page.locator('[data-success]')).toBeHidden();
  });

  test('o rascunho continua depois de recarregar a página', async ({ page }) => {
    await page.goto('/orcamento/');
    await page.fill('#form-field-name', 'Pessoa de Teste');
    await next(page).click();
    await page.fill('#form-field-field_ba71415', 'Empresa de Teste Ltda');
    await page.waitForTimeout(300);
    await page.reload();
    await expect(step(page).locator('legend')).toHaveText('Dados da Empresa');
    await expect(page.locator('#form-field-field_ba71415')).toHaveValue('Empresa de Teste Ltda');
    await expect(page.locator('#form-field-name')).toHaveValue('Pessoa de Teste');
  });
});

test.describe('orçamento: envio', () => {
  test('carregando, sem envio duplicado, e confirmação com a mensagem do servidor', async ({ page }) => {
    const calls = await mockEndpoint(page, async (r) => {
      await new Promise((x) => setTimeout(x, 800));
      await r.fulfill(ok('Recebemos seu pedido (mensagem do servidor).'));
    });
    await page.goto('/orcamento/');
    await fillAll(page);
    const submit = page.locator('[data-submit]');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await expect(submit).toContainText('Enviando solicitação');
    await page.locator('[data-quote-form]').evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.locator('[data-success]')).toBeVisible();
    expect(calls).toHaveLength(1);
    await expect(page.getByRole('heading', { name: 'Solicitação de orçamento enviada' })).toBeVisible();
    await expect(page.locator('[data-success-message]')).toHaveText('Recebemos seu pedido (mensagem do servidor).');
    await expect(page.locator('[data-success-summary]')).toContainText('Empresa de Teste Ltda');
    await expect(page.locator('[data-quote-form]')).toBeHidden();
    // Como no Elementor, o formulário volta limpo ao início; o rascunho foi apagado.
    expect(await page.evaluate(() => sessionStorage.getItem('msserver:orcamento'))).toBeNull();
    await page.getByRole('button', { name: 'Enviar outra solicitação' }).click();
    await expect(step(page).locator('legend')).toHaveText('Dados Pessoais');
    await expect(page.locator('#form-field-name')).toHaveValue('');
  });

  test('erro do servidor por campo: leva à etapa, mostra a mensagem e mantém os dados', async ({ page }) => {
    await mockEndpoint(page, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, data: { message: 'Há um erro no seu envio.', errors: { field_2e1002c: 'O campo aceita apenas números e caracteres de telefone.' }, data: [] } }),
      }),
    );
    await page.goto('/orcamento/');
    await fillAll(page);
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-alert]')).toBeVisible();
    await expect(page.locator('[data-alert]')).toContainText('Há um erro no seu envio.');
    await expect(step(page).locator('legend')).toHaveText('Email e Telefone');
    await expect(page.getByText('O campo aceita apenas números e caracteres de telefone.')).toBeVisible();
    await expect(page.locator('[data-success]')).toBeHidden();
    for (const [id, v] of Object.entries(VALUES)) await expect(page.locator(byId(id))).toHaveValue(v);
  });

  test('falha de rede: aviso, dados preservados e novo envio funciona', async ({ page }) => {
    const calls = await mockEndpoint(page, (r, n) => (n === 1 ? r.abort('failed') : r.fulfill(ok())));
    await page.goto('/orcamento/');
    await fillAll(page);
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-alert]')).toBeVisible();
    await expect(page.locator('[data-alert]')).toContainText('Seus dados continuam preenchidos');
    await expect(page.locator('[data-success]')).toBeHidden();
    for (const [id, v] of Object.entries(VALUES)) await expect(page.locator(byId(id))).toHaveValue(v);
    await expect(page.locator('[data-submit]')).toBeEnabled();
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-success]')).toBeVisible();
    expect(calls).toHaveLength(2);
  });

  test('resposta inesperada não vira confirmação', async ({ page }) => {
    await mockEndpoint(page, (r) => r.fulfill({ status: 500, contentType: 'text/html', body: '<html>erro</html>' }));
    await page.goto('/orcamento/');
    await fillAll(page);
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-alert]')).toBeVisible();
    await expect(page.locator('[data-success]')).toBeHidden();
  });

  test('redirecionamento configurado no Elementor é respeitado', async ({ page }) => {
    await mockEndpoint(page, (r) => r.fulfill(ok('', { redirect_url: '/sobre/' })));
    await page.goto('/orcamento/');
    await fillAll(page);
    await page.locator('[data-submit]').click();
    await expect(page).toHaveURL(/\/sobre\/$/);
  });
});

test.describe('orçamento: telas e acessibilidade', () => {
  test('layout: sem rolagem lateral, botões confortáveis e progresso adequado à tela', async ({ page, isMobile }) => {
    await page.goto('/orcamento/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const btn = (await next(page).boundingBox())!;
    expect(btn.height).toBeGreaterThanOrEqual(44);
    if (isMobile) {
      // Celular: progresso compacto no cartão, sem a linha do tempo.
      await expect(page.locator('.timeline')).toBeHidden();
      await expect(page.locator('[data-next-label]')).toBeVisible();
      const input = (await page.locator('#form-field-name').boundingBox())!;
      expect(input.height).toBeGreaterThanOrEqual(48);
      // O botão fica logo abaixo do campo.
      expect(btn.y - (input.y + input.height)).toBeLessThan(120);
    } else {
      await expect(page.locator('.timeline')).toBeVisible();
      await expect(page.locator('[data-tl-item]')).toHaveCount(5);
      const card = (await page.locator('[data-quote-card]').boundingBox())!;
      const aside = (await page.locator('.quote-aside').boundingBox())!;
      expect(card.x).toBeGreaterThan(aside.x + aside.width);
    }
  });

  test('menu marca a página atual e o console fica limpo', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errors.push(m.text()));
    await page.goto('/orcamento/');
    if (!isMobile) await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Orçamento' })).toHaveAttribute('aria-current', 'page');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    const crumbs = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Orçamento']);
    expect(errors).toEqual([]);
  });

  test('acessibilidade (axe, WCAG 2.1 AA): início, erros e confirmação', async ({ page }) => {
    await mockEndpoint(page, (r) => r.fulfill(ok()));
    const axe = async () => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`);
    await page.goto('/orcamento/');
    expect(await axe()).toEqual([]);
    await next(page).click();
    expect(await axe()).toEqual([]);
    await page.fill('#form-field-name', 'Pessoa de Teste');
    await fillAll(page);
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-success]')).toBeVisible();
    // Espera a entrada da confirmação terminar (durante o esmaecimento o contraste é parcial).
    await page.locator('[data-success]').evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    expect(await axe()).toEqual([]);
  });
});

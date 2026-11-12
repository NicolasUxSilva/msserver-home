import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { line, mockStore } from './store-mock';

// Finalização de compra (/finalizar-compra/): carrinho, cupons, frete e pedido pela Store API do
// WooCommerce, simulada em ./store-mock.ts no formato do WooCommerce 8.2 (nada chega à loja real).
// Campos, regras de país, forma de pagamento e textos legais vêm da página publicada
// (src/data/checkout-wc.json).
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
  await page.route('**/finalizar-compra/order-received/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Pedido recebido</title>' }));
});

const R210_16 = 5421; // Servidor Dell PowerEdge R210, Memoria RAM 16GB, R$ 3.950,00
const BATERIA = 7820; // Bateria Dell nu209 …, R$ 350,00
const GW = 'woo_paypal_stripe_gateway_set';
const nb = (s: string) => s.replace(/ /g, ' ');
const card = (page: Page, k: 'number' | 'expiry' | 'cvc') => page.locator(`#${GW}-card-${k}`);
const submit = (page: Page) => page.getByRole('button', { name: 'Finalizar pedido' });

async function open(page: Page, opts: Parameters<typeof mockStore>[1] = {}) {
  const store = await mockStore(page, { lines: [line(R210_16, 1), line(BATERIA, 2)], ...opts });
  await page.goto('/finalizar-compra/');
  await expect(page.locator('[data-co]')).toHaveAttribute('data-state', 'ready');
  return store;
}

async function fillBilling(page: Page, values: Record<string, string> = {}) {
  const v = { first_name: 'Maria', last_name: 'Souza', company: 'Empresa Teste', address_1: 'Rua das Flores, 100', city: 'Santo André', postcode: '09010-160', phone: '(11) 4858-5358', email: 'maria@example.com', ...values };
  for (const [k, value] of Object.entries(v)) await page.locator(`#billing_${k}`).fill(value);
}

async function fillCard(page: Page, number = '4242 4242 4242 4242', expiry = '12 / 30', cvc = '123') {
  await card(page, 'number').fill(number);
  await card(page, 'expiry').fill(expiry);
  await card(page, 'cvc').fill(cvc);
}

test.describe('finalização: página e dados da loja', () => {
  test('SEO, trilha, etapas e campos da finalização do WooCommerce', async ({ page }) => {
    await open(page);
    await expect(page).toHaveTitle('Finalização de compra - MSSERVER');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/finalizar-compra/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'max-image-preview:large');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'WebPage').url).toBe('https://msserver.com.br/finalizar-compra/');
    await expect(page.locator('h1')).toHaveText('Finalização de compra');
    await expect(page.locator('.cat-crumbs a')).toHaveText(['Início', 'Carrinho']);
    await expect(page.locator('.co-steps [aria-current="step"]')).toContainText('Dados e pagamento');
    await expect(page.locator('header [aria-current="page"]')).toHaveCount(0);

    // Os mesmos campos (nomes e autocomplete) e a ordem da finalização original.
    const keys = await page.locator('[data-co-address="billing"] > .co-field').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.key));
    expect(keys).toEqual(['first_name', 'last_name', 'company', 'country', 'address_1', 'address_2', 'city', 'state', 'postcode', 'phone', 'email']);
    await expect(page.locator('#billing_first_name')).toHaveAttribute('autocomplete', 'given-name');
    await expect(page.locator('#billing_email')).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('#billing_phone')).toHaveAttribute('type', 'tel');
    await expect(page.locator('#order_comments')).toHaveAttribute('name', 'order_comments');
    // País e estado da sessão (padrão da loja: Brasil, São Paulo), com os 27 estados.
    await expect(page.locator('#billing_country')).toHaveValue('BR');
    await expect(page.locator('#billing_country option:checked')).toHaveText('Brasil');
    await expect(page.locator('#billing_state')).toHaveValue('SP');
    await expect(page.locator('#billing_state option:not([value=""])')).toHaveCount(27);
    expect(await page.locator('#billing_country option').count()).toBe(249);
    // Forma de pagamento da loja: cartão, com as bandeiras e os três campos.
    await expect(page.locator('.co-method:not([hidden])')).toHaveCount(1);
    await expect(page.locator('.co-method-title')).toHaveText('Cartão de crédito');
    await expect(page.locator('.co-brands img')).toHaveCount(3);
    expect(await page.locator('.co-brands img').evaluateAll((els) => els.map((e) => e.getAttribute('alt')))).toEqual(['Visa', 'Mastercard', 'Discover']);
    await expect(card(page, 'number')).toHaveAttribute('autocomplete', 'cc-number');
    await expect(card(page, 'expiry')).toHaveAttribute('placeholder', 'MM / AA');
    // Os campos do cartão não têm "name": nunca entram num envio comum do formulário.
    for (const k of ['number', 'expiry', 'cvc'] as const) expect(await card(page, k).getAttribute('name')).toBeNull();
    await expect(page.locator('[data-co-form]')).toHaveAttribute('method', 'post');
    // Texto de privacidade da loja, com o link da política.
    await expect(page.locator('.co-privacy')).toContainText('Os seus dados pessoais serão utilizados para processar a sua compra');
    await expect(page.locator('.co-privacy a')).toHaveAttribute('href', 'https://msserver.com.br/?page_id=3');
  });

  test('resumo do pedido com os itens, quantidades e totais da loja', async ({ page, isMobile }) => {
    await open(page);
    if (isMobile) {
      // No celular, o resumo começa recolhido, com o total à vista.
      const toggle = page.locator('[data-co-summary-toggle]');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toContainText(nb('R$ 4.650,00'));
      await expect(toggle).toContainText('3 itens');
      await expect(page.locator('.co-items')).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    } else await expect(page.locator('[data-co-summary-toggle]')).toBeHidden();
    const items = page.locator('.co-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator('.co-item-name')).toContainText('Servidor Dell PowerEdge R210');
    await expect(items.nth(0).locator('.co-item-variation')).toHaveText('Memoria RAM: 16GB');
    await expect(items.nth(1).locator('[data-co-qty]')).toHaveText('2');
    await expect(items.nth(1).locator('.co-item-total')).toHaveText(nb('R$ 700,00'));
    await expect(page.locator('.co-totals .cart-total dt')).toHaveText(['Subtotal', 'Total']);
    await expect(page.locator('.co-totals .is-total dd')).toHaveText(nb('R$ 4.650,00'));
    await expect(page.locator('[data-co-place-total]')).toHaveText(nb('R$ 4.650,00'));
    await expect(page.getByRole('link', { name: 'Editar carrinho' })).toHaveAttribute('href', '/carrinho/');
  });

  test('carrinho vazio e loja indisponível', async ({ page }) => {
    await mockStore(page, {});
    await page.goto('/finalizar-compra/');
    await expect(page.locator('[data-co]')).toHaveAttribute('data-state', 'empty');
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Retornar para a loja' })).toHaveAttribute('href', '/servidores/');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
    await mockStore(page, { down: true });
    await page.goto('/finalizar-compra/');
    await expect(page.locator('[data-co]')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});

test.describe('finalização: campos e validação', () => {
  test('enviar sem preencher: lista de erros, campos marcados e nada vai para a loja', async ({ page }) => {
    const store = await open(page);
    await submit(page).click();
    const alert = page.locator('[data-co-alert]');
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(alert.locator('li')).toHaveText([
      'Nome é um campo obrigatório.',
      'Sobrenome é um campo obrigatório.',
      'Endereço é um campo obrigatório.',
      'Cidade é um campo obrigatório.',
      'CEP é um campo obrigatório.',
      'Telefone é um campo obrigatório.',
      'Endereço de e-mail é um campo obrigatório.',
      'Número do cartão é um campo obrigatório.',
      'Data de validade (MM/AA) é um campo obrigatório.',
      'Código do cartão é um campo obrigatório.',
    ]);
    await expect(page.locator('#billing_first_name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#billing_company')).not.toHaveAttribute('aria-invalid', 'true');
    // Cada erro leva ao campo.
    await alert.getByRole('link', { name: 'Cidade é um campo obrigatório.' }).click();
    await expect(page.locator('#billing_city')).toBeFocused();
    // Ao corrigir, o erro do campo some, e também da lista do alto.
    await page.locator('#billing_city').fill('Santo André');
    await expect(page.locator('#billing_city')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(alert.locator('li')).toHaveCount(9);
    await expect(alert).not.toContainText('Cidade');
    // Com tudo corrigido, o alerta fecha.
    await fillBilling(page);
    await fillCard(page);
    await expect(alert).toBeHidden();
    expect(store.requests.filter((r) => r.path === '/checkout')).toEqual([]);
  });

  test('formatos: e-mail, telefone, CEP, cartão, validade e código', async ({ page }) => {
    const store = await open(page);
    await fillBilling(page, { email: 'maria@', phone: '11 9999-ABCD', postcode: '0901' });
    // CEP com máscara 00000-000.
    await page.locator('#billing_postcode').fill('');
    await page.locator('#billing_postcode').pressSequentially('0901');
    await expect(page.locator('#billing_postcode')).toHaveValue('0901');
    // Cartão no formato do formulário do WooCommerce.
    await card(page, 'number').pressSequentially('4242424242424241');
    await expect(card(page, 'number')).toHaveValue('4242 4242 4242 4241');
    await expect(page.locator('.co-brands img.is-active')).toHaveAttribute('alt', 'Visa');
    await card(page, 'expiry').pressSequentially('0120');
    await expect(card(page, 'expiry')).toHaveValue('01 / 20');
    await card(page, 'cvc').pressSequentially('12a');
    await expect(card(page, 'cvc')).toHaveValue('12');
    await submit(page).click();
    await expect(page.locator('[data-co-alert] li')).toHaveText([
      'Digite um CEP válido.',
      'Telefone não é um número de telefone válido.',
      'Endereço de e-mail de faturamento inválido.',
      'Número do cartão inválido.',
      'O cartão está vencido.',
      'Código do cartão inválido.',
    ]);
    // Corrigidos, não há mais erros (o pedido segue para a loja).
    await page.locator('#billing_postcode').fill('09010160');
    await expect(page.locator('#billing_postcode')).toHaveValue('09010-160');
    await page.locator('#billing_phone').fill('(11) 4858-5358');
    await page.locator('#billing_email').fill('maria@example.com');
    await card(page, 'number').fill('5555555555554444');
    await expect(page.locator('.co-brands img.is-active')).toHaveAttribute('alt', 'Mastercard');
    await card(page, 'expiry').fill('');
    await card(page, 'expiry').pressSequentially('4');
    await expect(card(page, 'expiry')).toHaveValue('04 / ');
    await card(page, 'expiry').pressSequentially('35');
    await card(page, 'cvc').fill('321');
    await submit(page).click();
    await expect.poll(() => store.requests.filter((r) => r.path === '/checkout').length).toBe(1);
  });

  test('regras de endereço de cada país, como no WooCommerce', async ({ page }) => {
    const store = await open(page);
    const label = (k: string) => page.locator(`[data-co-address="billing"] .co-field[data-key="${k}"] [data-co-label]`);
    const order = () => page.locator('[data-co-address="billing"] > .co-field:not([hidden])').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.key));
    // Estados Unidos: "ZIP Code" e "State", com a lista de estados.
    await page.locator('#billing_country').selectOption('US');
    await expect(label('postcode')).toHaveText('Código ZIP');
    await expect(label('state')).toHaveText('Estado');
    await expect(page.locator('#billing_state option:not([value=""])')).toHaveCount(54);
    await expect(page.locator('#billing_state')).toHaveValue('');
    // Portugal: sem estados (o campo some) e o código postal obrigatório.
    await page.locator('#billing_country').selectOption('PT');
    await expect(page.locator('[data-co-address="billing"] .co-field[data-key="state"]')).toBeHidden();
    expect(await order()).toEqual(['first_name', 'last_name', 'company', 'country', 'address_1', 'address_2', 'city', 'postcode', 'phone', 'email']);
    // Alemanha: o código postal vem antes da cidade; estado opcional.
    await page.locator('#billing_country').selectOption('DE');
    expect(await order()).toEqual(['first_name', 'last_name', 'company', 'country', 'address_1', 'address_2', 'postcode', 'city', 'state', 'phone', 'email']);
    await expect(page.locator('[data-co-address="billing"] .co-field[data-key="state"] .co-opt')).toBeVisible();
    // Reino Unido: estado ("County") em texto livre, opcional.
    await page.locator('#billing_country').selectOption('GB');
    await expect(page.locator('#billing_state_text')).toBeVisible();
    await expect(page.locator('#billing_state')).toBeHidden();
    await expect(label('state')).toHaveText('Condado');
    await expect(page.locator('label[for="billing_state_text"]')).toHaveCount(1);
    // De volta ao Brasil: CEP, estados e endereço da sessão atualizado (impostos e frete pela loja).
    await page.locator('#billing_country').selectOption('BR');
    await page.locator('#billing_state').selectOption('RJ');
    await expect(label('postcode')).toHaveText('CEP');
    await expect.poll(() => store.requests.filter((r) => r.path === '/cart/update-customer').length).toBeGreaterThan(0);
    const last = store.requests.filter((r) => r.path === '/cart/update-customer').at(-1)!;
    const billing = last.body!.billing_address as Record<string, string>;
    expect(Object.keys(billing).sort()).toEqual(['address_1', 'address_2', 'city', 'company', 'country', 'email', 'first_name', 'last_name', 'phone', 'postcode', 'state']);
    expect(billing).toMatchObject({ country: 'BR', state: 'RJ' });
  });
});

test.describe('finalização: pedido e pagamento', () => {
  test('pedido aprovado: os dados vão ao WooCommerce como no formulário original e abre o pedido recebido', async ({ page }) => {
    const store = await open(page);
    await fillBilling(page);
    await page.locator('#billing_address_2').fill('Sala 3');
    await page.locator('#order_comments').fill('Entregar em horário comercial.');
    await fillCard(page);
    await Promise.all([page.waitForURL('**/finalizar-compra/order-received/9001/?key=wc_order_mock9001'), submit(page).click()]);
    const req = store.requests.find((r) => r.path === '/checkout')!;
    expect(req.nonce).toBeTruthy();
    const body = req.body as Record<string, unknown>;
    expect(body.billing_address).toEqual({
      first_name: 'Maria',
      last_name: 'Souza',
      company: 'Empresa Teste',
      address_1: 'Rua das Flores, 100',
      address_2: 'Sala 3',
      city: 'Santo André',
      state: 'SP',
      postcode: '09010-160',
      country: 'BR',
      phone: '(11) 4858-5358',
      email: 'maria@example.com',
    });
    // Sem entrega na loja: o pedido fica sem endereço de entrega, como na finalização original.
    expect(Object.values(body.shipping_address as Record<string, string>).every((v) => v === '')).toBe(true);
    expect(body.customer_note).toBe('Entregar em horário comercial.');
    expect(body.payment_method).toBe(GW);
    const data = Object.fromEntries((body.payment_data as { key: string; value: string }[]).map((d) => [d.key, d.value]));
    expect(data).toMatchObject({
      payment_method: GW,
      'card-number': '4242 4242 4242 4242',
      'card-expiry': '12 / 30',
      'card-cvc': '123',
      billing_first_name: 'Maria',
      billing_email: 'maria@example.com',
      billing_country: 'BR',
      billing_state: 'SP',
      order_comments: 'Entregar em horário comercial.',
    });
    expect(store.orders).toHaveLength(1);
  });

  test('pagamento recusado: aviso, formulário liberado e dados mantidos', async ({ page }) => {
    const store = await open(page, { payment: 'failure' });
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    const alert = page.locator('[data-co-alert]');
    await expect(alert).toContainText('O pagamento não foi aprovado. Confira os dados do cartão ou use outro cartão.');
    await expect(submit(page)).toBeEnabled();
    await expect(page.locator('#billing_first_name')).toHaveValue('Maria');
    await expect(card(page, 'number')).toHaveValue('4242 4242 4242 4242');
    await expect(page).toHaveURL(/\/finalizar-compra\/$/);
    expect(store.orders[0].status).toBe('pending');
  });

  test('erro da forma de pagamento (402): a mensagem da loja', async ({ page }) => {
    await open(page);
    await fillBilling(page);
    await fillCard(page, '4000 0000 0000 0002');
    await submit(page).click();
    await expect(page.locator('[data-co-alert-title]')).toHaveText('Não foi possível processar o pagamento: Your card was declined.');
    await expect(submit(page)).toBeEnabled();
  });

  test('resposta da forma de pagamento da loja no formato clássico (como em produção): aviso e carrinho relido', async ({ page }) => {
    const store = await open(page);
    // A resposta exata da loja ao pedido de teste de 12/11/2026 (HTTP 200, sem payment_result).
    const body = readFileSync('tests/fixtures/finalizacao-resposta-pagamento.json', 'utf8');
    await page.route('**/wp-json/wc/store/v1/checkout', (r) => r.fulfill({ status: 200, contentType: 'application/json; charset=UTF-8', headers: { Nonce: 'n9' }, body }));
    await fillBilling(page);
    await fillCard(page);
    const gets = store.requests.filter((r) => r.path === '/cart').length;
    await submit(page).click();
    await expect(page.locator('[data-co-alert-title]')).toHaveText('Erro ao processar o pedido. Por favor, tente novamente.');
    await expect(page.locator('[data-co-alert-list]')).toBeHidden();
    await expect(page).toHaveURL(/\/finalizar-compra\/$/);
    await expect(submit(page)).toBeEnabled();
    await expect.poll(() => store.requests.filter((r) => r.path === '/cart').length).toBe(gets + 1);
    // Outra mensagem da loja no mesmo formato aparece como veio (só o texto, sem HTML).
    await page.route('**/wp-json/wc/store/v1/checkout', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { Nonce: 'n9' },
        body: JSON.stringify({ result: 'failure', messages: '<ul class="woocommerce-error" role="alert"><li>Cartão recusado pelo emissor.<img src=x onerror="window.__xss=1"></li></ul>', refresh: false, reload: false }),
      }),
    );
    await submit(page).click();
    await expect(page.locator('[data-co-alert-list] li')).toHaveText(['Cartão recusado pelo emissor.']);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    // Sucesso no mesmo formato: segue o endereço indicado.
    await page.route('**/wp-json/wc/store/v1/checkout', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', headers: { Nonce: 'n9' }, body: JSON.stringify({ result: 'success', redirect: '/finalizar-compra/order-received/77/?key=wc_order_x' }) }),
    );
    await Promise.all([page.waitForURL('**/order-received/77/?key=wc_order_x'), submit(page).click()]);
  });

  test('erros de endereço devolvidos pela loja marcam os campos', async ({ page }) => {
    await open(page);
    await page.route('**/wp-json/wc/store/v1/checkout', (r) =>
      r.fulfill({
        status: 400,
        contentType: 'application/json',
        headers: { Nonce: 'n9' },
        body: JSON.stringify({ code: 'woocommerce_rest_invalid_address', message: 'There was a problem with the provided billing address: City is required', data: { status: 400, errors: { billing: ['City is required'] } } }),
      }),
    );
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-alert] li')).toHaveText(['Cidade é um campo obrigatório.']);
    await expect(page.locator('#billing_city')).toHaveAttribute('aria-invalid', 'true');

    await page.route('**/wp-json/wc/store/v1/checkout', (r) =>
      r.fulfill({
        status: 400,
        contentType: 'application/json',
        headers: { Nonce: 'n9' },
        body: JSON.stringify({
          code: 'rest_invalid_param',
          message: 'Invalid parameter(s): billing_address',
          data: { status: 400, params: { billing_address: 'The provided postcode / ZIP is not valid' }, details: { billing_address: { code: 'invalid_postcode', message: 'The provided postcode / ZIP is not valid', data: null } } },
        }),
      }),
    );
    await submit(page).click();
    await expect(page.locator('[data-co-alert] li')).toHaveText(['Digite um CEP válido.']);
    await expect(page.locator('#billing_postcode')).toHaveAttribute('aria-invalid', 'true');
  });

  test('nonce vencido: a loja recebe um pedido só (repete uma vez com o nonce novo)', async ({ page }) => {
    // Dados de cobrança já na sessão (preenchidos sem digitar): o primeiro POST é o do pedido.
    const billing = { first_name: 'Maria', last_name: 'Souza', company: '', address_1: 'Rua das Flores, 100', address_2: '', city: 'Santo André', state: 'SP', postcode: '09010-160', country: 'BR', phone: '(11) 4858-5358', email: 'maria@example.com' };
    const store = await open(page, { expireNonceOnce: true, billing });
    await expect(page.locator('#billing_first_name')).toHaveValue('Maria');
    await expect(page.locator('#billing_postcode')).toHaveValue('09010-160');
    await fillCard(page);
    await Promise.all([page.waitForURL('**/order-received/**'), submit(page).click()]);
    expect(store.requests.filter((r) => r.path === '/checkout')).toHaveLength(2);
    expect(store.orders).toHaveLength(1);
  });

  test('loja sem resposta no envio: aviso para conferir antes de tentar de novo', async ({ page }) => {
    await open(page, { downOnCheckout: true });
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-alert-title]')).toContainText('Não foi possível confirmar o pedido');
    await expect(submit(page)).toBeEnabled();
  });

  test('enquanto processa, o formulário fica travado (sem envio duplo)', async ({ page }) => {
    const store = await open(page);
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route('**/wp-json/wc/store/v1/checkout', async (r) => {
      await held;
      await r.fallback();
    });
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-submit-label]')).toHaveText('Processando…');
    await expect(page.locator('[data-co-submit]')).toBeDisabled();
    await expect(page.locator('[data-co-form]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#billing_first_name')).toBeDisabled();
    await page.locator('[data-co-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
    release();
    await page.waitForURL('**/order-received/**');
    expect(store.orders).toHaveLength(1);
  });

  test('dados do cartão e pessoais fora das ferramentas de análise e do armazenamento do navegador', async ({ page }) => {
    await open(page, { payment: 'failure' });
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-alert]')).toBeVisible();
    const leaked = await page.evaluate(() => JSON.stringify([(window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [], { ...localStorage }, { ...sessionStorage }]));
    for (const secret of ['4242', '12 / 30', 'maria@example.com', 'Souza', '4858']) expect(leaked).not.toContain(secret);
    expect(leaked).toContain('checkout_submit');
  });

  test('conexão sem HTTPS: o cartão não é enviado', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, 'isSecureContext', { value: false }));
    const store = await open(page);
    const note = page.locator('[data-co-insecure]');
    await expect(note).toBeVisible();
    await expect(note.getByRole('link', { name: 'Abrir em conexão segura' })).toHaveAttribute('href', /^https:\/\/localhost:\d+\/finalizar-compra\/$/);
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-alert-title]')).toContainText('não está em conexão segura');
    expect(store.requests.filter((r) => r.path === '/checkout')).toEqual([]);
  });
});

test.describe('finalização: cupom, entrega e pedido sem pagamento', () => {
  test('cupom: aplicar, código inválido e remover (os valores são os da loja)', async ({ page, isMobile }) => {
    const store = await open(page);
    if (isMobile) await page.locator('[data-co-summary-toggle]').click();
    await page.getByRole('button', { name: 'Você tem um cupom de desconto?' }).click();
    const input = page.getByRole('textbox', { name: 'Código do cupom' });
    await expect(input).toBeFocused();
    await page.getByRole('button', { name: 'Aplicar cupom' }).click();
    await expect(page.locator('[data-co-coupon-msg]')).toHaveText('Por favor, insira um código de cupom.');
    await input.fill('naoexiste');
    await input.press('Enter');
    await expect(page.locator('[data-co-coupon-msg]')).toHaveText('Não foi possível aplicar o cupom: Coupon "naoexiste" does not exist!');
    await input.fill('desconto10');
    await input.press('Enter');
    await expect(page.locator('[data-co-coupon-msg]')).toHaveText('Cupom aplicado com sucesso.');
    await expect(page.locator('.co-totals .is-discount dt')).toContainText('Cupom: DESCONTO10');
    await expect(page.locator('.co-totals .is-discount dd')).toHaveText(nb('−R$ 465,00'));
    await expect(page.locator('.co-totals .is-total dd')).toHaveText(nb('R$ 4.185,00'));
    await expect(page.locator('[data-co-place-total]')).toHaveText(nb('R$ 4.185,00'));
    // O Enter no cupom não envia o pedido.
    expect(store.requests.filter((r) => r.path === '/checkout')).toEqual([]);
    await page.getByRole('button', { name: 'Remover DESCONTO10' }).click();
    await expect(page.locator('.co-totals .is-discount')).toHaveCount(0);
    await expect(page.locator('.co-totals .is-total dd')).toHaveText(nb('R$ 4.650,00'));
    await expect(page.locator('.cart-notice')).toHaveText('Cupom removido com sucesso.');
  });

  test('pedido sem valor a pagar: sem cartão, e o pedido vai sem forma de pagamento', async ({ page, isMobile }) => {
    const store = await open(page);
    if (isMobile) await page.locator('[data-co-summary-toggle]').click();
    await page.getByRole('button', { name: 'Você tem um cupom de desconto?' }).click();
    await page.getByRole('textbox', { name: 'Código do cupom' }).fill('gratis100');
    await page.getByRole('button', { name: 'Aplicar cupom' }).click();
    await expect(page.locator('[data-co-no-payment]')).toBeVisible();
    await expect(page.locator('.co-method')).toBeHidden();
    await fillBilling(page);
    await Promise.all([page.waitForURL('**/order-received/**'), submit(page).click()]);
    const body = store.requests.find((r) => r.path === '/checkout')!.body!;
    expect(body.payment_method).toBe('');
    expect(body.payment_data).toEqual([]);
  });

  test('com entrega (se a loja passar a cobrar frete): formas de entrega e outro endereço', async ({ page }) => {
    const store = await open(page, { shipping: true });
    const section = page.locator('[data-co-shipping]');
    await expect(section).toBeVisible();
    await expect(section.locator('.co-num')).toHaveText('2');
    await expect(section.locator('.co-rate')).toHaveCount(2);
    await expect(section.locator('.co-rate').nth(0)).toContainText(nb('R$ 50,00'));
    await expect(page.locator('.co-totals .is-total dd')).toHaveText(nb('R$ 4.700,00'));
    await section.getByText('Retirar na loja').click();
    await expect.poll(() => store.requests.find((r) => r.path === '/cart/select-shipping-rate')?.body).toEqual({ package_id: '0', rate_id: 'local_pickup:2' });
    await expect(page.locator('.co-totals .is-total dd')).toHaveText(nb('R$ 4.650,00'));
    // Outro endereço de entrega: campos próprios, obrigatórios.
    await section.getByText('Enviar para um endereço diferente?').click();
    await expect(page.locator('#shipping_first_name')).toBeFocused();
    await fillBilling(page);
    await fillCard(page);
    await submit(page).click();
    await expect(page.locator('[data-co-alert] li')).toContainText(['Nome é um campo obrigatório.']);
    for (const [k, v] of Object.entries({ first_name: 'João', last_name: 'Lima', address_1: 'Av. Paulista, 1000', city: 'São Paulo', postcode: '01310-100' })) await page.locator(`#shipping_${k}`).fill(v);
    await Promise.all([page.waitForURL('**/order-received/**'), submit(page).click()]);
    const body = store.requests.find((r) => r.path === '/checkout')!.body!;
    expect(body.shipping_address).toMatchObject({ first_name: 'João', address_1: 'Av. Paulista, 1000', postcode: '01310-100', state: 'SP', country: 'BR', phone: '' });
  });
});

test('layout sem rolagem lateral e acessibilidade (axe), com e sem erros', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const settle = () => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle();
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  const axe = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
  await submit(page).click();
  await expect(page.locator('[data-co-alert]')).toBeVisible();
  await settle();
  const axe2 = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(axe2.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
  expect(errors).toEqual([]);
});

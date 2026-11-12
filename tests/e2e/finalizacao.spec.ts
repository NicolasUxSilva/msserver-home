import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { line, mockStore } from './store-mock';

// Finalização de orçamento (/finalizar-compra/): resumo do carrinho do WooCommerce (Store API simulada
// em ./store-mock.ts, no formato do WooCommerce 8.2; nada chega à loja real), dados de contato e envio
// da solicitação ao WhatsApp do comercial. Sem pagamento e sem pedido.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
  // window.open registrado (o WhatsApp não é aberto de verdade nos testes).
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] };
    w.__opened = [];
    window.open = ((url: string) => {
      w.__opened.push(String(url));
      return {} as Window;
    }) as typeof window.open;
  });
});

const R210_16 = 5421; // Servidor Dell PowerEdge R210, Memoria RAM 16GB, R$ 3.950,00 (categoria Dell)
const BATERIA = 7820; // Bateria Dell nu209 …, R$ 350,00 (categoria Baterias: sem marca cadastrada)
const R610_64 = 5279; // Servidor Dell Poweredge R610, Memoria RAM 64GB, R$ 5.250,00
const WHATSAPP = '5511985991837';
const nb = (s: string) => s.replace(/ /g, ' ');
const send = (page: Page) => page.locator('[data-fo-cta]');
const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
const messageOf = (url: string) => new URL(url).searchParams.get('text')!;

async function open(page: Page, opts: Parameters<typeof mockStore>[1] = {}) {
  const store = await mockStore(page, { lines: [line(R210_16, 2), line(BATERIA, 1)], ...opts });
  await page.goto('/finalizar-compra/');
  await expect(page.locator('[data-fo]')).toHaveAttribute('data-state', 'ready');
  return store;
}

const CONTACT = { name: 'Maria Souza', company: 'Empresa Teste Ltda', email: 'maria@empresa.com.br', phone: '11912345678', notes: 'Preciso para o próximo mês.' };
async function fillContact(page: Page, values: Partial<typeof CONTACT> = {}) {
  for (const [k, v] of Object.entries({ ...CONTACT, ...values })) await page.locator(`#orcamento_${k}`).fill(v);
}

test.describe('finalização de orçamento: página e resumo', () => {
  test('página de orçamento, sem pagamento: SEO, trilha, etapas e só os dados de contato', async ({ page }) => {
    const store = await open(page);
    await expect(page).toHaveTitle('Finalização de orçamento - MSSERVER');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/finalizar-compra/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'max-image-preview:large');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    const crumbs = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'BreadcrumbList').itemListElement;
    expect(crumbs.at(-1).name).toBe('Finalização de orçamento');
    await expect(page.locator('h1')).toHaveText('Finalização de orçamento');
    await expect(page.locator('.cat-crumbs a')).toHaveText(['Início', 'Carrinho']);
    await expect(page.locator('.fo-steps [aria-current="step"]')).toContainText('Revisão e contato');
    await expect(page.locator('header [aria-current="page"]')).toHaveCount(0);

    // Nada de pagamento: sem campos de cartão, forma de pagamento, botão de pagar ou de concluir pedido.
    await expect(page.locator('input[autocomplete^="cc-"], input[name="payment_method"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/pagamento|pagar|cartão|finalizar pedido|parcel/i);
    const names = await page.locator('[data-fo-form] input, [data-fo-form] textarea').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
    expect(names).toEqual(['name', 'company', 'email', 'phone', 'notes']);
    await expect(page.getByRole('button', { name: 'Solicitar orçamento pelo WhatsApp' })).toBeVisible();
    // A página só lê o carrinho: nenhuma alteração na loja.
    expect(store.requests.map((r) => `${r.method} ${r.path}`)).toEqual(['GET /cart']);
  });

  test('resumo com os dados reais do carrinho: foto, nome, marca, configuração, preço, quantidade, subtotal e total', async ({ page }) => {
    await open(page, { lines: [line(R210_16, 2), line(BATERIA, 1), line(R610_64, 1)] });
    await expect(page.locator('[data-fo-count]')).toHaveText('4 itens');
    const items = page.locator('.fo-item');
    await expect(items).toHaveCount(3);
    const [r210, bateria, r610] = [items.nth(0), items.nth(1), items.nth(2)];
    await expect(r210.locator('.fo-item-name a')).toHaveText('Servidor Dell PowerEdge R210');
    await expect(r210.locator('.fo-item-name a')).toHaveAttribute('href', '/servidor/servidor-dell-r210/');
    await expect(r210.locator('.fo-thumb img')).toHaveAttribute('src', /\/_astro\/.+\.webp$/);
    await expect(r210.locator('.fo-tag')).toHaveText('Marca: Dell');
    await expect(r210.locator('.fo-item-options')).toHaveText('Memoria RAM: 16GB');
    await expect(r210.locator('[data-unit]')).toHaveText(nb('R$ 3.950,00'));
    await expect(r210.locator('[data-qty]')).toHaveText('2');
    await expect(r210.locator('[data-line]')).toHaveText(nb('R$ 7.900,00'));
    // Sem marca nem configuração cadastradas: as linhas não aparecem (nada inventado).
    await expect(bateria.locator('.fo-item-name a')).toHaveText('Bateria Dell nu209 fr463 u8735 perc-5-6-h700-h800');
    await expect(bateria.locator('.fo-tag')).toHaveCount(0);
    await expect(bateria.locator('.fo-item-options')).toHaveCount(0);
    await expect(bateria.locator('[data-line]')).toHaveText(nb('R$ 350,00'));
    await expect(r610.locator('.fo-item-options')).toHaveText('Memoria RAM: 64GB');
    await expect(r610.locator('[data-line]')).toHaveText(nb('R$ 5.250,00'));
    await expect(page.locator('.fo-totals .cart-total dt')).toHaveText(['Subtotal', 'Total estimado']);
    await expect(page.locator('.fo-totals .is-total dd')).toHaveText(nb('R$ 13.500,00'));
    await expect(page.locator('[data-fo-total]')).toHaveText(nb('R$ 13.500,00'));
    await expect(page.getByRole('link', { name: 'Editar no carrinho' })).toHaveAttribute('href', '/carrinho/');
    await expect(page.getByRole('link', { name: 'Continuar escolhendo produtos' })).toHaveAttribute('href', '/servidores/');
  });

  test('carrinho vazio e loja indisponível', async ({ page }) => {
    await mockStore(page, {});
    await page.goto('/finalizar-compra/');
    await expect(page.locator('[data-fo]')).toHaveAttribute('data-state', 'empty');
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver o catálogo' })).toHaveAttribute('href', '/servidores/');
    await expect(send(page)).toBeHidden();
    await expect(page.locator('[data-fo-bar]')).toBeHidden();

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
    await mockStore(page, { down: true });
    await page.goto('/finalizar-compra/');
    await expect(page.locator('[data-fo]')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});

test.describe('finalização de orçamento: contato e WhatsApp', () => {
  test('campos obrigatórios e formatos conferidos antes de abrir o WhatsApp', async ({ page }) => {
    await open(page);
    await send(page).click();
    const alert = page.locator('[data-fo-alert]');
    await expect(alert).toBeFocused();
    await expect(alert.locator('li')).toHaveText(['Informe o seu nome completo.', 'Informe a empresa.', 'Informe o e-mail.', 'Informe o WhatsApp.']);
    await expect(page.locator('#orcamento_name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#orcamento_notes')).not.toHaveAttribute('aria-invalid', 'true');
    expect(await opened(page)).toEqual([]);
    // Cada erro leva ao campo.
    await alert.getByRole('link', { name: 'Informe a empresa.' }).click();
    await expect(page.locator('#orcamento_company')).toBeFocused();
    // Formatos.
    await fillContact(page, { name: 'Maria', email: 'maria@empresa', phone: '1191234' });
    await send(page).click();
    await expect(alert.locator('li')).toHaveText(['Informe o nome e o sobrenome.', 'Informe um e-mail válido (ex.: nome@empresa.com.br).', 'Informe o WhatsApp com DDD (ex.: (11) 91234-5678).']);
    expect(await opened(page)).toEqual([]);
    // Máscara do WhatsApp e correções: a lista acompanha e fecha.
    await page.locator('#orcamento_phone').fill('');
    await page.locator('#orcamento_phone').pressSequentially('11912345678');
    await expect(page.locator('#orcamento_phone')).toHaveValue('(11) 91234-5678');
    await expect(alert.locator('li')).toHaveCount(2);
    await page.locator('#orcamento_name').fill('Maria Souza');
    await page.locator('#orcamento_email').fill('maria@empresa.com.br');
    await expect(alert).toBeHidden();
    await send(page).click();
    expect(await opened(page)).toHaveLength(1);
  });

  test('abre o WhatsApp do comercial com a solicitação completa e organizada', async ({ page }) => {
    await open(page);
    await fillContact(page);
    await send(page).click();
    const [url] = await opened(page);
    expect(url.startsWith(`https://wa.me/${WHATSAPP}?text=`)).toBe(true);
    expect(messageOf(url)).toBe(
      [
        'Olá! Gostaria de solicitar um orçamento para os seguintes produtos:',
        '',
        '*DADOS DO SOLICITANTE*',
        'Nome: Maria Souza',
        'Empresa: Empresa Teste Ltda',
        'E-mail: maria@empresa.com.br',
        'WhatsApp: (11) 91234-5678',
        '',
        '*PRODUTOS SOLICITADOS*',
        '*Produto 1:*',
        '- Nome: Servidor Dell PowerEdge R210',
        '- Marca: Dell',
        '- Configuração: Memoria RAM: 16GB',
        '- Quantidade: 2',
        '- Valor unitário: R$ 3.950,00',
        '- Subtotal: R$ 7.900,00',
        '- Link: https://msserver.com.br/servidor/servidor-dell-r210/?attribute_pa_memoria-ram=16gb',
        '',
        '*Produto 2:*',
        '- Nome: Bateria Dell nu209 fr463 u8735 perc-5-6-h700-h800',
        '- Quantidade: 1',
        '- Valor unitário: R$ 350,00',
        '- Subtotal: R$ 350,00',
        '- Link: https://msserver.com.br/servidor/bateria-dell-nu209-fr463-u8735-perc-5-6-h700-h800/',
        '',
        '*RESUMO*',
        'Quantidade total de itens: 3',
        'Valor total estimado: R$ 8.250,00',
        '',
        '*OBSERVAÇÕES*',
        'Preciso para o próximo mês.',
        '',
        'Gostaria de receber mais informações e condições comerciais sobre esses produtos.',
      ].join('\n'),
    );
    // Confirmação na página, com a etapa de envio marcada e o link para abrir de novo.
    const sent = page.locator('[data-fo-sent]');
    await expect(sent).toBeVisible();
    await expect(sent).toContainText('Sua solicitação está pronta no WhatsApp');
    await expect(sent.getByRole('link', { name: 'Abrir o WhatsApp de novo' })).toHaveAttribute('href', url);
    await expect(page.locator('.fo-steps [aria-current="step"]')).toContainText('Envio pelo WhatsApp');
  });

  test('sem observações, a mensagem diz "Nenhuma."', async ({ page }) => {
    await open(page);
    await fillContact(page, { notes: '' });
    await send(page).click();
    expect(messageOf((await opened(page))[0])).toContain('*OBSERVAÇÕES*\nNenhuma.\n');
  });

  test('quantidades alteradas no carrinho: resumo e mensagem acompanham, e os dados digitados continuam', async ({ page }) => {
    const store = await open(page);
    await fillContact(page);
    // Volta ao carrinho, muda a quantidade da bateria para 3 e remove o servidor.
    await page.getByRole('link', { name: 'Editar no carrinho' }).click();
    await expect(page.locator('[data-cart]')).toHaveAttribute('data-state', 'ready');
    const bateria = page.locator('.cart-item').nth(1);
    await bateria.getByRole('button', { name: /Aumentar a quantidade/ }).click();
    await bateria.getByRole('button', { name: /Aumentar a quantidade/ }).click();
    await expect.poll(() => store.requests.find((r) => r.path === '/cart/update-item')?.body).toEqual({ key: line(BATERIA).key, quantity: 3 });
    await page.locator('.cart-item').nth(0).locator('.cart-remove').click();
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.getByRole('link', { name: 'Avançar para o orçamento' }).click();
    await expect(page).toHaveURL(/\/finalizar-compra\/$/);
    await expect(page.locator('[data-fo]')).toHaveAttribute('data-state', 'ready');
    // A seleção é a do carrinho; o contato digitado volta.
    await expect(page.locator('.fo-item')).toHaveCount(1);
    await expect(page.locator('.fo-item [data-qty]')).toHaveText('3');
    await expect(page.locator('.fo-item [data-line]')).toHaveText(nb('R$ 1.050,00'));
    await expect(page.locator('[data-fo-count]')).toHaveText('3 itens');
    for (const k of ['name', 'company', 'email', 'notes'] as const) await expect(page.locator(`#orcamento_${k}`)).toHaveValue(CONTACT[k]);
    await expect(page.locator('#orcamento_phone')).toHaveValue('(11) 91234-5678');
    await send(page).click();
    const text = messageOf((await opened(page))[0]);
    expect(text).toContain('- Quantidade: 3\n- Valor unitário: R$ 350,00\n- Subtotal: R$ 1.050,00');
    expect(text).toContain('Quantidade total de itens: 3\nValor total estimado: R$ 1.050,00');
    expect(text).not.toContain('PowerEdge R210');
  });

  test('jornada completa: produto → carrinho → finalização de orçamento → WhatsApp', async ({ page }) => {
    await mockStore(page, {});
    await page.goto('/servidor/servidor-dell-r210/');
    await page.locator('.pd-opt', { hasText: '16GB' }).click();
    await expect(page.locator('[data-pd-variation]')).toHaveValue(String(R210_16));
    await page.locator('#pd-qty').fill('2');
    await Promise.all([page.waitForURL(/\/carrinho\/$/), page.locator('.pd-cta').click()]);
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.getByRole('link', { name: 'Avançar para o orçamento' }).click();
    await expect(page.locator('[data-fo]')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('.fo-item [data-qty]')).toHaveText('2');
    await fillContact(page);
    await send(page).click();
    const text = messageOf((await opened(page))[0]);
    expect(text).toContain('*Produto 1:*\n- Nome: Servidor Dell PowerEdge R210\n- Marca: Dell\n- Configuração: Memoria RAM: 16GB\n- Quantidade: 2\n- Valor unitário: R$ 3.950,00\n- Subtotal: R$ 7.900,00');
    expect(text).toContain('Valor total estimado: R$ 7.900,00');
  });

  test('dados que a sessão do WooCommerce já tem preenchem o contato', async ({ page }) => {
    // Como a Store API devolve: textos com entidades HTML do WordPress.
    await open(page, { billing: { first_name: 'João', last_name: 'Lima', company: 'Lima &#8211; TI &amp; Redes', email: 'joao@limati.com.br', phone: '1148585358', country: 'BR' } });
    await expect(page.locator('#orcamento_name')).toHaveValue('João Lima');
    await expect(page.locator('#orcamento_company')).toHaveValue('Lima – TI & Redes');
    await expect(page.locator('#orcamento_email')).toHaveValue('joao@limati.com.br');
    await expect(page.locator('#orcamento_phone')).toHaveValue('(11) 4858-5358');
  });

  test('navegador bloqueia a nova janela: o WhatsApp abre na mesma aba', async ({ page }) => {
    await page.addInitScript(() => {
      window.open = (() => null) as typeof window.open;
    });
    await page.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>WhatsApp</title>' }));
    await open(page);
    await fillContact(page);
    await Promise.all([page.waitForURL(new RegExp(`^https://wa\\.me/${WHATSAPP}\\?text=`)), send(page).click()]);
    expect(messageOf(page.url())).toContain('Nome: Maria Souza');
  });

  test('eventos de análise sem dados pessoais', async ({ page }) => {
    await open(page);
    await fillContact(page);
    await send(page).click();
    const layer = await page.evaluate(() => JSON.stringify((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []));
    expect(layer).toContain('"event":"quote_whatsapp_submit","items":3,"value":8250');
    for (const secret of ['Maria', 'maria@empresa', '91234', 'Empresa Teste', 'próximo mês']) expect(layer).not.toContain(secret);
  });

  test('barra de envio no celular e tablet; no desktop, só o botão do formulário', async ({ page, isMobile }) => {
    await open(page);
    const bar = page.locator('[data-fo-bar]');
    if (!isMobile) {
      await expect(bar).toBeHidden();
      return;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(nb('R$ 8.250,00'));
    // Pela barra, a mesma conferência: leva aos erros do formulário.
    await bar.getByRole('button', { name: 'Solicitar pelo WhatsApp' }).click();
    await expect(page.locator('[data-fo-alert]')).toBeFocused();
    await fillContact(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await bar.getByRole('button', { name: 'Solicitar pelo WhatsApp' }).click();
    expect(await opened(page)).toHaveLength(1);
    // Com o botão do formulário à vista, a barra sai.
    await send(page).scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
  });
});

test('layout sem rolagem lateral e acessibilidade (axe): resumo, erros e envio', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, { lines: [line(R210_16, 2), line(BATERIA, 1), line(R610_64, 1)] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const settle = () => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  const check = async () => {
    await settle();
    const axe = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
  };
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await check();
  await send(page).click();
  await expect(page.locator('[data-fo-alert]')).toBeVisible();
  await check();
  await fillContact(page);
  await send(page).click();
  await expect(page.locator('[data-fo-sent]')).toBeVisible();
  await check();
  expect(errors).toEqual([]);
});

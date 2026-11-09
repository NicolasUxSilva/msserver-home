import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { line, mockStore } from './store-mock';

// Carrinho (/carrinho/): lido e alterado pela Store API do WooCommerce, simulada em ./store-mock.ts
// no formato do WooCommerce 8.2 (nada chega à loja real). Textos do carrinho do WooCommerce em
// português, como no carrinho publicado; "Avançar para o pagamento" leva à finalização do WordPress.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const CHECKOUT = 'https://msserver.com.br/finalizar-compra/';
const R210_16 = 5421; // Servidor Dell PowerEdge R210, Memoria RAM 16GB, R$ 3.950,00
const BATERIA = 7820; // Bateria Dell nu209 …, R$ 350,00
const R610_64 = 5279; // Servidor Dell Poweredge R610, Memoria RAM 64GB, R$ 5.250,00 (atributo do produto)
const nb = (s: string) => s.replace(/ /g, ' ');

test.describe('carrinho: itens e totais da loja', () => {
  test('itens, preços, quantidades e totais como o WooCommerce devolve; SEO do carrinho', async ({ page }) => {
    await mockStore(page, { lines: [line(R210_16, 2), line(BATERIA, 1), line(R610_64, 1)] });
    await page.goto('/carrinho/');
    await expect(page).toHaveTitle('Carrinho - MSSERVER');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, max-image-preview:large');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/carrinho/');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld['@graph'].map((n: { '@type': string }) => n['@type']).sort()).toEqual(['BreadcrumbList', 'Organization', 'WebPage', 'WebSite']);
    await expect(page.locator('h1')).toHaveText('Carrinho');
    await expect(page.locator('[data-cart-count]')).toHaveText('4 itens');
    // Nenhum item do menu marcado (o carrinho não está no menu).
    await expect(page.locator('header [aria-current="page"]')).toHaveCount(0);

    const items = page.locator('.cart-item');
    await expect(items).toHaveCount(3);
    const first = items.nth(0);
    await expect(first.locator('.cart-name a')).toHaveText('Servidor Dell PowerEdge R210');
    // O item leva à página do produto deste site, com a foto do catálogo.
    await expect(first.locator('.cart-name a')).toHaveAttribute('href', '/servidor/servidor-dell-r210/');
    await expect(first.locator('.cart-thumb img')).toHaveAttribute('src', /\/_astro\/.+\.webp$/);
    await expect(first.locator('.cart-variation')).toHaveText('Memoria RAM: 16GB');
    await expect(first.locator('.cart-price [data-v]')).toHaveText(nb('R$ 3.950,00'));
    await expect(first.locator('.cart-qty input')).toHaveValue('2');
    await expect(first.locator('.cart-line [data-v]')).toHaveText(nb('R$ 7.900,00'));
    await expect(items.nth(1).locator('.cart-variation')).toHaveCount(0);
    await expect(items.nth(2).locator('.cart-variation')).toHaveText('Memoria RAM: 64GB');

    const totals = page.locator('[data-cart-totals]');
    await expect(totals.locator('.cart-total')).toHaveCount(2);
    await expect(totals.locator('.cart-total').nth(0)).toHaveText(nb('SubtotalR$ 13.500,00'));
    await expect(totals.locator('.is-total')).toHaveText(nb('TotalR$ 13.500,00'));
    await expect(page.getByRole('heading', { name: 'Total no carrinho' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Avançar para o pagamento' })).toHaveAttribute('href', CHECKOUT);
  });

  test('quantidade: muda pela Store API (com o nonce) e os totais acompanham', async ({ page }) => {
    const store = await mockStore(page, { lines: [line(R210_16, 1), line(BATERIA, 1)] });
    await page.goto('/carrinho/');
    const row = page.locator('.cart-item').first();
    // Várias batidas seguidas viram uma alteração só.
    await row.locator('[data-step="1"]').click();
    await row.locator('[data-step="1"]').click();
    await expect(row.locator('.cart-line [data-v]')).toHaveText(nb('R$ 11.850,00'));
    await expect(page.locator('.is-total dd')).toHaveText(nb('R$ 12.200,00'));
    const updates = store.requests.filter((r) => r.path === '/cart/update-item');
    expect(updates).toHaveLength(1);
    expect(updates[0].body).toEqual({ key: store.lines[0].key, quantity: 3 });
    expect(updates[0].nonce).toBeTruthy();
    await expect(page.locator('[data-cart-count]')).toHaveText('4 itens');
    // O botão de menos fica desligado na quantidade mínima.
    await expect(page.locator('.cart-item').nth(1).locator('[data-step="-1"]')).toBeDisabled();
    // Digitar a quantidade também atualiza.
    await page.locator('.cart-item').nth(1).locator('.cart-qty input').fill('4');
    await page.locator('.cart-item').nth(1).locator('.cart-qty input').press('Tab');
    await expect(page.locator('.is-total dd')).toHaveText(nb('R$ 13.250,00'));
  });

  test('remover e "Desfazer?" (o item volta com a mesma quantidade)', async ({ page }) => {
    const store = await mockStore(page, { lines: [line(R210_16, 2), line(BATERIA, 1)] });
    await page.goto('/carrinho/');
    await page.getByRole('button', { name: 'Remover Bateria Dell nu209 fr463 u8735 perc-5-6-h700-h800 do carrinho' }).click();
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-notice p')).toHaveText('“Bateria Dell nu209 fr463 u8735 perc-5-6-h700-h800” removido.');
    await expect(page.locator('.is-total dd')).toHaveText(nb('R$ 7.900,00'));
    expect(store.requests.find((r) => r.path === '/cart/remove-item')!.body).toEqual({ key: line(BATERIA).key });
    await page.getByRole('button', { name: 'Desfazer?' }).click();
    await expect(page.locator('.cart-item')).toHaveCount(2);
    expect(store.requests.filter((r) => r.path === '/cart/add-item').at(-1)!.body).toEqual({ id: BATERIA, quantity: 1 });
    // Removendo tudo: o carrinho vazio.
    for (let i = 0; i < 2; i++) await page.locator('.cart-remove').first().click();
    await expect(page.locator('[data-cart-empty]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible();
  });

  test('vazio: mensagem do WooCommerce e o caminho de volta para a loja', async ({ page }) => {
    await mockStore(page);
    await page.goto('/carrinho/');
    await expect(page.locator('[data-cart-empty]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Retornar para a loja' })).toHaveAttribute('href', '/servidores/');
    await expect(page.locator('[data-cart-ready]')).toBeHidden();
    await expect(page.locator('[data-cart-count]')).toBeHidden();
  });

  test('loja indisponível neste endereço: aviso, "Tentar de novo" e o WhatsApp', async ({ page }) => {
    const store = await mockStore(page, { down: true });
    await page.goto('/carrinho/');
    await expect(page.locator('[data-cart-unavailable]')).toBeVisible();
    await expect(page.locator('[data-cart-unavailable] a')).toHaveAttribute('href', /^https:\/\/wa\.me\//);
    const before = store.requests.length;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect.poll(() => store.requests.length).toBeGreaterThan(before);
    await expect(page.locator('[data-cart-unavailable]')).toBeVisible();
  });

  test('nonce vencido: a alteração é repetida com o nonce novo, sem a pessoa perceber', async ({ page }) => {
    const store = await mockStore(page, { lines: [line(BATERIA, 1)], expireNonceOnce: true });
    await page.goto('/carrinho/');
    await page.locator('[data-step="1"]').click();
    await expect(page.locator('.is-total dd')).toHaveText(nb('R$ 700,00'));
    const updates = store.requests.filter((r) => r.path === '/cart/update-item');
    expect(updates.length).toBe(2);
    expect(updates[0].nonce).not.toBe(updates[1].nonce);
    await expect(page.locator('.cart-notice--error')).toHaveCount(0);
  });
});

test.describe('carrinho: adicionar, WhatsApp e finalização', () => {
  test('link do catálogo (/carrinho/?add-to-cart=ID): adiciona, limpa o endereço e avisa', async ({ page }) => {
    const store = await mockStore(page);
    await page.goto('/categoria-produto/placas-de-rede/');
    await page.locator('.pc[data-product="7828"] .pc-btn').click();
    await expect(page).toHaveURL(/\/carrinho\/$/);
    await expect.poll(() => store.requests.find((r) => r.path === '/cart/add-item')?.body).toEqual({ id: 7828, quantity: 1 });
    await expect(page.locator('.cart-notice')).toHaveText('“Placa rede servidor 10gb pcie x8 dual port sfp+ -bcm57810s” foi adicionado ao seu carrinho.');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    // Recarregar não adiciona de novo.
    await page.reload();
    await expect(page.locator('.cart-item .cart-qty input')).toHaveValue('1');
  });

  test('link do catálogo sem a loja neste endereço: segue para a finalização do WordPress, que adiciona', async ({ page }) => {
    await mockStore(page, { down: true });
    await page.route(`${CHECKOUT}**`, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Finalização</title>' }));
    await page.goto('/carrinho/?add-to-cart=7828');
    await expect(page).toHaveURL(`${CHECKOUT}?add-to-cart=7828&quantity=1`);
  });

  test('"Orçamento pelo WhatsApp": a mensagem do plugin do WordPress, com os itens e o total', async ({ page }) => {
    await mockStore(page, { lines: [line(R210_16, 2), line(BATERIA, 1)] });
    await page.goto('/carrinho/');
    const href = (await page.getByRole('link', { name: 'Orçamento pelo WhatsApp' }).getAttribute('href'))!;
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe('https://wa.me/5511985991837');
    expect(url.searchParams.get('text')).toBe(
      ['Ola! Mensagem vinda do site.', '', '-> 2 x Servidor Dell PowerEdge R210 - 16GB = R$ 3.950,00', '', '-> 1 x Bateria Dell nu209 fr463 u8735 perc-5-6-h700-h800 = R$ 350,00', '', 'Total do carrinho: R$ 8.250,00'].join('\n'),
    );
    await expect(page.getByRole('link', { name: 'Orçamento pelo WhatsApp' })).toHaveAttribute('target', '_blank');
  });

  test('do produto ao carrinho: escolher, adicionar e ver o item no carrinho', async ({ page }) => {
    await mockStore(page, { lines: [line(BATERIA, 1)] });
    await page.goto('/servidor/servidor-dell-r210/');
    await page.locator('.pd-opt', { hasText: '16GB' }).click();
    await page.locator('[data-pd-step="1"]').click();
    await page.locator('.pd-cta').click();
    await expect(page).toHaveURL(/\/carrinho\/$/);
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(page.locator('.cart-item').nth(1).locator('.cart-name a')).toHaveText('Servidor Dell PowerEdge R210');
    await expect(page.locator('.cart-item').nth(1).locator('.cart-qty input')).toHaveValue('2');
    await expect(page.locator('.is-total dd')).toHaveText(nb('R$ 8.250,00'));
  });
});

test.describe('carrinho: telas e acessibilidade', () => {
  test('layout sem rolagem lateral, colunas no desktop e cartões no celular; axe', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await mockStore(page, { lines: [line(R210_16, 2), line(7822, 1)] });
    await page.goto('/carrinho/');
    await expect(page.locator('.cart-item')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const list = (await page.locator('.cart-list').boundingBox())!;
    const summary = (await page.locator('.cart-summary').boundingBox())!;
    if (isMobile) {
      expect(summary.y).toBeGreaterThan(list.y + list.height - 1);
      await expect(page.locator('.cart-head')).toBeHidden();
    } else {
      expect(Math.abs(summary.y - list.y)).toBeLessThan(2);
      await expect(page.locator('.cart-head')).toBeVisible();
    }
    // Botões de quantidade e remover com o tamanho de toque.
    const btn = (await page.locator('.cart-remove').first().boundingBox())!;
    expect(btn.height).toBeGreaterThanOrEqual(40);
    // O rodapé entra com animação (página curta: já está na tela); o axe mede depois dela.
    const settle = () => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle();
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
    // Vazio e indisponível também acessíveis.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
    await mockStore(page, { down: true });
    await page.goto('/carrinho/');
    await expect(page.locator('[data-cart-unavailable]')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle();
    const axe2 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe2.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
});

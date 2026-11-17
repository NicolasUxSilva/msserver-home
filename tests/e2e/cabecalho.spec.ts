import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import catalog from '../../src/data/catalog.json' with { type: 'json' };
import { line, mockStore } from './store-mock';

// Cabeçalho: a busca leva ao catálogo deste site (/servidores/?busca=) e sugere produtos e categorias
// enquanto se digita, com os dados reais do catálogo (índice /busca.json); o atalho do carrinho mostra
// a quantidade de itens da Store API do WooCommerce (simulada). Nada vai para a busca do WordPress.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const P = catalog.products as unknown as Record<string, { id: number; name: string; slug: string; description: string }>;

/** Abre a busca do cabeçalho (no celular e no tablet, o painel abaixo do topo). */
async function searchInput(page: import('@playwright/test').Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir busca de produtos' }).click();
    return page.locator('#busca-produtos-movel');
  }
  return page.locator('#busca-produtos');
}

test.describe('cabeçalho: busca no catálogo', () => {
  test('sugestões com os dados reais, teclado e o produto escolhido', async ({ page, isMobile }) => {
    const wp: string[] = [];
    page.on('request', (r) => /[?&]s=/.test(r.url()) && wp.push(r.url()));
    await page.goto('/sobre/');
    const input = await searchInput(page, isMobile);
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('placeholder', 'Pesquisar produtos...');
    await input.fill('r740');
    const list = page.locator(`#${await input.getAttribute('aria-controls')}`);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const options = list.getByRole('option');
    await expect(options.first()).toBeVisible();
    // Os produtos do catálogo com "R740" no nome aparecem; o último item leva a todos os resultados.
    const names = await list.locator('.sg-prod .sg-name').allTextContents();
    expect(names.some((n) => n.includes('PowerEdge R740'))).toBe(true);
    await expect(list.locator('.sg-all')).toContainText('no catálogo');
    // Teclado: seta para baixo marca a primeira sugestão; Enter abre o produto.
    await input.press('ArrowDown');
    const first = options.first();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', (await first.getAttribute('id'))!);
    const href = await first.getAttribute('data-href');
    await Promise.all([page.waitForURL(`**${href}`), input.press('Enter')]);
    expect(href).toMatch(/^\/servidor\/[^/]+\/$/);
    expect(wp).toEqual([]);
  });

  test('Enter sem escolher: o catálogo com a busca aplicada (estado no endereço)', async ({ page, isMobile }) => {
    await page.goto('/');
    const input = await searchInput(page, isMobile);
    await input.fill('dl380');
    await Promise.all([page.waitForURL(/\/servidores\/\?busca=dl380$/), input.press('Enter')]);
    await expect(page.locator('[data-cat-q]')).toHaveValue('dl380');
    const visible = page.locator('.pc:not([hidden])');
    await expect(visible.first()).toBeVisible();
    for (const t of await visible.locator('.pc-name').allTextContents()) expect(t.toLowerCase()).toContain('dl380');
  });

  test('código de peça da descrição, sem acentos e sem resultado', async ({ page, isMobile }) => {
    // Código citado só na descrição publicada (não no nome): HSTNS-PL18, da fonte HP DL380 750w.
    const fonte = P['7866'];
    expect(fonte.description).toMatch(/HSTNS-PL18/);
    expect(fonte.name).not.toMatch(/HSTNS-PL18/i);
    await page.goto('/sobre/');
    const input = await searchInput(page, isMobile);
    await input.fill('hstns-pl18');
    const found = page.locator(`#${await input.getAttribute('aria-controls')}`);
    await expect(found.locator('.sg-prod .sg-name').first()).toHaveText(fonte.name);
    // Com acento: "memória" encontra "Memoria RAM" (atributo das variações).
    await input.fill('memória');
    const list = page.locator(`#${await input.getAttribute('aria-controls')}`);
    await expect(list.locator('.sg-prod').first()).toBeVisible();
    await input.fill('xyzinexistente');
    const status = page.locator('[data-search-status]:visible');
    await expect(status).toContainText('Nenhum produto encontrado para “xyzinexistente”');
    await input.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('índice indisponível: aviso e a busca continua levando ao catálogo', async ({ page, isMobile }) => {
    await page.route('**/busca.json', (r) => r.abort());
    await page.goto('/sobre/');
    const input = await searchInput(page, isMobile);
    await input.fill('dell');
    await expect(page.locator('[data-search-status]:visible')).toContainText('Não foi possível carregar as sugestões');
    await Promise.all([page.waitForURL(/\/servidores\/\?busca=dell$/), input.press('Enter')]);
  });

  test('busca do catálogo e do blog sem JavaScript também ficam no site', async ({ page }) => {
    await page.goto('/categoria-produto/dell/');
    await expect(page.locator('[data-cat-search]')).toHaveAttribute('action', '/categoria-produto/dell/');
    await expect(page.locator('[data-cat-search] input')).toHaveAttribute('name', 'busca');
    await expect(page.locator('form[data-search]').first()).toHaveAttribute('action', '/servidores/');
    // Nenhum formulário ou link do site leva à busca do WordPress.
    expect(await page.locator('form[action*="msserver.com.br"], a[href*="?s="], a[href*="post_type=product"]').count()).toBe(0);
  });
});

test.describe('cabeçalho: atalho do carrinho', () => {
  test('quantidade de itens: aparece ao adicionar e acompanha o carrinho', async ({ page }) => {
    await mockStore(page, { lines: [line(7820, 2)] });
    await page.goto('/sobre/');
    const cart = page.locator('[data-cart-link]').first();
    await expect(cart).toHaveAttribute('href', '/carrinho/');
    await expect(cart).toHaveAttribute('aria-label', 'Carrinho, vazio');
    await expect(cart.locator('[data-cart-badge]')).toBeHidden();
    // O carrinho lê a loja: o contador passa a mostrar os 2 itens, também nas próximas páginas.
    await page.goto('/carrinho/');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(cart.locator('[data-cart-badge]')).toHaveText('2');
    await expect(cart).toHaveAttribute('aria-label', 'Carrinho, 2 itens');
    await expect(cart).toHaveAttribute('aria-current', 'page');
    await page.goto('/sobre/');
    await expect(page.locator('[data-cart-link] [data-cart-badge]').first()).toHaveText('2');
    // Remover no carrinho: o contador zera.
    await page.goto('/carrinho/');
    await page.locator('.cart-remove').click();
    await expect(page.locator('[data-cart-empty]')).toBeVisible();
    await expect(page.locator('[data-cart-link] [data-cart-badge]').first()).toBeHidden();
  });

  test('cabeçalho com o carrinho: sem rolagem lateral e acessível (axe)', async ({ page }) => {
    for (const path of ['/', '/servidores/', '/blog/']) {
      await page.goto(path);
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      expect(sw, path).toBe(iw);
      await expect(page.locator('[data-cart-link]').first()).toBeVisible();
    }
    await page.goto('/sobre/');
    const results = await new AxeBuilder({ page }).include('header').analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

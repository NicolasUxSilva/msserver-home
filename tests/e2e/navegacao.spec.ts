import { expect, test, type Page } from '@playwright/test';

// Navegação entre as páginas já reconstruídas (Home e "Sobre nós"). Elas se ligam por links
// internos; as páginas ainda não reformuladas continuam no WordPress (msserver.com.br).
// Nenhuma requisição sai para a produção durante os testes.
test.beforeEach(async ({ page }) => {
  await page.route(/youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me|msserver\.com\.br/, (r) => r.abort());
});

const openMobileMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.locator('#menu-movel')).toBeVisible();
};

/** A página carregada é a "Sobre nós" reconstruída (não a do WordPress). */
const expectNewAbout = async (page: Page) => {
  await expect(page).toHaveURL(/\/sobre\/$/);
  await expect(page.locator('h1')).toHaveText('Quem somos');
  await expect(page.locator('#quem-somos')).toBeVisible();
  await expect(page.locator('#especialidades')).toHaveCount(1);
};

/** A página carregada é a Home reconstruída. */
const expectNewHome = async (page: Page) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#inicio')).toBeVisible();
  await expect(page.locator('#nossa-linha')).toHaveCount(1);
};

test.describe('Home → Sobre nós', () => {
  test('menu principal "Sobre nós"', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await openMobileMenu(page);
      await page.locator('#menu-movel').getByRole('link', { name: 'Sobre nós' }).click();
    } else {
      await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Sobre nós' }).click();
    }
    await expectNewAbout(page);
  });

  test('rodapé "Quem somos"', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Quem somos' }).click();
    await expectNewAbout(page);
  });

  test('todos os links para a página institucional usam a rota nova', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => /msserver\.com\.br\/sobre/.test(h))).toEqual([]);
    expect(hrefs.filter((h) => h === '/sobre/').length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Sobre nós → Home', () => {
  test('logo', async ({ page }) => {
    await page.goto('/sobre/');
    await page.locator('header .brand').click();
    await expectNewHome(page);
  });

  test('menu principal "Início"', async ({ page, isMobile }) => {
    await page.goto('/sobre/');
    if (isMobile) {
      await openMobileMenu(page);
      await page.locator('#menu-movel').getByRole('link', { name: 'Início' }).click();
    } else {
      await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Início' }).click();
    }
    await expectNewHome(page);
  });

  test('rodapé "Início"', async ({ page }) => {
    await page.goto('/sobre/');
    await page.locator('footer').getByRole('link', { name: 'Início' }).click();
    await expectNewHome(page);
  });
});

test('páginas reconstruídas não apontam para as versões antigas; as demais seguem no WordPress', async ({ page }) => {
  for (const path of ['/', '/sobre/']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    // Nenhum link para a Home ou a "Sobre nós" antigas do WordPress.
    expect(hrefs.filter((h) => /^https:\/\/msserver\.com\.br\/?$|^https:\/\/msserver\.com\.br\/sobre\/?$/.test(h))).toEqual([]);
    // Páginas ainda não reformuladas: mesmos destinos no WordPress (o menu do desktop fica no
    // HTML também no celular, só oculto; por isso o seletor CSS).
    for (const [name, href] of [
      ['Orçamento', 'https://msserver.com.br/orcamento/'],
      ['Blog', 'https://msserver.com.br/blog/'],
      ['Suporte', 'https://msserver.com.br/obter-suporte/'],
      ['Cases de sucesso', 'https://msserver.com.br/cases-de-sucesso/'],
    ]) {
      await expect(page.locator('nav[aria-label="Menu principal"] a.nav-link', { hasText: new RegExp(`^${name}$`) })).toHaveAttribute('href', href);
    }
    await expect(page.locator('footer').getByRole('link', { name: 'Obter Suporte' })).toHaveAttribute('href', 'https://msserver.com.br/obter-suporte');
  }
});

import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-sobre.json' with { type: 'json' };

// Nada sai para serviços externos durante os testes.
test.beforeEach(async ({ page }) => {
  await page.route(/youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const norm = (s: string) => s.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
const scrollAll = (page: Page) =>
  page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
const settle = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.offsetParent !== null && getComputedStyle(el).opacity !== '1').length),
    )
    .toBe(0);

test.describe('sobre nós: preservação da página original', () => {
  test('todos os textos da página do WordPress estão presentes', async ({ page }) => {
    await page.goto('/sobre/');
    const body = norm((await page.locator('main').textContent()) ?? '');
    const missing = original.texts.filter((t) => !body.includes(norm(t)));
    expect(missing).toEqual([]);
  });

  test('títulos na mesma ordem da página original', async ({ page }) => {
    await page.goto('/sobre/');
    const headings = (await page.locator('main h1, main h2').allTextContents()).map(norm);
    expect(headings).toEqual(original.headings.map(norm));
  });

  test('ordem dos blocos dentro das colunas e das seções', async ({ page }) => {
    await page.goto('/sobre/');
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('main h2, main figure img, main .block-btn, main .spec-title, main .rv-who strong')].map((el) =>
        el.tagName === 'IMG' ? 'img:' + (el as HTMLImageElement).currentSrc.split('/').pop()!.split('.')[0].split('_')[0] : (el.textContent ?? '').trim(),
      ),
    );
    expect(order).toEqual([
      'img:retrato', 'Propósito', 'img:evento', 'Visão e missão', 'img:equipe', 'Foco no atendimento', 'Conte conosco',
      'Especialidades', 'Servidores fisicos', 'Servidores em nuvem privada', 'Cibersegurança', 'Extensão de garantia',
      'Monitoramento', 'Suporte e manutenção', 'Recompra', 'Rotinas de backup',
      'O que os clientes dizem', 'Fernando', 'Sara', 'Jessica', 'Pedro Hermano',
    ]);
  });

  test('botão "Conte conosco" mantém o destino original', async ({ page }) => {
    await page.goto('/sobre/');
    for (const href of original.hrefs) await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Conte conosco' })).toHaveAttribute('href', original.hrefs[0]);
  });

  test('as 11 imagens e os 2 fundos originais carregam', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    await page.goto('/sobre/');
    await scrollAll(page);
    // Força o carregamento das imagens adiadas (loading="lazy") antes de conferir.
    await page.evaluate(() => document.querySelectorAll<HTMLImageElement>('main img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('main img')].every((i) => i.complete));
    const imgs = page.locator('main img');
    await expect(imgs).toHaveCount(original.images.length);
    const broken = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('main img')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
    for (const sel of ['.band-texture', '.reviews-texture']) {
      const bg = await page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(bg).toMatch(/url\(/);
      const url = bg.match(/url\("?(.*?)"?\)/)![1];
      expect((await page.request.get(url)).ok()).toBe(true);
    }
    expect(failed).toEqual([]);
  });
});

test('sobre nós: SEO, header e console', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errors.push(m.text()));
  await page.goto('/sobre/');
  await expect(page).toHaveTitle('Sobre - MSSERVER');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^QUEM SOMOS PROPÓSITO Em um mundo/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/sobre/');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('h1')).toHaveCount(1);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  const crumbs = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'BreadcrumbList');
  expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Sobre']);
  if (!isMobile) await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Sobre nós' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-wa-fab]')).toHaveAttribute('href', 'https://wa.me/5511985991837?text=Ola!%20Mensagem%20vinda%20do%20site.');
  await scrollAll(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await settle(page);
  expect(errors).toEqual([]);
});

test('sobre nós: carrossel de depoimentos (setas, pontos, volta ao início, troca automática)', async ({ page, isMobile }) => {
  await page.goto('/sobre/');
  const track = page.locator('[data-rv-track]');
  await track.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const dots = page.locator('[data-rv-dot]:not([hidden])');
  // Com 4 depoimentos: 3 por vez no desktop (2 posições), 1 por vez no celular (4 posições).
  await expect(dots).toHaveCount(isMobile ? 4 : 2);
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  // Troca automática (5 s), enquanto ninguém mexe no carrossel.
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 10000 });
  // Setas: avançar no último volta ao primeiro; voltar no primeiro vai ao último.
  const next = page.getByRole('button', { name: 'Próximo depoimento' });
  const prev = page.getByRole('button', { name: 'Depoimento anterior' });
  const last = isMobile ? 3 : 1;
  await page.getByRole('button', { name: `Ir para o depoimento ${last + 1}` }).click();
  await expect(dots.nth(last)).toHaveAttribute('aria-current', 'true');
  await next.click();
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await prev.click();
  await expect(dots.nth(last)).toHaveAttribute('aria-current', 'true');
  // O trilho acompanha: o depoimento correspondente fica visível.
  await expect(page.locator('[data-rv-item]').last()).toBeInViewport();
  // Depois de usar os controles, a troca automática para (como no WordPress).
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6000);
  await expect(dots.nth(last)).toHaveAttribute('aria-current', 'true');
});

test('sobre nós: carrossel não troca sozinho com redução de movimento', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/sobre/');
  await page.locator('[data-rv-track]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(6500);
  await expect(page.locator('[data-rv-dot]').first()).toHaveAttribute('aria-current', 'true');
  await ctx.close();
});

test.describe('sobre nós: composição', () => {
  test.skip(({ isMobile }) => isMobile, 'somente desktop');

  test('duas colunas lado a lado, terminando na mesma linha', async ({ page }) => {
    await page.goto('/sobre/');
    const left = (await page.locator('.col--left').boundingBox())!;
    const right = (await page.locator('.col--right').boundingBox())!;
    expect(right.x).toBeGreaterThan(left.x + left.width);
    expect(Math.abs(left.y + left.height - (right.y + right.height))).toBeLessThan(2);
    // O retrato sobe sobre a faixa "Quem somos".
    const band = (await page.locator('#quem-somos').boundingBox())!;
    const portrait = (await page.locator('.photo--portrait').boundingBox())!;
    expect(portrait.y).toBeLessThan(band.y + band.height);
  });
});

test('sobre nós: acessibilidade (axe, WCAG 2.1 AA)', async ({ page }) => {
  await page.goto('/sobre/');
  await scrollAll(page);
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
});

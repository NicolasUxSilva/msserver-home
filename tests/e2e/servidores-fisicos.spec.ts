import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Landing de Servidores Físicos integrada ao site em /servidores-fisicos/ (docs/LANDINGS.md).
// Os testes vêm do repositório da landing (tests/e2e/page.spec.ts e lean.spec.ts, commit a8439e1), com
// três adaptações da integração: o endereço da página e o canonical publicados; os CTAs de WhatsApp
// conferidos são os da landing (conteúdo e botão flutuante; cabeçalho e rodapé agora são os do site);
// e o menu móvel testado é o do site. Os testes novos, no fim, conferem a integração (cabeçalho e
// rodapé do site, links internos, nenhum endereço de preview).
const LEAN = '/servidores-fisicos/';
const OFFICIAL = /^https:\/\/wa\.me\/5511985991837\?text=/;
const block = /googletagmanager|facebook|clarity|youtube|msserver\.com\.br/;

test.beforeEach(async ({ page }) => {
  await page.route(block, (r) => r.abort());
});

test('metadados de SEO e dados estruturados', async ({ page }) => {
  await page.goto(LEAN);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/servidores-fisicos/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://msserver.com.br/servidores-fisicos/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Servidores Dell, HP e IBM/);
  await expect(page.locator('h1')).toHaveCount(1);
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/og-servidores-dedicados\.jpg$/);
  const res = await page.request.get(new URL(og!).pathname);
  expect(res.ok()).toBe(true);
});

test('imagens e fontes carregam', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  await page.goto(LEAN);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForLoadState('networkidle');
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(failed).toEqual([]);
  expect(await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)).toBeGreaterThanOrEqual(2);
});

test('página sem simulador nem "Ver no catálogo", com os 6 modelos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(LEAN);
  await expect(page.locator('[data-simulator], #simulador, #configurar')).toHaveCount(0);
  await expect(page.locator('[data-sim-start], [data-sim-preset]')).toHaveCount(0);
  await expect(page.locator('main').getByText(/simul/i)).toHaveCount(0);
  await expect(page.getByText('Ver no catálogo')).toHaveCount(0);
  await expect(page.getByText('Ver todos os servidores')).toHaveCount(0);
  await expect(page.locator('#equipamentos .cat-card')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('todos os CTAs de WhatsApp da landing usam o número oficial e a mensagem certa', async ({ page }) => {
  await page.goto(LEAN);
  // Os CTAs da landing: os 10 do conteúdo e o botão flutuante (como no original, sem o cabeçalho e o
  // rodapé próprios, que deram lugar aos do site).
  const links = await page.$$eval('main a[href*="wa.me"], [data-lp-fab]', (as) => as.map((a) => ({ href: a.getAttribute('href')!, loc: a.getAttribute('data-track-location'), target: a.getAttribute('target') })));
  expect(links).toHaveLength(11);
  expect(links.every((l) => l.href.includes('?text='))).toBe(true);
  for (const l of links) {
    expect(l.href).toMatch(OFFICIAL);
    expect(l.target).toBe('_blank');
    const text = decodeURIComponent(new URL(l.href).searchParams.get('text') ?? '');
    if (l.loc?.startsWith('modelo-')) {
      expect(text).toMatch(/^Olá! Vim pela página de servidores físicos e tenho interesse no .+ \((rack|torre), Intel Xeon .+\)\. Pode me passar disponibilidade e valores para a minha empresa\?$/);
    } else if (l.loc === 'processo') {
      expect(text).toBe('Olá! Vi como funciona a compra na página de servidores físicos e quero orientação para escolher o servidor da minha empresa.');
    } else {
      expect(text).toBe('Olá! Vim pela página de servidores físicos e procuro um servidor para a minha empresa.');
    }
  }
  const r740 = links.find((l) => l.loc === 'modelo-servidor-dell-r740')!;
  expect(decodeURIComponent(new URL(r740.href).searchParams.get('text')!)).toContain('Dell PowerEdge R740 (rack, Intel Xeon Scalable)');
});

test('clique no WhatsApp gera o evento de clique (não um lead confirmado)', async ({ page, context }) => {
  await context.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: 'ok' }));
  await page.goto(LEAN);
  const popup = page.waitForEvent('popup');
  await page.locator('#inicio a[href*="wa.me"]').click();
  await (await popup).close();
  const events = await page.evaluate(() => (window.dataLayer ?? []).filter((e) => (e as { event?: string }).event));
  expect(events).toEqual([{ event: 'contact_whatsapp_click', location: 'hero' }]);
});

test('âncoras e navegação apontam para seções existentes', async ({ page }) => {
  await page.goto(LEAN);
  const hashes = await page.$$eval('a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')!))]);
  for (const h of hashes) expect(await page.locator(h).count(), `destino de ${h}`).toBeGreaterThan(0);
  await expect(page).toHaveTitle('Servidores Físicos para Empresas | Dell, HP e IBM | MSSERVER');
  const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
  expect(ld.map((x: { '@type': string }) => x['@type'])).toEqual(['Organization', 'FAQPage']);
  const faqLd = ld[1].mainEntity.map((q: { name: string }) => q.name);
  const visible = await page.locator('#duvidas summary h3').allTextContents();
  expect(faqLd).toEqual(visible);
});

test('sem violações de acessibilidade (axe, WCAG A/AA)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LEAN);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
});

test('botão flutuante de WhatsApp aparece depois do hero', async ({ page }) => {
  await page.goto(LEAN);
  const fab = page.locator('[data-lp-fab]');
  await expect(fab).toBeHidden();
  await page.locator('#diferenciais').scrollIntoViewIfNeeded();
  await expect(fab).toBeVisible();
});

test('menu móvel do site e sem rolagem horizontal', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 1440) >= 1180, 'somente telas menores');
  await page.goto(LEAN);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = page.locator('#menu-movel');
  await expect(menu).toBeVisible();
  // O menu é o do site: Soluções leva às duas landings e não tem mais o Aplicativo de Gestão.
  await menu.locator('[data-m-open]', { hasText: 'Soluções' }).click();
  await expect(menu.getByRole('link', { name: 'Servidores Físicos' })).toHaveAttribute('href', '/servidores-fisicos/');
  await expect(menu.getByRole('link', { name: 'Soluções Cloud' })).toHaveAttribute('href', '/solucoes-cloud/');
  await expect(menu.getByRole('link', { name: 'Aplicativo de Gestão' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('CTA de WhatsApp na seção "Como funciona a compra"', async ({ page, context, viewport }) => {
  await context.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: 'ok' }));
  await page.goto(LEAN);
  const section = page.locator('#processo');
  const cta = section.getByRole('link', { name: 'Falar com a equipe' });
  await expect(cta).toBeVisible();
  // Fica depois das etapas.
  const order = await section.evaluate((el) => {
    const ol = el.querySelector('ol.proc')!;
    const a = el.querySelector('.proc-cta')!;
    return ol.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(order).toBeTruthy();
  const box = await cta.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  if ((viewport?.width ?? 1440) < 640) expect(box!.width).toBeGreaterThan(280);
  const popup = page.waitForEvent('popup');
  await cta.click();
  await (await popup).close();
  const events = await page.evaluate(() => (window.dataLayer ?? []).filter((e) => (e as { event?: string }).event));
  expect(events).toEqual([{ event: 'contact_whatsapp_click', location: 'processo' }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('indicador de projetos entregues mostra +10.250', async ({ page }) => {
  await page.goto(LEAN);
  const stats = page.locator('#clientes .proof-stats');
  await expect(stats.locator('dd')).toHaveText(['+15', '+10.250']);
  await expect(stats).toContainText('projetos entregues');
  await expect(page.getByText('+250', { exact: true })).toHaveCount(0);
});

// ——— Integração ao site ———

test('cabeçalho e rodapé do site, com Soluções e a página atual', async ({ page, isMobile }) => {
  await page.goto(LEAN);
  await expect(page.locator('header.site-header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  // Nada do cabeçalho e do rodapé próprios da landing (navegação por âncoras, link da versão PT).
  await expect(page.locator('nav[aria-label="Seções da página"]')).toHaveCount(0);
  await expect(page.locator('a[href*="servidores-dedicados-para-empresas"]')).toHaveCount(0);
  await expect(page.locator('footer [data-year]')).toHaveText(String(new Date().getFullYear()));
  if (!isMobile) {
    const solucoes = page.locator('.nav-desktop [data-nav-item]', { hasText: 'Soluções' });
    await solucoes.hover();
    const panel = solucoes.locator('[data-sub-panel]');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Servidores Físicos' })).toHaveAttribute('href', '/servidores-fisicos/');
    await expect(panel.getByRole('link', { name: 'Aplicativo de Gestão' })).toHaveCount(0);
  }
  // O cabeçalho do site acompanha a rolagem (fixo no topo).
  await page.locator('#processo').scrollIntoViewIfNeeded();
  const top = await page.locator('header.site-header').evaluate((h) => h.getBoundingClientRect().top);
  expect(top).toBe(0);
});

test('links para páginas do site são internos; nenhum endereço de preview ou de outro projeto', async ({ page }) => {
  await page.goto(LEAN);
  await expect(page.locator('main a', { hasText: 'Como funciona a extensão' })).toHaveAttribute('href', '/extencao-de-garantia/');
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  for (const h of hrefs) {
    expect(h, h).not.toMatch(/vercel\.app|localhost|wp-content\/plugins\/msserver-landing/);
  }
  const html = await page.content();
  expect(html).not.toMatch(/vercel\.app|msserver-landing-servidores-fisicos/);
});

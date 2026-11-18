import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CLOUD, completeCloud, gotoLanding, openSimulator } from './solucoes-cloud-helpers';

// Landing de Soluções Cloud integrada ao site em /solucoes-cloud/ (docs/LANDINGS.md).
// Os testes vêm do repositório da landing (tests/e2e/page.spec.ts, commit 3199d6f), com as adaptações
// da integração: o canonical e a indexação publicados em /solucoes-cloud/ (definidos na etapa de
// conclusão); os dados estruturados em dois blocos (o layout do site publica um bloco por item); os CTAs
// de WhatsApp conferidos são os da landing (conteúdo e botão flutuante; cabeçalho e rodapé agora são os
// do site); e o menu móvel testado é o do site. Os testes novos, no fim, conferem a integração.

test('metadados próprios de Cloud, com o endereço publicado', async ({ page }) => {
  await gotoLanding(page);
  await expect(page).toHaveTitle('Infraestrutura Cloud para a TI da sua Empresa | MSSERVER');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Servidor no limite/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/solucoes-cloud/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://msserver.com.br/solucoes-cloud/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
  await expect(page.locator('link[hreflang]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/og-cloud-msserver\.jpg$/);
  expect((await page.request.get(new URL(og!).pathname)).ok()).toBe(true);
  const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
  expect(ld.map((x: { '@type': string }) => x['@type'])).toEqual(['Organization', 'FAQPage']);
  const faqLd = ld[1].mainEntity.map((q: { name: string }) => q.name);
  expect(faqLd).toEqual(await page.locator('#duvidas summary h3').allTextContents());
});

test('conteúdo de Cloud para quem cuida da TI: sem hardware físico, catálogo, preços ou revenda', async ({ page }) => {
  await gotoLanding(page);
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  for (const banned of [/R\$\s?\d/, /Dell|PowerEdge|ProLiant|Lenovo|\bHPE?\b|\bIBM\b/, /extensão de garantia/i, /comprar servidor|Ver no catálogo/i, /Xeon/, /parceri|comiss|revend|afiliad|cliente que você atende|propor ao cliente|seu cliente/i]) {
    expect(text, String(banned)).not.toMatch(banned);
  }
  await expect(page.locator('#equipamentos, #modalidades, .cat-card')).toHaveCount(0);
  const ids = await page.$$eval('main > section[id]', (s) => s.map((x) => x.id));
  expect(ids).toEqual(['inicio', 'desafios', 'apoio', 'solucoes', 'simulador', 'diferenciais', 'implantacao', 'equipe', 'duvidas']);
  await expect(page.locator('h1')).toHaveText('Você cuida da TI. A gente entra com a infraestrutura Cloud.');
  await expect(page.locator('#apoio h2')).toHaveText('Você não precisa cuidar de toda a infraestrutura sozinho');
  await expect(page.locator('#equipe h2')).toHaveText('Especialistas de verdade do outro lado');
});

test('links internos e de WhatsApp', async ({ page }) => {
  await gotoLanding(page);
  const hashes = await page.$$eval('a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')!))]);
  for (const h of hashes) expect(await page.locator(h).count(), `destino de ${h}`).toBeGreaterThan(0);
  // Os CTAs da landing: os do conteúdo e o botão flutuante.
  const wa = await page.$$eval('main a[href*="wa.me"], [data-lp-fab]', (as) => as.map((a) => a.getAttribute('href')!));
  expect(wa.length).toBeGreaterThanOrEqual(6);
  for (const href of wa) {
    expect(href).toMatch(/^https:\/\/wa\.me\/5511985991837\?text=/);
    expect(decodeURIComponent(new URL(href).searchParams.get('text')!)).toMatch(/página de Cloud da MSSERVER/);
    expect(decodeURIComponent(new URL(href).searchParams.get('text')!)).not.toMatch(/parceri|comiss|revend|cliente/i);
  }
  // O CTA principal do hero leva para a conversa com um especialista.
  const heroCta = page.locator('#inicio .hero-actions a').first();
  await expect(heroCta).toHaveText('Conversar com um especialista');
  await expect(heroCta).toHaveAttribute('href', /wa\.me/);
});

test('imagens, fontes e rolagem horizontal', async ({ page, baseURL }) => {
  const failed: string[] = [];
  const errors: string[] = [];
  page.on('response', (r) => r.url().startsWith(baseURL!) && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  page.on('pageerror', (e) => errors.push(String(e)));
  await gotoLanding(page);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src))).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('sem violações de acessibilidade (axe, WCAG A/AA) na página', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoLanding(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
});

test('sem violações de acessibilidade no resumo do simulador', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSimulator(page);
  await completeCloud(page);
  const results = await new AxeBuilder({ page }).include('[data-simulator]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
});

test('menu móvel do site', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 1440) >= 1180, 'somente telas menores');
  await gotoLanding(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = page.locator('#menu-movel');
  await expect(menu).toBeVisible();
  await menu.locator('[data-m-open]', { hasText: 'Soluções' }).click();
  const cloud = menu.getByRole('link', { name: 'Soluções Cloud' });
  await expect(cloud).toHaveAttribute('href', '/solucoes-cloud/');
  await expect(cloud).toHaveAttribute('aria-current', 'page');
  await expect(menu.getByRole('link', { name: 'Aplicativo de Gestão' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

// ——— Integração ao site ———

test('cabeçalho e rodapé do site, sem os da landing; o simulador abre pelo hero', async ({ page }) => {
  await gotoLanding(page);
  await expect(page.locator('header.site-header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Seções da página"]')).toHaveCount(0);
  await expect(page.locator('footer [data-year]')).toHaveText(String(new Date().getFullYear()));
  // O cabeçalho fixo não cobre o simulador ao abrir (rolagem com o desconto do cabeçalho).
  await page.locator('#inicio').getByRole('link', { name: 'Avaliar minha infraestrutura' }).click();
  await expect(page.locator('[data-simulator]')).toHaveClass(/is-ready/);
  await expect(page.locator('.sim-step-title')).toBeInViewport();
  const headerBottom = await page.locator('header.site-header').evaluate((h) => h.getBoundingClientRect().bottom);
  const titleTop = await page.locator('.sim-step-title').evaluate((t) => t.getBoundingClientRect().top);
  expect(titleTop).toBeGreaterThanOrEqual(headerBottom);
});

test('links para páginas do site são internos; nenhum endereço de preview ou de outro projeto', async ({ page }) => {
  await gotoLanding(page);
  // "Saiba mais" das soluções e o link do backup: as páginas do site.
  const more = await page.locator('#solucoes .sol-more').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(more).toEqual(['/nuvem-privada/', 'https://msserver.com.br/servidores-dedicados/', '/consultoria-em-implantacao-de-servidores/']);
  await expect(page.locator('main a', { hasText: 'Conheça o backup em nuvem' })).toHaveAttribute('href', '/backup-em-nuvem/');
  const html = await page.content();
  expect(html).not.toMatch(/vercel\.app|cloud-ms-beige|solucoes-cloud-msserver|\/solucoes-cloud\/_astro\//);
  expect(page.url()).toMatch(new RegExp(`${CLOUD}$`));
});

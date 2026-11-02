import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-home.json' with { type: 'json' };

// Nada sai para serviços externos durante os testes.
test.beforeEach(async ({ page }) => {
  await page.route(/youtube\.com|ytimg|googletagmanager|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const scrollAll = async (page: Page) =>
  page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });

const norm = (s: string) =>
  s
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();

test.describe('preservação da home original', () => {
  test('todos os links da home do WordPress continuam presentes', async ({ page }) => {
    await page.goto('/');
    const hrefs = new Set(await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!)));
    const equivalent: Record<string, string> = {
      // Âncora para a seção do app nesta mesma página.
      'https://msserver.com.br/#appmobile': '#appmobile',
      // Logo do menu lateral do WordPress (mesma página inicial).
      'https://msserver.com.br': 'https://msserver.com.br/',
    };
    const missing = original.hrefs.filter((h) => !hrefs.has(equivalent[h] ?? h));
    expect(missing).toEqual([]);
    expect(await page.locator('a[href="#"], a[href="#/"]').count()).toBe(0);
  });

  test('todos os textos da home do WordPress continuam presentes', async ({ page }) => {
    await page.goto('/');
    const body = norm((await page.locator('body').textContent()) ?? '');
    const missing: string[] = [];
    for (const t of original.texts) {
      // Textos combinados de um mesmo bloco são verificados frase a frase.
      for (const part of t.split(/(?<=[.,?!])\s+(?=[A-ZÀ-Ú])/)) {
        const p = norm(part).replace(/\s*»$/, ' »');
        if (!body.includes(p)) missing.push(part);
      }
    }
    expect(missing).toEqual([]);
  });

  test('ordem das seções preservada', async ({ page }) => {
    await page.goto('/');
    const order = await page.evaluate(() => {
      const ids = ['inicio', 'nossa-linha', 'appmobile', 'blog', 'social-title', 'clients-title'];
      return ids.map((id) => document.getElementById(id)!.getBoundingClientRect().top + scrollY);
    });
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    await expect(page.locator('iframe[title], [data-video]')).toHaveCount(1);
  });
});

test('SEO: title, description, canonical, H1 e dados estruturados', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('MSServer Soluções em Servidores');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Servidores usados, servidor Dell, servidor hp e ibm/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br');
  await expect(page.locator('h1')).toHaveCount(1);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['BreadcrumbList', 'Organization', 'WebPage', 'WebSite']);
});

test('imagens e fontes carregam, sem erros no console', async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errors.push(m.text()));
  page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  await page.goto('/');
  await scrollAll(page);
  await page.waitForLoadState('networkidle');
  // Força o carregamento das imagens dos slides e das abas ocultas.
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => ((i as HTMLImageElement).loading = 'eager')));
  await page.waitForLoadState('networkidle');
  // Imagens do próprio site (a miniatura do YouTube é externa e fica bloqueada nos testes).
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => i.src.startsWith(location.origin) && i.complete && i.naturalWidth === 0).map((i) => i.src),
  );
  expect(broken).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)).toBeGreaterThanOrEqual(2);
});

test('sem rolagem horizontal e conteúdo revelado após rolar', async ({ page }) => {
  await page.goto('/');
  await scrollAll(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  // Todo bloco com entrada animada termina visível (nenhum fica preso em opacidade 0).
  await expect
    .poll(() =>
      page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.offsetParent !== null && getComputedStyle(el).opacity !== '1').length),
    )
    .toBe(0);
});

test('abas da linha de servidores (clique e teclado)', async ({ page }) => {
  await page.goto('/');
  const panel = (id: string) => page.locator(`#${id}-tab`);
  await expect(panel('rack')).toBeVisible();
  await expect(panel('torre')).toBeHidden();
  await page.getByRole('tab', { name: 'Torre' }).click();
  await expect(panel('torre')).toBeVisible();
  await expect(panel('torre').getByRole('heading', { name: 'Servidor Dell PowerEdge T410' })).toBeVisible();
  await expect(panel('rack')).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Escala Nuvem' })).toBeFocused();
  await expect(panel('escala-nuvem')).toBeVisible();
  await expect(panel('escala-nuvem').locator('li')).toHaveCount(6);
});

test('slider: navegação, pausa e destinos', async ({ page, isMobile }) => {
  await page.goto('/');
  const active = () => page.locator('[data-slide][data-active]');
  await expect(active()).toHaveAttribute('id', 'slide-servidores');
  await page.getByRole('button', { name: 'Pausar a troca automática' }).click();
  await page.getByRole('button', { name: 'Próximo slide' }).click();
  await expect(active()).toHaveAttribute('id', 'slide-app');
  const link = active().getByRole('link', { name: 'Baixar o app' });
  await expect(link).toHaveAttribute('href', isMobile ? '#appmobile' : 'https://msserver.com.br/aplicativo-ms-server/');
  await page.getByRole('button', { name: /^Ir para o slide 03/ }).click();
  await expect(active()).toHaveAttribute('id', 'slide-nuvem');
  await expect(active().getByRole('link', { name: isMobile ? 'Obter suporte' : 'Nuvem' })).toHaveAttribute(
    'href',
    isMobile ? 'https://msserver.com.br/obter-suporte' : 'https://msserver.com.br/solucoes-cloud-msserver/',
  );
});

test('slider avança sozinho a cada 5 s', async ({ page }) => {
  await page.goto('/');
  await page.mouse.move(0, 0);
  await expect(page.locator('[data-slide][data-active]')).toHaveAttribute('id', 'slide-app', { timeout: 8000 });
});

test('busca de produtos envia para a busca do WooCommerce', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Abrir busca de produtos' }).click();
  const form = page.locator(isMobile ? '#busca-movel form' : 'form[data-search]');
  await form.locator('input[type="search"]').fill('dell r740');
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().startsWith('https://msserver.com.br/?')),
    page.route('https://msserver.com.br/?**', (r) => r.fulfill({ body: 'ok' })),
    form.locator('input[type="search"]').press('Enter'),
  ]);
  const url = new URL(req.url());
  expect(url.searchParams.get('s')).toBe('dell r740');
  expect(url.searchParams.get('post_type')).toBe('product');
});

test('WhatsApp flutuante com o número e a mensagem do site', async ({ page }) => {
  await page.goto('/');
  const fab = page.locator('[data-wa-fab]');
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAttribute('href', 'https://wa.me/5511985991837?text=Ola!%20Mensagem%20vinda%20do%20site.');
  await expect(fab).toHaveAttribute('target', '_blank');
});

test('vídeo do YouTube é carregado ao se aproximar da seção', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-video] iframe')).toHaveCount(0);
  await page.locator('[data-video]').scrollIntoViewIfNeeded();
  const iframe = page.locator('[data-video] iframe');
  await expect(iframe).toHaveCount(1);
  const src = (await iframe.getAttribute('src'))!;
  expect(src).toContain('youtube.com/embed/1MQYjMeyX6w');
  expect(src).toContain('list=PLD5Luy6JY9pB9oSb0IRJZsyHrZEDxRqQW');
  expect(src).toContain('mute=1');
  expect(src).toContain('autoplay=1');
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'somente desktop');

  test('submenus do header: mouse, clique e Esc', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Menu principal' });
    await nav.getByRole('link', { name: 'Servidores', exact: true }).hover();
    await expect(nav.getByRole('link', { name: 'Placas de Rede' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Componentes' })).toHaveAttribute('href', 'https://msserver.com.br/categoria-produto/componentes/');
    await page.mouse.move(700, 600);
    await expect(nav.getByRole('link', { name: 'Placas de Rede' })).toBeHidden();

    const sol = nav.getByRole('button', { name: 'Soluções' });
    await sol.click();
    await expect(sol).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'Servidores Dedicados' })).toBeVisible();
    await expect(nav.getByText('Servidores em Nuvem')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sol).toHaveAttribute('aria-expanded', 'false');
    await expect(sol).toBeFocused();
  });

  test('acordeão de soluções expande ao passar o mouse', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('[data-acc-item]');
    await items.nth(1).hover();
    await expect(items.nth(1)).toHaveAttribute('data-open', '');
    await expect(items.nth(1).getByText(/Tome decisões inteligentes/)).toBeVisible();
    await expect(items.nth(1).locator('a')).toHaveAttribute('href', 'https://msserver.com.br/solucoes-cloud/');
  });
});

test.describe('celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'somente celular');

  test('menu móvel com todos os níveis', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.locator('#menu-movel');
    await expect(menu).toBeVisible();
    await menu.getByRole('button', { name: 'Abrir submenu de Servidores' }).click();
    await menu.getByRole('button', { name: 'Abrir submenu de Componentes' }).click();
    await expect(menu.getByRole('link', { name: 'Gavetas' })).toBeVisible();
    await menu.getByRole('button', { name: 'Soluções', exact: true }).click();
    await menu.getByRole('button', { name: 'Servidores em Nuvem', exact: true }).click();
    await expect(menu.getByRole('link', { name: 'Nuvem Privada' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Cases de sucesso' })).toHaveAttribute('href', 'https://msserver.com.br/cases-de-sucesso/');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('âncora do slide do app leva à seção do app', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pausar a troca automática' }).click();
    await page.getByRole('button', { name: /^Ir para o slide 02/ }).click();
    await page.locator('[data-slide][data-active]').getByRole('link', { name: 'Baixar o app' }).click();
    await expect(page.locator('#appmobile')).toBeInViewport();
  });
});

const settle = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.offsetParent !== null && getComputedStyle(el).opacity !== '1').length),
    )
    .toBe(0);

test('acessibilidade (axe, WCAG 2.1 AA)', async ({ page }) => {
  await page.goto('/');
  await scrollAll(page);
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
});

test('redução de movimento: slider parado e conteúdo visível', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(6000);
  await expect(page.locator('[data-slide][data-active]')).toHaveAttribute('id', 'slide-servidores');
  await expect(page.locator('h1')).toBeVisible();
  await ctx.close();
});

test('cartões inteiros clicáveis levam ao mesmo destino do título', async ({ page }) => {
  await page.route('https://msserver.com.br/**', (r) => r.fulfill({ body: 'ok', contentType: 'text/html' }));
  await page.goto('/');
  const card = page.locator('#rack-tab .card').first();
  await card.scrollIntoViewIfNeeded();
  // Clique real do usuário sobre a foto (sem seletor): o link esticado do título recebe o clique.
  let box = (await card.locator('.card-photo').boundingBox())!;
  await page.mouse.click(box.x + 30, box.y + 30);
  await expect(page).toHaveURL('https://msserver.com.br/servidor/servidor-hp-proliant-dl380-g7/');
  await page.goto('/');
  const post = page.locator('.post').first();
  await post.scrollIntoViewIfNeeded();
  box = (await post.locator('.post-thumb').boundingBox())!;
  await page.mouse.click(box.x + 30, box.y + 30);
  await expect(page).toHaveURL(/msserver\.com\.br\/review-servidor-poweredge-vale-a-pena\/$/);
});

test('vídeo mostra a miniatura do próprio vídeo enquanto o player carrega', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-video] .poster, [data-video] iframe').first()).toHaveCount(1);
  const html = await page.content();
  expect(html).toContain('https://i.ytimg.com/vi/1MQYjMeyX6w/maxresdefault.jpg');
});

test.describe('desktop: linha de servidores', () => {
  test.skip(({ isMobile }) => isMobile, 'somente desktop');

  test('coluna lateral fixa e abas verticais com setas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-tabs]')).toHaveAttribute('aria-orientation', 'vertical');
    await page.getByRole('tab', { name: /Rack/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('tab', { name: /Torre/ })).toBeFocused();
    await expect(page.locator('#torre-tab')).toBeVisible();
    // A coluna com as abas acompanha a rolagem pela grade.
    const panels = page.locator('.line-panels');
    const top = await panels.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y + 600), top);
    await expect(page.locator('[data-tabs]')).toBeInViewport();
  });
});

test.describe('celular: carrossel de servidores', () => {
  test.skip(({ isMobile }) => !isMobile, 'somente celular');

  test('servidores deslizam na horizontal', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('#rack-tab [data-rail]');
    await rail.scrollIntoViewIfNeeded();
    // A lista é mais larga que a tela e rola na horizontal até o último cartão.
    expect(await rail.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await rail.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    await expect(page.locator('#rack-tab .card').last()).toBeInViewport();
    // Nenhum cartão fica de fora: todos continuam no DOM e acessíveis.
    await expect(page.locator('#rack-tab .card')).toHaveCount(6);
  });
});

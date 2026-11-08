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
      // Páginas já reconstruídas neste projeto: Início e "Sobre nós" levam às rotas internas
      // (ver ROUTES em src/config/site.ts); as demais seguem no WordPress.
      'https://msserver.com.br': '/',
      'https://msserver.com.br/': '/',
      'https://msserver.com.br/sobre': '/sobre/',
      'https://msserver.com.br/sobre/': '/sobre/',
    };
    const missing = original.hrefs.filter((h) => !hrefs.has(equivalent[h] ?? h));
    expect(missing).toEqual([]);
    expect(await page.locator('a[href="#"], a[href="#/"]').count()).toBe(0);
  });

  // Textos do banner do aplicativo, substituídos pela copy comercial (plataforma/SaaS) a pedido
  // da MSSERVER em 06/11/2026 (ver docs/PRESERVACAO.md).
  const REPLACED = new Set([
    'O UNICO COM APP GRATUITO PARA GESTÃO DE SERVIDORES',
    'Acompanhamento em tempo real do seu servidor. RECURSOS E SERVIÇOS PARA MITIGAR INDISPONIBILIDADES. Servidores Dell, Servidores HP, Servidores Ibm',
    'GERENCIE SEUS SERVIDORES COM O APP DA MSSERVER',
    'Acompanhamento em tempo real do seu servidor. Recursos e Serviços para mitigar indisponibilidades.',
  ]);

  test('todos os textos da home do WordPress continuam presentes', async ({ page }) => {
    await page.goto('/');
    const body = norm((await page.locator('body').textContent()) ?? '');
    const missing: string[] = [];
    for (const t of original.texts.filter((t) => !REPLACED.has(t))) {
      // Textos combinados de um mesmo bloco são verificados frase a frase.
      for (const part of t.split(/(?<=[.,?!])\s+(?=[A-ZÀ-Ú])/)) {
        const p = norm(part).replace(/\s*»$/, ' »');
        if (!body.includes(p)) missing.push(part);
      }
    }
    expect(missing).toEqual([]);
    // Os textos substituídos não aparecem mais (nem como antigos, nem como atuais).
    for (const t of REPLACED) expect(body).not.toContain(norm(t));
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
  // Força o carregamento das imagens das abas ocultas.
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

  test('menu móvel: meia tela, logo centralizada, itens de abrir lado a lado e todos os níveis', async ({ page }) => {
    await page.goto('/');
    // Simula o Safari/Chrome dos celulares: o desfoque do header vira bloco de contenção para
    // elementos fixos. Com o menu dentro do header, ele abria com altura zero.
    await page.addStyleTag({ content: '[data-header]{filter: drop-shadow(0 0 0 transparent) !important}' });
    await page.evaluate(() => window.scrollTo(0, 500));
    const toggle = (await page.getByRole('button', { name: 'Abrir menu' }).boundingBox())!;
    await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
    const menu = page.locator('#menu-movel');
    const sheet = menu.getByRole('dialog', { name: 'Menu' });
    await expect(sheet).toBeVisible();
    await expect(menu).toHaveClass(/is-open/);
    await page.waitForTimeout(600);
    // Metade da altura da tela (ou o mínimo que cabe o menu em telas muito baixas).
    const vp = page.viewportSize()!;
    const box = (await sheet.boundingBox())!;
    expect(box.y).toBe(0);
    expect(box.height).toBeGreaterThanOrEqual(vp.height * 0.5 - 1);
    expect(box.height).toBeLessThanOrEqual(Math.max(vp.height * 0.5, 320) + 1);
    // Logo centralizada.
    const logo = (await menu.locator('.m-brand').boundingBox())!;
    expect(Math.abs(logo.x + logo.width / 2 - vp.width / 2)).toBeLessThan(2);
    // Itens que abrem submenu (Servidores, Soluções) lado a lado, acima dos links.
    const servidores = (await menu.getByRole('button', { name: 'Servidores', exact: true }).boundingBox())!;
    const solucoes = (await menu.getByRole('button', { name: 'Soluções', exact: true }).boundingBox())!;
    expect(Math.abs(servidores.y - solucoes.y)).toBeLessThan(1);
    expect(Math.abs(servidores.width - solucoes.width)).toBeLessThan(1);
    const links = menu.locator('#m-v-root .m-cell');
    await expect(links).toHaveCount(6);
    const firstLink = (await links.first().boundingBox())!;
    expect(firstLink.y).toBeGreaterThan(servidores.y + servidores.height);
    // Links nas mesmas duas colunas dos botões, com o texto centralizado na célula.
    expect(Math.abs(firstLink.x - servidores.x)).toBeLessThan(2);
    const cell = (await menu.locator('.m-cell', { has: page.getByRole('link', { name: 'Sobre nós' }) }).boundingBox())!;
    const link = (await menu.getByRole('link', { name: 'Sobre nós' }).boundingBox())!;
    expect(Math.abs(cell.x - solucoes.x)).toBeLessThan(2);
    expect(Math.abs(cell.x + cell.width / 2 - (link.x + link.width / 2))).toBeLessThan(2);

    // Submenus em camadas, com "Voltar". O título da camada leva à página do item, quando existe.
    await menu.getByRole('button', { name: 'Servidores', exact: true }).click();
    await expect(menu.getByRole('link', { name: 'Ver todos' })).toBeVisible();
    await expect(menu.locator('#m-v-root-0 .m-title')).toHaveAttribute('href', 'https://msserver.com.br/servidores');
    await menu.getByRole('button', { name: 'Componentes', exact: true }).click();
    await expect(menu.locator('#m-v-root-0-4 .m-title')).toHaveAttribute('href', 'https://msserver.com.br/categoria-produto/componentes/');
    await expect(menu.getByRole('link', { name: 'Gavetas' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Gavetas' })).toHaveAttribute('href', 'https://msserver.com.br/categoria-produto/gavetas/');
    await menu.locator('#m-v-root-0-4').getByRole('button', { name: 'Voltar' }).click();
    await menu.locator('#m-v-root-0').getByRole('button', { name: 'Voltar' }).click();
    await menu.getByRole('button', { name: 'Soluções', exact: true }).click();
    await menu.getByRole('button', { name: 'Servidores em Nuvem', exact: true }).click();
    await expect(menu.getByRole('link', { name: 'Nuvem Privada' })).toBeVisible();
    await menu.locator('#m-v-root-3-0').getByRole('button', { name: 'Voltar' }).click();
    await menu.locator('#m-v-root-3').getByRole('button', { name: 'Voltar' }).click();
    await expect(menu.getByRole('link', { name: 'Cases de sucesso' })).toHaveAttribute('href', 'https://msserver.com.br/cases-de-sucesso/');

    // Esc fecha e a página continua no mesmo ponto.
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    expect(await page.evaluate(() => window.scrollY)).toBe(500);
  });

  test('menu móvel fecha tocando fora do painel e pelo ✕', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('#menu-movel');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(menu.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(600);
    const vp = page.viewportSize()!;
    await page.mouse.click(vp.width / 2, vp.height - 30);
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(menu.getByRole('dialog')).toBeVisible();
    await menu.getByRole('button', { name: 'Fechar menu' }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
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

test.describe('hero interativa', () => {
  const active = (page: Page) => page.locator('[data-hero-panel][data-active]');

  test('seletor troca mensagem, arte e destinos (clique e teclado)', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(active(page)).toHaveAttribute('id', 'hero-p-servidores');
    await expect(page.locator('h1')).toHaveText('Servidores usados e semi-novos');
    await page.getByRole('tab', { name: 'App' }).click();
    await expect(active(page)).toHaveAttribute('id', 'hero-p-app');
    await expect(page.locator('[data-hero-art][data-active]')).toHaveAttribute('href', 'https://msserver.com.br/aplicativo-ms-server/');
    await expect(active(page).getByRole('link', { name: 'Conhecer a plataforma' })).toHaveAttribute('href', isMobile ? '#appmobile' : 'https://msserver.com.br/aplicativo-ms-server/');
    await page.getByRole('tab', { name: 'App' }).press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Data Center' })).toBeFocused();
    await expect(active(page)).toHaveAttribute('id', 'hero-p-nuvem');
    await expect(active(page).getByRole('link', { name: isMobile ? 'Obter suporte' : 'Nuvem' })).toHaveAttribute(
      'href',
      isMobile ? 'https://msserver.com.br/obter-suporte' : 'https://msserver.com.br/solucoes-cloud-msserver/',
    );
    // Seta para a direita no último tema existente leva ao banner de locação; End também.
    await page.getByRole('tab', { name: 'Data Center' }).press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Locação para IA' })).toBeFocused();
    await expect(active(page)).toHaveAttribute('id', 'hero-p-locacao');
    await page.getByRole('tab', { name: 'Locação para IA' }).press('ArrowRight');
    await expect(active(page)).toHaveAttribute('id', 'hero-p-servidores');
    await page.getByRole('tab', { name: 'Servidores' }).press('End');
    await expect(active(page)).toHaveAttribute('id', 'hero-p-locacao');
    // Só a mensagem ativa fica visível e acessível.
    await expect(page.locator('#hero-p-servidores')).toBeHidden();
  });

  test('troca sozinha a cada 7 s, sem botão de pausa, e segue depois de uma escolha', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero] button', { hasText: /pausa|retomar/i })).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(active(page)).toHaveAttribute('id', 'hero-p-app', { timeout: 9000 });
    // Escolher um tema reinicia o tempo; com o mouse fora da hero, a troca continua.
    await page.getByRole('tab', { name: 'Servidores' }).click();
    await page.mouse.move(0, 0);
    await expect(active(page)).toHaveAttribute('id', 'hero-p-servidores');
    await expect(active(page)).toHaveAttribute('id', 'hero-p-app', { timeout: 9000 });
  });

  test('pausa enquanto o mouse está sobre a hero', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse só no desktop');
    await page.goto('/');
    await page.locator('[data-hero]').hover({ position: { x: 300, y: 200 } });
    await page.waitForTimeout(8000);
    await expect(active(page)).toHaveAttribute('id', 'hero-p-servidores');
  });

  test('pontos centralizados indicam o tema (um por banner), sem barra de status', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero-tabs] [role="tab"]')).toHaveCount(4);
    // Os pontos não têm texto visível (o nome do tema fica só no rótulo acessível).
    expect((await page.locator('[data-hero-tabs]').innerText()).trim()).toBe('');
    // O grupo de pontos (do primeiro ao último) é pequeno e fica no centro da tela.
    const first = (await page.locator('[data-hero-tabs] [role="tab"]').first().boundingBox())!;
    const last = (await page.locator('[data-hero-tabs] [role="tab"]').last().boundingBox())!;
    const span = last.x + last.width - first.x;
    expect(Math.abs(first.x + span / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2);
    expect(span).toBeLessThan(140);
    expect(first.height).toBeLessThanOrEqual(28);
    await expect(page.getByRole('tab', { name: 'Servidores' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Data Center' }).click();
    await expect(page.getByRole('tab', { name: 'Data Center' })).toHaveAttribute('aria-selected', 'true');
  });

  test('a arte cobre a seção inteira, com o texto por cima', async ({ page }) => {
    await page.goto('/');
    const hero = (await page.locator('[data-hero]').boundingBox())!;
    // Altura de uma hero comum: a tela inteira abaixo do header.
    const header = (await page.locator('[data-header]').boundingBox())!;
    expect(Math.abs(hero.height - (page.viewportSize()!.height - header.height))).toBeLessThan(2);
    // Imagem preenchida por recorte proporcional, nunca deformada.
    await expect(page.locator('[data-hero-art][data-active] img')).toHaveCSS('object-fit', 'cover');
    const art = (await page.locator('[data-hero-art][data-active] img').boundingBox())!;
    expect(art.x).toBeLessThanOrEqual(hero.x);
    expect(art.width).toBeGreaterThanOrEqual(hero.width);
    expect(art.y).toBeLessThanOrEqual(hero.y);
    expect(art.y + art.height).toBeGreaterThanOrEqual(hero.y + hero.height - 1);
    expect(hero.width).toBe(page.viewportSize()!.width);
    const title = (await active(page).locator('.hero-title').first().boundingBox())!;
    expect(title.y).toBeGreaterThan(hero.y);
    expect(title.y + title.height).toBeLessThan(hero.y + hero.height);
  });

  test('a troca não desloca o restante da página', async ({ page }) => {
    await page.goto('/');
    const next = page.locator('#nossa-linha');
    const y0 = await next.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    for (const name of ['App', 'Data Center', 'Locação para IA', 'Servidores']) {
      await page.getByRole('tab', { name }).click();
      await page.waitForTimeout(300);
      expect(await next.evaluate((el) => el.getBoundingClientRect().top + scrollY)).toBe(y0);
    }
  });
});

// Banner de locação de servidores para IA (artes enviadas pela MSSERVER, uma para desktop e outra
// para o celular). Regiões da arte em pixels do arquivo: [x1, y1, x2, y2].
const LOC_ART = {
  desktop: { nat: [1714, 918], palavra: [112, 140, 1002, 300], servidores: [188, 288, 1052, 785] },
  mobile: { nat: [941, 1672], palavra: [113, 808, 847, 958], servidores: [137, 1005, 817, 1418] },
};

test.describe('banner de locação para IA', () => {
  const open = async (page: Page) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Locação para IA' }).click();
    await expect(page.locator('[data-hero-panel][data-active]')).toHaveAttribute('id', 'hero-p-locacao');
  };

  test('copy, botão e destino', async ({ page }) => {
    await open(page);
    const panel = page.locator('#hero-p-locacao');
    await expect(panel.locator('.hero-title')).toHaveText(/^Potência para IA\.\s+Sua infraestrutura por\s+locação\.$/);
    await expect(panel.locator('.hero-desc:visible')).toHaveText(
      'Tenha acesso a servidores equipados com GPUs de alto desempenho para inteligência artificial, sem precisar investir na aquisição dos equipamentos.',
    );
    const cta = panel.getByRole('link', { name: 'Conheça a locação' });
    await expect(cta).toHaveAttribute('href', 'https://msserver.com.br/orcamento/');
    await expect(page.locator('[data-hero-art][data-active]')).toHaveAttribute('href', 'https://msserver.com.br/orcamento/');
    await expect(page.locator('[data-hero]')).not.toContainText(/haas/i);
  });

  test('cada tela carrega a sua arte, sem deformar', async ({ page, isMobile }) => {
    await open(page);
    const img = page.locator('[data-hero-art][data-active] img');
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(isMobile ? /slide-4-mobile/ : /slide-4-desktop/);
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    // Proporção da caixa igual à da arte (sem esticar) ou preenchimento proporcional.
    const fit = await img.evaluate((i) => getComputedStyle(i).objectFit);
    expect(['cover', 'contain']).toContain(fit);
  });

  test('o texto fica na mesma altura dos outros banners', async ({ page, isMobile }) => {
    await page.goto('/');
    const measure = async (key: string) => {
      await page.locator(`#hero-t-${key}`).click();
      await expect(page.locator('[data-hero-panel][data-active]')).toHaveAttribute('id', `hero-p-${key}`);
      return page.locator(`#hero-p-${key}`).evaluate((panel) => {
        const hero = panel.closest('[data-hero]')!.getBoundingClientRect();
        const boxes = [...panel.children]
          .filter((e) => getComputedStyle(e).display !== 'none')
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.height > 0);
        const top = Math.min(...boxes.map((r) => r.top)) - hero.top;
        const bottom = Math.max(...boxes.map((r) => r.bottom)) - hero.top;
        return { top, center: (top + bottom) / 2 };
      });
    };
    const others = [await measure('servidores'), await measure('app'), await measure('nuvem')];
    const loc = await measure('locacao');
    // Desktop: mensagens centradas na mesma linha. Celular: todas começam no mesmo ponto do topo.
    for (const o of others) {
      if (isMobile) expect(Math.abs(loc.top - o.top)).toBeLessThan(2);
      else expect(Math.abs(loc.center - o.center)).toBeLessThan(2);
    }
  });

  test('o texto não cobre a palavra "LOCAÇÃO" nem os servidores', async ({ page }) => {
    await open(page);
    await page.waitForTimeout(1500);
    const gaps = await page.evaluate((ART) => {
      const img = document.querySelector<HTMLImageElement>('.media-item[data-key="locacao"] img')!;
      const A = /slide-4-mobile/.test(img.currentSrc) ? ART.mobile : ART.desktop;
      const box = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const [nw, nh] = A.nat;
      const sc = cs.objectFit === 'contain' ? Math.min(box.width / nw, box.height / nh) : Math.max(box.width / nw, box.height / nh);
      const [px, py] = cs.objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const ox = box.left + (box.width - nw * sc) * px;
      const oy = box.top + (box.height - nh * sc) * py;
      const map = (r: number[]) => [ox + r[0] * sc, oy + r[1] * sc, ox + r[2] * sc, oy + r[3] * sc];
      const panel = document.querySelector('#hero-p-locacao')!;
      const rects: number[][] = [];
      for (const el of panel.querySelectorAll('.hero-title, .hero-desc')) {
        if (getComputedStyle(el).display === 'none') continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        for (const q of range.getClientRects()) rects.push([q.left, q.top, q.right, q.bottom]);
      }
      for (const a of panel.querySelectorAll('.hero-actions a')) {
        if (getComputedStyle(a).display === 'none') continue;
        const q = a.getBoundingClientRect();
        rects.push([q.left, q.top, q.right, q.bottom]);
      }
      // Distância entre retângulos (positiva = separados).
      const gap = (a: number[], b: number[]) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]);
      return {
        palavra: Math.min(...rects.map((r) => gap(r, map(A.palavra)))),
        servidores: Math.min(...rects.map((r) => gap(r, map(A.servidores)))),
      };
    }, LOC_ART);
    expect(gaps.palavra).toBeGreaterThan(12);
    expect(gaps.servidores).toBeGreaterThan(12);
  });
});

test.describe('hero no celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'somente celular');

  test('deslizar sobre a arte troca o tema', async ({ page }) => {
    await page.goto('/');
    const art = page.locator('[data-hero-visual]');
    await art.scrollIntoViewIfNeeded();
    await art.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const mk = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: r.top + r.height / 2 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(r.right - 30)], changedTouches: [mk(r.right - 30)], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(r.left + 30)], bubbles: true }));
    });
    await expect(page.locator('[data-hero-panel][data-active]')).toHaveAttribute('id', 'hero-p-app');
  });

  test('"Conhecer a plataforma" leva à seção do app', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'App' }).click();
    await page.locator('[data-hero-panel][data-active]').getByRole('link', { name: 'Conhecer a plataforma' }).click();
    await expect(page.locator('#appmobile')).toBeInViewport();
  });
});

test('redução de movimento: hero parada e conteúdo visível', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForTimeout(8000);
  await expect(page.locator('[data-hero-panel][data-active]')).toHaveAttribute('id', 'hero-p-servidores');
  await expect(page.locator('h1')).toBeVisible();
  await ctx.close();
});

test.describe('celular: soluções e postagens', () => {
  test.skip(({ isMobile }) => !isMobile, 'somente celular');

  test('soluções: acordeão horizontal com as três sempre na tela', async ({ page }) => {
    await page.route('https://msserver.com.br/**', (r) => r.fulfill({ body: 'ok', contentType: 'text/html' }));
    await page.goto('/');
    const items = page.locator('[data-acc-item]');
    await page.locator('[data-acc]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    // Espera a entrada animada dos painéis terminar.
    await expect.poll(() => items.last().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await page.waitForTimeout(300);
    const vw = page.viewportSize()!.width;
    const inside = async () => {
      for (let i = 0; i < 3; i++) {
        const b = (await items.nth(i).boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(vw);
      }
    };
    await expect(items.nth(0)).toHaveAttribute('data-open', '');
    await inside();
    // Toque real (o click() do Playwright simula um mouse, que abre o painel ao passar por cima).
    const tap = async (i: number, dx: number) => {
      const b = (await items.nth(i).boundingBox())!;
      await page.touchscreen.tap(b.x + dx, b.y + b.height / 2);
    };
    // Tocar numa faixa recolhida abre a solução, sem seguir o link.
    await tap(1, 20);
    await expect(items.nth(1)).toHaveAttribute('data-open', '');
    await expect(page).toHaveURL(/localhost/);
    await page.waitForTimeout(800);
    await inside();
    // Deslizar para a esquerda abre a próxima.
    await page.locator('[data-acc]').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const mk = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: r.top + 200 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(r.right - 40)], changedTouches: [mk(r.right - 40)], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(r.left + 40)], bubbles: true }));
    });
    await expect(items.nth(2)).toHaveAttribute('data-open', '');
    // Com a solução aberta, o toque segue o link.
    await tap(1, 20);
    await expect(items.nth(1)).toHaveAttribute('data-open', '');
    await expect(page).toHaveURL(/localhost/);
    await page.waitForTimeout(800);
    await tap(1, 60);
    await expect(page).toHaveURL('https://msserver.com.br/solucoes-cloud/');
  });

  test('postagens deslizam na horizontal', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('.post-grid');
    await rail.scrollIntoViewIfNeeded();
    expect(await rail.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await rail.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    await expect(page.locator('.post').last()).toBeInViewport();
    await expect(page.locator('.post')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

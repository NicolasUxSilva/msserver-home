import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-catalog.json' with { type: 'json' };
import catalog from '../../src/data/catalog.json' with { type: 'json' };

// Catálogo de servidores: /servidores/ e categorias Dell, HP e IBM. A referência é o catálogo
// publicado no WordPress (tests/fixtures/original-catalog.json, capturado das páginas originais):
// os mesmos produtos, na mesma ordem, nas mesmas páginas, com os mesmos nomes, links, preços,
// botões e imagens. Nenhuma requisição sai para o site de produção durante os testes.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

type Key = 'servidores' | 'dell' | 'hp' | 'ibm';
const LISTINGS = original.listings as unknown as Record<Key, (typeof original.listings)['dell'] & { orders: Record<string, number[]> }>;
const PRODUCTS = catalog.products as unknown as Record<string, { url: string; imageSrc: string; button: { url: string; kind: string } }>;
const PATH: Record<Key, string> = { servidores: '/servidores/', dell: '/categoria-produto/dell/', hp: '/categoria-produto/hp/', ibm: '/categoria-produto/ibm/' };
const pageUrl = (key: Key, n: number) => `${PATH[key]}${n > 1 ? `page/${n}/` : ''}`;
const visibleIds = (page: Page) => page.locator('.pc:not([hidden])').evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.product)));
const squash = (s: string) => s.replace(/\s+/g, '');

test.describe('catálogo: preservação do WordPress', () => {
  test('dados sincronizados: todos os produtos, com a imagem original e o mesmo link', async () => {
    const ids = Object.keys(PRODUCTS).map(Number).sort((a, b) => a - b);
    expect(ids).toEqual(Object.keys(LISTINGS.servidores.products).map(Number).sort((a, b) => a - b));
    for (const key of Object.keys(LISTINGS) as Key[]) {
      for (const [id, p] of Object.entries(LISTINGS[key].products)) {
        const d = PRODUCTS[id];
        expect(d.url, p.name).toBe(p.url);
        // A miniatura do WordPress é a mesma imagem destacada, recortada (ex.: -300x300).
        expect(d.imageSrc.replace(/\.\w+$/, ''), p.name).toBe(p.image.replace(/-\d+x\d+(?=\.\w+$)/, '').replace(/\.\w+$/, ''));
      }
    }
  });

  for (const key of Object.keys(LISTINGS) as Key[]) {
    test(`${key}: mesmas páginas, produtos, nomes, links, preços e botões`, async ({ page }) => {
      const L = LISTINGS[key];
      for (const [i, ids] of L.pages.entries()) {
        await page.goto(pageUrl(key, i + 1));
        expect(await visibleIds(page)).toEqual(ids);
        const first = i * L.perPage + 1;
        const last = first + ids.length - 1;
        await expect(page.locator('[data-cat-count]')).toHaveText(
          L.total === ids.length ? `Mostrando todos os ${L.total} resultados` : `Mostrando ${first}–${last} de ${L.total} resultados`,
        );
        for (const id of ids) {
          const o = L.products[String(id) as keyof typeof L.products] as { name: string; url: string; price: string; button: { text: string; href: string } };
          const card = page.locator(`.pc[data-product="${id}"]`);
          await expect(card.locator('.pc-title a')).toHaveText(o.name);
          await expect(card.locator('.pc-title a')).toHaveAttribute('href', o.url);
          // Preço exatamente como no WordPress (sem preço publicado: "Sob consulta").
          const price = (await card.locator('.pc-price').textContent())!;
          if (o.price) expect(squash(price)).toBe(squash(o.price));
          else expect(price.trim()).toBe('Sob consulta');
          const btn = card.locator('.pc-btn');
          await expect(btn).toHaveText(o.button.text);
          // Mesmo destino: página do produto (variações) ou o mesmo "adicionar ao carrinho".
          const href = o.button.href.startsWith('?') ? `${o.url}${o.button.href}` : o.button.href;
          await expect(btn).toHaveAttribute('href', href);
          await expect(card.locator('img')).toHaveAttribute('alt', o.name);
        }
      }
      // Não existe página além da última do WordPress.
      if (L.pages.length > 1) {
        await expect(page.getByRole('link', { name: 'Próxima página' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Página anterior' })).toHaveAttribute('href', pageUrl(key, L.pages.length - 1));
      }
    });
  }

  test('ordenações iguais às do WordPress (?orderby=), com paginação', async ({ page }) => {
    for (const key of ['dell', 'hp', 'ibm', 'servidores'] as Key[]) {
      const L = LISTINGS[key];
      for (const [orderby, expected] of Object.entries(L.orders)) {
        const ids: number[] = [];
        for (let n = 1; n <= L.pages.length; n++) {
          await page.goto(`${pageUrl(key, n)}?orderby=${orderby}`);
          ids.push(...(await visibleIds(page)));
        }
        expect(ids, `${key} ${orderby}`).toEqual(expected);
      }
    }
  });

  test('imagens carregam e nenhum card fica sem foto', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    for (let n = 1; n <= LISTINGS.servidores.pages.length; n++) {
      await page.goto(pageUrl('servidores', n));
      await page.evaluate(() => document.querySelectorAll<HTMLImageElement>('.pc:not([hidden]) img').forEach((i) => (i.loading = 'eager')));
      await expect.poll(() => page.locator('.pc:not([hidden]) img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
    }
    expect(failed).toEqual([]);
  });
});

test.describe('catálogo: busca, filtros, ordenação e paginação', () => {
  test('busca, filtro por categoria e limpeza, com o estado na URL e no histórico', async ({ page }) => {
    await page.goto('/servidores/');
    await page.fill('#cat-q', 'r740');
    await expect(page).toHaveURL(/\?busca=r740$/);
    const ids = await visibleIds(page);
    expect(ids.length).toBeGreaterThan(0);
    for (const name of await page.locator('.pc:not([hidden]) .pc-title a').allTextContents()) expect(name.toLowerCase()).toContain('r740');
    // Filtro por categoria real (contagem acompanha a busca).
    await page.locator('[data-cat-tipo="fans"]').click();
    await expect(page).toHaveURL(/tipo=fans/);
    for (const tags of await page.locator('.pc:not([hidden]) .pc-tags').allTextContents()) expect(tags).toContain('Fans');
    await expect(page.locator('[data-cat-tipo="fans"]')).toHaveAttribute('aria-pressed', 'true');
    // Sem resultados: aviso e saída.
    await page.fill('#cat-q', 'modelo que não existe');
    await expect(page.locator('[data-cat-empty]')).toBeVisible();
    await expect(page.locator('[data-cat-count]')).toHaveText('Nenhum resultado');
    await page.locator('[data-cat-reset]').click();
    await expect(page.locator('[data-cat-count]')).toHaveText('Mostrando 1–12 de 74 resultados');
    await expect(page).toHaveURL(/\/servidores\/$/);
    // Voltar no navegador restaura o estado anterior.
    await page.goBack();
    await expect(page.locator('[data-cat-empty]')).toBeVisible();
  });

  test('busca ignora acentos e maiúsculas e procura também nos atributos', async ({ page }) => {
    await page.goto('/categoria-produto/dell/');
    await page.fill('#cat-q', 'POWEREDGE 128gb');
    await expect(page).toHaveURL(/busca=POWEREDGE\+128gb/);
    await expect(page.locator('[data-cat-count]')).not.toHaveText('Nenhum resultado');
    for (const card of await page.locator('.pc:not([hidden])').all()) await expect(card.locator('.pc-spec')).toContainText('128');
  });

  test('ordenação e paginação mantêm busca e filtro nos links', async ({ page }) => {
    await page.goto('/servidores/?tipo=rack&orderby=price');
    await expect(page.locator('#cat-order')).toHaveValue('price');
    const p1 = await visibleIds(page);
    expect(p1).toEqual(catalog.listings.servidores.orders.price.filter((id) => (catalog.products as Record<string, { categories: string[] }>)[id].categories.includes('rack')).slice(0, 12));
    const next = page.getByRole('link', { name: 'Próxima página' });
    await expect(next).toHaveAttribute('href', '/servidores/page/2/?orderby=price&tipo=rack');
    await next.click();
    await expect(page).toHaveURL(/\/servidores\/page\/2\/\?orderby=price&tipo=rack$/);
    await expect(page.locator('[data-cat-count]')).toContainText('Mostrando 13–24 de 37 resultados');
    await expect(page.locator('[data-cat-count]')).toBeFocused();
  });

  test('endereço antigo do WordPress (?product-page=N) continua funcionando', async ({ page }) => {
    await page.goto('/servidores/?product-page=3');
    await expect(page).toHaveURL(/\/servidores\/page\/3\/$/);
    expect(await visibleIds(page)).toEqual(LISTINGS.servidores.pages[2]);
  });

  test('navegação entre fabricantes nas 4 páginas, mantendo a busca', async ({ page }) => {
    for (const key of Object.keys(PATH) as Key[]) {
      await page.goto(PATH[key]);
      const nav = page.getByRole('navigation', { name: 'Fabricantes' });
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', PATH[key]);
      for (const k of Object.keys(PATH) as Key[]) await expect(nav.locator(`a[href="${PATH[k]}"]`)).toHaveCount(1);
    }
    await page.goto('/servidores/');
    await page.fill('#cat-q', 'r640');
    await page.getByRole('navigation', { name: 'Fabricantes' }).getByRole('link', { name: /^Dell/ }).click();
    await expect(page).toHaveURL(/\/categoria-produto\/dell\/\?busca=r640$/);
    await expect(page.locator('#cat-q')).toHaveValue('r640');
    expect((await visibleIds(page)).length).toBeGreaterThan(0);
  });
});

test.describe('catálogo: página, telas e acessibilidade', () => {
  test('SEO e cabeçalho como no WordPress; menu marca Servidores', async ({ page, isMobile }) => {
    for (const key of Object.keys(PATH) as Key[]) {
      await page.goto(PATH[key]);
      await expect(page).toHaveTitle(LISTINGS[key].title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', LISTINGS[key].canonical);
      await expect(page.locator('meta[name="description"]')).toHaveCount(0);
      await expect(page.locator('h1')).toHaveText(key === 'servidores' ? 'Servidores' : key === 'dell' ? 'Dell' : key.toUpperCase());
      const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
      expect(ld['@graph'].some((n: { '@type': string }) => n['@type'] === 'CollectionPage')).toBe(true);
      if (!isMobile) await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Servidores', exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('layout: colunas, cards legíveis e sem rolagem lateral', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const key of Object.keys(PATH) as Key[]) {
      await page.goto(PATH[key]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const cols = await page.locator('[data-cat-grid]').evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(isMobile ? 1 : 4);
      const card = page.locator('.pc:not([hidden])').first();
      const btn = (await card.locator('.pc-btn').boundingBox())!;
      expect(btn.height).toBeGreaterThanOrEqual(44);
      if (isMobile) {
        // Celular: foto ao lado do nome e preço; botão na largura do card.
        const media = (await card.locator('.pc-media').boundingBox())!;
        const title = (await card.locator('.pc-title').boundingBox())!;
        expect(title.x).toBeGreaterThan(media.x + media.width - 1);
        const box = (await card.boundingBox())!;
        expect(btn.width).toBeGreaterThan(box.width * 0.85);
      }
    }
    expect(errors).toEqual([]);
  });

  test('acessibilidade (axe, WCAG 2.1 AA): lista, busca e sem resultados', async ({ page }) => {
    const axe = async () => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`);
    await page.goto('/servidores/');
    expect(await axe()).toEqual([]);
    await page.goto('/categoria-produto/dell/?busca=r7');
    await page.waitForTimeout(500);
    expect(await axe()).toEqual([]);
    await page.goto('/categoria-produto/ibm/?busca=inexistente');
    await expect(page.locator('[data-cat-empty]')).toBeVisible();
    expect(await axe()).toEqual([]);
  });
});

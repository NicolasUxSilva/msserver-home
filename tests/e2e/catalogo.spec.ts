import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-catalog.json' with { type: 'json' };
import catalog from '../../src/data/catalog.json' with { type: 'json' };

// Catálogo: /servidores/, categorias de fabricante (Dell, HP, IBM) e de componentes (Componentes,
// Baterias, Dissipadores, Fans, Fontes, Gavetas, Placas de Rede). A referência é o catálogo
// publicado no WordPress (tests/fixtures/original-catalog.json, capturado das páginas originais):
// os mesmos produtos, na mesma ordem, nas mesmas páginas, com os mesmos nomes, links, preços,
// botões e imagens. Nenhuma requisição sai para o site de produção durante os testes.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const COMPONENTS = ['componentes', 'baterias', 'dissipadores', 'fans', 'fontes', 'gavetas', 'placas-de-rede'] as const;
type Component = (typeof COMPONENTS)[number];
type Key = 'servidores' | 'dell' | 'hp' | 'ibm' | Component;
const LISTINGS = original.listings as unknown as Record<Key, (typeof original.listings)['dell'] & { orders: Record<string, number[]> }>;
const PRODUCTS = catalog.products as unknown as Record<string, { url: string; imageSrc: string; categories: string[]; button: { url: string; kind: string } }>;
const PATH = Object.fromEntries(Object.keys(LISTINGS).map((k) => [k, k === 'servidores' ? '/servidores/' : `/categoria-produto/${k}/`])) as Record<Key, string>;
const KEYS = Object.keys(PATH) as Key[];
/** Título exibido: o publicado, com os fabricantes em caixa de marca (DELL → Dell). */
const H1: Record<Key, string> = { servidores: 'Servidores', dell: 'Dell', hp: 'HP', ibm: 'IBM', componentes: 'Componentes', baterias: 'Baterias', dissipadores: 'Dissipadores', fans: 'Fans', fontes: 'Fontes', gavetas: 'Gavetas', 'placas-de-rede': 'Placas de Rede' };
const NAV = 'Categorias do catálogo';
/** Página do produto neste site (o mesmo endereço do WooCommerce, /servidor/slug/). */
const local = (url: string) => url.replace(/^https:\/\/msserver\.com\.br(?=\/servidor\/)/, '');
const CART = '/carrinho/';
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
          // O card leva à página do produto reconstruída, no mesmo endereço do WordPress.
          await expect(card.locator('.pc-title a')).toHaveAttribute('href', local(o.url));
          // Preço exatamente como no WordPress (sem preço publicado: "Sob consulta").
          const price = (await card.locator('.pc-price').textContent())!;
          if (o.price) expect(squash(price)).toBe(squash(o.price));
          else expect(price.trim()).toBe('Sob consulta');
          const btn = card.locator('.pc-btn');
          await expect(btn).toHaveText(o.button.text);
          // Mesmo destino: página do produto (variações) ou o mesmo "adicionar ao carrinho".
          // "Adicionar ao carrinho" abre o carrinho deste site com o mesmo ?add-to-cart=ID; os demais
          // botões levam à página do produto.
          const href = o.button.href.startsWith('?') ? `${CART}${o.button.href}` : local(o.button.href);
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
    for (const key of KEYS) {
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

  test('componentes: inventário completo de cada categoria, sem misturar categorias', async ({ page }) => {
    for (const key of COMPONENTS) {
      const L = LISTINGS[key];
      const seen: number[] = [];
      for (let n = 1; n <= L.pages.length; n++) {
        await page.goto(pageUrl(key, n));
        seen.push(...(await visibleIds(page)));
      }
      // Mesmos produtos do WordPress, cada um uma vez, todos da categoria da página.
      expect(seen, key).toEqual(L.pages.flat());
      expect(new Set(seen).size).toBe(L.total);
      for (const id of seen) expect(PRODUCTS[id].categories, `${key} ${id}`).toContain(key);
      // A página traz só os cards desta categoria (nenhum de outra escondido na grade).
      expect(await page.locator('.pc').count()).toBe(L.total);
      await expect(page.locator('.cat-sub b')).toHaveText(String(L.total));
    }
  });

  test('imagens carregam e nenhum card fica sem foto', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    const all = [...LISTINGS.servidores.pages.map((_, i) => pageUrl('servidores', i + 1)), ...COMPONENTS.flatMap((k) => LISTINGS[k].pages.map((_, i) => pageUrl(k, i + 1)))];
    for (const url of all) {
      await page.goto(url);
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
    // Categoria escolhida no seletor (só categorias reais; a contagem de cada opção acompanha a busca).
    await expect(page.locator('#cat-tipo option[value="fans"]')).toHaveText(/^Fans \(\d+\)$/);
    await expect(page.locator('#cat-tipo option[value="placas-de-rede"]')).toBeDisabled();
    await page.selectOption('#cat-tipo', 'fans');
    await expect(page).toHaveURL(/tipo=fans/);
    for (const tags of await page.locator('.pc:not([hidden]) .pc-tags').allTextContents()) expect(tags).toContain('Fans');
    await expect(page.locator('#cat-tipo')).toHaveValue('fans');
    await expect(page.locator('[data-cat-active]')).toContainText('Fans');
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

  test('navegação entre as 11 listagens em todas as páginas, com a atual marcada e a busca mantida', async ({ page }) => {
    for (const key of KEYS) {
      await page.goto(PATH[key]);
      const nav = page.getByRole('navigation', { name: NAV });
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', PATH[key]);
      // Dois grupos, como no menu do site: Servidores (todos e fabricantes) e Componentes.
      await expect(nav.getByRole('list', { name: 'Servidores' }).getByRole('link')).toHaveCount(4);
      await expect(nav.getByRole('list', { name: 'Componentes' }).getByRole('link')).toHaveCount(7);
      for (const k of KEYS) await expect(nav.locator(`a[href="${PATH[k]}"]`)).toContainText(String(LISTINGS[k].total));
    }
    await page.goto('/servidores/');
    await page.fill('#cat-q', 'r640');
    await page.getByRole('navigation', { name: NAV }).getByRole('link', { name: /^Dell/ }).click();
    await expect(page).toHaveURL(/\/categoria-produto\/dell\/\?busca=r640$/);
    await expect(page.locator('#cat-q')).toHaveValue('r640');
    expect((await visibleIds(page)).length).toBeGreaterThan(0);
    // De um fabricante para uma categoria de componentes, e entre componentes, a busca segue junto.
    await page.getByRole('navigation', { name: NAV }).getByRole('link', { name: /^Fans/ }).click();
    await expect(page).toHaveURL(/\/categoria-produto\/fans\/\?busca=r640$/);
    await expect.poll(() => visibleIds(page)).toEqual([7858]);
    await page.getByRole('navigation', { name: NAV }).getByRole('link', { name: /^Dissipadores/ }).click();
    await expect(page).toHaveURL(/\/categoria-produto\/dissipadores\/\?busca=r640$/);
    await expect.poll(() => visibleIds(page)).toEqual([7850]);
  });

  test('trilha das categorias de componentes, como no menu do site', async ({ page }) => {
    await page.goto('/categoria-produto/baterias/');
    const trail = page.getByRole('navigation', { name: 'Você está em' });
    await expect(trail.getByRole('listitem')).toHaveText(['Início', 'Servidores', 'Componentes', 'Baterias']);
    await expect(trail.getByRole('link', { name: 'Componentes' })).toHaveAttribute('href', '/categoria-produto/componentes/');
    await expect(trail.getByRole('link', { name: 'Servidores' })).toHaveAttribute('href', '/servidores/');
    await expect(trail.locator('[aria-current="page"]')).toHaveText('Baterias');
    await page.goto('/categoria-produto/componentes/page/2/');
    await expect(trail.getByRole('listitem')).toHaveText(['Início', 'Servidores', 'Componentes', 'Página 2']);
    await expect(trail.getByRole('link', { name: 'Componentes' })).toHaveAttribute('href', '/categoria-produto/componentes/');
  });

  test('componentes: seletor de categoria só com subcategorias reais; categorias de um tipo só, sem seletor', async ({ page }) => {
    await page.goto('/categoria-produto/componentes/');
    await expect(page.locator('#cat-tipo option')).toHaveText(['Todas', 'Dissipadores (5)', 'Fans (5)', 'Fontes (4)', 'Gavetas (4)']);
    await page.selectOption('#cat-tipo', 'fans');
    await expect(page).toHaveURL(/\/categoria-produto\/componentes\/\?tipo=fans$/);
    // O filtro mostra exatamente os produtos da categoria Fans, na ordem padrão da loja.
    expect(await visibleIds(page)).toEqual(LISTINGS.fans.pages.flat());
    await expect(page.locator('[data-cat-count]')).toHaveText('Mostrando todos os 5 resultados');
    await expect(page.locator('[data-cat-pages]')).toBeHidden();
    // Em Fans, Baterias etc. todos os produtos têm as mesmas categorias: nenhum filtro que não filtra.
    for (const key of COMPONENTS.filter((k) => k !== 'componentes')) {
      await page.goto(PATH[key]);
      await expect(page.locator('#cat-tipo')).toHaveCount(0);
      await expect(page.locator('#cat-order option')).toHaveCount(6);
    }
  });

  test('componentes: busca por código, sem resultados, ordenação por preço e paginação', async ({ page }) => {
    // Código da peça no nome (part number).
    await page.goto('/categoria-produto/fontes/');
    await page.fill('#cat-q', '723595-101');
    await expect(page).toHaveURL(/busca=723595-101$/);
    expect(await visibleIds(page)).toEqual([7864]);
    await page.fill('#cat-q', 'hp 750w');
    await expect(page).toHaveURL(/busca=hp\+750w$/);
    expect(await visibleIds(page)).toEqual([7866]);
    await page.fill('#cat-q', 'r9999');
    await expect(page.locator('[data-cat-empty]')).toBeVisible();
    await expect(page.locator('[data-cat-empty-text]')).toHaveText('Nenhum produto desta categoria corresponde a “r9999”.');
    await expect(page.locator('[data-cat-search-all]')).toHaveAttribute('href', 'https://msserver.com.br/?post_type=product&s=r9999');
    await page.locator('[data-cat-reset]').click();
    expect(await visibleIds(page)).toEqual(LISTINGS.fontes.pages.flat());
    // Ordenação por preço nas baterias (preços publicados de R$ 350 a R$ 950).
    await page.goto('/categoria-produto/baterias/');
    await page.selectOption('#cat-order', 'price-desc');
    await expect(page).toHaveURL(/\?orderby=price-desc$/);
    expect(await visibleIds(page)).toEqual(LISTINGS.baterias.orders['price-desc']);
    // Componentes: 18 produtos em 2 páginas de 16, trocadas no navegador.
    await page.goto('/categoria-produto/componentes/');
    await page.getByRole('navigation', { name: 'Paginação' }).getByRole('link', { name: 'Página 2' }).click();
    await expect(page).toHaveURL(/\/categoria-produto\/componentes\/page\/2\/$/);
    expect(await visibleIds(page)).toEqual(LISTINGS.componentes.pages[1]);
    await expect(page.locator('[data-cat-count]')).toHaveText('Mostrando 17–18 de 18 resultados');
    await page.goBack();
    expect(await visibleIds(page)).toEqual(LISTINGS.componentes.pages[0]);
  });

  test('componentes: card abre a página do produto; "Orçamento" adiciona pelo carrinho', async ({ page }) => {
    await page.goto('/categoria-produto/fans/');
    // Clique sobre a foto (o link do nome cobre o card inteiro) leva à página do produto.
    const card = page.locator('.pc[data-product="7854"]');
    const media = (await card.locator('.pc-media').boundingBox())!;
    const box = (await card.boundingBox())!;
    await card.click({ position: { x: media.x - box.x + media.width / 2, y: media.y - box.y + media.height / 2 } });
    await expect(page).toHaveURL(new RegExp(`${local(PRODUCTS['7854'].url)}$`));
    await expect(page.locator('h1')).toHaveText('Fan Dell poweredge R620 R320 R630 gfc0412ds-hr6c0-0hr6c0');
    await page.goto('/categoria-produto/placas-de-rede/');
    const btn = page.locator('.pc[data-product="7828"] .pc-btn');
    await expect(btn).toHaveText('Orçamento');
    await expect(btn).toHaveAttribute('href', `${CART}?add-to-cart=7828`);
    await expect(btn).toHaveAttribute('rel', 'nofollow');
    await expect(page.locator('.pc[data-product="7828"] .pc-price')).toHaveText('R$ 950,00');
  });

  test('cards de componentes: etiqueta só quando informa (sem repetir a categoria da página)', async ({ page }) => {
    await page.goto('/categoria-produto/fans/');
    await expect(page.locator('.pc-tags')).toHaveCount(0);
    await page.goto('/categoria-produto/componentes/');
    await expect(page.locator('.pc[data-product="7854"] .pc-tag')).toHaveText(['Fans']);
    await expect(page.locator('.pc[data-product="7842"] .pc-tag')).toHaveText(['Dissipadores']);
    // No catálogo geral, as etiquetas continuam como antes.
    await page.goto('/servidores/page/6/');
    await expect(page.locator('.pc[data-product="7854"] .pc-tag')).toHaveText(['Componentes', 'Fans']);
  });
});

test.describe('catálogo: página, telas e acessibilidade', () => {
  test('SEO e cabeçalho como no WordPress; menu marca Servidores', async ({ page, isMobile }) => {
    for (const key of KEYS) {
      await page.goto(PATH[key]);
      await expect(page).toHaveTitle(LISTINGS[key].title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', LISTINGS[key].canonical);
      await expect(page.locator('meta[name="description"]')).toHaveCount(0);
      await expect(page.locator('h1')).toHaveText(H1[key]);
      const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
      expect(ld['@graph'].some((n: { '@type': string }) => n['@type'] === 'CollectionPage')).toBe(true);
      if (!isMobile) await expect(page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Servidores', exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('layout: colunas, cards legíveis e sem rolagem lateral', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const key of KEYS) {
      await page.goto(PATH[key]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      // Nome completo de cada produto, sem corte (nas peças, o código no fim do nome identifica o item).
      expect(await page.locator('.pc:not([hidden]) .pc-title').evaluateAll((ts) => ts.filter((t) => t.scrollHeight > t.clientHeight + 1).length)).toBe(0);
      // A categoria atual fica à vista na navegação (no celular, a linha desliza até ela).
      const cur = (await page.getByRole('navigation', { name: NAV }).locator('[aria-current="page"]').boundingBox())!;
      expect(cur.x).toBeGreaterThanOrEqual(0);
      expect(cur.x + cur.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      // Ferramentas enxutas: busca, categoria e ordenação, sem linha de chips. No desktop, numa linha só.
      const tools = await page.locator('.cat-tools > *').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      if (!isMobile) expect(new Set(tools).size).toBe(1);
      await expect(page.locator('.cat-tools button[aria-pressed]')).toHaveCount(0);
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
    await page.goto('/categoria-produto/componentes/?tipo=fontes');
    await page.waitForTimeout(500);
    expect(await axe()).toEqual([]);
    await page.goto('/categoria-produto/placas-de-rede/');
    expect(await axe()).toEqual([]);
  });
});

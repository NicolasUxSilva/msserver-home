import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import blog from '../../src/data/blog.json' with { type: 'json' };

// Blog: listagem, categorias e artigos nos mesmos endereços do WordPress, com o conteúdo sincronizado
// do WordPress (src/data/blog.json). Os testes conferem que cada artigo publica o texto completo, o
// título, a data, o SEO do All in One SEO e o endereço oficial; e que a busca, a paginação, as
// categorias, o compartilhamento e a home usam os dados reais. Nenhuma requisição sai para a produção.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|youtube-nocookie|ytimg|googletag|facebook|clarity|cloudfront|wa\.me|linkedin/, (r) => r.abort());
});

type Post = { id: number; slug: string; url: string; date: string; title: string; excerpt: string; categories: string[]; content: string; seo: { title: string; description: string } };
const POSTS = (blog.posts as Post[]).slice().sort((a, b) => b.date.localeCompare(a.date));
const CATS = blog.categories as { slug: string; name: string; count: number }[];

/** Percorre a página (as animações de entrada começam ao aparecer na tela) e espera todas terminarem,
 *  para o axe medir o contraste das cores finais, como no teste da home. */
const settle = async (page: Page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.offsetParent !== null && getComputedStyle(el).opacity !== '1').length))
    .toBe(0);
};
test.describe('blog: listagem e categorias', () => {
  test('/blog/: as postagens mais recentes, 12 por página, como no WordPress', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page).toHaveTitle('Blog - MSSERVER');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/blog/');
    await expect(page.locator('h1')).toHaveText('Blog');
    await expect(page.locator('.cat-sub')).toContainText(`${POSTS.length} artigos`);
    const titles = await page.locator('[data-blog-grid] .bp-title').allTextContents();
    expect(titles).toEqual(POSTS.slice(0, 12).map((p) => p.title));
    // Página 2 com as 12 seguintes e canonical próprio.
    await page.locator('.cat-pages a[aria-label="Página 2"]').click();
    await expect(page).toHaveURL(/\/blog\/page\/2\/$/);
    expect(await page.locator('[data-blog-grid] .bp-title').allTextContents()).toEqual(POSTS.slice(12, 24).map((p) => p.title));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/blog/page/2/');
  });

  test('categorias: navegação e listagem de cada uma (/category/slug/)', async ({ page }) => {
    for (const c of CATS) {
      await page.goto(`/category/${c.slug}/`);
      await expect(page.locator('h1')).toHaveText(c.name);
      const n = Math.min(12, c.count);
      await expect(page.locator('[data-blog-grid] .bp-card')).toHaveCount(n);
    }
    // "Sem categoria" (padrão do WordPress) não aparece na navegação, mas a página continua existindo.
    await page.goto('/blog/');
    await expect(page.locator('.cat-brands a', { hasText: 'Sem categoria' })).toHaveCount(0);
  });

  test('busca nos artigos: resultados de todas as páginas, termo no endereço', async ({ page }) => {
    const target = POSTS[20];
    const word = target.title.split(' ').find((w) => w.length > 6)!;
    await page.goto('/blog/');
    await page.locator('[data-blog-q]').fill(word);
    await page.locator('[data-blog-q]').press('Enter');
    await expect(page).toHaveURL(new RegExp(`busca=${encodeURIComponent(word).replace(/%/g, '%')}`));
    await expect(page.locator('[data-blog-results] .bp-title', { hasText: target.title })).toBeVisible();
    await expect(page.locator('[data-blog-grid]')).toBeHidden();
    await page.locator('[data-blog-q]').fill('xyzinexistente');
    await page.locator('[data-blog-q]').press('Enter');
    await expect(page.locator('[data-blog-empty]')).toBeVisible();
    await page.locator('[data-blog-reset]').click();
    await expect(page.locator('[data-blog-grid]')).toBeVisible();
  });
});

test.describe('blog: artigos', () => {
  test('cada artigo: texto completo, título, data, SEO e endereço do WordPress', async ({ page }) => {
    test.setTimeout(240_000);
    for (const p of POSTS) {
      const res = await page.goto(`/${p.slug}/`);
      expect(res?.status(), p.slug).toBe(200);
      await expect(page.locator('h1'), p.slug).toHaveText(p.title);
      expect(await page.locator('h1').count(), p.slug).toBe(1);
      await expect(page, p.slug).toHaveTitle(p.seo.title);
      await expect(page.locator('link[rel="canonical"]'), p.slug).toHaveAttribute('href', p.url);
      await expect(page.locator('meta[property="og:type"]'), p.slug).toHaveAttribute('content', 'article');
      await expect(page.locator('time').first(), p.slug).toHaveAttribute('datetime', `${p.date}-03:00`);
      if (!p.content.trim()) {
        await expect(page.locator('meta[name="robots"]'), p.slug).toHaveAttribute('content', 'noindex, follow');
        continue;
      }
      // O texto publicado inteiro, na mesma ordem (o texto do HTML do WordPress, lido pelo navegador,
      // sem espaços, para comparar com o texto exibido).
      const [published, shown] = await page.evaluate((html) => {
        const d = document.createElement('div');
        d.innerHTML = html;
        d.querySelectorAll('script, style, noscript').forEach((e) => e.remove());
        return [d.textContent ?? '', document.querySelector('.post-prose')?.textContent ?? ''].map((t) => t.replace(/\s+/g, ''));
      }, p.content);
      expect(shown, p.slug).toBe(published);
    }
  });

  test('artigo: compartilhar, anterior e seguinte, leitura relacionada e links internos', async ({ page }) => {
    const p = POSTS[1];
    await page.goto(`/${p.slug}/`);
    const share = page.locator('.post-share');
    await expect(share.locator('a[aria-label="Compartilhar no Facebook"]')).toHaveAttribute('href', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}`);
    await expect(share.locator('a[aria-label="Compartilhar no LinkedIn"]')).toHaveAttribute('href', new RegExp(encodeURIComponent(p.url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.locator('.post-nav-link--next .post-nav-title')).toHaveText(POSTS[0].title);
    await expect(page.locator('.post-nav-link--prev .post-nav-title')).toHaveText(POSTS[2].title);
    await expect(page.locator('.post-related .bp-card')).toHaveCount(3);
    // Links do conteúdo para páginas deste site são internos; nenhum aponta para o checkout.
    const hrefs = await page.locator('.post-prose a').evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
    for (const h of hrefs) expect(h, h).not.toMatch(/finalizar-compra|add-to-cart/);
  });

  test('home: as três postagens mais recentes do blog, com links para os artigos', async ({ page }) => {
    await page.goto('/');
    const links = await page.locator('#blog .post-title a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(links).toEqual(POSTS.slice(0, 3).map((p) => `/${p.slug}/`));
  });

  test('telas: sem rolagem lateral e acessibilidade (axe) na listagem e no artigo', async ({ page }) => {
    for (const path of ['/blog/', `/${POSTS[0].slug}/`, `/category/${CATS.find((c) => c.slug !== 'sem-categoria')!.slug}/`]) {
      await page.goto(path);
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      expect(sw, path).toBe(iw);
      await settle(page);
      const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`), path).toEqual([]);
    }
  });
});

import { expect, test, type Page } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-cases.json' with { type: 'json' };
import catalog from '../../src/data/catalog.json' with { type: 'json' };

// Páginas novas desta etapa: Cases de sucesso (conteúdo publicado no WordPress, tests/fixtures/
// original-cases.json), 404, política de privacidade (estrutura, sem texto jurídico), Soluções Cloud
// e Servidores Físicos (as landings integradas), robots.txt, sitemap do site, casca do suporte e as categorias Rack, Torre e
// Escala Nuvem. Nenhuma requisição sai para a produção.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

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

test.describe('cases de sucesso', () => {
  test('conteúdo publicado: textos, números, os seis cases e as imagens dos clientes', async ({ page }) => {
    await page.goto('/cases-de-sucesso/');
    await expect(page).toHaveTitle('Cases de sucesso - MSSERVER');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://msserver.com.br/cases-de-sucesso/');
    const text = squash(await page.locator('main').innerText()).toLowerCase();
    // Todos os textos publicados, menos o "Ver case completo →" (não era link no WordPress), com a
    // grafia "Indústria" e as quebras de linha do Elementor unidas.
    const expected = original.texts.filter((t) => !/^Ver case completo|^•$|^\d$/.test(t)).map((t) => (t === 'Industria' ? 'Indústria' : t));
    for (const t of expected) expect(text, t).toContain(squash(t).toLowerCase());
    await expect(page.locator('.cs-card')).toHaveCount(6);
    // As imagens carregam (cartões dos clientes publicados).
    const imgs = page.locator('.cs-media img');
    for (let i = 0; i < 6; i++) {
      await imgs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(() => imgs.nth(i).evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    expect(await imgs.evaluateAll((els) => els.map((e) => e.getAttribute('alt')))).toEqual(['Lumiar Healthcare', 'Grupo Terracom', 'Ourominas Ouro e Câmbio', 'Datasafer', 'Forças Armadas', 'Rumo']);
  });

  test('contatos: WhatsApp comercial do site (sem o número fictício) e o orçamento', async ({ page }) => {
    await page.goto('/cases-de-sucesso/');
    const html = await page.content();
    expect(html).not.toContain('5511999999999');
    expect(html).not.toContain('figma.site');
    const was = await page.locator('main a[href*="wa.me"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
    expect(was.length).toBeGreaterThanOrEqual(2);
    for (const w of was) expect(w).toMatch(/^https:\/\/wa\.me\/5511985991837/);
    await expect(page.getByRole('link', { name: 'Solicitar Orçamento' })).toHaveAttribute('href', '/orcamento/');
    await expect(page.getByRole('link', { name: 'Ver cases' })).toHaveAttribute('href', '#cases');
  });

  test('telas: sem rolagem lateral e acessibilidade (axe)', async ({ page }) => {
    await page.goto('/cases-de-sucesso/');
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw).toBe(iw);
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});

test.describe('404, privacidade, robots e sitemap', () => {
  test('404: status, mensagem, busca no catálogo e caminhos do site', async ({ page }) => {
    const res = await page.goto('/endereco-que-nao-existe/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Página não encontrada');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.getByRole('link', { name: 'Ir para a página inicial' })).toHaveAttribute('href', '/');
    await expect(page.locator('.nf-links a').first()).toHaveAttribute('href', '/servidores/');
    await page.locator('#nf-q').fill('r640');
    await Promise.all([page.waitForURL(/\/servidores\/\?busca=r640$/), page.locator('#nf-q').press('Enter')]);
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });

  test('política de privacidade: estrutura pronta, conteúdo pendente marcado e fora dos buscadores', async ({ page }) => {
    await page.goto('/politica-de-privacidade/');
    await expect(page.locator('h1')).toHaveText('Política de privacidade');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('.pp-pending')).toContainText('Conteúdo em aprovação');
    await expect(page.locator('.pp-placeholder').first()).toHaveText('[Conteúdo jurídico pendente de aprovação]');
    await expect(page.locator('.pp-table-wrap tbody tr')).toHaveCount(10);
    // Nenhuma afirmação de conformidade enquanto o texto não for aprovado.
    expect(await page.locator('main').innerText()).not.toMatch(/em conformidade com a LGPD|cumpre a LGPD/i);
    // Link no rodapé de todas as páginas e junto dos formulários.
    for (const path of ['/', '/orcamento/', '/nuvem-privada/', '/extencao-de-garantia/', '/finalizar-compra/']) {
      await page.goto(path);
      await expect(page.locator('footer a[href="/politica-de-privacidade/"]'), path).toHaveCount(1);
    }
    for (const path of ['/orcamento/', '/extencao-de-garantia/', '/backup-em-nuvem/', '/consultoria-em-implantacao-de-servidores/', '/nuvem-privada/']) {
      await page.goto(path);
      expect(await page.locator('form .privacy-note a[href="/politica-de-privacidade/"]').count(), path).toBeGreaterThan(0);
    }
  });

  test('robots.txt e sitemap do site: páginas indexáveis, sem transação', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://msserver.com.br/sitemap-site.xml');
    expect(robots).toContain('Sitemap: https://msserver.com.br/sitemap.xml');
    expect(robots).toContain('Disallow: /wp-admin/');
    const xml = await (await request.get('/sitemap-site.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toContain('https://msserver.com.br/');
    expect(locs).toContain('https://msserver.com.br/solucoes-cloud/');
    expect(locs).toContain('https://msserver.com.br/servidores-fisicos/');
    expect(locs).toContain('https://msserver.com.br/categoria-produto/rack/');
    for (const p of Object.values(catalog.products as Record<string, { slug: string }>)) expect(locs).toContain(`https://msserver.com.br/servidor/${p.slug}/`);
    for (const bad of ['/carrinho/', '/finalizar-compra/', '/politica-de-privacidade/', '/parciais/']) expect(locs.some((l) => l.includes(bad)), bad).toBe(false);
    expect(new Set(locs).size).toBe(locs.length);
  });
});

test.describe('Soluções Cloud, suporte e categorias de formato', () => {
  test('landings integradas: Soluções Cloud e Servidores Físicos nas páginas do site, sem rastreamento próprio', async ({ page }) => {
    // Testes completos de cada landing: solucoes-cloud.spec.ts, solucoes-cloud-simulador.spec.ts e
    // servidores-fisicos.spec.ts. Aqui: as duas são páginas do site (cabeçalho, rodapé, layout) e
    // não carregam o GTM próprio das landings (o rastreamento segue o consentimento do site).
    for (const [path, title] of [
      ['/solucoes-cloud/', 'Infraestrutura Cloud para a TI da sua Empresa | MSSERVER'],
      ['/servidores-fisicos/', 'Servidores Físicos para Empresas | Dell, HP e IBM | MSSERVER'],
    ]) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('meta[name="generator"]')).toHaveAttribute('content', /^Astro/);
      await expect(page.locator('header.site-header nav[aria-label="Menu principal"]')).toHaveCount(1);
      expect(await page.content()).not.toContain('googletagmanager.com/gtm.js');
    }
    // Menu e banner da home levam às landings integradas.
    await page.goto('/');
    expect(await page.locator('a[href="/solucoes-cloud/"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href="/servidores-fisicos/"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="solucoes-cloud-msserver"], a[href="https://msserver.com.br/solucoes-cloud/"], a[href="https://msserver.com.br/servidores-fisicos/"]').count()).toBe(0);
  });

  test('casca do suporte: marcadores do plugin, fora dos buscadores e da navegação', async ({ page }) => {
    await page.goto('/parciais/suporte/');
    const html = await page.content();
    for (const m of ['msserver-wp-head', '%%MS_TITULO%%', '%%MS_INTRO%%', '%%MS_CONTEUDO%%', 'data-msserver-wp-footer']) expect(html, m).toContain(m);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('.sup-tabs a')).toHaveText(['Entrar', 'Enviar chamado', 'Meus chamados']);
  });

  test('Rack, Torre e Escala Nuvem: contagens do WooCommerce, navegação e etiquetas do produto', async ({ page }) => {
    const L = catalog.listings as unknown as Record<string, { total: number; category: { count: number } }>;
    for (const [slug, title] of [
      ['rack', 'Rack'],
      ['torre', 'Torre'],
      ['escala-nuvem', 'Escala Nuvem'],
    ]) {
      await page.goto(`/categoria-produto/${slug}/`);
      await expect(page.locator('h1')).toHaveText(title);
      expect(L[slug].total).toBe(L[slug].category.count);
      await expect(page.locator('.cat-sub b')).toHaveText(String(L[slug].total));
      await expect(page.locator('.pc:not([hidden])')).toHaveCount(Math.min(16, L[slug].total));
      await expect(page.locator('.cat-brand[aria-current="page"]')).toContainText(title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(`formato ${title}`));
    }
    // No produto, a etiqueta do formato leva à listagem.
    await page.goto('/servidor/servidor-dell-r740/');
    await expect(page.locator('.pd-tags a', { hasText: 'Rack' })).toHaveAttribute('href', '/categoria-produto/rack/');
    // Menu: o grupo "Por formato" dentro de Servidores.
    expect(await page.locator('a[href="/categoria-produto/escala-nuvem/"]').count()).toBeGreaterThan(0);
  });
});

test.describe('nenhum caminho para pagamento', () => {
  test('nenhuma página ou script do build leva ao checkout com pagamento do WooCommerce', async () => {
    const dist = path.resolve(import.meta.dirname, '../../dist');
    const files: string[] = [];
    const walk = async (dir: string) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) await walk(p);
        else if (/\.(html|js)$/.test(e.name)) files.push(p);
      }
    };
    await walk(dist);
    expect(files.length).toBeGreaterThan(150);
    const bad: string[] = [];
    for (const f of files) {
      const s = await readFile(f, 'utf8');
      // Formulários que enviam para a finalização de compra do WordPress, o campo "add-to-cart" do
      // WooCommerce, o checkout da Store API, a página de pagamento de pedido e campos de cartão.
      if (/action="https:\/\/msserver\.com\.br\/finalizar-compra\//.test(s)) bad.push(`${f}: formulário para o checkout do WordPress`);
      if (/name="add-to-cart"/.test(s)) bad.push(`${f}: campo add-to-cart`);
      if (/wc\/store(\/v1)?\/checkout/.test(s)) bad.push(`${f}: checkout da Store API`);
      if (/order-pay|pay_for_order/.test(s)) bad.push(`${f}: pagamento de pedido`);
      // Campos de formulário (input/select) de cartão; a meta "twitter:card" não é campo.
      if (/autocomplete="cc-|<(?:input|select)\b[^>]*\bname="[^"]*(card|cartao|cvv|cvc)[^"]*"/i.test(s)) bad.push(`${f}: campo de cartão`);
      if (/https:\/\/msserver\.com\.br\/finalizar-compra\/\?/.test(s)) bad.push(`${f}: link para o checkout do WordPress`);
    }
    expect(bad).toEqual([]);
  });
});

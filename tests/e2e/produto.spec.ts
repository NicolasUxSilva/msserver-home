import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import original from '../fixtures/original-products.json' with { type: 'json' };
import catalog from '../../src/data/catalog.json' with { type: 'json' };

// Páginas de produto (/servidor/slug/). A referência são as 74 páginas publicadas no WordPress
// (tests/fixtures/original-products.json, capturado do HTML): mesmo nome, título, descrição e JSON-LD,
// mesmas fotos na mesma ordem, mesmo preço, mesmas opções e variações (ids e preços) e o mesmo
// formulário do WooCommerce (os mesmos campos enviados ao carrinho). Nenhuma requisição sai para o
// site de produção: o carrinho do WooCommerce é respondido pelo próprio teste.
test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

type Orig = {
  id: number;
  url: string;
  title: string;
  description: string;
  h1: string;
  price: string;
  gallery: string[];
  text: string;
  schemaTypes: string[];
  form: null | {
    type: 'variable' | 'simple';
    fields: string[];
    button: string;
    addToCart?: number;
    variations?: { id: number; attributes: Record<string, string>; price: number; inStock: boolean }[];
    attribute?: { field: string; label: string; options: { value: string; label: string }[] };
  };
};
const ORIG = original.products as unknown as Record<string, Orig>;
const PRODUCTS = catalog.products as unknown as Record<string, { slug: string; url: string; name: string }>;
const path = (id: number | string) => `/servidor/${PRODUCTS[id].slug}/`;
const squash = (s: string) => s.replace(/\s+/g, '');
const IDS = Object.keys(ORIG);
const CART = 'https://msserver.com.br/carrinho/';

/** Responde o carrinho do WooCommerce no próprio teste e guarda o que o formulário enviou. */
async function catchCart(page: Page) {
  const sent: { method: string; body: string }[] = [];
  await page.route(CART, async (r) => {
    sent.push({ method: r.request().method(), body: r.request().postData() ?? '' });
    await r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Carrinho</title>' });
  });
  return sent;
}

/** Texto da descrição como no WordPress: sem marcação, entidades resolvidas, espaços simples. */
const proseText = (page: Page) =>
  page.locator('.pd-prose').evaluate((el) => {
    const ta = document.createElement('textarea');
    ta.innerHTML = el.innerHTML.replace(/<[^>]+>/g, ' ');
    return ta.value.replace(/\s+/g, ' ').trim();
  });

test.describe('produto: preservação do WordPress', () => {
  test('as 74 páginas: nome, SEO, preço, fotos, descrição, garantia e formulário iguais aos publicados', async ({ page }) => {
    test.setTimeout(240_000);
    for (const id of IDS) {
      const o = ORIG[id];
      await page.goto(path(id));
      // Mesmo endereço e SEO (All in One SEO).
      expect(PRODUCTS[id].url).toBe(o.url);
      await expect(page).toHaveTitle(o.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', o.url);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', o.description);
      // JSON-LD: o do All in One SEO (@graph) e o BreadcrumbList do WooCommerce, em blocos separados.
      const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
      expect(ld.flatMap((l) => (l['@graph'] ?? []).map((n: { '@type': string }) => n['@type'])).sort(), id).toEqual(o.schemaTypes);
      expect(ld.map((l) => l['@type'] ?? 'graph'), id).toEqual(['graph', 'BreadcrumbList']);
      await expect(page.locator('h1')).toHaveText(o.h1);
      // Fotos: as mesmas imagens, na mesma ordem.
      expect(await page.locator('.pd-shot').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.original)), id).toEqual(o.gallery);
      // Preço como no WordPress; sem preço publicado, "Sob consulta".
      if (o.price) expect(squash(await page.locator('[data-pd-range]').innerText()), id).toBe(squash(o.price));
      else await expect(page.locator('.pd-price')).toHaveText('Sob consulta');
      // Descrição: o mesmo texto.
      expect(await proseText(page), id).toBe(o.text);
      // Bloco de garantia do modelo.
      await expect(page.locator('.pd-guarantee')).toContainText('GARANTIA PADRÃO DE 1 ANO.');
      await expect(page.locator('.pd-guarantee li')).toHaveCount(3);
      // Formulário do WooCommerce.
      const form = page.locator('[data-pd-form]');
      if (!o.form) {
        await expect(form).toHaveCount(0);
        await expect(page.locator('.pd-cta')).toHaveText('Fale com um consultor');
        continue;
      }
      await expect(form).toHaveAttribute('action', CART);
      await expect(form).toHaveAttribute('method', 'post');
      await expect(form.locator('.pd-cta')).toHaveText(o.form.button);
      const names = new Set(await form.locator('input[name]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name)));
      // Mesmos campos do formulário original (no simples, o add-to-cart ia no próprio botão).
      expect([...names].sort(), id).toEqual([...new Set([...o.form.fields, ...(o.form.type === 'simple' ? ['add-to-cart'] : [])])].sort());
      await expect(form.locator('input[name="add-to-cart"]')).toHaveValue(id);
      if (o.form.type === 'variable') {
        // Opções: as que têm variação disponível no WordPress, com o mesmo valor e o mesmo texto.
        const a = o.form.attribute!;
        const used = new Set(o.form.variations!.map((v) => v.attributes[a.field]));
        const expected = a.options.filter((x) => used.has(x.value));
        const radios = await form.locator(`input[name="${a.field}"]`).evaluateAll((els) => els.map((e) => ({ value: (e as HTMLInputElement).value, label: e.parentElement!.textContent!.trim() })));
        expect(radios.sort((x, y) => x.value.localeCompare(y.value)), id).toEqual(expected.sort((x, y) => x.value.localeCompare(y.value)));
        await expect(form.locator('legend')).toHaveText(a.label);
        // Variações: os mesmos ids, opções e preços.
        const cfg = JSON.parse((await page.locator('[data-pd-config]').textContent())!);
        expect(cfg.variations.map((v: { id: number; attributes: object; price: number }) => ({ id: v.id, attributes: v.attributes, price: v.price })).sort((x: { id: number }, y: { id: number }) => x.id - y.id), id).toEqual(
          o.form.variations!.map((v) => ({ id: v.id, attributes: v.attributes, price: v.price })).sort((x, y) => x.id - y.id),
        );
      }
    }
  });

  test('dados sincronizados: cada produto do catálogo tem página, fotos e variações do WooCommerce', async () => {
    expect(Object.keys(PRODUCTS).sort()).toEqual([...IDS].sort());
    const all = catalog.products as unknown as Record<string, { gallery: { src: string }[]; variations: { id: number; purchasable: boolean }[] }>;
    for (const id of IDS) {
      expect(all[id].gallery.map((g) => g.src)).toEqual(ORIG[id].gallery);
      // As variações oferecidas no WordPress estão todas na página; as demais não têm preço.
      const offered = new Set((ORIG[id].form?.variations ?? []).map((v) => v.id));
      for (const v of all[id].variations) expect(offered.has(v.id), `${id} ${v.id}`).toBe(v.purchasable);
    }
  });
});

test.describe('produto: compra (formulário do WooCommerce)', () => {
  test('variável: escolher a memória mostra o preço dela e envia a variação ao carrinho', async ({ page }) => {
    const sent = await catchCart(page);
    await page.goto(path(4827));
    const price = page.locator('[data-pd-price]');
    await expect(price).toContainText('R$ 3.100,00');
    await expect(price).toContainText('R$ 3.950,00');
    // Sem escolher: a mensagem do WooCommerce e nada é enviado.
    await page.locator('.pd-cta').click();
    await expect(page.locator('[data-pd-msg]')).toHaveText('Selecione uma das opções do produto antes de adicioná-lo ao carrinho.');
    expect(sent).toEqual([]);
    // Opções em ordem crescente; escolher 16GB.
    await expect(page.locator('.pd-opt')).toHaveText(['8GB', '16GB']);
    await page.locator('.pd-opt', { hasText: '16GB' }).click();
    await expect(page.locator('[data-pd-msg]')).toBeHidden();
    await expect(page.locator('[data-pd-single]')).toHaveText(/^R\$\s3\.950,00$/);
    await expect(page.locator('[data-pd-range]')).toBeHidden();
    await expect(page.locator('[data-pd-variation]')).toHaveValue('5421');
    // Limpar volta à faixa de preço.
    await page.locator('[data-pd-reset]').click();
    await expect(page.locator('[data-pd-variation]')).toHaveValue('0');
    await expect(page.locator('[data-pd-range]')).toBeVisible();
    await expect(page.locator('[data-pd-single]')).toBeHidden();
    await page.locator('.pd-opt', { hasText: '8GB' }).click();
    await expect(page.locator('[data-pd-variation]')).toHaveValue('5423');
    // Quantidade: mínimo 1.
    await page.locator('[data-pd-step="-1"]').click();
    await expect(page.locator('#pd-qty')).toHaveValue('1');
    await page.locator('[data-pd-step="1"]').click();
    await page.locator('[data-pd-step="1"]').click();
    await Promise.all([page.waitForURL(CART), page.locator('.pd-cta').click()]);
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe('POST');
    expect(Object.fromEntries(new URLSearchParams(sent[0].body))).toEqual({ 'attribute_pa_memoria-ram': '8gb', quantity: '3', 'add-to-cart': '4827', product_id: '4827', variation_id: '5423' });
  });

  test('atributo do próprio produto (attribute_memoria-ram) e opções sem preço fora da escolha', async ({ page }) => {
    const sent = await catchCart(page);
    // Atributo cadastrado no produto: o valor enviado é o próprio texto ("16GB"), como no original.
    await page.goto(path(4994));
    await page.locator('.pd-opt', { hasText: '16GB' }).click();
    await Promise.all([page.waitForURL(CART), page.locator('.pd-cta').click()]);
    expect(new URLSearchParams(sent[0].body).get('attribute_memoria-ram')).toBe('16GB');
    expect(new URLSearchParams(sent[0].body).get('variation_id')).toBe('5277');
    // HP DL380 G10: 8GB e 16GB não têm preço no WooCommerce (o WordPress não as oferece).
    await page.goto(path(8141));
    await expect(page.locator('.pd-opt')).toHaveText(['32GB']);
    // Uma opção só: já vem marcada, com a variação e o preço dela.
    await expect(page.locator('.pd-opt input')).toBeChecked();
    await expect(page.locator('[data-pd-variation]')).not.toHaveValue('0');
  });

  test('simples com preço: quantidade e "Orçamento" enviam ao carrinho como o botão original', async ({ page }) => {
    const sent = await catchCart(page);
    await page.goto(path(7820));
    await expect(page.locator('.pd-opts')).toHaveCount(0);
    await page.locator('#pd-qty').fill('2');
    await Promise.all([page.waitForURL(CART), page.locator('.pd-cta').click()]);
    expect(Object.fromEntries(new URLSearchParams(sent[0].body))).toEqual({ quantity: '2', 'add-to-cart': '7820' });
  });

  test('sem preço: sem formulário (como no WordPress) e o contato com um consultor', async ({ page }) => {
    await page.goto(path(7854));
    await expect(page.locator('[data-pd-form]')).toHaveCount(0);
    const cta = page.locator('.pd-cta');
    await expect(cta).toHaveAttribute('href', /^https:\/\/wa\.me\/5511985991837\?text=/);
    await expect(cta).toHaveAttribute('target', '_blank');
    await expect(page.locator('.pd-help a')).toHaveText('Fale com um consultor.');
  });
});

test.describe('produto: galeria, navegação e telas', () => {
  test('galeria: miniaturas trocam a foto; a foto abre ampliada e navega com as setas', async ({ page, isMobile }) => {
    await page.goto(path(4827));
    const active = () => page.locator('.pd-shot.is-active').getAttribute('data-index');
    await page.locator('.pd-thumb').nth(2).click();
    expect(await active()).toBe('2');
    await expect(page.locator('.pd-thumb').nth(2)).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.pd-shot.is-active').click();
    const dialog = page.locator('[data-pd-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-pd-lb-count]')).toHaveText('3 de 3');
    await expect.poll(() => page.locator('[data-pd-lb-img]').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    if (!isMobile) {
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-pd-lb-count]')).toHaveText('1 de 3');
    } else {
      await page.locator('.pd-lb-next').click();
      await expect(page.locator('[data-pd-lb-count]')).toHaveText('1 de 3');
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await active()).toBe('0');
  });

  test('trilha e links: catálogo e home levam às páginas novas; a trilha volta ao catálogo', async ({ page }) => {
    await page.goto(path(4827));
    const trail = page.getByRole('navigation', { name: 'Você está em' });
    await expect(trail.getByRole('link')).toHaveText(['Início', 'Servidores', 'Dell']);
    await expect(trail.getByRole('link', { name: 'Dell' })).toHaveAttribute('href', '/categoria-produto/dell/');
    await page.goto(path(7854));
    await expect(trail.getByRole('link')).toHaveText(['Início', 'Servidores', 'Componentes', 'Fans']);
    // Catálogo: nome, foto e botão do card levam à página do produto.
    await page.goto('/categoria-produto/dell/');
    const card = page.locator('.pc[data-product="4827"]');
    await expect(card.locator('.card-link')).toHaveAttribute('href', path(4827));
    await expect(card.locator('.pc-btn')).toHaveAttribute('href', path(4827));
    await card.locator('.card-link').click();
    await expect(page).toHaveURL(new RegExp(`${path(4827)}$`));
    await expect(page.locator('h1')).toHaveText('Servidor Dell PowerEdge R210');
    // Home ("Nossa linha"): nenhum link para as páginas de produto antigas.
    await page.goto('/');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => h.includes('msserver.com.br/servidor/'))).toEqual([]);
    expect(hrefs.filter((h) => h.startsWith('/servidor/')).length).toBeGreaterThan(0);
  });

  test('telas: sem rolagem lateral, compra à vista e acessibilidade (axe)', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const id of [4827, 7820, 7854, 7822, 4994]) {
      await page.goto(path(id));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      // Nome completo, sem corte.
      expect(await page.locator('h1').evaluate((h) => h.scrollWidth <= h.clientWidth + 1)).toBe(true);
      const buy = (await page.locator('.pd-card').boundingBox())!;
      const gallery = (await page.locator('.pd-gallery').boundingBox())!;
      // Desktop: galeria e compra lado a lado; celular: compra logo depois da galeria.
      if (isMobile) expect(buy.y).toBeGreaterThan(gallery.y + gallery.height - 1);
      else expect(Math.abs(buy.y - gallery.y)).toBeLessThan(2);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`), String(id)).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test('imagens da galeria carregam (todas as páginas)', async ({ page }) => {
    test.setTimeout(240_000);
    const failed: string[] = [];
    page.on('response', (r) => r.url().startsWith('http://localhost') && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    for (const id of IDS) {
      await page.goto(path(id));
      await page.evaluate(() => document.querySelectorAll<HTMLImageElement>('.pd-gallery img').forEach((i) => (i.loading = 'eager')));
      await expect.poll(() => page.locator('.pd-gallery img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0)), String(id)).toBe(true);
    }
    expect(failed).toEqual([]);
  });
});

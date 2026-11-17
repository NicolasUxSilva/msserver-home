import { expect, test, type Page } from '@playwright/test';
import { line, mockStore } from './store-mock';

// Rastreamento e consentimento. Os eventos ficam no dataLayer no padrão do GA4 (sem dados pessoais);
// as ferramentas (GTM, Google Ads, Meta Pixel, Clarity, RD Station) só carregam com PUBLIC_TRACKING e
// depois do consentimento da categoria. O build dos testes tem o rastreamento desligado: para testar o
// aviso, o teste liga a configuração na resposta da página (nada muda no site) e bloqueia os
// endereços das ferramentas, registrando quais o site tentou carregar.
const TOOLS = /googletagmanager|google-analytics|googleadservices|doubleclick|facebook|clarity|cloudfront/;

test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|wa\.me/, (r) => r.abort());
});

type Layer = Record<string, unknown>[];
const layer = (page: Page) => page.evaluate(() => (window as unknown as { dataLayer?: Layer }).dataLayer ?? []);

/** Registra no teste cada evento enviado ao dataLayer (também os que saem logo antes de trocar de página). */
async function recordLayer(page: Page) {
  const pushed: Record<string, unknown>[] = [];
  await page.exposeFunction('__dlPush', (json: string) => pushed.push(JSON.parse(json)));
  await page.addInitScript(() => {
    const w = window as unknown as { dataLayer: unknown[]; __dlPush: (s: string) => void };
    const dl: unknown[] = [];
    dl.push = (...items: unknown[]) => {
      for (const it of items) {
        try {
          if (it && typeof it === 'object' && !('length' in (it as object))) w.__dlPush(JSON.stringify(it));
        } catch {
          /* argumentos do gtag não são JSON */
        }
      }
      return Array.prototype.push.apply(dl, items);
    };
    w.dataLayer = dl;
  });
  return pushed;
}
const of = (pushed: Record<string, unknown>[], event: string) => pushed.filter((e) => e.event === event) as { ecommerce: { currency: string; value: number; items: Record<string, unknown>[] }; location?: string }[];

test.describe('eventos de comércio (GA4)', () => {
  test('produto: view_item ao abrir; add_to_cart com a variação, a quantidade e o valor', async ({ page }) => {
    await mockStore(page);
    const pushed = await recordLayer(page);
    await page.goto('/servidor/servidor-dell-r210/');
    await expect.poll(() => of(pushed, 'view_item').length).toBe(1);
    const [view] = of(pushed, 'view_item');
    expect(view.ecommerce.currency).toBe('BRL');
    expect(view.ecommerce.items[0]).toMatchObject({ item_id: '4827', item_name: 'Servidor Dell PowerEdge R210', item_brand: 'Dell' });
    await page.locator('.pd-opt', { hasText: '8GB' }).click();
    await page.locator('[data-pd-step="1"]').click();
    await Promise.all([page.waitForURL(/\/carrinho\/$/), page.locator('.pd-cta').click()]);
    const [add] = of(pushed, 'add_to_cart');
    expect(add.location).toBe('produto');
    expect(add.ecommerce.value).toBe(6200);
    expect(add.ecommerce.items[0]).toMatchObject({ item_id: '4827', variation_id: '5423', item_variant: '8GB', quantity: 2, price: 3100 });
  });

  test('carrinho: view_cart, mudança de quantidade e remoção', async ({ page }) => {
    await mockStore(page, { lines: [line(7820, 1)] });
    const pushed = await recordLayer(page);
    await page.goto('/carrinho/');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect.poll(() => of(pushed, 'view_cart').length).toBe(1);
    expect(of(pushed, 'view_cart')[0].ecommerce.items[0]).toMatchObject({ item_id: '7820', quantity: 1, price: 350 });
    await page.locator('[data-step="1"]').click();
    await expect.poll(() => of(pushed, 'add_to_cart').length).toBe(1);
    expect(of(pushed, 'add_to_cart')[0].ecommerce.items[0]).toMatchObject({ item_id: '7820', quantity: 1 });
    await page.locator('.cart-remove').click();
    await expect.poll(() => of(pushed, 'remove_from_cart').length).toBe(1);
    expect(of(pushed, 'remove_from_cart')[0].ecommerce.items[0]).toMatchObject({ item_id: '7820', quantity: 2 });
  });
});

/** Liga o rastreamento na resposta da página (só no teste) e registra as ferramentas pedidas. */
async function withTracking(page: Page) {
  const requested: string[] = [];
  await page.route(TOOLS, (r) => (requested.push(new URL(r.request().url()).hostname), r.abort()));
  await page.route(
    (url) => url.hostname === 'localhost' && !/\.[a-z0-9]+$/i.test(url.pathname),
    async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/(<script type="application\/json" data-consent-config>\{"enabled":)false/, '$1true');
      await route.fulfill({ response: res, body });
    },
  );
  return requested;
}

test.describe('consentimento de cookies', () => {
  test('sem rastreamento no build: nenhuma ferramenta e nenhum aviso', async ({ page }) => {
    const requested: string[] = [];
    await page.route(TOOLS, (r) => (requested.push(r.request().url()), r.abort()));
    await page.goto('/');
    await expect(page.locator('[data-consent]')).toBeHidden();
    await expect(page.locator('[data-consent-open]')).toBeHidden();
    await page.waitForTimeout(500);
    expect(requested).toEqual([]);
  });

  test('com rastreamento: nada carrega antes da escolha; "Só os necessários" mantém tudo desligado', async ({ page }) => {
    const requested = await withTracking(page);
    await page.goto('/');
    await expect(page.locator('[data-consent]')).toBeVisible();
    await page.waitForTimeout(400);
    expect(requested).toEqual([]);
    await page.getByRole('button', { name: 'Só os necessários' }).click();
    await expect(page.locator('[data-consent]')).toBeHidden();
    await page.reload();
    await expect(page.locator('[data-consent]')).toBeHidden();
    await page.waitForTimeout(400);
    expect(requested).toEqual([]);
  });

  test('com rastreamento: só Análise aceita carrega GTM e Clarity, sem Google Ads, Meta e RD', async ({ page }) => {
    const requested = await withTracking(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Personalizar' }).click();
    await page.locator('[data-consent-toggle="analytics"]').check();
    await page.getByRole('button', { name: 'Salvar escolhas' }).click();
    await expect.poll(() => requested.sort().join(',')).toContain('clarity');
    await page.waitForTimeout(400);
    expect(requested.some((h) => h.includes('googletagmanager'))).toBe(true);
    expect(requested.some((h) => /facebook|cloudfront/.test(h))).toBe(false);
    // O GTM recebe o estado do consentimento (Consent Mode v2).
    const events = await layer(page);
    expect(JSON.stringify(events)).toContain('"analytics_storage":"granted"');
    expect(JSON.stringify(events)).toContain('"ad_storage":"denied"');
    // Preferências pelo rodapé reabrem as opções com a escolha marcada.
    await page.locator('footer [data-consent-open]').click();
    await expect(page.locator('[data-consent-toggle="analytics"]')).toBeChecked();
    await expect(page.locator('[data-consent-toggle="marketing"]')).not.toBeChecked();
  });

  test('com rastreamento: aceitar todos carrega as cinco ferramentas', async ({ page }) => {
    const requested = await withTracking(page);
    await page.goto('/sobre/');
    await page.getByRole('button', { name: 'Aceitar todos' }).click();
    await expect.poll(() => new Set(requested.map((h) => (/googletagmanager/.test(h) ? 'google' : /facebook/.test(h) ? 'meta' : /clarity/.test(h) ? 'clarity' : /cloudfront/.test(h) ? 'rd' : h))).size).toBe(4);
  });
});

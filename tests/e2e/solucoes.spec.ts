import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import original from '../fixtures/original-solucoes.json' with { type: 'json' };

// Páginas de soluções reconstruídas (Nuvem Privada, Extensão de Garantia, Backup em Nuvem e
// Consultoria), conferidas contra as páginas publicadas no WordPress (tests/fixtures/
// original-solucoes.json, capturado do HTML em 12/11/2026). Os formulários são enviados a um
// admin-ajax.php simulado no formato do Elementor: nada chega ao WordPress.
const AJAX = 'https://msserver.com.br/wp-admin/admin-ajax.php';
const PAGES = Object.keys(original.pages) as (keyof typeof original.pages)[];
const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

test.beforeEach(async ({ page }) => {
  await page.route(/msserver\.com\.br|youtube\.com|ytimg|googletag|facebook|clarity|cloudfront|wa\.me/, (r) => r.abort());
});

type Sent = { url: string; fields: Record<string, string[]> };
/** admin-ajax.php simulado: guarda o que foi enviado e responde como o Elementor. */
async function mockAjax(page: Page, reply: (route: Route) => Promise<void> | void = (r) => r.fulfill({ json: { success: true, data: { message: 'A mensagem foi enviada com sucesso.', data: [] } } })) {
  const sent: Sent[] = [];
  await page.route(AJAX, async (route) => {
    const req = route.request();
    const form = await new Response(req.postDataBuffer() as unknown as BodyInit, { headers: { 'content-type': req.headers()['content-type'] } }).formData();
    const fields: Record<string, string[]> = {};
    for (const [k, v] of form.entries()) (fields[k] ??= []).push(String(v));
    sent.push({ url: req.url(), fields });
    await reply(route);
  });
  return sent;
}

test.describe('soluções: conteúdo preservado', () => {
  for (const route of PAGES) {
    const o = original.pages[route];
    test(`${route}: SEO, textos, botões, âncoras, vídeos e formulários do original`, async ({ page }) => {
      await page.goto(route);
      // SEO da página publicada (All in One SEO).
      const seo = JSON.parse(readFileSync('src/data/solucoes-seo.json', 'utf8')) as Record<string, { title: string; canonical: string; schema: unknown }>;
      const s = Object.values(seo).find((x) => x.canonical === `https://msserver.com.br${route}`)!;
      await expect(page).toHaveTitle(o.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', s.canonical);
      expect(JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)).toEqual(s.schema);
      await expect(page.locator('h1')).toHaveCount(1);

      // Todos os textos (CAIXA ALTA passou para caixa de frase; palavras e erros mantidos).
      // Texto da página com um espaço entre os elementos (inclui o que só aparece em outra tela).
      const text = norm(
        await page.locator('main').evaluate((el) => {
          const parts: string[] = [];
          const walk = (n: Node) => {
            if (n.nodeType === Node.TEXT_NODE) parts.push(n.textContent ?? '');
            else if (n.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes((n as Element).tagName)) {
              parts.push(' ');
              n.childNodes.forEach(walk);
              parts.push(' ');
            }
          };
          walk(el);
          return parts.join('');
        }),
      );
      const missing = o.texts.filter((t) => !text.includes(norm(t)));
      expect(missing).toEqual([]);

      // Botões: mesmo texto e destino.
      for (const b of o.buttons) {
        const links = page.locator(`main a[href="${b.href}"]`);
        expect(await links.count(), `${b.text} → ${b.href}`).toBeGreaterThan(0);
        const labels = (await links.allTextContents()).map(norm);
        expect(labels.some((l) => l.includes(norm(b.text))), `${b.text}`).toBe(true);
      }
      // Âncoras publicadas.
      for (const id of o.anchors) await expect(page.locator(`#${id}`)).toHaveCount(1);
      // Vídeos: o mesmo do YouTube (e o mesmo início).
      for (const v of o.videos) {
        const id = v.match(/(?:youtu\.be\/|v=)([\w-]{11})/)![1];
        const start = v.match(/[?&]t=(\d+)s/)?.[1];
        const box = page.locator(`[data-sol-video][data-src*="/embed/${id}?"]`);
        await expect(box).toHaveCount(1);
        if (start) await expect(box).toHaveAttribute('data-src', new RegExp(`start=${start}`));
      }
      // Formulários: os mesmos campos (ids do Elementor) e, nos de contato, os mesmos textos.
      for (const f of o.forms) {
        for (const field of f.fields) {
          const sel = `[name="form_fields[${field.id}]"], [data-np-field="${field.id}"]`;
          expect(await page.locator(sel).count(), `${f.form_id}: ${field.id}`).toBeGreaterThan(0);
          if (field.placeholder) await expect(page.locator(`[name="form_fields[${field.id}]"]`).first()).toHaveAttribute('placeholder', field.placeholder);
        }
      }
      // Imagens: todas carregadas.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
      });
      const broken = await page.locator('main img:not([src*="ytimg"])').evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      );
      expect(broken).toEqual([]);
    });
  }

  test('todas as imagens publicadas estão no projeto (scripts/prepare-solucoes-assets.mjs)', () => {
    const script = readFileSync('scripts/prepare-solucoes-assets.mjs', 'utf8');
    const files = new Set([...script.matchAll(/'(\d{4}\/\d{2}\/[^']+)'/g)].map((m) => m[1].replace(/\.(png|jpe?g)$/, '')));
    // Os logos dos parceiros entram por uma lista de nomes.
    for (const n of ['REDHAT-2', 'MICROSOFT-2', 'INTEL-2', 'HP-2', 'GOOGLE-2', 'EQUINIZ', 'DELL-2', 'CISCO-2', 'CIRION-2', 'AZURE-2', 'AWS-2']) files.add(`2023/11/${n}`);
    const missing = PAGES.flatMap((r) => original.pages[r].images).filter((img) => !files.has(img.replace(/\.(png|jpe?g)$/, '')));
    expect(missing).toEqual([]);
  });

  test('Backup: o "Saiba mais" publicado aponta para #funciona, que a página original não tem (documentado)', async ({ page }) => {
    await page.goto('/backup-em-nuvem/');
    await expect(page.locator('.bk-hero a', { hasText: 'Saiba mais' })).toHaveAttribute('href', '#funciona');
    await expect(page.locator('#funciona')).toHaveCount(0);
  });
});

test.describe('soluções: formulários de contato (Elementor)', () => {
  const FORMS = [
    { route: '/extencao-de-garantia/', prefix: 'garantia', form: '[data-sol-lead]', postId: '6727', formId: 'f07f805', title: 'Extenção de Garantia - MSSERVER', extra: null },
    { route: '/backup-em-nuvem/', prefix: 'backup', form: '[data-sol-lead]', postId: '6641', formId: '58d3284', title: 'Backup em Nuvem - MSSERVER', extra: 'field_0d01f80' },
    { route: '/consultoria-em-implantacao-de-servidores/', prefix: 'consultoria', form: '[data-sol-lead]', postId: '7247', formId: '716f78c', title: 'Consultoria em implantação de servidores - MSSERVER', extra: null },
  ];

  for (const f of FORMS) {
    test(`${f.route}: confere os campos, envia como o Elementor e mostra a confirmação do servidor`, async ({ page }) => {
      const sent = await mockAjax(page);
      await page.goto(f.route);
      const box = page.locator(f.form);
      await box.getByRole('button', { name: 'Enviar' }).click();
      await expect(box.locator('.sol-field.is-invalid')).toHaveCount(f.extra ? 4 : 3);
      await expect(box.locator(`#${f.prefix}-name`)).toBeFocused();
      await expect(box.getByText('Este campo é obrigatório.').first()).toBeVisible();
      expect(sent).toEqual([]);
      await box.locator(`#${f.prefix}-name`).fill('Maria Souza');
      await box.locator(`#${f.prefix}-field_f66ed12`).fill('maria@empresa');
      await box.locator(`#${f.prefix}-field_2702160`).fill('11 4858 abc');
      if (f.extra) await box.locator(`#${f.prefix}-${f.extra}`).fill('2 TB');
      await box.getByRole('button', { name: 'Enviar' }).click();
      await expect(box.getByText('Informe um e-mail válido.')).toBeVisible();
      await expect(box.getByText(/Informe um telefone válido/)).toBeVisible();
      expect(sent).toEqual([]);
      await box.locator(`#${f.prefix}-field_f66ed12`).fill('maria@empresa.com.br');
      await box.locator(`#${f.prefix}-field_2702160`).fill('(11) 4858-5358');
      await box.getByRole('button', { name: 'Enviar' }).click();
      await expect(box.locator('[data-success]')).toBeVisible();
      await expect(box.locator('[data-success-message]')).toHaveText('A mensagem foi enviada com sucesso.');
      expect(sent).toHaveLength(1);
      expect(sent[0].fields).toMatchObject({
        action: ['elementor_pro_forms_send_form'],
        post_id: [f.postId],
        form_id: [f.formId],
        referer_title: [f.title],
        queried_id: [f.postId],
        'form_fields[name]': ['Maria Souza'],
        'form_fields[field_f66ed12]': ['maria@empresa.com.br'],
        // Sem espaços, como o servidor exige.
        'form_fields[field_2702160]': ['(11)4858-5358'],
      });
      if (f.extra) expect(sent[0].fields[`form_fields[${f.extra}]`]).toEqual(['2 TB']);
      expect(sent[0].fields.referrer[0]).toContain(f.route);
    });
  }

  test('falha do servidor e da rede: aviso, dados mantidos e WhatsApp como alternativa', async ({ page }) => {
    let mode: 'server' | 'network' = 'server';
    await mockAjax(page, (r) =>
      mode === 'server' ? r.fulfill({ json: { success: false, data: { message: 'Há um erro no formulário.', errors: { field_f66ed12: 'E-mail inválido.' } } } }) : r.abort(),
    );
    await page.goto('/extencao-de-garantia/');
    const box = page.locator('[data-sol-lead]');
    await box.locator('#garantia-name').fill('Maria Souza');
    await box.locator('#garantia-field_f66ed12').fill('maria@empresa.com.br');
    await box.locator('#garantia-field_2702160').fill('11948585358');
    await box.getByRole('button', { name: 'Enviar' }).click();
    const alert = box.locator('[data-alert]');
    await expect(alert).toBeFocused();
    await expect(alert).toContainText('Há um erro no formulário.');
    await expect(box.getByText('E-mail inválido.')).toBeVisible();
    await expect(alert.getByRole('link')).toHaveAttribute('href', /wa\.me\/5511985991837/);
    mode = 'network';
    await box.getByRole('button', { name: 'Enviar' }).click();
    await expect(alert).toContainText('A conexão com o servidor falhou');
    await expect(box.locator('#garantia-name')).toHaveValue('Maria Souza');
    await expect(box.locator('[data-success]')).toBeHidden();
  });
});

test.describe('Nuvem Privada: configurador em etapas', () => {
  const desktop = original.pages['/nuvem-privada/'].forms.find((f) => f.form_id === '1b2c23a')!;
  const mobile = original.pages['/nuvem-privada/'].forms.find((f) => f.form_id === '74046a9')!;

  test('mesmas etapas e opções dos dois widgets publicados', async ({ page }) => {
    await page.goto('/nuvem-privada/');
    await expect(page.locator('.np-step-label')).toHaveText([...desktop.steps]);
    for (const field of desktop.fields.filter((x) => x.options)) {
      expect(await page.locator(`.np-opts--desktop input[data-np-field="${field.id}"]`).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(field.options);
    }
    for (const field of mobile.fields.filter((x) => x.options)) {
      expect(await page.locator(`.np-opts--mobile input[data-np-field="${field.id}"]`).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(field.options);
    }
  });

  test('escolha por etapa, resumo ao lado e envio com o widget da tela', async ({ page, isMobile }) => {
    const sent = await mockAjax(page);
    await page.goto('/nuvem-privada/');
    const cfg = page.locator('[data-np-config]');
    const next = cfg.getByRole('button', { name: 'Próximo' });
    if (isMobile) {
      // Celular (74046a9): várias opções por etapa, nenhuma marcada de início.
      await expect(cfg.locator('[data-np-sum="field_49faf56"] [data-np-sum-value]')).toHaveText('—');
      await cfg.getByText('2x Silver 4314 (32 Cores, 64 Threads, 2.4 GHz)').click();
      await cfg.getByText('2x Gold 6138 (44 Cores, 88 Threads, 2.0 GHz)').click();
      await expect(cfg.locator('[data-np-sum="field_49faf56"] [data-np-sum-value]')).toContainText('2x Silver 4314');
      await next.click();
      await cfg.locator('[data-np-step="1"] .np-opts--mobile').getByText('32 GB').click();
      await next.click();
      await next.click();
      await cfg.locator('[data-np-step="3"] .np-opts--mobile').getByText('2', { exact: true }).click();
    } else {
      // Desktop/tablet (1b2c23a): uma opção por etapa, a primeira já marcada (como a lista suspensa).
      await expect(cfg.locator('[data-np-sum="field_49faf56"] [data-np-sum-value]')).toHaveText('4 Cores - 8 Threads');
      await cfg.getByText('16 Cores, - 32 Threads').click();
      await expect(cfg.locator('[data-np-sum="field_49faf56"] [data-np-sum-value]')).toHaveText('16 Cores, - 32 Threads');
      await next.click();
      await cfg.locator('[data-np-step="1"]').getByText('OUTRO').click();
      await next.click();
      await cfg.locator('[data-np-step="2"]').getByText('1.2 TB').click();
      // Voltar não confere nada e mantém a escolha.
      await cfg.getByRole('button', { name: 'Anterior' }).click();
      await expect(cfg.locator('[data-np-step="1"] .np-opts--desktop input:checked')).toHaveValue('OUTRO');
      await next.click();
      await next.click();
    }
    await next.click();
    await expect(cfg.locator('.np-panel-name').filter({ visible: true })).toHaveText('Contato');
    const send = cfg.getByRole('button', { name: 'Enviar' });
    await send.click();
    await expect(cfg.locator('.sol-field.is-invalid')).toHaveCount(3);
    expect(sent).toEqual([]);
    await cfg.locator('#np-field_ec698fd').fill('João Lima');
    await cfg.locator('#np-field_77d068a').fill('joao@empresa.com.br');
    await cfg.locator('#np-field_b063367').fill('11 98599 1837');
    await send.click();
    await expect(cfg.locator('[data-np-success]')).toBeVisible();
    expect(sent).toHaveLength(1);
    const f = sent[0].fields;
    expect(f).toMatchObject({ action: ['elementor_pro_forms_send_form'], post_id: ['7016'], referer_title: ['Nuvem Privada - MSSERVER'], queried_id: ['7016'] });
    expect(f['form_fields[field_ec698fd]']).toEqual(['João Lima']);
    expect(f['form_fields[field_b063367]']).toEqual(['11985991837']);
    if (isMobile) {
      expect(f.form_id).toEqual(['74046a9']);
      expect(f['form_fields[field_49faf56][]']).toEqual(['2x Silver 4314 (32 Cores, 64 Threads, 2.4 GHz)', '2x Gold 6138 (44 Cores, 88 Threads, 2.0 GHz)']);
      // O valor publicado tem um espaço no início (" 32 GB").
      expect(f['form_fields[field_f2bee49][]']).toEqual([' 32 GB']);
      expect(f['form_fields[field_94be79a][]']).toBeUndefined();
      expect(f['form_fields[field_f72c94c][]']).toEqual(['2']);
    } else {
      expect(f.form_id).toEqual(['1b2c23a']);
      expect(f['form_fields[field_49faf56]']).toEqual(['16 Cores, - 32 Threads']);
      expect(f['form_fields[field_f2bee49]']).toEqual(['OUTRO']);
      expect(f['form_fields[field_94be79a]']).toEqual(['1.2 TB']);
      expect(f['form_fields[field_f72c94c]']).toEqual(['1']);
    }
  });
});

test.describe('soluções: vídeo, menu e navegação', () => {
  test('vídeo: a capa do YouTube vira o player no clique, no mesmo vídeo e início', async ({ page }) => {
    await page.goto('/backup-em-nuvem/');
    const box = page.locator('[data-sol-video]');
    await expect(box.locator('a')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=ZebwXutm2Po&t=46s');
    await expect(box.locator('iframe')).toHaveCount(0);
    await box.locator('a').click();
    await expect(box.locator('iframe')).toHaveAttribute('src', /youtube\.com\/embed\/ZebwXutm2Po\?.*start=46/);
    await expect(box.locator('iframe')).toHaveAttribute('title', /Backup em Nuvem da MSServer/);
  });

  const SOLUCOES = [
    ['Soluções Cloud', 'https://msserver.com.br/solucoes-cloud/'],
    ['Nuvem Privada', '/nuvem-privada/'],
    ['Servidores Físicos', 'https://msserver.com.br/servidores-fisicos/'],
    ['Aplicativo de Gestão', 'https://msserver.com.br/aplicativo-ms-server/'],
    ['Extensão de Garantia', '/extencao-de-garantia/'],
    ['Backup em Nuvem', '/backup-em-nuvem/'],
    ['Consultoria', '/consultoria-em-implantacao-de-servidores/'],
  ];

  test('menu Soluções: os sete itens, na ordem, com os destinos (desktop e celular)', async ({ page, isMobile }) => {
    await page.goto('/nuvem-privada/');
    const header = page.locator('header.site-header');
    await expect(header).not.toContainText('Servidores Dedicados');
    await expect(header).not.toContainText('Servidores em Nuvem');
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
      const menu = page.locator('#menu-movel');
      await menu.getByRole('button', { name: 'Soluções', exact: true }).click();
      const layer = menu.locator('#m-v-root-3');
      for (const [label, href] of SOLUCOES) await expect(layer.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
      // A página atual fica marcada.
      await expect(layer.getByRole('link', { name: 'Nuvem Privada', exact: true })).toHaveAttribute('aria-current', 'page');
    } else {
      const nav = page.getByRole('navigation', { name: 'Menu principal' });
      await nav.getByRole('button', { name: 'Soluções' }).click();
      const panel = nav.locator('[data-sub-panel]:not([hidden])');
      await expect(panel.locator('a')).toHaveText(SOLUCOES.map(([l]) => l));
      expect(await panel.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(SOLUCOES.map(([, h]) => h));
    }
  });

  test('Home: o cartão "Consultoria" leva à página reconstruída', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-acc-item]').first().locator('a')).toHaveAttribute('href', '/consultoria-em-implantacao-de-servidores/');
  });
});

test.describe('soluções: layout e acessibilidade', () => {
  for (const route of PAGES) {
    test(`${route}: sem rolagem lateral, sem erros e com axe`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(route);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});

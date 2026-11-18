import { expect, test, type Page } from '@playwright/test';
import { CLOUD, choose, completeCloud, next, openSimulator, sim } from './solucoes-cloud-helpers';

// Simulador da landing de Soluções Cloud (repositório cloud-ms, tests/e2e/simulator.spec.ts, commit
// 3199d6f), na página integrada ao site: só o endereço mudou.

const waText = async (page: Page, sel: string) => decodeURIComponent(new URL((await page.locator(sel).first().getAttribute('href'))!).searchParams.get('text')!);

test('fluxo completo gera o resumo e a mensagem com as escolhas reais', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await context.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: 'ok' }));
  await openSimulator(page);
  await completeCloud(page);

  const review = sim(page).locator('.sim-review-list');
  await expect(review).toContainText('Sistemas de gestão e ERP, Banco de dados');
  await expect(review).toContainText('Nuvem privada');
  await expect(review).toContainText('8 cores');
  await expect(review).toContainText('32 GB');
  await expect(review).toContainText('900 GB');
  await expect(review).toContainText('2 IPs');
  await expect(review).toContainText('Backup diário');
  await expect(sim(page).locator('.sim-disclaimer')).toContainText('Sem preço calculado');
  await expect(sim(page).locator('[data-summary-count]')).toHaveText('6 de 6');
  await expect(sim(page).locator('[data-price]')).toContainText('Sob avaliação');
  expect(await sim(page).innerText()).not.toMatch(/R\$/);

  // Contexto opcional do profissional.
  await choose(page, 'Sou da equipe de TI da empresa');
  await sim(page).getByLabel('Observações para a equipe (opcional)').fill('25 usuários, ERP e banco no mesmo servidor');
  await expect(sim(page).locator('[data-summary-list]')).toContainText('Sou da equipe de TI da empresa');

  const send = sim(page).getByRole('link', { name: 'Enviar levantamento pelo WhatsApp' });
  const text = await waText(page, '.sim-send a[data-wa-dynamic]');
  expect(text).toMatch(/^Olá! Vim pela página de Cloud da MSSERVER\. Organizei no simulador os requisitos da infraestrutura da minha empresa e gostaria de uma avaliação técnica\./);
  expect(text).not.toMatch(/parceri|cliente|comiss|revend/i);
  for (const line of ['• Meu papel: Sou da equipe de TI da empresa', '• Observações: 25 usuários, ERP e banco no mesmo servidor', '• Necessidade: Sistemas de gestão e ERP, Banco de dados', '• Momento: Migrar o servidor local', '• Modelo: Nuvem privada', '• Criticidade: Crítico', '• Processamento: 8 cores / 16 threads', '• Memória: 32 GB', '• Armazenamento: 900 GB', '• IPs: 2 IPs', '• Itens para avaliar: Backup diário']) {
    expect(text).toContain(line);
  }
  expect(await send.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5511985991837\?text=/);

  const popup = page.waitForEvent('popup');
  await send.click();
  await (await popup).close();
  await expect(sim(page).locator('[data-submit-status]')).toContainText('envie a mensagem por lá');
  const events = await page.evaluate(() => (window.dataLayer ?? []).map((e) => e as { event: string; location?: string }));
  expect(events.filter((e) => e.event === 'contact_whatsapp_click')).toEqual([{ event: 'contact_whatsapp_click', location: 'simulador-envio' }]);
  const names = events.map((e) => e.event);
  expect(names).toContain('simulation_start');
  expect(names).toContain('simulation_complete');
  expect(names.filter((n) => n === 'simulation_step_complete')).toHaveLength(6);
  expect(errors).toEqual([]);
});

test('validações bloqueiam o avanço e mostram o que falta', async ({ page }) => {
  await openSimulator(page);
  await next(page);
  await expect(sim(page).locator('[data-error]')).toHaveText('Escolha pelo menos um sistema ou carga de trabalho, ou marque "Ainda não sei".');
  await choose(page, 'Outro cenário');
  await next(page);
  await expect(sim(page).locator('[data-error]')).toHaveText('Descreva a outra necessidade em poucas palavras.');
  await expect(sim(page).getByLabel('Descreva a outra necessidade')).toBeFocused();
  await sim(page).getByLabel('Descreva a outra necessidade').fill('Área de trabalho remota');
  await next(page);
  await expect(sim(page).locator('[data-error]')).toContainText('migração');
  await choose(page, 'Novo ambiente');
  await expect(sim(page).locator('[data-error]')).toBeHidden();
  await next(page, 'Qual modelo de Cloud atende melhor à operação?');
  await choose(page, 'Quero orientação');
  await next(page);
  await expect(sim(page).locator('[data-error]')).toContainText('criticidade');
  await choose(page, 'Não sei');
  await next(page, 'Quanto processamento o ambiente precisa?');
  // Etapas futuras ficam bloqueadas na barra de progresso.
  await expect(sim(page).locator('[data-goto="5"]')).toBeDisabled();
});

test('"Outro" em memória e armazenamento: validação e conversão de unidade', async ({ page }) => {
  await openSimulator(page);
  await choose(page, 'Ainda não sei');
  await choose(page, 'Ampliar o ambiente');
  await next(page);
  await choose(page, 'Servidor dedicado em data center');
  await choose(page, 'Importante');
  await next(page);
  await choose(page, 'Quero recomendação');
  await next(page, 'Quanta memória RAM?');
  await choose(page, 'Outro');
  const mem = sim(page).getByLabel('Memória desejada, em GB');
  await expect(mem).toBeFocused();
  await mem.fill('12,5');
  await next(page);
  await expect(sim(page).locator('[data-error]')).toContainText('número inteiro');
  await mem.fill('256');
  await next(page, 'Quanto espaço de armazenamento?');
  await choose(page, 'Outro');
  await sim(page).getByLabel('Capacidade desejada').fill('4');
  await sim(page).getByLabel('Unidade').selectOption('TB');
  await choose(page, 'Velocidade de leitura e gravação');
  await next(page, 'Rede, proteção e serviços');
  await choose(page, /^1$/);
  await next(page, 'Revise o levantamento e envie para a equipe');
  const review = sim(page).locator('.sim-review-list');
  await expect(review).toContainText('256 GB (outro)');
  await expect(review).toContainText('4 TB (outro)');
  await expect(review).toContainText('A definir com a equipe');
  await expect(review).toContainText('Servidor dedicado em data center');
  const text = await waText(page, '.sim-send a[data-wa-dynamic]');
  expect(text).toContain('• Memória: 256 GB (outro)');
  expect(text).toContain('• Armazenamento: 4 TB (outro)');
  expect(text).toContain('• Processamento: A definir com a equipe');
  expect(text).toContain('• Prioridade do armazenamento: Velocidade de leitura e gravação');
  expect(text).not.toContain('Itens para avaliar');
});

test('voltar e alterar a partir do resumo mantém as demais escolhas', async ({ page }) => {
  await openSimulator(page);
  await completeCloud(page);
  await sim(page).locator('.sim-review-row', { hasText: 'Memória' }).getByRole('button', { name: /Alterar/ }).click();
  await expect(sim(page).locator('.sim-step-title')).toHaveText('Quanta memória RAM?');
  await choose(page, '64 GB');
  for (let i = 0; i < 3; i++) await next(page);
  await expect(sim(page).locator('.sim-step-title')).toHaveText('Revise o levantamento e envie para a equipe');
  await expect(sim(page).locator('.sim-review-list')).toContainText('64 GB');
  await expect(sim(page).locator('.sim-review-list')).toContainText('900 GB');
});

test('a simulação sobrevive a recarregar a página e chega ao CTA final', async ({ page }) => {
  await openSimulator(page);
  await completeCloud(page);
  await page.reload();
  await expect(sim(page)).toHaveClass(/is-ready/);
  await expect(sim(page).locator('.sim-step-title')).toHaveText('Revise o levantamento e envie para a equipe');
  await expect(sim(page).locator('[data-notices]')).toContainText('Retomamos o levantamento');
  const final = page.locator('.final [data-wa-summary]');
  await expect(final).toContainText('Enviar o levantamento');
  await expect(page.locator('[data-final-saved]')).toBeVisible();
  const text = decodeURIComponent(new URL((await final.getAttribute('href'))!).searchParams.get('text')!);
  expect(text).toContain('• Processamento: 8 cores / 16 threads');
  await expect(final).toHaveAttribute('data-track-location', 'cta-final-simulacao');

  // Recomeçar limpa tudo, inclusive o CTA final.
  page.once('dialog', (d) => d.accept());
  await sim(page).getByRole('button', { name: 'Fazer outro levantamento' }).click();
  await expect(sim(page).locator('.sim-step-title')).toHaveText('O que a sua infraestrutura precisa atender?');
  await expect(sim(page).locator('[data-summary-count]')).toHaveText('0 de 6');
  await expect(final).toContainText('Conversar com um especialista');
  await expect(page.locator('[data-final-saved]')).toBeHidden();
});

test('atalhos da página pré-selecionam uso e modelo', async ({ page }) => {
  await page.goto(CLOUD);
  await page.locator('#desafios a[data-sim-preset="workload:database"]').click();
  await expect(sim(page).locator('.opt-input[value="database"]')).toBeChecked();
  await choose(page, 'Novo ambiente');
  await page.locator('#solucoes a[data-sim-preset="model:hybrid"]').click();
  await expect(sim(page).locator('.sim-step-title')).toHaveText('Qual modelo de Cloud atende melhor à operação?');
  await expect(sim(page).locator('.opt-input[value="hybrid"]')).toBeChecked();
  await expect(sim(page).locator('[data-notices]')).toContainText('"Híbrida ou multicloud" já está selecionado');
});

test('desafios marcam vários itens de uma vez e avisam o que foi marcado', async ({ page }) => {
  await page.goto(CLOUD);
  await page.locator('#desafios a[data-track-location="desafio-arquivos-backup"]').click();
  await expect(sim(page).locator('.opt-input[value="files"]')).toBeChecked();
  await expect(sim(page).locator('[data-notices]')).toContainText('Marcamos no levantamento: Arquivos e compartilhamento');
  await page.locator('#desafios a[data-track-location="desafio-trocar-provedor"]').click();
  await expect(sim(page).locator('.opt-input[value="switch"]')).toBeChecked();
  await expect(sim(page).locator('.opt-input[value="files"]')).toBeChecked();
  const text = decodeURIComponent(new URL((await page.locator('.final [data-wa-summary]').getAttribute('href'))!).searchParams.get('text')!);
  expect(text).toContain('• Necessidade: Arquivos e compartilhamento');
  expect(text).toContain('• Momento: Trocar de provedor');
  expect(text).toContain('• Itens para avaliar: Backup diário');
  expect(text).toMatch(/^Olá! Vim pela página de Cloud da MSSERVER\. Comecei a organizar/);
});

test('dicas acompanham os usos escolhidos', async ({ page }) => {
  await openSimulator(page);
  await choose(page, 'Banco de dados');
  await choose(page, 'Migrar o servidor local');
  await next(page);
  await choose(page, 'Híbrida ou multicloud');
  await choose(page, 'Crítico');
  await next(page);
  await expect(sim(page).locator('[data-tips]')).toContainText('mais núcleos');
  await choose(page, /^4 cores$/);
  await next(page);
  await choose(page, '16 GB');
  await next(page);
  await choose(page, '300 GB');
  await next(page, 'Rede, proteção e serviços');
  await expect(sim(page).locator('[data-tips]')).toContainText('VPN ou o link ponto a ponto');
});

test('no celular, a barra fixa e o resumo em folha funcionam', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 1440) >= 1024, 'somente celular');
  await openSimulator(page);
  await choose(page, 'Aplicações e sites');
  await choose(page, 'Novo ambiente');
  await expect(sim(page).locator('[data-mobilebar]')).toBeVisible();
  await sim(page).locator('[data-open-sheet]').click();
  const sheet = sim(page).locator('[data-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Aplicações e sites');
  await sheet.getByRole('button', { name: 'Fechar resumo' }).click();
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

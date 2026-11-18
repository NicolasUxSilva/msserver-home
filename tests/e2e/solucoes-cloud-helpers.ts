import { expect, type Page } from '@playwright/test';

// Auxiliares dos testes da landing de Soluções Cloud (repositório cloud-ms, tests/e2e/helpers.ts), com o
// endereço da página integrada e, para abrir o simulador, o CTA do hero (o "Avaliar meu ambiente" do
// cabeçalho próprio da landing deu lugar ao cabeçalho do site).
export const CLOUD = '/solucoes-cloud/';

// Rastreamento real nunca é disparado durante os testes (nem chamadas à produção).
export const BLOCKED = /googletagmanager|google-analytics|facebook|clarity|youtube|msserver\.com\.br/;

export async function gotoLanding(page: Page) {
  await page.route(BLOCKED, (r) => r.abort());
  await page.goto(CLOUD);
}

export const sim = (page: Page) => page.locator('[data-simulator]');

export async function openSimulator(page: Page) {
  await gotoLanding(page);
  await page.locator('#inicio').getByRole('link', { name: 'Avaliar minha infraestrutura' }).click();
  await expect(sim(page)).toHaveClass(/is-ready/);
  await expect(sim(page).locator('.sim-step-title')).toHaveText('O que a sua infraestrutura precisa atender?');
}

/** Marca uma opção pelo título visível (os inputs ficam sob o cartão). */
export async function choose(page: Page, title: string | RegExp) {
  await sim(page).locator('.opt').filter({ has: page.locator('.opt-title', { hasText: title }) }).first().click();
}

/** Clica em "Continuar" (barra do celular ou botão da etapa) e confere o título seguinte. */
export async function next(page: Page, title?: string) {
  const mobile = sim(page).locator('[data-next-mobile]');
  if (await mobile.isVisible()) await mobile.click();
  else await sim(page).locator('[data-next]').click();
  if (title) await expect(sim(page).locator('.sim-step-title')).toHaveText(title);
}

/** Preenche todas as etapas com uma configuração completa e para no resumo. */
export async function completeCloud(page: Page) {
  await choose(page, 'Sistemas de gestão e ERP');
  await choose(page, 'Banco de dados');
  await choose(page, 'Migrar o servidor local');
  await next(page, 'Qual modelo de Cloud atende melhor à operação?');
  await choose(page, 'Nuvem privada');
  await choose(page, 'Crítico');
  await next(page, 'Quanto processamento o ambiente precisa?');
  await choose(page, /^8 cores$/);
  await next(page, 'Quanta memória RAM?');
  await choose(page, '32 GB');
  await next(page, 'Quanto espaço de armazenamento?');
  await choose(page, '900 GB');
  await next(page, 'Rede, proteção e serviços');
  await choose(page, /^2$/);
  await choose(page, 'Backup diário');
  await next(page, 'Revise o levantamento e envie para a equipe');
}

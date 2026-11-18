import { CUSTOM_LIMITS } from '../../../data/landings/solucoes-cloud/cloud';
import { STEPS } from './options';
import type { Notice, SimState, StepId } from './types';
import { OTHER, UNSURE } from './types';

/** Número digitado em "Outro" (aceita vírgula decimal), ou null se não for um número. */
export function parseAmount(raw: string): number | null {
  const t = raw.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Memória informada em "Outro", em GB inteiros dentro dos limites. */
export function customMemoryGb(s: SimState): number | null {
  const n = parseAmount(s.memoryOther);
  if (n === null || !Number.isInteger(n)) return null;
  return n >= CUSTOM_LIMITS.memoryGb.min && n <= CUSTOM_LIMITS.memoryGb.max ? n : null;
}

/** Armazenamento informado em "Outro", convertido para GB e dentro dos limites. */
export function customStorageGb(s: SimState): number | null {
  const n = parseAmount(s.storageOther);
  if (n === null) return null;
  const gb = Math.round(s.storageOtherUnit === 'TB' ? n * 1000 : n);
  return gb >= CUSTOM_LIMITS.storageGb.min && gb <= CUSTOM_LIMITS.storageGb.max ? gb : null;
}

/** Mensagem de erro que impede avançar, ou null quando a etapa está completa. */
export function validateStep(id: StepId, s: SimState): string | null {
  switch (id) {
    case 'objetivo':
      if (s.workloads.length === 0) return 'Escolha pelo menos um sistema ou carga de trabalho, ou marque "Ainda não sei".';
      if (s.workloads.includes(OTHER) && s.otherWorkload.trim().length < 3) return 'Descreva a outra necessidade em poucas palavras.';
      if (!s.scenario) return 'Diga se é uma migração, uma troca de provedor, um novo ambiente ou uma ampliação.';
      return null;
    case 'modelo':
      if (!s.model) return 'Escolha um modelo de Cloud ou "Quero orientação".';
      if (!s.criticality) return 'Informe a criticidade do ambiente (ou "Não sei").';
      return null;
    case 'processamento':
      return s.processor ? null : 'Escolha uma opção de processamento ou "Quero recomendação".';
    case 'memoria':
      if (!s.memory) return 'Escolha a quantidade de memória ou "Não sei".';
      if (s.memory === OTHER && customMemoryGb(s) === null) {
        return `Informe a memória em GB, com um número inteiro de ${CUSTOM_LIMITS.memoryGb.min} a ${CUSTOM_LIMITS.memoryGb.max.toLocaleString('pt-BR')}.`;
      }
      return null;
    case 'armazenamento':
      if (!s.storage) return 'Escolha a capacidade de armazenamento ou "Não sei".';
      if (s.storage === OTHER && customStorageGb(s) === null) return 'Informe a capacidade com um número, de 10 GB a 1.000 TB.';
      return null;
    case 'rede':
      return s.ips ? null : 'Escolha a quantidade de IPs.';
    case 'resumo':
      return null;
  }
}

export const isStepComplete = (id: StepId, s: SimState) => validateStep(id, s) === null;

export const firstIncompleteStep = (s: SimState): number => {
  const idx = STEPS.findIndex((step) => step.id !== 'resumo' && validateStep(step.id, s) !== null);
  return idx === -1 ? STEPS.length - 1 : idx;
};

export const isComplete = (s: SimState) => firstIncompleteStep(s) === STEPS.length - 1;

/** Aplica uma alteração e mantém o estado coerente. */
export function applyChange(prev: SimState, patch: Partial<SimState>): { state: SimState; notices: Notice[] } {
  const next: SimState = { ...prev, ...patch };
  const notices: Notice[] = [];

  // "Ainda não sei" é exclusivo entre os usos.
  if (patch.workloads) {
    const added = patch.workloads.filter((w) => !prev.workloads.includes(w));
    if (added.includes(UNSURE)) next.workloads = [UNSURE];
    else if (next.workloads.length > 1) next.workloads = next.workloads.filter((w) => w !== UNSURE);
    if (!next.workloads.includes(OTHER)) next.otherWorkload = '';
  }
  if (patch.memory !== undefined && next.memory !== OTHER) next.memoryOther = '';
  if (patch.storage !== undefined && next.storage !== OTHER) {
    next.storageOther = '';
    next.storageOtherUnit = 'GB';
  }
  return { state: next, notices };
}

/** Orientações curtas, ligadas às escolhas anteriores. Não bloqueiam. */
export function tipsFor(id: StepId, s: SimState): string[] {
  const has = (w: string) => s.workloads.includes(w as never);
  const tips: string[] = [];
  if (id === 'processamento') {
    if (has('database')) tips.push('Bancos de dados com muitos acessos simultâneos se beneficiam de mais núcleos.');
    if (has('erp')) tips.push('ERPs costumam rodar aplicação e banco de dados juntos: considere os dois no processamento.');
    if (has('files') && tips.length === 0) tips.push('Para arquivos, o processador raramente é o gargalo: armazenamento e rede pesam mais.');
  }
  if (id === 'memoria') {
    if (has('database')) tips.push('No banco de dados, a memória funciona como cache: quanto mais dados cabem na RAM, menos leituras em disco.');
    if (has('erp')) tips.push('Some a memória da aplicação e a do banco de dados quando os dois rodam no mesmo ambiente.');
  }
  if (id === 'armazenamento') {
    if (has('database')) tips.push('Para bancos de dados, priorize velocidade de leitura e gravação. A equipe seleciona a tecnologia de armazenamento adequada.');
    if (has('files')) tips.push('Para arquivos, a capacidade costuma pesar mais. Considere o crescimento dos próximos meses.');
  }
  if (id === 'rede') {
    if (s.model === 'hybrid' || s.scenario === 'migrate') tips.push('Para integrar a nuvem ao escritório, a VPN ou o link ponto a ponto mantêm o tráfego protegido.');
    if (s.scenario === 'switch') tips.push('Na troca de provedor, use as observações da última etapa para contar o que roda hoje e onde: isso agiliza o planejamento da migração.');
    if (s.criticality === 'high') tips.push('Em ambientes críticos, backup diário e monitoramento ajudam a recuperar e a antecipar problemas.');
  }
  if (tips.length === 0 && (id === 'processamento' || id === 'memoria' || id === 'armazenamento')) {
    tips.push('Ainda sem esse número? Escolha "Não sei" ou "Quero recomendação". A equipe dimensiona a partir do uso do ambiente.');
  }
  return tips.slice(0, 2);
}

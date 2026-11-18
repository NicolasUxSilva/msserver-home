// Conteúdo editorial da landing de Cloud para quem cuida da infraestrutura de TI de
// uma empresa (equipe interna ou contratada). As afirmações sobre a MSSERVER vêm das
// páginas publicadas em msserver.com.br, consultadas em 28/10/2026 e revisadas em
// 30/10/2026 (fonte em cada bloco):
//   SC = /solucoes-cloud-msserver/   NP = /nuvem-privada/
//   SD = /servidores-dedicados/      BK = /backup-em-nuvem/
//   CO = /consultoria-em-implantacao-de-servidores/
// Nenhum preço, SLA contratual ou condição comercial é afirmado aqui.

import type { Scenario, Workload } from '../../../scripts/landings/cloud-simulator/types';
import { CONTACT } from './site';
import { ROUTES } from '../../../config/site';

export const HERO_PROOF = [
  // NP: "Nuvem personalizada e exclusiva", "processadores virtuais e memória", "topologia de rede"
  { icon: 'cloud', title: 'Nuvem privada sob medida', text: 'Processamento, memória, storage e rede' },
  // SC: "Todos nossos recursos em Cloud com maquinas espelhadas, garantindo 99,9% de Uptime"
  { icon: 'activity', title: '99,9% de uptime', text: 'Informado pela MSSERVER, em máquinas espelhadas' },
  // SC: "Nosso programa de migração oferece instruções de uso para toda a equipe"
  { icon: 'graduation-cap', title: 'Programa de migração', text: 'Instruções de uso para a sua equipe' },
  // NP: "Somos uma empresa nacional" · SD: "data center no Brasil"
  { icon: 'map-pin', title: 'Empresa nacional', text: 'Data center no Brasil' },
];

/** Situações do dia a dia de quem cuida da infraestrutura. Cada uma leva ao simulador com o contexto marcado. */
export interface Challenge {
  id: string;
  icon: string;
  title: string;
  text: string;
  /** Recursos que costumam entrar na solução (rótulos, não oferta). */
  fits: string[];
  workload?: Workload;
  scenario?: Scenario;
  service?: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'servidor-local',
    icon: 'hard-drive',
    title: 'O servidor local chegou ao limite',
    text: 'Disco quase cheio, memória no talo e um hardware que já passou da hora. Em vez de trocar peça por peça, o ambiente pode ir para uma estrutura dimensionada para a operação.',
    fits: ['Nuvem privada', 'Migração', 'Backup diário'],
    scenario: 'migrate',
  },
  {
    id: 'erp-remoto',
    icon: 'layout-dashboard',
    title: 'O ERP precisa ser acessado de qualquer lugar',
    text: 'Filial, home office, contador de fora. Com o sistema na nuvem e VPN com o escritório, a equipe usa o mesmo ambiente de onde estiver.',
    fits: ['Memória', 'VPN', 'Backup diário'],
    workload: 'erp',
  },
  {
    // NP: "Altíssima performance de I/O" · SD: "bancos de dados complexos"
    id: 'banco-lento',
    icon: 'database',
    title: 'O banco de dados trava no horário de pico',
    text: 'Consulta lenta, fechamento de mês que não termina e usuário reclamando. Pede recursos reservados e armazenamento com boa performance de I/O.',
    fits: ['Performance de I/O', 'Memória', 'Cores'],
    workload: 'database',
  },
  {
    // SC: "escalável"
    id: 'crescimento',
    icon: 'trending-up',
    title: 'A operação cresceu e o ambiente não acompanhou',
    text: 'Mais usuários, mais sistemas e mais dados no mesmo servidor. A estrutura precisa crescer junto, sem recomeçar do zero a cada ampliação.',
    fits: ['Armazenamento', 'Memória', 'Monitoramento'],
    scenario: 'expand',
  },
  {
    // NP / BK: backup diário em ambiente externo, ransomware
    id: 'arquivos-backup',
    icon: 'folder-archive',
    title: 'Arquivos espalhados e backup que ninguém confere',
    text: 'HD externo, cópia manual e o risco de um ransomware. Arquivos centralizados na nuvem, com backup diário em ambiente externo.',
    fits: ['Capacidade', 'Backup diário', 'Acesso remoto'],
    workload: 'files',
    service: 'backup',
  },
  {
    // SC: programa de migração
    id: 'trocar-provedor',
    icon: 'arrow-right-left',
    title: 'O provedor atual não atende mais',
    text: 'Custo que não fecha, suporte distante ou recurso que não escala. A troca pode ser planejada com a equipe e o programa de migração.',
    fits: ['Migração', 'Orientação', 'Suporte'],
    scenario: 'switch',
  },
];

export const challengePreset = (c: Challenge) =>
  [c.workload && `workload:${c.workload}`, c.scenario && `scenario:${c.scenario}`, c.service && `service:${c.service}`].filter(Boolean).join(' ');

/** O que fica com a TI da empresa e o que a MSSERVER assume. */
export const SUPPORT_SPLIT = {
  you: [
    { icon: 'users', text: 'Conhece a operação, os sistemas e os usuários da empresa' },
    { icon: 'scan-search', text: 'Identifica os gargalos e as necessidades do ambiente' },
    { icon: 'list-checks', text: 'Define prioridades e requisitos com a equipe da MSSERVER' },
    { icon: 'messages-square', text: 'Acompanha o dia a dia e participa das decisões técnicas' },
  ],
  us: [
    // SC / NP / SD
    { icon: 'cloud', text: 'Infraestrutura em nuvem: nuvem privada ou servidor dedicado em data center' },
    // SC ("Análise", "Orientação") · NP ("dimensionada pelos arquitetos")
    { icon: 'compass', text: 'Dimensionamento e arquitetura com os especialistas' },
    // SC
    { icon: 'graduation-cap', text: 'Programa de migração, com instruções de uso para a sua equipe' },
    // SC / NP
    { icon: 'shield-check', text: 'Monitoramento, segurança de rede e backup diário (adicional)' },
    // NP
    { icon: 'headset', text: 'Suporte técnico em português' },
  ],
};

export interface Solution {
  model: 'private' | 'dedicated' | 'hybrid';
  icon: string;
  title: string;
  text: string;
  /** Quando costuma fazer sentido (orientação, não regra comercial). */
  when: string;
  points: string[];
  href?: string;
}

export const SOLUTIONS: Solution[] = [
  {
    // NP
    model: 'private',
    icon: 'cloud',
    title: 'Nuvem privada',
    text: 'Nuvem personalizada e exclusiva, dimensionada pelos arquitetos da MSSERVER conforme os pré-requisitos e o orçamento da empresa.',
    when: 'ERP, banco e arquivos que pedem um ambiente exclusivo, com recursos e custos previsíveis.',
    points: ['Processadores virtuais, memória e latência de storage sob medida', 'Topologia de rede, segurança e tecnologia de virtualização definidas no projeto', 'Periféricos específicos, como USB e placas PCI-e'],
    href: ROUTES.nuvemPrivada,
  },
  {
    // SC + SD
    model: 'dedicated',
    icon: 'server',
    title: 'Servidor dedicado em data center',
    text: 'Recursos exclusivos de alta performance, hospedados em data center. A empresa usa a infraestrutura sem comprar nem instalar equipamento.',
    when: 'Cargas pesadas e estáveis que precisam de recursos só delas.',
    points: ['Console/KVM para ligar, reiniciar e montar ISOs', 'Baixa latência de leitura e gravação', 'VLAN privada, VPN e firewall dedicado (adicionais)'],
    href: 'https://msserver.com.br/servidores-dedicados/',
  },
  {
    // SC: "Não importa seu estágio na adoção de Cloud, se a sua necessidade é de cloud privada, multicloud ou híbrida..."
    model: 'hybrid',
    icon: 'network',
    title: 'Híbrida e multicloud',
    text: 'Não importa o estágio de adoção: os especialistas orientam a combinação da nuvem com o que a empresa já tem ou com outros provedores.',
    when: 'Parte do ambiente continua no escritório ou em outro provedor.',
    points: ['Análise de recursos e custos operacionais', 'Interligação com o escritório por VPN ou ponto a ponto', 'Conexão direta com grandes redes e IX.br'],
    // CO: "Multicloud e Nuvem Híbrida"
    href: ROUTES.consultoria,
  },
];

// Argumentos para apresentar a decisão à gestão da empresa.
// SC: "Cloud sob demanda e sem a necessidade de altos investimentos iniciais ... escalável"
// NP: "custos previsíveis, além de total controle ... isolamento de dados"
export const MANAGEMENT_ARGUMENTS = [
  { icon: 'wallet', title: 'Sem altos investimentos iniciais', text: 'Cloud sob demanda: a empresa usa a infraestrutura sem comprar equipamento para começar.' },
  { icon: 'receipt', title: 'Custos previsíveis', text: 'Recursos dimensionados para a necessidade, sem pagar por tecnologia que a operação não usa.' },
  { icon: 'trending-up', title: 'Cresce no mesmo ambiente', text: 'Os recursos acompanham o crescimento do negócio, sem trocar de estrutura.' },
  { icon: 'shield-check', title: 'Isolamento e controle', text: 'Ambiente exclusivo, controle de acesso de rede e requisitos de segurança próprios.' },
];

export const DIFFERENTIATORS = {
  // SC: "Todos nossos recursos em Cloud com maquinas espelhadas, garantindo 99,9% de Uptime, mantendo seus dados e serviços protegidos."
  uptime: {
    title: 'Recursos em máquinas espelhadas',
    text: 'Todos os recursos em Cloud ficam em máquinas espelhadas, com 99,9% de uptime informado pela MSSERVER, para manter os dados e os serviços da empresa protegidos.',
  },
  items: [
    {
      icon: 'graduation-cap',
      title: 'Da implantação à utilização',
      // SC
      text: 'O programa de migração traz instruções de uso para toda a sua equipe, das aplicações às boas práticas de uso dos recursos.',
    },
    {
      icon: 'activity',
      title: 'Monitoramento personalizado',
      // SC
      text: 'Ferramentas de monitoramento personalizado dão informação para decisões de negócio e de infraestrutura.',
    },
    {
      icon: 'headset',
      title: 'Suporte e treinamento',
      // NP
      text: 'Especialistas à disposição 24/7, por telefone e portal, em português. Treinamentos para a equipe sem custos adicionais.',
    },
    {
      icon: 'lock',
      title: 'Segurança a nível de rede',
      // NP
      text: 'Controle de acesso de rede, com interligação ao escritório por rede privada ponto a ponto, VPN ou regras restritivas de firewall.',
    },
    {
      icon: 'waypoints',
      title: 'Conectividade',
      // NP / SD
      text: 'Conexão direta com Akamai, Cloudflare, Microsoft, Google, AWS e UPX, peerings do IX.br e trânsito por múltiplas operadoras.',
    },
    {
      icon: 'building-2',
      title: 'Empresa nacional',
      // NP
      text: 'Segurança jurídica, tributária e cambial de uma empresa brasileira. Dá para visitar as instalações.',
    },
  ],
  // NP / SD / BK
  backup: {
    title: 'Backup diário',
    text: 'Dados armazenados em ambiente externo e à prova de falhas, para casos de remoção indevida de arquivos, banco de dados corrompido, problemas de sistema ou ransomware. Serviço adicional.',
    link: { href: ROUTES.backup, label: 'Conheça o backup em nuvem' },
  },
};

export const STATS = [
  // /cases-de-sucesso/ ("+15 Anos no Mercado")
  { value: '+15', label: 'anos no mercado' },
  // Informado pela MSSERVER em 28/10/2026 (mesmo indicador da landing de servidores físicos).
  { value: '+10.250', label: 'projetos entregues' },
];

// Fonte: depoimentos publicados em /sobre/ (pequenas correções de digitação).
export const TESTIMONIALS = [
  {
    quote:
      'Sempre que precisamos, adquirimos os equipamentos com a MSServer. Temos um excelente atendimento, nos é ofertado nada mais do que precisamos, gerando economia para a nossa empresa, sem contar o pós-venda mais ágil que o das próprias fabricantes.',
    name: 'Fernando',
    company: 'Perfilados Nardi',
  },
  {
    quote:
      'A MSServer fez o serviço de implantação de servidores. O que surpreendeu foi a agilidade em realizar essa implantação, que facilitou muito a nossa rotina, além de garantir a alta disponibilidade da nossa operação.',
    name: 'Sara',
    company: 'RD Concretos',
  },
];

/**
 * Da avaliação técnica à operação. SC ("Processos": Análise, Orientação, Cloud Computing),
 * contato ("Converse com um consultor para receber um orçamento") e programa de migração.
 * Prazos e etapas de cada projeto são definidos na avaliação técnica.
 */
export const PROCESS: { who: 'you' | 'both' | 'us'; title: string; text: string }[] = [
  { who: 'you', title: 'Levantamento', text: 'Pelo simulador ou direto no WhatsApp: sistemas, recursos, rede e como o ambiente está hoje. O que ainda não se sabe pode ficar em aberto.' },
  { who: 'both', title: 'Avaliação técnica', text: 'A equipe da MSSERVER analisa recursos e custos operacionais com você, buscando um ambiente enxuto, seguro e com alta disponibilidade.' },
  { who: 'both', title: 'Arquitetura e proposta', text: 'Os especialistas indicam o modelo e a arquitetura, e um consultor envia a proposta para a configuração definida.' },
  { who: 'both', title: 'Migração e implantação', text: 'O ambiente sobe com o programa de migração, que traz instruções de uso para a sua equipe, das aplicações às boas práticas.' },
  { who: 'us', title: 'Operação e suporte', text: 'Com o ambiente em produção, o monitoramento personalizado e o suporte especializado acompanham a infraestrutura.' },
];

export const WHO_LABEL = { you: 'Sua TI', both: 'Sua TI + MSSERVER', us: 'MSSERVER' } as const;

export const FAQ = [
  {
    q: 'Como funciona a migração?',
    // SC
    a: 'O plano de cada migração é definido na avaliação técnica, a partir do ambiente atual e da criticidade dos sistemas. O programa de migração da MSSERVER oferece instruções de uso para toda a equipe, desde o uso das aplicações até as boas práticas de uso dos recursos.',
  },
  {
    q: 'Como dimensionar o ambiente?',
    // SC ("Análise", "Orientação")
    a: 'Comece pelo simulador: ele organiza sistemas, processamento, memória, armazenamento e rede, e aceita "Não sei" ou "Quero recomendação" quando o número ainda não está claro. A equipe analisa recursos e custos operacionais com você e fecha o dimensionamento.',
  },
  {
    q: 'Qual a diferença entre nuvem privada e servidor dedicado em data center?',
    // NP / SD
    a: 'Na nuvem privada, os arquitetos da MSSERVER dimensionam processadores virtuais, memória, latência de storage, topologia de rede e virtualização sob medida para a empresa. No servidor dedicado, os recursos de um servidor hospedado em data center ficam exclusivos para o seu ambiente, com acesso por Console/KVM. Se o modelo ainda não estiver claro, escolha "Quero orientação" no simulador.',
  },
  {
    q: 'Quais recursos podem ser configurados?',
    // SC (configurador) / NP / SD
    a: 'O configurador da MSSERVER vai de 2 a 22 cores (4 a 44 threads), de 8 a 64 GB de memória e de 300 GB a 2 TB de armazenamento, com a opção de informar outros valores, e de 1 a 6 IPs. VPN, link ponto a ponto, firewall, VLAN privada, backup diário e monitoramento entram na avaliação; alguns são serviços adicionais.',
  },
  {
    q: 'Como fica a segurança do ambiente?',
    // NP / SD / SC
    a: 'O ambiente tem controle de acesso a nível de rede e pode ser interligado ao escritório por rede privada ponto a ponto, VPN ou regras restritivas de firewall. Há também ferramentas de monitoramento personalizado. Alguns recursos de rede são serviços adicionais.',
  },
  {
    q: 'Como funciona o backup?',
    // NP / BK
    a: 'O backup diário é um serviço adicional: os dados ficam em ambiente externo e à prova de falhas, para recuperar arquivos removidos, bancos de dados corrompidos, problemas de sistema e ataques de ransomware. A MSSERVER também oferece backup em nuvem com criptografia e redundância.',
  },
  {
    q: 'Como funciona o suporte?',
    // NP
    a: 'A MSSERVER informa que os especialistas ficam à disposição 24/7, por telefone e portal, em português, e que faz treinamentos para a equipe sem custos adicionais. O atendimento comercial é das 8h às 18h.',
  },
  {
    q: 'Qual é a disponibilidade do ambiente?',
    // SC
    a: 'A MSSERVER informa que todos os recursos em Cloud ficam em máquinas espelhadas, com 99,9% de uptime. As condições de cada contratação são detalhadas na proposta.',
  },
  {
    q: 'O simulador mostra preço?',
    a: 'Não. A MSSERVER não publica tabela de preços de Cloud. O simulador monta um levantamento preliminar de requisitos, e a equipe analisa o ambiente antes de qualquer proposta.',
  },
  {
    q: 'Como solicitar uma avaliação?',
    a: `Conclua o simulador e envie o levantamento pelo WhatsApp, ou fale direto com um especialista pelo WhatsApp, pelo telefone ${CONTACT.phoneDisplay} ou pelo e-mail ${CONTACT.emailCommercial}. O atendimento comercial é das 8h às 18h.`,
  },
];

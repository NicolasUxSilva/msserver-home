// Conteúdo editorial da landing de servidores físicos. As afirmações sobre a
// MSSERVER vêm das páginas publicadas em msserver.com.br (fonte em cada bloco),
// exceto onde indicado como informação fornecida pela MSSERVER.
import { ROUTES } from '../../../config/site';

export const HERO_PROOF = [
  // Fonte: páginas de produto ("Garantia padrão de 1 ano. Extensão de garantia disponível até 5 anos.")
  { icon: 'shield-check', title: 'Garantia de até 5 anos', text: '1 ano padrão + extensão' },
  // Fonte: landing anterior e Quem Somos ("Venda e locação de servidores")
  { icon: 'layers', title: 'Compra ou locação', text: 'Servidores rack ou torre' },
  // Fonte: /cases-de-sucesso/ ("+15 Anos no Mercado")
  { icon: 'badge-check', title: '+15 anos no mercado', text: 'Infraestrutura para empresas' },
  // Fonte: home ("Fornecimento de servidores e peças para empresas e datacenters em todo o Brasil")
  { icon: 'truck', title: 'Envio para todo o Brasil', text: 'Estoque pronto para montagem' },
];

export const APPLICATIONS = [
  {
    icon: 'layout-dashboard',
    title: 'ERP e sistemas de gestão',
    text: 'Faturamento, fiscal, estoque e CRM em um servidor exclusivo da empresa, sem disputar recursos com outros clientes.',
  },
  {
    icon: 'database',
    title: 'Bancos de dados',
    text: 'Consultas e gravações constantes pedem memória para cache e discos de baixa latência.',
  },
  {
    icon: 'layers',
    title: 'Virtualização',
    text: 'Consolide vários servidores virtuais em um único equipamento, com recursos reservados para cada máquina.',
  },
  {
    icon: 'globe',
    title: 'Aplicações e sites',
    text: 'Sistemas web, portais e APIs com hardware exclusivo e controle total do ambiente.',
  },
  {
    icon: 'folder-archive',
    title: 'Arquivos e backup',
    text: 'Compartilhamento de arquivos e retenção de cópias de segurança, com capacidade para crescer.',
  },
];

export const DIFFERENTIATORS = {
  // Fonte: /extencao-de-garantia
  warranty: {
    title: 'Garantia padrão de 1 ano, com extensão até 5 anos',
    text: 'O plano Non-Stop prevê a substituição antecipada do servidor em caso de problema, e a extensão cobre componentes como discos, fonte e placa-mãe.',
    link: { href: ROUTES.garantia, label: 'Como funciona a extensão' },
  },
  items: [
    {
      icon: 'clipboard-check',
      title: 'Testado antes de sair',
      // Fonte: páginas de produto + landing anterior ("Estoque imediato e pronto para envio")
      text: 'Cada equipamento sai com selo de garantia, checklist e teste de stress. Estoque pronto para montagem e envio para todo o Brasil.',
    },
    {
      icon: 'headset',
      title: 'Suporte humano e pró-ativo',
      // Fonte: landing anterior ("Você fala com especialistas de verdade. Nada de robôs.") e home (suporte on-site)
      text: 'Você fala com especialistas, não com robôs. Atendimento técnico especializado, inclusive on-site.',
    },
    {
      icon: 'compass',
      title: 'Consultoria de implantação',
      // Fonte: landing anterior e /consultoria-em-implantacao-de-servidores/
      text: 'Não é só hardware: a equipe desenha o projeto certo para o seu cenário, local ou em nuvem.',
    },
    {
      icon: 'repeat',
      title: 'Recompra do equipamento atual',
      // Fonte: landing anterior ("Garantimos a recompra com um preço justo") e Quem Somos
      text: 'Preço justo pelo seu servidor usado na troca por um novo, em upgrades ou na migração para a nuvem.',
    },
  ],
};

export const PROCESS = [
  { title: 'Fale pelo WhatsApp', text: 'Conte o uso, o número de usuários e o que já existe na sua empresa.' },
  { title: 'Indicação do especialista', text: 'A equipe indica o modelo e a configuração adequados ao seu cenário.' },
  { title: 'Proposta', text: 'Você recebe a proposta de compra ou locação para a configuração indicada.' },
  { title: 'Montagem, testes e envio', text: 'O servidor passa por checklist e teste de stress antes do envio para todo o Brasil.' },
];

export const STATS = [
  // Fonte: /cases-de-sucesso/ ("+15 Anos no Mercado")
  { value: '+15', label: 'anos no mercado' },
  // Informado pela MSSERVER em 28/10/2026 (antes: "+250", de /cases-de-sucesso/).
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

export const FAQ = [
  {
    q: 'Os servidores são novos?',
    a: 'A MSSERVER trabalha com servidores usados e seminovos das linhas Dell PowerEdge, HP ProLiant e IBM System x. Todos saem com selo de garantia, checklist e teste de stress.',
  },
  {
    q: 'Como funciona a garantia?',
    a: 'Os servidores têm garantia padrão de 1 ano. A extensão de garantia amplia a cobertura para até 5 anos, inclui componentes como discos, fonte e placa-mãe e segue o plano Non-Stop de substituição antecipada. A extensão também pode ser contratada pelo App MSSERVER.',
  },
  {
    q: 'É melhor comprar ou alugar um servidor?',
    a: 'Na compra, o equipamento passa a ser da empresa e o investimento acontece de uma vez. Na locação, você usa o servidor sem imobilizar capital, com condições definidas em contrato. A escolha depende do horizonte do projeto, do orçamento e da política da empresa. A equipe apresenta as duas opções.',
  },
  {
    q: 'A MSSERVER oferece suporte técnico?',
    a: 'Sim. O suporte é feito por especialistas, inclusive com atendimento on-site, e também pode ser acionado pelo App MSSERVER. O atendimento comercial funciona das 8h às 18h.',
  },
  {
    q: 'Vocês atendem empresas fora de São Paulo?',
    a: 'Sim. A MSSERVER fornece servidores e peças para empresas e data centers em todo o Brasil.',
  },
  {
    q: 'É possível montar uma configuração específica?',
    a: 'Sim. A equipe monta configurações específicas de processador, memória e armazenamento para o seu cenário. Conte os detalhes pelo WhatsApp.',
  },
];

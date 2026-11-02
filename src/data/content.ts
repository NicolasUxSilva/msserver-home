// Conteúdo textual da home atual de msserver.com.br, preservado.
// As palavras, a pontuação e a ordem são as do WordPress. A única mudança é tipográfica:
// títulos e botões publicados em CAIXA ALTA passam a usar caixa de frase, como nas landings.
// A versão original de cada texto está em docs/PRESERVACAO.md.
import { LINKS } from '../config/site';

export type Slide = {
  key: string;
  /** Slider do desktop/tablet (widget 551d510): o slide inteiro é um link. */
  desktop: { heading: string; description: string; highlight: string; keywords?: string; button: string; href: string; newTab?: boolean };
  /** Slider do celular (widget 30e1739): o botão é o link. */
  mobile: { heading: string; description: string; highlight?: string; button: string; href: string };
  alt: string;
};

export const SLIDES: Slide[] = [
  {
    key: 'servidores',
    desktop: {
      heading: 'Servidores usados e semi-novos',
      description: 'Venda, Locação e Manutenção de Servidores Usados e Seminovos, Servidor Dell servidor Hp e ibm.',
      highlight: 'Confira modelos com suporte on-site e garantia estendida de até 5 anos.',
      button: 'Ver modelos',
      href: LINKS.servers,
    },
    mobile: {
      heading: 'Servidores usados e semi-novos',
      description: 'Venda, Locação e Manutenção.',
      highlight: 'Confira nossos modelos com suporte on-site e garantia estendida de até 5 anos.',
      button: 'Ver modelos',
      href: LINKS.servers,
    },
    alt: 'Servidores Dell em torre e rack com notebook e tablet exibindo painéis de monitoramento',
  },
  {
    key: 'app',
    desktop: {
      heading: 'O unico com app gratuito para gestão de servidores',
      description: 'Acompanhamento em tempo real do seu servidor.',
      highlight: 'Recursos e serviços para mitigar indisponibilidades.',
      keywords: 'Servidores Dell, Servidores HP, Servidores Ibm',
      button: 'Baixar o app',
      href: LINKS.app,
      newTab: true,
    },
    mobile: {
      heading: 'Gerencie seus servidores com o app da MSSERVER',
      description: 'Acompanhamento em tempo real do seu servidor. Recursos e Serviços para mitigar indisponibilidades.',
      button: 'Baixar o app',
      // Na home do WordPress: https://msserver.com.br/#appmobile (âncora da seção do app nesta página).
      href: '#appmobile',
    },
    alt: 'Celulares exibindo o aplicativo da MSSERVER',
  },
  {
    key: 'nuvem',
    desktop: {
      heading: 'Nuvem privada suporte e monitoramento 24h',
      description: 'Fornecimento de servidores e peças para empresas e datacenters em todo o brasil,',
      highlight: 'O recurso certo para seu projeto você encontra aqui.',
      keywords: 'Servidores Usados Dell, Servidores para empresas, Servidores Ibm',
      button: 'Nuvem',
      href: 'https://msserver.com.br/solucoes-cloud-msserver/',
    },
    mobile: {
      heading: 'Suporte e monitoramento 24h',
      description: 'Fornecimento de servidores e peças para empresas e datacenters em todo o Brasil, o recurso certo para seu projeto você encontra aqui.',
      button: 'Obter suporte',
      href: 'https://msserver.com.br/obter-suporte',
    },
    alt: 'Racks de data center iluminados',
  },
];

export const LINE = {
  title: 'Nossa linha',
  viewAll: { label: 'Ver todos', href: LINKS.servers },
};

/** Acordeão de soluções (widget eael-image-accordion, versão desktop). */
export const SOLUTIONS = [
  {
    key: 'consultoria',
    title: 'Consultoria',
    text: 'Obtenha o melhor custo-benefício para o seu projeto. Nossa consultoria especializada em servidores físicos e recursos em nuvem garante uma implementação eficiente e econômica. Confira alguns casos de sucesso.',
    href: 'https://msserver.com.br/consultoria-em-implantacao-de-servidores/',
  },
  {
    key: 'migracao',
    title: 'Migração para Nuvem',
    text: 'Tome decisões inteligentes para seus recursos computacionais. Oferecemos a ajuda necessária! Compare os benefícios exclusivos de nossos servidores físicos e nossa solução em nuvem poderosa.',
    href: 'https://msserver.com.br/solucoes-cloud/',
  },
  {
    key: 'ciberseguranca',
    title: 'Cibersegurança',
    // Título usado no acordeão do celular no WordPress.
    mobileTitle: 'Cyber Segurança',
    text: 'Proteja suas informações valiosas. Soluções personalizadas e uma base sólida que garantem a segurança do seu negócio no digital, analisamos as principais vulnerabilidades em sua infra reduzindo assim riscos de ataques cibernéticos, saiba mais e proteja-se agora mesmo.',
    // No WordPress este painel aponta para "#/" (não leva a nenhuma página).
    href: null,
  },
] as const;

export const APP = {
  kicker: 'Conheça',
  title: 'Nosso app',
  button: { label: 'Quero conhecer', href: LINKS.app },
};

export const POSTS_TITLE = 'Confira nossas últimas postagens';
export const POSTS_READ_MORE = 'Leia mais »';
export const SOCIAL_TITLE = 'Acompanhe nossas redes';
export const CLIENTS_TITLE = 'Alguns clientes';

/** Logos de "Alguns clientes", na ordem do carrossel atual. */
export const CLIENTS = [
  { file: '01-correios', name: 'Correios' },
  { file: '02-datasafer', name: 'Datasafer' },
  { file: '03-exercito-brasileiro', name: 'Exército Brasileiro' },
  { file: '04-cliente', name: 'McDonald’s' },
  { file: '05-otimi', name: 'Otimi Tecnologia' },
  { file: '06-shopping-aricanduva', name: 'Shopping Aricanduva' },
  { file: '07-way-306', name: 'Way 306' },
  { file: '08-voxline', name: 'Voxline' },
  { file: '09-zafex', name: 'Zafex' },
  { file: '10-attri', name: 'Attri' },
] as const;

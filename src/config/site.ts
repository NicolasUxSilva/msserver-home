// Fatos, links e integrações da home atual de msserver.com.br (WordPress), preservados.
// Altere aqui, nunca nos componentes. Fonte: HTML publicado da home em 02/11/2026.

export const SITE = {
  origin: 'https://msserver.com.br',
  canonical: 'https://msserver.com.br',
  // Title, description e Open Graph da home atual (All in One SEO), sem alteração.
  title: 'MSServer Soluções em Servidores',
  description:
    'Servidores usados, servidor Dell, servidor hp e ibm. Grandes marcas com o melhor pós venda, não arrisque, conte com a MSServer!',
  ogSiteName: 'MSSERVER - Soluções em servidores para empresas.',
  ogImage: 'https://msserver.com.br/wp-content/uploads/2025/08/cropped-MS-Server_Cloud-1-scaled-1-e1755871178311.png',
  locale: 'pt_BR',
} as const;

const U = SITE.origin;

/**
 * Páginas já reconstruídas neste projeto: os links entre elas são internos (caminho na raiz do
 * site, respeitando o BASE_PATH do build), para que a Home e "Sobre nós" novas levem uma à outra
 * em qualquer ambiente. As páginas ainda não reformuladas continuam apontando para o WordPress
 * em msserver.com.br até serem reconstruídas. Ao reconstruir outra página, acrescente-a aqui.
 */
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
export const ROUTES = {
  home: `${BASE}/`,
  about: `${BASE}/sobre/`,
} as const;

export const LINKS = {
  home: ROUTES.home,
  servers: `${U}/servidores`,
  about: ROUTES.about,
  quote: `${U}/orcamento/`,
  blog: `${U}/blog/`,
  support: `${U}/obter-suporte/`,
  cases: `${U}/cases-de-sucesso/`,
  app: `${U}/aplicativo-ms-server/`,
  search: `${U}/`,
} as const;

export type NavLink = { label: string; href?: string; children?: NavLink[] };

/** Menu principal (ElementsKit "menu-menu"): mesmos itens, nomes, ordem e destinos. */
export const NAV: NavLink[] = [
  {
    label: 'Servidores',
    href: `${U}/servidores`,
    children: [
      { label: 'Ver todos', href: `${U}/servidores` },
      { label: 'Dell', href: `${U}/categoria-produto/dell/` },
      { label: 'HP', href: `${U}/categoria-produto/hp/` },
      { label: 'IBM', href: `${U}/categoria-produto/ibm/` },
      {
        label: 'Componentes',
        href: `${U}/categoria-produto/componentes/`,
        children: [
          { label: 'Baterias', href: `${U}/categoria-produto/baterias/` },
          { label: 'Dissipadores', href: `${U}/categoria-produto/dissipadores/` },
          { label: 'Fans', href: `${U}/categoria-produto/fans/` },
          { label: 'Fontes', href: `${U}/categoria-produto/fontes/` },
          { label: 'Gavetas', href: `${U}/categoria-produto/gavetas/` },
          { label: 'Placas de Rede', href: `${U}/categoria-produto/placas-de-rede/` },
        ],
      },
    ],
  },
  { label: 'Início', href: LINKS.home },
  { label: 'Sobre nós', href: LINKS.about },
  {
    // No WordPress, "Soluções" e "Servidores em Nuvem" apenas abrem submenus (href="#").
    label: 'Soluções',
    children: [
      {
        label: 'Servidores em Nuvem',
        children: [
          { label: 'Soluções Cloud', href: `${U}/solucoes-cloud/` },
          { label: 'Nuvem Privada', href: `${U}/nuvem-privada/` },
          { label: 'Servidores Dedicados', href: `${U}/servidores-dedicados/` },
        ],
      },
      { label: 'Aplicativo de Gestão', href: `${U}/aplicativo-ms-server/` },
      { label: 'Extensão de Garantia', href: `${U}/extencao-de-garantia` },
      { label: 'Backup em Nuvem', href: `${U}/backup-em-nuvem/` },
      { label: 'Consultoria', href: `${U}/consultoria-em-implantacao-de-servidores/` },
    ],
  },
  { label: 'Orçamento', href: `${U}/orcamento/` },
  { label: 'Blog', href: `${U}/blog/` },
  { label: 'Suporte', href: `${U}/obter-suporte/` },
  { label: 'Cases de sucesso', href: `${U}/cases-de-sucesso/` },
];

/** Menu do rodapé ("MENU"), com os destinos do WordPress; Início e Quem somos levam às páginas
 *  reconstruídas (ROUTES). */
export const FOOTER_MENU = [
  { label: 'Início', href: LINKS.home },
  { label: 'Quem somos', href: LINKS.about },
  { label: 'Orçamento', href: `${U}/orcamento` },
  { label: 'Blog', href: `${U}/blog` },
  { label: 'Servidores', href: `${U}/servidores` },
  { label: 'Obter Suporte', href: `${U}/obter-suporte` },
] as const;

export const SOCIAL = [
  { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/msserverinformatica/' },
  { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/msserver/' },
  { name: 'Linkedin', icon: 'linkedin', url: 'https://www.linkedin.com/company/msserver/' },
  { name: 'Youtube', icon: 'youtube', url: 'https://www.youtube.com/@msserversolucoesemservidor9811' },
] as const;

export const APP_STORES = {
  ios: 'https://apps.apple.com/br/app/msserver/id6444350263',
  android: 'https://play.google.com/store/apps/details?id=br.com.msserver',
} as const;

/** Rodapé: textos exatamente como publicados. */
export const CONTACT = {
  hours: 'Horário de funcionamento: 8 am as 18 pm.',
  address: 'Salvador de Sá, 182, Sta Terezinha, Santo André - SP',
  emails: ['contato@msserver.com.br', 'comercial@msserver.com.br'],
  phones: [
    { display: '(11) 4858-5358', e164: '+551148585358' },
    { display: '(11) 98599-1837', e164: '+5511985991837' },
  ],
  copyright: '© 2023 MSServer. Todos os direitos reservados.',
} as const;

/** Botão flutuante do plugin Click to Chat (mesmo número e mensagem pré-preenchida). */
export const WHATSAPP = {
  number: '5511985991837',
  preFilled: 'Ola! Mensagem vinda do site.',
} as const;
export const whatsappUrl = (text: string = WHATSAPP.preFilled) => `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(text)}`;

/** Vídeo da home (widget de vídeo do Elementor, com a playlist do canal). */
export const VIDEO = {
  id: '1MQYjMeyX6w',
  playlist: 'PLD5Luy6JY9pB9oSb0IRJZsyHrZEDxRqQW',
  title: 'Vídeo institucional MSSERVER',
} as const;

/**
 * Rastreamento instalado hoje na home do WordPress. Só é carregado quando
 * PUBLIC_TRACKING=true no build (produção), para que previews e testes não gerem dados.
 */
export const TRACKING = {
  enabled: import.meta.env.PUBLIC_TRACKING === 'true',
  gtm: 'GTM-KTDRRP3',
  googleAds: 'AW-715484072',
  metaPixel: '4553103271463659',
  clarity: 'hfpiyea4bu',
  // Loader do RD Station (inclui o pop-up de conversão exibido no celular).
  rdStation: 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/df434ab1-ef5b-48ad-8041-1e522789e947-loader.js',
} as const;

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
 * site, respeitando o BASE_PATH do build), para que as páginas novas (Home, "Sobre nós",
 * Orçamento, o catálogo de servidores, as categorias, as páginas de produto, o carrinho, a
 * finalização de orçamento e as soluções) levem umas às outras em qualquer ambiente. As páginas ainda não reformuladas continuam apontando para o
 * WordPress em msserver.com.br até serem reconstruídas. Ao reconstruir outra página, acrescente-a aqui.
 */
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
export const ROUTES = {
  home: `${BASE}/`,
  about: `${BASE}/sobre/`,
  quote: `${BASE}/orcamento/`,
  servers: `${BASE}/servidores/`,
  dell: `${BASE}/categoria-produto/dell/`,
  hp: `${BASE}/categoria-produto/hp/`,
  ibm: `${BASE}/categoria-produto/ibm/`,
  componentes: `${BASE}/categoria-produto/componentes/`,
  baterias: `${BASE}/categoria-produto/baterias/`,
  dissipadores: `${BASE}/categoria-produto/dissipadores/`,
  fans: `${BASE}/categoria-produto/fans/`,
  fontes: `${BASE}/categoria-produto/fontes/`,
  gavetas: `${BASE}/categoria-produto/gavetas/`,
  placasDeRede: `${BASE}/categoria-produto/placas-de-rede/`,
  /** Carrinho (o mesmo endereço do WooCommerce); lido e alterado pela Store API do WooCommerce. */
  cart: `${BASE}/carrinho/`,
  /** Finalização de orçamento, no endereço da finalização de compra do WooCommerce: revisão do
   *  carrinho e envio da solicitação ao comercial pelo WhatsApp (o site não recebe pagamentos). */
  checkout: `${BASE}/finalizar-compra/`,
  /** Páginas de soluções reconstruídas, nos mesmos endereços do WordPress (inclusive a grafia
   *  "extencao" do endereço publicado). */
  nuvemPrivada: `${BASE}/nuvem-privada/`,
  garantia: `${BASE}/extencao-de-garantia/`,
  backup: `${BASE}/backup-em-nuvem/`,
  consultoria: `${BASE}/consultoria-em-implantacao-de-servidores/`,
} as const;

/** Página de um produto (/servidor/slug/, o mesmo endereço do WooCommerce). */
export const productRoute = (slug: string) => `${BASE}/servidor/${slug}/`;

export const LINKS = {
  home: ROUTES.home,
  servers: ROUTES.servers,
  about: ROUTES.about,
  quote: ROUTES.quote,
  blog: `${U}/blog/`,
  support: `${U}/obter-suporte/`,
  cases: `${U}/cases-de-sucesso/`,
  app: `${U}/aplicativo-ms-server/`,
  search: `${U}/`,
  /** Finalização de compra no WordPress: recebe o "Orçamento" sem JavaScript (um POST, que o
   *  WooCommerce atende: adiciona o produto e mostra a finalização) e é o destino do carrinho quando a
   *  Store API não responde neste endereço. A finalização deste site é ROUTES.checkout. */
  checkout: `${U}/finalizar-compra/`,
} as const;

/** Store API do WooCommerce (mesmo domínio do site, com a sessão do carrinho em cookie). Em outro
 *  ambiente, PUBLIC_STORE_API aponta para outra instalação. */
export const STORE_API = (import.meta.env?.PUBLIC_STORE_API || '/wp-json/wc/store/v1').replace(/\/$/, '');

export type NavLink = { label: string; href?: string; children?: NavLink[] };

/** Menu principal (ElementsKit "menu-menu"): mesmos itens, nomes, ordem e destinos. */
export const NAV: NavLink[] = [
  {
    label: 'Servidores',
    href: LINKS.servers,
    children: [
      { label: 'Ver todos', href: LINKS.servers },
      { label: 'Dell', href: ROUTES.dell },
      { label: 'HP', href: ROUTES.hp },
      { label: 'IBM', href: ROUTES.ibm },
      {
        label: 'Componentes',
        href: ROUTES.componentes,
        children: [
          { label: 'Baterias', href: ROUTES.baterias },
          { label: 'Dissipadores', href: ROUTES.dissipadores },
          { label: 'Fans', href: ROUTES.fans },
          { label: 'Fontes', href: ROUTES.fontes },
          { label: 'Gavetas', href: ROUTES.gavetas },
          { label: 'Placas de Rede', href: ROUTES.placasDeRede },
        ],
      },
    ],
  },
  { label: 'Início', href: LINKS.home },
  { label: 'Sobre nós', href: LINKS.about },
  {
    // No WordPress, "Soluções" apenas abre o submenu (href="#"). Desde a reconstrução das soluções,
    // uma lista só, na ordem definida pela MSSERVER: "Servidores Dedicados" (/servidores-dedicados/)
    // deu lugar à página de Servidores Físicos já publicada, e o grupo "Servidores em Nuvem" saiu.
    // Nuvem Privada, Extensão de Garantia, Backup em Nuvem e Consultoria são as páginas
    // reconstruídas (ROUTES); Soluções Cloud e Servidores Físicos são páginas próprias, publicadas
    // fora deste projeto; o Aplicativo de Gestão continua na página atual do WordPress.
    label: 'Soluções',
    children: [
      { label: 'Soluções Cloud', href: `${U}/solucoes-cloud/` },
      { label: 'Nuvem Privada', href: ROUTES.nuvemPrivada },
      { label: 'Servidores Físicos', href: `${U}/servidores-fisicos/` },
      { label: 'Aplicativo de Gestão', href: `${U}/aplicativo-ms-server/` },
      { label: 'Extensão de Garantia', href: ROUTES.garantia },
      { label: 'Backup em Nuvem', href: ROUTES.backup },
      { label: 'Consultoria', href: ROUTES.consultoria },
    ],
  },
  { label: 'Orçamento', href: LINKS.quote },
  { label: 'Blog', href: `${U}/blog/` },
  { label: 'Suporte', href: `${U}/obter-suporte/` },
  { label: 'Cases de sucesso', href: `${U}/cases-de-sucesso/` },
];

/** Menu do rodapé ("MENU"), com os destinos do WordPress; Início, Quem somos, Orçamento e
 *  Servidores levam às páginas reconstruídas (ROUTES). */
export const FOOTER_MENU = [
  { label: 'Início', href: LINKS.home },
  { label: 'Quem somos', href: LINKS.about },
  { label: 'Orçamento', href: LINKS.quote },
  { label: 'Blog', href: `${U}/blog` },
  { label: 'Servidores', href: LINKS.servers },
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

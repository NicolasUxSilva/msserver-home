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
 * Páginas servidas por este projeto: os links entre elas são internos (caminho na raiz do site,
 * respeitando o BASE_PATH do build), para que levem umas às outras em qualquer ambiente. As
 * páginas que continuam no WordPress (Suporte, Minha conta, Aplicativo de Gestão e as landings
 * antigas) seguem com o endereço absoluto de msserver.com.br.
 * Ao reconstruir outra página, acrescente-a aqui e em docs/ROTEAMENTO.md.
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
  /** Formatos de servidor (categorias do WooCommerce com os mesmos endereços). */
  rack: `${BASE}/categoria-produto/rack/`,
  torre: `${BASE}/categoria-produto/torre/`,
  escalaNuvem: `${BASE}/categoria-produto/escala-nuvem/`,
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
  /** Landings aprovadas, integradas ao site com o cabeçalho e o rodapé dele (seções e simulador
   *  vindos dos repositórios cloud-ms e landins-servidores-fisicos, docs/LANDINGS.md), nos endereços
   *  já publicados. */
  cloud: `${BASE}/solucoes-cloud/`,
  servidoresFisicos: `${BASE}/servidores-fisicos/`,
  /** Blog: listagem (/blog/, /blog/page/N/), artigos na raiz (/slug/) e categorias (/category/slug/),
   *  os mesmos endereços do WordPress. */
  blog: `${BASE}/blog/`,
  cases: `${BASE}/cases-de-sucesso/`,
  privacy: `${BASE}/politica-de-privacidade/`,
} as const;

/** Página de um produto (/servidor/slug/, o mesmo endereço do WooCommerce). */
export const productRoute = (slug: string) => `${BASE}/servidor/${slug}/`;
/** Artigo do blog (/slug/, o mesmo endereço do WordPress). */
export const postRoute = (slug: string) => `${BASE}/${slug}/`;
/** Categoria do blog (/category/slug/, o mesmo endereço do WordPress). */
export const blogCategoryRoute = (slug: string) => `${BASE}/category/${slug}/`;
/** Busca no catálogo (o destino da busca do cabeçalho). */
export const searchRoute = (q: string) => `${ROUTES.servers}${q.trim() ? `?busca=${encodeURIComponent(q.trim())}` : ''}`;

export const LINKS = {
  home: ROUTES.home,
  servers: ROUTES.servers,
  about: ROUTES.about,
  quote: ROUTES.quote,
  blog: ROUTES.blog,
  cases: ROUTES.cases,
  /** Suporte (Awesome Support): continua no WordPress, com a identidade do site aplicada pelo plugin
   *  wordpress/msserver-suporte (docs/SUPORTE.md). */
  support: `${U}/obter-suporte/`,
  app: `${U}/aplicativo-ms-server/`,
  /** Busca do cabeçalho: o catálogo deste site (/servidores/?busca=). */
  search: ROUTES.servers,
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
      {
        // Formatos de servidor: categorias do WooCommerce (Rack, Torre, Escala nuvem) que ganharam
        // página no catálogo. Grupo sem página própria.
        label: 'Por formato',
        children: [
          { label: 'Rack', href: ROUTES.rack },
          { label: 'Torre', href: ROUTES.torre },
          { label: 'Escala Nuvem', href: ROUTES.escalaNuvem },
        ],
      },
    ],
  },
  { label: 'Início', href: LINKS.home },
  { label: 'Sobre nós', href: LINKS.about },
  {
    // No WordPress, "Soluções" apenas abre o submenu (href="#"). Uma lista só, na ordem definida
    // pela MSSERVER. Soluções Cloud e Servidores Físicos são as landings aprovadas, integradas ao
    // site. O Aplicativo de Gestão saiu deste menu por decisão da MSSERVER (18/11/2026); a página
    // (/aplicativo-ms-server/, no WordPress) continua no ar e com os links da home (LINKS.app).
    label: 'Soluções',
    children: [
      { label: 'Soluções Cloud', href: ROUTES.cloud },
      { label: 'Nuvem Privada', href: ROUTES.nuvemPrivada },
      { label: 'Servidores Físicos', href: ROUTES.servidoresFisicos },
      { label: 'Extensão de Garantia', href: ROUTES.garantia },
      { label: 'Backup em Nuvem', href: ROUTES.backup },
      { label: 'Consultoria', href: ROUTES.consultoria },
    ],
  },
  { label: 'Orçamento', href: LINKS.quote },
  { label: 'Blog', href: LINKS.blog },
  { label: 'Suporte', href: LINKS.support },
  { label: 'Cases de sucesso', href: LINKS.cases },
];

/** Menu do rodapé ("MENU"): os mesmos itens do WordPress, com os destinos deste site. */
export const FOOTER_MENU = [
  { label: 'Início', href: LINKS.home },
  { label: 'Quem somos', href: LINKS.about },
  { label: 'Orçamento', href: LINKS.quote },
  { label: 'Blog', href: LINKS.blog },
  { label: 'Servidores', href: LINKS.servers },
  { label: 'Obter Suporte', href: LINKS.support },
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
 * Rastreamento instalado hoje na home do WordPress. Só existe na página quando PUBLIC_TRACKING=true no
 * build (produção, com autorização da MSSERVER), para que previews e testes não gerem dados. Mesmo
 * ligado, cada ferramenta só carrega depois do consentimento da categoria dela (src/scripts/consent.ts).
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

/**
 * Consentimento de cookies: categoria de cada ferramenta (proposta técnica; a classificação final
 * depende da aprovação jurídica — docs/PRIVACIDADE.md). Mudar a versão pede a escolha de novo a
 * todos os visitantes (use ao mudar ferramentas ou categorias).
 */
export const CONSENT = {
  enabled: TRACKING.enabled,
  version: '1',
  tools: { gtm: TRACKING.gtm, googleAds: TRACKING.googleAds, metaPixel: TRACKING.metaPixel, clarity: TRACKING.clarity, rdStation: TRACKING.rdStation },
  categories: { gtm: 'analytics', googleAds: 'marketing', metaPixel: 'marketing', clarity: 'analytics', rdStation: 'marketing' },
} as const;

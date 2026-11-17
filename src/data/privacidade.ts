// Política de privacidade e consentimento de cookies.
//
// IMPORTANTE: o conteúdo jurídico da política ainda não foi aprovado pela MSSERVER. Enquanto
// POLICY.approved for false, a página /politica-de-privacidade/ mostra a estrutura com os pontos
// pendentes claramente marcados, sai com "noindex" e não se apresenta como política válida. Nada aqui
// afirma conformidade com a LGPD. Quando o texto for aprovado, preencha cada seção (body) e mude
// approved para true (docs/PRIVACIDADE.md).

export const POLICY = {
  approved: false,
  title: 'Política de privacidade',
  /** Data da versão aprovada (vazia enquanto não houver aprovação). */
  updatedAt: '',
  pendingNotice:
    'Esta página está em preparação. O texto da política de privacidade da MSSERVER ainda está em aprovação e será publicado aqui. Enquanto isso, dúvidas sobre dados pessoais podem ser enviadas para contato@msserver.com.br.',
  /** Seções previstas (a estrutura usual de uma política); body vazio = conteúdo pendente de aprovação. */
  sections: [
    { id: 'controlador', title: 'Quem é o controlador dos dados', body: '' },
    { id: 'dados', title: 'Quais dados pessoais são coletados', body: '' },
    { id: 'finalidades', title: 'Para que os dados são usados', body: '' },
    { id: 'bases-legais', title: 'Bases legais', body: '' },
    { id: 'compartilhamento', title: 'Com quem os dados são compartilhados', body: '' },
    { id: 'cookies', title: 'Cookies e tecnologias semelhantes', body: '' },
    { id: 'direitos', title: 'Direitos do titular e como exercê-los', body: '' },
    { id: 'retencao', title: 'Por quanto tempo os dados são guardados', body: '' },
    { id: 'seguranca', title: 'Segurança', body: '' },
    { id: 'encarregado', title: 'Encarregado (DPO) e contato', body: '' },
    { id: 'alteracoes', title: 'Alterações desta política', body: '' },
  ] as { id: string; title: string; body: string }[],
};

/**
 * Inventário técnico das tecnologias usadas pelo site (fatos de implementação, não texto jurídico),
 * para orientar a redação da política e a configuração do consentimento. "Categoria" é a proposta
 * técnica usada pelo gestor de consentimento; a classificação final depende da aprovação jurídica.
 */
export const TECHNOLOGIES = [
  { name: 'Carrinho de orçamento (WooCommerce)', provider: 'MSSERVER (msserver.com.br)', purpose: 'Guardar os produtos escolhidos para o orçamento (sessão do carrinho).', storage: 'Cookies da sessão do WooCommerce', category: 'Necessário' },
  { name: 'Preferências e estado do site', provider: 'MSSERVER (navegador)', purpose: 'Escolha de cookies, quantidade de itens do carrinho, rascunho dos dados de contato da finalização e avisos.', storage: 'localStorage e sessionStorage', category: 'Necessário' },
  { name: 'Suporte (Awesome Support / WordPress)', provider: 'MSSERVER (msserver.com.br)', purpose: 'Login e sessão de quem abre e acompanha chamados.', storage: 'Cookies de login do WordPress', category: 'Necessário' },
  { name: 'Formulários de orçamento e de soluções', provider: 'MSSERVER (Elementor, no WordPress)', purpose: 'Receber os dados de contato enviados nos formulários.', storage: 'Envio ao servidor (sem cookie próprio)', category: 'Necessário' },
  { name: 'Google Tag Manager', provider: 'Google', purpose: 'Gerenciar as tags de análise e de publicidade configuradas pela MSSERVER.', storage: 'Script (as tags configuradas podem usar cookies)', category: 'Análise / Publicidade' },
  { name: 'Google Ads (conversões e remarketing)', provider: 'Google', purpose: 'Medir conversões de campanhas e remarketing de produtos.', storage: 'Cookies do Google Ads', category: 'Publicidade' },
  { name: 'Meta Pixel', provider: 'Meta', purpose: 'Medir campanhas e públicos de anúncios no Facebook e no Instagram.', storage: 'Cookies da Meta', category: 'Publicidade' },
  { name: 'Microsoft Clarity', provider: 'Microsoft', purpose: 'Mapas de calor e gravações de navegação para análise de uso.', storage: 'Cookies do Clarity', category: 'Análise' },
  { name: 'RD Station', provider: 'RD Station', purpose: 'Automação de marketing e pop-up de conversão.', storage: 'Cookies do RD Station', category: 'Publicidade' },
  { name: 'Vídeos do YouTube (blog, soluções e home)', provider: 'Google', purpose: 'Exibir vídeos incorporados.', storage: 'Cookies do YouTube ao reproduzir', category: 'Terceiros (ao reproduzir)' },
];

/** Textos do aviso de cookies (sujeitos à aprovação jurídica; ajuste aqui). */
export const CONSENT_TEXT = {
  title: 'Cookies e privacidade',
  body: 'Usamos cookies necessários para o site funcionar (como o carrinho de orçamento). Com a sua permissão, também usamos cookies de análise, para entender como o site é usado, e de publicidade, para medir campanhas. Você pode mudar a escolha quando quiser em “Preferências de cookies”, no rodapé.',
  acceptAll: 'Aceitar todos',
  rejectAll: 'Só os necessários',
  customize: 'Personalizar',
  save: 'Salvar escolhas',
  categories: [
    { key: 'necessary', title: 'Necessários', text: 'Funcionamento do site: carrinho, login do suporte e as suas escolhas. Sempre ativos.', locked: true },
    { key: 'analytics', title: 'Análise', text: 'Medição de uso e de navegação (Microsoft Clarity e as tags de análise do Google Tag Manager).', locked: false },
    { key: 'marketing', title: 'Publicidade', text: 'Medição de campanhas e remarketing (Google Ads, Meta Pixel e RD Station).', locked: false },
  ],
  policyLink: 'Política de privacidade',
} as const;

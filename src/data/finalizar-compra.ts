// Finalização de compra (/finalizar-compra/): textos, campos e integrações.
//
// Campos, regras de endereço por país, países, estados, forma de pagamento, texto de privacidade e SEO
// vêm da página publicada do WooCommerce (src/data/checkout-wc.json, gerado por npm run sync:checkout).
// O WordPress da loja mostra os textos do WooCommerce em inglês (a tradução não está carregada);
// aqui vão as traduções oficiais do WooCommerce para o português do Brasil, como no restante do site.
import wc from './checkout-wc.json';

export const WC = wc;

export const CHECKOUT = {
  title: 'Finalização de compra',
  seoTitle: wc.seo.title,
  canonical: wc.seo.canonical,
  robots: wc.seo.robots,
  steps: ['Carrinho', 'Dados e pagamento', 'Pedido recebido'],
  cart: 'Carrinho',
  billingTitle: 'Detalhes de faturamento',
  shippingTitle: 'Entrega',
  shipToDifferent: 'Enviar para um endereço diferente?',
  shippingRates: 'Forma de entrega',
  noShippingRates: 'Nenhuma forma de entrega disponível para este endereço. Confira o endereço ou fale com a gente.',
  additionalTitle: 'Informação adicional',
  notesLabel: 'Notas do pedido',
  notesPlaceholder: 'Notas sobre seu pedido, por exemplo, informações especiais sobre entrega.',
  paymentTitle: 'Pagamento',
  orderTitle: 'Seu pedido',
  editCart: 'Editar carrinho',
  summaryToggle: 'Resumo do pedido',
  itemsOne: '1 item',
  itemsMany: '%s itens',
  required: 'obrigatório',
  selectOption: 'Selecione uma opção…',
  optional: '(opcional)',
  // Cupom (como no WooCommerce: "Você tem um cupom de desconto? Clique aqui e informe o código").
  couponToggle: 'Você tem um cupom de desconto?',
  couponLabel: 'Código do cupom',
  couponApply: 'Aplicar cupom',
  couponApplied: 'Cupom aplicado com sucesso.',
  couponRemoved: 'Cupom removido com sucesso.',
  couponEmpty: 'Por favor, insira um código de cupom.',
  couponError: 'Não foi possível aplicar o cupom: %s',
  couponRemove: 'Remover',
  // Totais (mesmos do carrinho).
  subtotal: 'Subtotal',
  coupon: 'Cupom: %s',
  shipping: 'Entrega',
  shippingLater: 'Informe o endereço de entrega',
  tax: 'Impostos',
  total: 'Total',
  // Cartão (formulário do WooCommerce: "Card number", "Expiry (MM/YY)", "Card code").
  cardNumber: 'Número do cartão',
  cardExpiry: 'Data de validade (MM/AA)',
  cardCvc: 'Código do cartão',
  cardNumberPlaceholder: '•••• •••• •••• ••••',
  cardExpiryPlaceholder: 'MM / AA',
  cardCvcPlaceholder: 'CVC',
  noPayment: 'Este pedido não precisa de pagamento.',
  noGateway: 'Desculpe, parece que não há métodos de pagamento disponíveis. Por favor, fale com a gente se precisar de ajuda ou quiser combinar outra forma.',
  insecure: 'Esta página não está em conexão segura (HTTPS). Para proteger os dados do cartão, o pagamento só é enviado em conexão segura.',
  insecureLink: 'Abrir em conexão segura',
  // "Place order".
  placeOrder: 'Finalizar pedido',
  processing: 'Processando…',
  processingLive: 'Processando o pedido. Não feche nem atualize a página.',
  // Validação (mensagens do WooCommerce).
  errorsTitle: 'Confira os campos destacados:',
  requiredField: '%s é um campo obrigatório.',
  invalidEmail: 'Endereço de e-mail de faturamento inválido.',
  invalidPhone: '%s não é um número de telefone válido.',
  invalidPostcode: 'Digite um %s válido.',
  invalidState: 'Selecione um %s da lista.',
  invalidCardNumber: 'Número do cartão inválido.',
  invalidExpiry: 'Data de validade inválida.',
  expiredCard: 'O cartão está vencido.',
  invalidCvc: 'Código do cartão inválido.',
  // Respostas da loja.
  checkoutError: 'Erro ao processar o pedido. Por favor, tente novamente.',
  paymentFailed: 'O pagamento não foi aprovado. Confira os dados do cartão ou use outro cartão.',
  paymentError: 'Não foi possível processar o pagamento: %s',
  networkError: 'Não foi possível confirmar o pedido porque a conexão com a loja falhou. Antes de tentar de novo, confira se recebeu um e-mail de confirmação ou fale com a gente.',
  cartChanged: 'O carrinho foi atualizado. Confira os valores antes de finalizar.',
  help: 'Precisa de ajuda?',
  helpLink: 'Fale com um consultor pelo WhatsApp',
  // Estados da página (o carrinho é lido da loja no navegador), como no carrinho.
  loading: 'Carregando a finalização de compra…',
  empty: 'Seu carrinho está vazio.',
  returnToShop: 'Retornar para a loja',
  unavailableTitle: 'Não foi possível carregar a finalização de compra agora.',
  unavailableText: 'A loja não respondeu. Tente de novo em instantes ou fale com um consultor pelo WhatsApp.',
  retry: 'Tentar de novo',
  consult: 'Fale com um consultor',
  noScriptTitle: 'A finalização de compra precisa de JavaScript.',
  noScriptText: 'Ative o JavaScript no navegador para concluir o pedido ou fale com um consultor pelo WhatsApp.',
} as const;

/** Nomes dos campos e das regras de endereço do WooCommerce (inglês, como na loja) em português. */
export const LABELS: Record<string, string> = {
  'First name': 'Nome',
  'Last name': 'Sobrenome',
  'Company name': 'Nome da empresa',
  'Country / Region': 'País/Região',
  'Street address': 'Endereço',
  'House number and street name': 'Nome da rua e número da casa',
  'Apartment, suite, unit, etc.': 'Apartamento, suíte, unidade, etc.',
  'Apartment, suite, unit, etc. (optional)': 'Apartamento, suíte, unidade, etc. (opcional)',
  'Town / City': 'Cidade',
  'Town / City / Post Office': 'Cidade / Agência dos Correios',
  'Town / District': 'Cidade / Distrito',
  'Town / Village': 'Cidade / Vila',
  Municipality: 'Município',
  Suburb: 'Subúrbio',
  'State / County': 'Estado',
  State: 'Estado',
  'State / Zone': 'Estado / Zona',
  County: 'Condado',
  Canton: 'Cantão',
  Department: 'Departamento',
  District: 'Distrito',
  'Municipality / District': 'Município / Distrito',
  Parish: 'Paróquia',
  Prefecture: 'Prefeitura',
  Province: 'Província',
  Region: 'Região',
  'Postcode / ZIP': 'CEP',
  Postcode: 'Código postal',
  'Postal code': 'Código postal',
  'Postal Code': 'Código postal',
  'ZIP Code': 'Código ZIP',
  'PIN Code': 'Código PIN',
  Eircode: 'Eircode',
  Phone: 'Telefone',
  'Email address': 'Endereço de e-mail',
  'Credit Card': 'Cartão de crédito',
};

export const pt = (s: string) => LABELS[s] ?? s;

/** Texto de privacidade do WooCommerce, com o link da página (o nome do link traduzido). */
export const PRIVACY_HTML = wc.privacy.html.replace('>privacy policy<', '>política de privacidade<').replace(' target="_blank"', ' target="_blank" rel="noopener"');

/** Países aceitos, com o nome em português (o WooCommerce manda em inglês), em ordem alfabética. */
export function countryOptions() {
  const names = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
  return wc.countries
    .map((c) => {
      let name = c.name;
      try {
        const n = names.of(c.code);
        if (n && n !== c.code) name = n;
      } catch {
        /* código sem nome no Intl: fica o do WooCommerce */
      }
      return { code: c.code, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

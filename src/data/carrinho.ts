// Carrinho (/carrinho/): textos e integrações. Os textos são os do carrinho do WooCommerce em
// português, como aparecem na página publicada (o All in One SEO guardou um retrato do carrinho com
// itens: "Produto, Preço, Quantidade, Subtotal, Atualizar o carrinho, Orçamento pelo WhatsApp, Total
// no carrinho, Subtotal, Total, Avançar para o pagamento"). Os itens e valores vêm da Store API.
import { WHATSAPP } from '../config/site';

export const CART = {
  title: 'Carrinho',
  /** Título, canonical e "noindex" do All in One SEO (a página não é indexada). */
  seoTitle: 'Carrinho - MSSERVER',
  canonical: 'https://msserver.com.br/carrinho/',
  robots: 'noindex, max-image-preview:large',
  columns: { product: 'Produto', price: 'Preço', quantity: 'Quantidade', subtotal: 'Subtotal', remove: 'Remover item' },
  totalsTitle: 'Total no carrinho',
  subtotal: 'Subtotal',
  total: 'Total',
  checkout: 'Avançar para o pagamento',
  whatsapp: 'Orçamento pelo WhatsApp',
  // Mensagens do WooCommerce (pt_BR).
  empty: 'Seu carrinho está vazio.',
  returnToShop: 'Retornar para a loja',
  added: '“%s” foi adicionado ao seu carrinho.',
  removed: '“%s” removido.',
  undo: 'Desfazer?',
  lowStock: 'Apenas %s em estoque',
  backorder: 'Disponível por encomenda',
  coupon: 'Cupom: %s',
  shipping: 'Entrega',
  shippingLater: 'Calculado na finalização da compra',
  tax: 'Impostos',
  // Estados desta página (o carrinho é lido da loja no navegador).
  loading: 'Carregando o carrinho…',
  unavailableTitle: 'Não foi possível carregar o carrinho agora.',
  unavailableText: 'A loja não respondeu. Tente de novo em instantes ou fale com um consultor pelo WhatsApp.',
  retry: 'Tentar de novo',
  consult: 'Fale com um consultor',
  noScriptTitle: 'O carrinho precisa de JavaScript.',
  noScriptText: 'Ative o JavaScript no navegador ou siga para a finalização da compra, que mostra os mesmos itens.',
} as const;

/**
 * "Orçamento pelo WhatsApp": o mesmo formato de mensagem do plugin "WooCommerce Order on WhatsApp"
 * (2.3.2) do WordPress — mensagem, linha em branco, "-> quantidade x produto = preço" por item e o
 * total do carrinho. O número e a mensagem configurados no plugin não são públicos (opções do
 * WordPress); aqui vão o WhatsApp e a mensagem que o site já usa em todos os botões de WhatsApp.
 * Confirme com a MSSERVER e ajuste aqui, se forem outros.
 */
export const WHATSAPP_ORDER = {
  number: WHATSAPP.number,
  intro: WHATSAPP.preFilled,
  totalLabel: 'Total do carrinho:',
} as const;

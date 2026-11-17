// Textos fixos da página de produto, como publicados no modelo do WordPress (Elementor 4844), iguais
// nos 74 produtos. Os dados de cada produto (nome, fotos, preço, variações, descrição) vêm do
// WooCommerce (src/data/catalog.json); nada aqui é específico de um produto.

/** Bloco ao lado da compra (no WordPress, repetido para o celular abaixo da descrição). */
export const GUARANTEE = {
  title: 'GARANTIA PADRÃO DE 1 ANO.',
  items: [
    'Extensão de garantia disponível até 5 anos.',
    'Aplicativo para gerenciar seus servidores – APP MSSERVER.',
    'Todos equipamento vão com selo de garantia, check-list e testes de stress.',
  ],
  // Última linha do bloco (sem ícone no original). "Fale com um consultor." leva ao WhatsApp do site.
  help: { text: 'Precisa de uma configuração especifica ou ficou com duvida?', cta: 'Fale com um consultor.' },
} as const;

/** Textos do formulário do WooCommerce, em português (o original mostrava os textos em inglês). */
export const BUY = {
  /** Botão do WooCommerce, renomeado no WordPress pelo plugin "Woo Add to Cart Text Change". */
  button: 'Orçamento',
  quantity: 'Quantidade',
  reset: 'Limpar',
  noPrice: 'Sob consulta',
  /** Produto sem preço publicado: o WordPress não mostra botão; aqui, o contato do bloco de garantia. */
  consult: 'Fale com um consultor',
  // Mensagens do WooCommerce (add-to-cart-variation), traduzidas.
  makeSelection: 'Selecione uma das opções do produto antes de adicioná-lo ao carrinho.',
  unavailable: 'Desculpe, este produto não está disponível. Escolha uma combinação diferente.',
  outOfStock: 'Fora de estoque',
  /** Enquanto o produto é adicionado ao carrinho. */
  adding: 'Adicionando ao carrinho…',
  /** A loja não respondeu (rede, manutenção): o pedido segue pelo WhatsApp, nunca pelo checkout
   *  antigo do WooCommerce (o site não recebe pagamentos). */
  storeDown: 'Não foi possível adicionar ao carrinho agora. Você pode pedir o orçamento deste produto direto pelo WhatsApp.',
  storeDownCta: 'Pedir pelo WhatsApp',
} as const;

/**
 * Mensagem de orçamento de um produto pelo WhatsApp (sem JavaScript ou com a loja fora do ar):
 * produto, opções escolhidas, quantidade e o endereço da página. Nenhum dado pessoal.
 */
export function productQuoteText(p: { name: string; url: string; options?: string[]; quantity?: number }) {
  const opts = p.options?.filter(Boolean).join(', ');
  const qty = p.quantity && p.quantity > 1 ? `${p.quantity} x ` : '';
  return `Olá! Vim pelo site e gostaria de um orçamento: ${qty}${p.name}${opts ? ` (${opts})` : ''}. ${p.url}`;
}

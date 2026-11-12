// Finalização de orçamento (/finalizar-compra/): textos e integrações.
//
// A MSSERVER não recebe pagamentos pelo site: o carrinho do WooCommerce reúne os produtos e esta página
// encaminha a solicitação de orçamento ao comercial pelo WhatsApp, com a mensagem montada a partir do
// carrinho (produtos, quantidades e valores que o WooCommerce devolve) e dos dados de contato.
import { WHATSAPP } from '../config/site';
import schema from './finalizacao-schema.json';

export const QUOTE = {
  title: 'Finalização de orçamento',
  /** O endereço é o da finalização de compra do WooCommerce; título e trilha descrevem o que a página faz agora. */
  seoTitle: 'Finalização de orçamento - MSSERVER',
  canonical: 'https://msserver.com.br/finalizar-compra/',
  /** robots da página publicada (All in One SEO). */
  robots: 'max-image-preview:large',
  schema,
  lead: 'Revise os produtos, informe seu contato e envie a solicitação ao comercial da MSSERVER pelo WhatsApp.',
  steps: ['Carrinho', 'Revisão e contato', 'Envio pelo WhatsApp'],
  cart: 'Carrinho',

  // Resumo
  summaryTitle: 'Resumo da solicitação',
  editCart: 'Editar no carrinho',
  keepShopping: 'Continuar escolhendo produtos',
  itemsOne: '1 item',
  itemsMany: '%s itens',
  brand: 'Marca',
  code: 'Código',
  unitPrice: 'Valor unitário',
  quantity: 'Quantidade',
  lineTotal: 'Subtotal',
  // Totais (as linhas do carrinho; o total é uma estimativa com os preços do site).
  subtotal: 'Subtotal',
  coupon: 'Cupom: %s',
  shipping: 'Entrega',
  shippingLater: 'A combinar com o comercial',
  tax: 'Impostos',
  total: 'Total estimado',
  estimateNote: 'Valor estimado com os preços atuais do site. Condições comerciais, disponibilidade e prazo são confirmados pelo comercial da MSSERVER.',

  // Contato
  contactTitle: 'Seus dados',
  contactLead: 'Para o comercial retornar com a proposta.',
  required: 'obrigatório',
  optional: '(opcional)',
  fields: {
    name: { label: 'Nome completo', autocomplete: 'name', missing: 'Informe o seu nome completo.' },
    company: { label: 'Empresa', autocomplete: 'organization', missing: 'Informe a empresa.' },
    email: { label: 'E-mail corporativo', autocomplete: 'email', placeholder: 'nome@empresa.com.br', missing: 'Informe o e-mail.' },
    phone: { label: 'WhatsApp', autocomplete: 'tel', placeholder: '(11) 91234-5678', missing: 'Informe o WhatsApp.' },
    notes: { label: 'Observações', placeholder: 'Ex.: prazo desejado, configuração específica, cidade de entrega.', missing: '' },
  },
  // Validação
  errorsTitle: 'Confira os campos destacados:',
  invalidName: 'Informe o nome e o sobrenome.',
  invalidEmail: 'Informe um e-mail válido (ex.: nome@empresa.com.br).',
  invalidPhone: 'Informe o WhatsApp com DDD (ex.: (11) 91234-5678).',

  // Envio
  cta: 'Solicitar orçamento pelo WhatsApp',
  ctaShort: 'Solicitar pelo WhatsApp',
  ctaNote: 'Abre o WhatsApp do comercial da MSSERVER com a mensagem pronta. Nada é enviado antes de você confirmar no WhatsApp.',
  sentTitle: 'Sua solicitação está pronta no WhatsApp',
  sentText: 'Confira a mensagem e toque em enviar para falar com o comercial. Seu carrinho continua salvo.',
  sentAgain: 'Abrir o WhatsApp de novo',

  // Estados (o carrinho é lido da loja no navegador), como no carrinho.
  loading: 'Carregando a sua solicitação…',
  empty: 'Seu carrinho está vazio.',
  emptyText: 'Escolha os servidores ou componentes no catálogo e adicione ao carrinho para solicitar o orçamento.',
  returnToShop: 'Ver o catálogo',
  unavailableTitle: 'Não foi possível carregar a sua solicitação agora.',
  unavailableText: 'A loja não respondeu. Tente de novo em instantes ou fale com um consultor pelo WhatsApp.',
  retry: 'Tentar de novo',
  consult: 'Fale com um consultor',
  noScriptTitle: 'A finalização do orçamento precisa de JavaScript.',
  noScriptText: 'Ative o JavaScript no navegador ou fale com um consultor pelo WhatsApp.',
} as const;

/**
 * WhatsApp do comercial: o número que o site já usa em todos os botões de WhatsApp (o do plugin Click to
 * Chat do WordPress, o do rodapé e o do "Orçamento pelo WhatsApp" do carrinho). O número configurado no
 * plugin "WooCommerce Order on WhatsApp" não é público; se o comercial usar outro, troque aqui.
 */
export const QUOTE_WHATSAPP = {
  number: WHATSAPP.number,
} as const;

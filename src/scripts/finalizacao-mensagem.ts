// Mensagem da solicitação de orçamento para o WhatsApp do comercial, montada só com o que existe: os
// itens, as quantidades e os valores do carrinho do WooCommerce, os dados do catálogo deste site (marca)
// e o que a pessoa informou. Linhas sem dado (código, marca, configuração) ficam de fora.

export type QuoteContact = { name: string; company: string; email: string; phone: string; notes: string };

export type QuoteItem = {
  name: string;
  brand: string | null;
  code: string | null;
  /** Opções escolhidas (ex.: "Memoria RAM: 16GB"). */
  options: string[];
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  link: string | null;
};

export type QuoteSummary = {
  items: QuoteItem[];
  itemsCount: number;
  /** Linhas entre os produtos e o total (cupons, taxas, entrega, impostos), quando o carrinho tiver. */
  adjustments: { label: string; value: string }[];
  total: string;
};

export function quoteMessage(contact: QuoteContact, summary: QuoteSummary) {
  const lines: string[] = ['Olá! Gostaria de solicitar um orçamento para os seguintes produtos:', '', '*DADOS DO SOLICITANTE*'];
  lines.push(`Nome: ${contact.name}`, `Empresa: ${contact.company}`, `E-mail: ${contact.email}`, `WhatsApp: ${contact.phone}`, '', '*PRODUTOS SOLICITADOS*');
  summary.items.forEach((item, i) => {
    lines.push(`*Produto ${i + 1}:*`, `- Nome: ${item.name}`);
    if (item.brand) lines.push(`- Marca: ${item.brand}`);
    if (item.code) lines.push(`- Código/modelo: ${item.code}`);
    if (item.options.length) lines.push(`- Configuração: ${item.options.join('; ')}`);
    lines.push(`- Quantidade: ${item.quantity}`, `- Valor unitário: ${item.unitPrice}`, `- Subtotal: ${item.lineTotal}`);
    if (item.link) lines.push(`- Link: ${item.link}`);
    lines.push('');
  });
  lines.push('*RESUMO*', `Quantidade total de itens: ${summary.itemsCount}`);
  for (const a of summary.adjustments) lines.push(`${a.label}: ${a.value}`);
  lines.push(`Valor total estimado: ${summary.total}`, '', '*OBSERVAÇÕES*', contact.notes.trim() || 'Nenhuma.', '', 'Gostaria de receber mais informações e condições comerciais sobre esses produtos.');
  return lines.join('\n');
}

export const whatsappLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

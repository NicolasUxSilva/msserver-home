// Descrição do produto (HTML do WooCommerce, como cadastrado no editor) pronta para a página: mantém o
// texto e a formatação (títulos, listas, tabelas, negrito, links) e descarta o que não é conteúdo
// (atributos de editor, estilos, scripts). Roda no build; nada disso vai para o navegador.
//
// Ajustes técnicos, sem mudar o texto:
//  - <h1>/<h2> da descrição viram <h3> (a página já tem o h1, que é o nome do produto, e o h2
//    "Descrição"); os demais títulos ficam como estão.
//  - Link com endereço inválido: se o texto visível do link é um endereço válido (caso do
//    "http://Especificações do fabricante" que mostra o endereço da Dell), o link passa a usá-lo;
//    senão, vira texto simples.
//  - Elementos vazios (ex.: um <h1> sem texto) são removidos.

const KEEP = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'h6', 'a', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span', 'blockquote', 'hr']);
const RENAME: Record<string, string> = { h1: 'h3', h2: 'h3' };
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript)\b[\s\S]*?<\/\1>/gi;
const VOID = new Set(['br', 'hr']);

const escapeAttr = (s: string) => s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/"/g, '&quot;');

function safeHref(raw: string) {
  const href = raw.replace(/&amp;/g, '&').trim();
  if (/^mailto:/i.test(href)) return href;
  try {
    const u = new URL(href);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function productDescription(html: string) {
  const open: string[] = [];
  const out = html
    .replace(DROP_WITH_CONTENT, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Link quebrado cujo texto é o próprio endereço: usa o endereço mostrado.
    .replace(/<a\b([^>]*)>(https?:\/\/[^<\s]+)<\/a>/gi, (m, attrs: string, text: string) => {
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
      return href && safeHref(href) ? m : `<a href="${text}">${text}</a>`;
    });
  return out
    .replace(/<\s*(\/?)\s*([a-z0-9]+)\b([^>]*)>/gi, (_, close: string, rawName: string, attrs: string) => {
      const name = RENAME[rawName.toLowerCase()] ?? rawName.toLowerCase();
      if (!KEEP.has(name)) return '';
      if (close) {
        if (name === 'a') {
          // Fecha o link só se ele foi aberto como link (o inválido virou texto).
          const kept = open.pop();
          return kept === 'kept' ? '</a>' : '';
        }
        return VOID.has(name) ? '' : `</${name}>`;
      }
      if (name === 'a') {
        const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? /href\s*=\s*'([^']*)'/i.exec(attrs)?.[1];
        const safe = href ? safeHref(href) : null;
        open.push(safe ? 'kept' : 'dropped');
        return safe ? `<a href="${escapeAttr(safe)}">` : '';
      }
      if (name === 'th' || name === 'td') {
        const keep = [...attrs.matchAll(/\b(colspan|rowspan|scope)\s*=\s*"([^"]*)"/gi)].map((m) => ` ${m[1].toLowerCase()}="${escapeAttr(m[2])}"`).join('');
        return `<${name}${keep}>`;
      }
      return `<${name}>`;
    })
    .replace(/<(p|h3|h4|h5|h6|strong|b|em|span|div|li)>(?:\s|&nbsp;)*<\/\1>/gi, '')
    .trim();
}

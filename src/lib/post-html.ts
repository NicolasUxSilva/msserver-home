// Conteúdo de uma postagem do blog (HTML como publicado no WordPress) pronto para a página: mantém o
// texto e a formatação (títulos, parágrafos, listas, citações, tabelas, imagens, vídeos e links) e
// descarta o que é do editor (classes, estilos, wrappers do Elementor, scripts). Roda no build;
// nada disso vai para o navegador.
//
// Ajustes técnicos, sem mudar o texto:
//  - <h1> do conteúdo vira <h2> (a página já tem o h1, que é o título da postagem).
//  - Links para páginas que este site serve (postagens, produtos, categorias, páginas reconstruídas)
//    passam a usar o endereço interno (funciona igual em produção e no preview); os demais ficam
//    como estão. Link com endereço inválido vira texto simples.
//  - Imagens e vídeos carregam sob demanda (loading="lazy"); vídeos do YouTube ficam num quadro
//    16:9 responsivo. Outros iframes são removidos (não há outros no conteúdo publicado).
//  - Elementos vazios são removidos.

const KEEP = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sup', 'sub', 'mark', 'small', 'code', 'pre', 'kbd',
  'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote', 'cite', 'hr',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'figure', 'figcaption', 'img', 'iframe',
]);
const RENAME: Record<string, string> = { h1: 'h2' };
const VOID = new Set(['br', 'hr', 'img']);
const DROP_WITH_CONTENT = /<(script|style|object|embed|noscript|form|button|svg|template)\b[\s\S]*?<\/\1>/gi;

const escapeAttr = (s: string) => s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attr = (attrs: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs)?.slice(1).find((v) => v !== undefined);

function safeUrl(raw: string, allow: RegExp = /^(https?:|mailto:|tel:)/i) {
  const href = raw.replace(/&amp;/g, '&').trim();
  if (href.startsWith('#')) return href;
  if (!allow.test(href)) return null;
  try {
    return /^https?:/i.test(href) ? new URL(href).href : href;
  } catch {
    return null;
  }
}

const YOUTUBE = /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\/|^https:\/\/player\.vimeo\.com\/video\//i;

export type PostHtmlOptions = {
  /** Endereço interno de uma URL do site (ou null quando a página não é servida por este site). */
  internal: (url: string) => string | null;
  /** Título da postagem (nome acessível dos vídeos sem título). */
  title: string;
};

export function postContent(html: string, opts: PostHtmlOptions) {
  const open: ('kept' | 'dropped')[] = [];
  let videos = 0;
  const out = html
    .replace(DROP_WITH_CONTENT, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(\/?)\s*([a-z0-9]+)\b([^>]*?)\s*\/?>/gi, (_, close: string, rawName: string, attrs: string) => {
      const name = RENAME[rawName.toLowerCase()] ?? rawName.toLowerCase();
      if (!KEEP.has(name)) return '';
      if (close) {
        if (name === 'a') return open.pop() === 'kept' ? '</a>' : '';
        if (name === 'iframe') return '';
        return VOID.has(name) ? '' : `</${name}>`;
      }
      if (name === 'a') {
        const href = attr(attrs, 'href');
        const safe = href ? safeUrl(href) : null;
        open.push(safe ? 'kept' : 'dropped');
        if (!safe) return '';
        const local = /^https?:/i.test(safe) ? opts.internal(safe) : null;
        const blank = !local && /target\s*=\s*["']?_blank/i.test(attrs);
        return `<a href="${escapeAttr(local ?? safe)}"${blank ? ' target="_blank" rel="noopener"' : ''}>`;
      }
      if (name === 'img') {
        const src = attr(attrs, 'src');
        const safe = src ? safeUrl(src, /^https?:/i) : null;
        if (!safe) return '';
        const w = attr(attrs, 'width');
        const h = attr(attrs, 'height');
        const dims = w && h && /^\d+$/.test(w) && /^\d+$/.test(h) ? ` width="${w}" height="${h}"` : '';
        return `<img src="${escapeAttr(safe)}" alt="${escapeAttr(attr(attrs, 'alt') ?? '')}"${dims} loading="lazy" decoding="async">`;
      }
      if (name === 'iframe') {
        const src = attr(attrs, 'src');
        const safe = src ? safeUrl(src, /^https:/i) : null;
        if (!safe || !YOUTUBE.test(safe)) return '';
        videos++;
        const title = attr(attrs, 'title') || `Vídeo ${videos} de “${opts.title}”`;
        return `<div class="post-embed"><iframe src="${escapeAttr(safe)}" title="${escapeAttr(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      }
      if (name === 'th' || name === 'td') {
        const keep = ['colspan', 'rowspan', 'scope'].map((k) => [k, attr(attrs, k)]).filter(([, v]) => v).map(([k, v]) => ` ${k}="${escapeAttr(v!)}"`).join('');
        return `<${name}${keep}>`;
      }
      if (name === 'ol') {
        const start = attr(attrs, 'start');
        return start && /^\d+$/.test(start) ? `<ol start="${start}">` : '<ol>';
      }
      return `<${name}>`;
    });
  // Vazios (inclusive aninhados, como <p><strong></strong></p>), em algumas passadas.
  let clean = out;
  for (let i = 0; i < 3; i++) clean = clean.replace(/<(p|h[2-6]|strong|b|em|i|u|li|blockquote|figure|figcaption|mark|small|code)>(?:\s|&nbsp;|<br>)*<\/\1>/gi, '');
  return clean.replace(/\n{3,}/g, '\n\n').trim();
}

/** Texto puro do conteúdo (contagem de palavras para o tempo de leitura). */
export const plainText = (html: string) =>
  html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Minutos de leitura (cerca de 200 palavras por minuto), no mínimo 1. */
export const readingMinutes = (html: string) => Math.max(1, Math.round(plainText(html).split(' ').filter(Boolean).length / 200));

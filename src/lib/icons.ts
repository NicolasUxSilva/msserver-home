// Leitura dos ícones em tempo de build (Lucide, ISC; marcas do Simple Icons, CC0).
// Nada disso vai para o JavaScript do navegador.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const BRANDS = new Set(['whatsapp', 'facebook', 'instagram', 'youtube']);
const LINKEDIN =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const cache = new Map<string, { body: string; viewBox: string; filled: boolean }>();

export function iconData(name: string) {
  const hit = cache.get(name);
  if (hit) return hit;
  const nm = path.join(process.cwd(), 'node_modules');
  let data;
  if (name === 'linkedin') {
    // O Simple Icons deixou de distribuir a marca do LinkedIn; caminho oficial do ícone "in".
    data = { body: `<path d="${LINKEDIN}"/>`, viewBox: '0 0 24 24', filled: true };
  } else if (BRANDS.has(name)) {
    const raw = readFileSync(path.join(nm, `simple-icons/icons/${name}.svg`), 'utf8');
    const d = raw.match(/<path d="([^"]+)"/)?.[1] ?? '';
    data = { body: `<path d="${d}"/>`, viewBox: '0 0 24 24', filled: true };
  } else {
    const raw = readFileSync(path.join(nm, `lucide-static/icons/${name}.svg`), 'utf8');
    const body = raw
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/\s*\n\s*/g, '');
    data = { body, viewBox: '0 0 24 24', filled: false };
  }
  cache.set(name, data);
  return data;
}

export function iconSvg(name: string, opts: { size?: number; strokeWidth?: number; className?: string } = {}) {
  const { body, viewBox, filled } = iconData(name);
  const size = opts.size ?? 20;
  const paint = filled
    ? 'fill="currentColor"'
    : `fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth ?? 1.75}" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg class="icon${opts.className ? ` ${opts.className}` : ''}" width="${size}" height="${size}" viewBox="${viewBox}" ${paint} aria-hidden="true" focusable="false">${body}</svg>`;
}

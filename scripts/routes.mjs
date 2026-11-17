// Lista de rotas do site novo para o roteamento de produção (docs/ROTEAMENTO.md). Roda depois do build
// (e da landing de Soluções Cloud) e grava em dist/_rotas/:
//  - rotas.txt: cada endereço de página servido por este build (um por linha), para conferência;
//  - nginx-rotas.map: as mesmas rotas no formato de um "map" do nginx ($uri → 1; /carrinho/ → 2, o
//    único que aceita ?add-to-cart=), incluído pela configuração de produção. Endereços fora da lista
//    (postagens novas antes do próximo build, páginas do WordPress) continuam no WordPress.
// Ficam de fora: /parciais/ (casca do plugin de suporte) e a 404 (servida pelo error_page).
//
// Uso: node scripts/routes.mjs   (parte de "npm run build")
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');
const OUT = path.join(DIST, '_rotas');
const routes = [];
const files = [];

async function walk(dir, rel) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const r = `${rel}${e.name}`;
    if (e.isDirectory()) {
      if (['_astro', '_rotas', 'parciais'].includes(e.name) && rel === '/') continue;
      if (e.name === '_astro') continue;
      await walk(path.join(dir, e.name), `${r}/`);
    } else if (e.name === 'index.html') routes.push(rel);
    else if (e.name !== '404.html') files.push(r);
  }
}
await walk(DIST, '/');
routes.sort();
files.sort();
if (!routes.includes('/') || !routes.includes('/solucoes-cloud/')) throw new Error('Build incompleto: falta a home ou a landing de Soluções Cloud (rode npm run build).');

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'rotas.txt'), [...routes, ...files].join('\n') + '\n');
const q = (s) => `"${s.replace(/"/g, '\\"')}"`;
const lines = [
  '# Gerado por scripts/routes.mjs — não edite. Rotas GET servidas pelo site novo (1); /carrinho/ (2) aceita ?add-to-cart=.',
  `# ${routes.length} páginas e ${files.length} arquivos; arquivos de /_astro/ e /solucoes-cloud/_astro/ têm location própria.`,
  ...routes.map((r) => `${q(r)} ${r === '/carrinho/' ? 2 : 1};`),
  ...files.map((f) => `${q(f)} 1;`),
];
await writeFile(path.join(OUT, 'nginx-rotas.map'), lines.join('\n') + '\n');
console.log(`Rotas: ${routes.length} páginas e ${files.length} arquivos (dist/_rotas/rotas.txt e nginx-rotas.map)`);

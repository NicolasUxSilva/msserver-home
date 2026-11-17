// Empacota o plugin wordpress/msserver-suporte com a casca atual do site (cabeçalho, rodapé, estilos e
// scripts), gerada pelo build em dist/parciais/suporte/. Resultado: dist-plugins/msserver-suporte/ e
// dist-plugins/msserver-suporte.zip, prontos para instalar no WordPress (docs/SUPORTE.md).
//
// O que muda na casca:
//  - saem as tags de SEO da casca (título, descrição, canonical, robots, Open Graph e JSON-LD): nas
//    páginas de suporte, quem define isso é o WordPress (wp_head, All in One SEO);
//  - os arquivos do site (/_astro/…, ícones) são copiados para app/ e passam a ser servidos pelo
//    plugin ({{MS_APP_URL}}), para que a página não dependa da versão do build publicada no servidor;
//  - links de página e a busca (/busca.json) continuam relativos ao domínio (as páginas do site são
//    servidas no mesmo domínio do WordPress).
//
// Uso: npm run build:suporte   (depois do astro build)
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'wordpress', 'msserver-suporte');
const OUT_DIR = path.join(ROOT, 'dist-plugins');
const OUT = path.join(OUT_DIR, 'msserver-suporte');

let html = await readFile(path.join(DIST, 'parciais', 'suporte', 'index.html'), 'utf8');

// 1. SEO da casca sai (o WordPress define o da página).
html = html
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/<meta name="(?:description|robots|twitter:[^"]+)"[^>]*>/g, '')
  .replace(/<meta property="(?:og|article):[^"]+"[^>]*>/g, '')
  .replace(/<link rel="canonical"[^>]*>/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

// 2. Marcadores obrigatórios.
const MARKERS = ['<meta name="msserver-wp-head">', '%%MS_TITULO%%', '%%MS_INTRO%%', '%%MS_CONTEUDO%%', '<script type="text/plain" data-msserver-wp-footer></script>'];
for (const m of MARKERS) if (!html.includes(m)) throw new Error(`Marcador ausente na casca: ${m}`);

// 3. Arquivos do site usados pela casca → app/ (com os módulos JavaScript que eles importam).
const assets = new Set();
const ASSET = /(?<![\w.])\/(_astro\/[\w.@-]+\.(?:js|css|webp|avif|png|jpg|jpeg|svg|woff2?)|favicon-32\.png|icon-192\.png|apple-touch-icon\.png)/g;
for (const m of html.matchAll(ASSET)) assets.add(m[1]);
const pending = [...assets].filter((a) => a.endsWith('.js'));
while (pending.length) {
  const js = await readFile(path.join(DIST, pending.pop()), 'utf8');
  for (const m of js.matchAll(/["'`]\.\/([\w.@-]+\.js)["'`]/g)) {
    const rel = `_astro/${m[1]}`;
    if (!assets.has(rel)) {
      assets.add(rel);
      pending.push(rel);
    }
  }
  for (const m of js.matchAll(/["'`]\/(_astro\/[\w.@-]+\.(?:webp|png|jpg|svg|woff2?))["'`]/g)) assets.add(m[1]);
}
html = html.replace(ASSET, '{{MS_APP_URL}}/$1');

// 4. Plugin: código-fonte + app/ (casca e arquivos).
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await cp(SRC, OUT, { recursive: true });
await mkdir(path.join(OUT, 'app', '_astro'), { recursive: true });
for (const a of assets) {
  const from = path.join(DIST, a);
  await stat(from);
  await cp(from, path.join(OUT, 'app', a));
}
await writeFile(path.join(OUT, 'app', 'shell.html'), html);
await writeFile(path.join(OUT, 'app', 'versao.txt'), `Casca gerada em ${new Date().toISOString()} a partir do commit ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()}\n`);

// 5. Zip para instalar pelo painel (Plugins → Adicionar novo → Enviar plugin).
await rm(`${OUT}.zip`, { force: true });
execFileSync('zip', ['-qr', 'msserver-suporte.zip', 'msserver-suporte'], { cwd: OUT_DIR });
console.log(`Plugin empacotado: dist-plugins/msserver-suporte.zip (${assets.size} arquivos do site na casca)`);

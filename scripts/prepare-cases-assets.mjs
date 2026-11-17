// Baixa as imagens publicadas hoje na página "Cases de sucesso" de msserver.com.br (página 8165 do
// WordPress) e grava em src/assets/cases/ (o Astro gera as versões otimizadas no build). São os
// cartões de cada cliente (a marca sobre a foto do setor) da versão desktop da página, os mais
// recentes (enviados em 07/05/2026). A versão do celular no WordPress usa outras fotos, de banco de
// imagens (uma delas com a marca de outra empresa): ficaram de fora (docs/PRESERVACAO.md).
// Uso: node scripts/prepare-cases-assets.mjs  (WP_ORIGIN=http://msserver.com.br sem HTTPS)
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = (process.env.WP_ORIGIN || 'https://msserver.com.br').replace(/\/$/, '');
const UP = `${ORIGIN}/wp-content/uploads`;
const UA = 'Mozilla/5.0 (MSSERVER site build script)';

// [arquivo publicado, destino] — na ordem dos cases na página (elementos 489d191d … 22239532).
const FILES = [
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.05.jpeg', 'lumiar.jpg'],
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.04-2.jpeg', 'terracom.jpg'],
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.04.jpeg', 'ourominas.jpg'],
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.05-1.jpeg', 'datasafer.jpg'],
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.05-2.jpeg', 'forcas-armadas.jpg'],
  ['2026/05/WhatsApp-Image-2026-05-07-at-16.58.04-1.jpeg', 'rumo.jpg'],
];

for (const [src, dest] of FILES) {
  const res = await fetch(`${UP}/${src}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Falha ao baixar ${src}: HTTP ${res.status}`);
  const out = await sharp(Buffer.from(await res.arrayBuffer())).rotate().jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const file = path.join(ROOT, 'src/assets/cases', dest);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log('  ✓', dest);
}

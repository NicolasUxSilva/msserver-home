// Baixa os materiais visuais publicados hoje na página "Sobre nós" de msserver.com.br e grava
// em src/assets/sobre/ (o Astro gera as versões otimizadas no build). Nenhum material é
// substituído: são os mesmos arquivos da página do WordPress, na maior resolução publicada.
// Uso: node scripts/prepare-sobre-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const UP = 'https://msserver.com.br/wp-content/uploads';
const UA = 'Mozilla/5.0 (MSSERVER site build script)';

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const jpg = (b, width) => sharp(b).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
const png = (b) => sharp(b).png({ compressionLevel: 9 }).toBuffer();

const FILES = [
  // Fotografias (widgets 04e93f1, 5ff4cf4 e e788c70), na maior versão do srcset.
  ['2026/04/MS-136-de-206.JPG-scaled.jpeg', 'photos/retrato.jpg', (b) => jpg(b, 1709)],
  ['2026/01/WhatsApp-Image-2026-01-08-at-10.07.57.jpeg', 'photos/evento.jpg', (b) => jpg(b, 1071)],
  ['2026/04/MS-178-de-206.JPG-1-2048x1367.jpeg', 'photos/equipe.jpg', (b) => jpg(b, 2048)],
  // Fundos das faixas "Quem somos" (6f8c929) e "O que os clientes dizem" (5cc1668).
  ['2023/05/Design-sem-nome-2023-05-24T141847.976-1.png', 'bg/quem-somos.png', png],
  ['2023/05/Design-sem-nome-2023-05-24T153419.233-1.png', 'bg/depoimentos.png', png],
  // Ícones dos cartões de "Especialidades", na ordem da página.
  ['2023/05/1-2.png', 'icons/01-servidores-fisicos.png', png],
  ['2023/05/3-4.png', 'icons/02-nuvem-privada.png', png],
  ['2023/05/7.png', 'icons/03-ciberseguranca.png', png],
  ['2023/05/2-4.png', 'icons/04-extensao-de-garantia.png', png],
  ['2023/05/5.png', 'icons/05-monitoramento.png', png],
  ['2023/05/6.png', 'icons/06-suporte-e-manutencao.png', png],
  ['2023/05/4-1.png', 'icons/07-recompra.png', png],
  ['2023/05/8.png', 'icons/08-rotinas-de-backup.png', png],
];

for (const [src, dest, fn] of FILES) {
  const file = path.join(ROOT, 'src/assets/sobre', dest);
  await mkdir(path.dirname(file), { recursive: true });
  const out = await fn(await download(`${UP}/${src}`));
  await writeFile(file, out);
  const m = await sharp(out).metadata();
  console.log('  ✓', dest, `${m.width}×${m.height}`, `${Math.round(out.length / 1024)} KB`);
}

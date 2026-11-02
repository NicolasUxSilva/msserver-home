// Baixa os materiais visuais publicados hoje na home de msserver.com.br e grava os originais
// em src/assets/ (o Astro gera as versões otimizadas no build). Nenhum material é substituído:
// os arquivos são os mesmos da home atual, só convertidos/redimensionados quando muito grandes.
// Uso: npm run assets
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const UP = 'https://msserver.com.br/wp-content/uploads';
const UA = 'Mozilla/5.0 (MSSERVER home build script)';

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function out(rel, buffer) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
  const m = await sharp(buffer).metadata();
  console.log('  ✓', rel, `${m.width}×${m.height}`);
}

const png = (b, width) => sharp(b).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
const jpg = (b, width) => sharp(b).flatten({ background: '#0e0d22' }).resize({ width, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();

const FILES = [
  // Logotipo do header (mesmo arquivo do WordPress).
  ['2025/08/cropped-MS-Server_Cloud-1-scaled-1-e1755871178311-2048x513.png', 'src/assets/brand/msserver-logo.png', (b) => sharp(b).trim().resize({ width: 960 }).png({ compressionLevel: 9 }).toBuffer()],
  // Banners do slider principal: desktop e mobile (widgets 551d510 e 30e1739).
  ['2026/09/ChatGPT-Image-22-de-set.-de-2026-13_13_31.png', 'src/assets/hero/slide-1-desktop.jpg', (b) => jpg(b, 2400)],
  ['2026/09/ChatGPT-Image-22-de-set.-de-2026-13_16_52.png', 'src/assets/hero/slide-2-desktop.jpg', (b) => jpg(b, 2400)],
  ['2026/09/ChatGPT-Image-25-de-set.-de-2026-09_41_36.png', 'src/assets/hero/slide-3-desktop.jpg', (b) => jpg(b, 2400)],
  ['2026/09/ChatGPT-Image-22-de-set.-de-2026-13_53_34.png', 'src/assets/hero/slide-1-mobile.jpg', (b) => jpg(b, 1200)],
  ['2026/09/ChatGPT-Image-22-de-set.-de-2026-13_46_54.png', 'src/assets/hero/slide-2-mobile.jpg', (b) => jpg(b, 1200)],
  ['2026/09/ChatGPT-Image-22-de-set.-de-2026-13_56_24.png', 'src/assets/hero/slide-3-mobile.jpg', (b) => jpg(b, 1200)],
  // Painéis de soluções (acordeão de imagens): desktop e mobile.
  ['2023/05/Cyber-Seguranca-3-1.png', 'src/assets/solutions/consultoria-desktop.jpg', (b) => jpg(b, 1400)],
  ['2023/05/Cyber-Seguranca-2-1.png', 'src/assets/solutions/migracao-desktop.jpg', (b) => jpg(b, 1400)],
  ['2023/05/Cyber-Seguranca-1.png', 'src/assets/solutions/ciberseguranca-desktop.jpg', (b) => jpg(b, 1400)],
  ['2023/05/4.png', 'src/assets/solutions/consultoria-mobile.jpg', (b) => jpg(b, 1400)],
  ['2023/05/3-3.png', 'src/assets/solutions/migracao-mobile.jpg', (b) => jpg(b, 1400)],
  ['2023/05/2-3.png', 'src/assets/solutions/ciberseguranca-mobile.jpg', (b) => jpg(b, 1400)],
  // Seção do app.
  ['2023/05/image-15-2.png', 'src/assets/app/app-telas.png', (b) => png(b, 1800)],
  ['2023/05/image-11.png', 'src/assets/app/app-store.png', (b) => png(b, 600)],
  ['2023/05/image-10.png', 'src/assets/app/google-play.png', (b) => png(b, 600)],
  // Rodapé: certificações e projetos socioambientais.
  ['2023/06/admin-ajax-1.png', 'src/assets/footer/certificacoes.png', (b) => png(b, 600)],
  ['2023/06/Design-sem-nome-2023-06-07T123112.441.png', 'src/assets/footer/projetos-socioambientais.png', (b) => png(b, 900)],
  // Logos de clientes ("Alguns clientes"), na ordem do carrossel atual.
  ['2023/05/correios.png', 'src/assets/clients/01-correios.png', (b) => png(b, 600)],
  ['2023/05/data-safer.png', 'src/assets/clients/02-datasafer.png', (b) => png(b, 600)],
  ['2023/05/EXERCITO-BRASILEIRO.png', 'src/assets/clients/03-exercito-brasileiro.png', (b) => png(b, 600)],
  ['2023/05/Design-sem-nome-2023-05-23T161719.488-1.png', 'src/assets/clients/04-cliente.png', (b) => png(b, 600)],
  ['2023/05/OTIMI.png', 'src/assets/clients/05-otimi.png', (b) => png(b, 600)],
  ['2023/05/SHOP.-ARICANDUVA.png', 'src/assets/clients/06-shopping-aricanduva.png', (b) => png(b, 600)],
  ['2023/05/WAY-306.png', 'src/assets/clients/07-way-306.png', (b) => png(b, 600)],
  ['2023/05/voxline.png', 'src/assets/clients/08-voxline.png', (b) => png(b, 600)],
  ['2023/05/ZAFEX.png', 'src/assets/clients/09-zafex.png', (b) => png(b, 600)],
  ['2023/05/attri.png', 'src/assets/clients/10-attri.png', (b) => png(b, 600)],
];

for (const [src, dest, fn] of FILES) await out(dest, await fn(await download(`${UP}/${src}`)));

// Ícones do site (mesmos do WordPress).
for (const [file, dest] of [
  ['cropped-cropped-MS-Server_Cloud-1-scaled-1-e1755871178311-32x32.png', 'public/favicon-32.png'],
  ['cropped-cropped-MS-Server_Cloud-1-scaled-1-e1755871178311-180x180.png', 'public/apple-touch-icon.png'],
  ['cropped-cropped-MS-Server_Cloud-1-scaled-1-e1755871178311-192x192.png', 'public/icon-192.png'],
]) {
  await writeFile(path.join(ROOT, dest), await download(`${UP}/2025/08/${file}`));
  console.log('  ✓', dest);
}

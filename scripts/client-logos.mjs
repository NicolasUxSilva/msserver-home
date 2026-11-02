// Versão monocromática dos logos de "Alguns clientes", com o mesmo tratamento usado na faixa de
// logos das landings (tinta única, fundo removido). Lê os originais baixados por `npm run assets`
// em src/assets/clients/ e grava em src/assets/clients-mono/. Os originais não são alterados.
// Uso: node scripts/client-logos.mjs
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src/assets/clients');
const OUT = path.join(ROOT, 'src/assets/clients-mono');
const INK = [36, 33, 41];

async function monochrome(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (x, y) => (y * width + x) * 4;
  const corners = [at(1, 1), at(width - 2, 1), at(1, height - 2), at(width - 2, height - 2)];
  const transparent = corners.every((i) => data[i + 3] < 8);
  const bg = [0, 1, 2].map((c) => corners.reduce((s, i) => s + data[i + c], 0) / corners.length);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    let a;
    if (transparent) {
      a = data[i + 3];
    } else {
      // Fundo sólido (branco ou bloco escuro): a distância de cor até o fundo vira a tinta.
      const dist = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
      a = Math.min(255, Math.round(Math.min(1, Math.max(0, (dist - 18) / 70)) * (data[i + 3] / 255) * 255 * 1.35));
    }
    out[i] = INK[0];
    out[i + 1] = INK[1];
    out[i + 2] = INK[2];
    out[i + 3] = a;
  }
  return sharp(out, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ height: 120, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(OUT, { recursive: true });
for (const f of (await readdir(SRC)).filter((f) => f.endsWith('.png')).sort()) {
  const png = await monochrome(path.join(SRC, f));
  await sharp(png).toFile(path.join(OUT, f));
  const m = await sharp(png).metadata();
  console.log('  ✓', f, `${m.width}×${m.height}`);
}

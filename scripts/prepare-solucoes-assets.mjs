// Baixa os materiais visuais publicados hoje nas páginas de soluções de msserver.com.br (Nuvem
// Privada, Extensão de Garantia, Backup em Nuvem e Consultoria) e grava em src/assets/solucoes/ (o
// Astro gera as versões otimizadas no build). Nenhum material é substituído ou gerado: são os mesmos
// arquivos das páginas do WordPress, na maior resolução publicada. Fotografias e fundos viram JPG
// (sem transparência a perder); ícones, logos e o QR code continuam PNG.
// Uso: node scripts/prepare-solucoes-assets.mjs
// Com o certificado HTTPS do site fora do ar: WP_ORIGIN=http://msserver.com.br node scripts/prepare-solucoes-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = (process.env.WP_ORIGIN || 'https://msserver.com.br').replace(/\/$/, '');
const UP = `${ORIGIN}/wp-content/uploads`;
const UA = 'Mozilla/5.0 (MSSERVER site build script)';

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Foto ou fundo (sem transparência útil): JPG na resolução publicada. */
const jpg = (b) => sharp(b).rotate().flatten({ background: '#04122d' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
/** Ícone, logo ou recorte com transparência: PNG, reduzido quando a largura passa do necessário. */
const png = (width) => (b) => sharp(b).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();

const FILES = [
  // ——— Nuvem Privada (página 7016) ———
  // Fundo da abertura (seção 4de3e25): desktop e celular.
  ['2023/10/4.png', 'nuvem-privada/abertura.jpg', jpg],
  ['2023/10/3-2.png', 'nuvem-privada/abertura-celular.jpg', jpg],
  // Imagem ao lado do formulário de configuração (seção 0da5953).
  ['2023/10/serv2-2.png', 'nuvem-privada/servidor-nuvem.png', png(600)],
  // "Uma nuvem feita para você" (seção e481760).
  ['2023/10/nuvem-3-2.png', 'nuvem-privada/datacenter.jpg', jpg],
  // Ícones de "A melhor performance pelo menor custo" (seção afcc0bc), na ordem.
  ['2023/10/nuvem-2.png', 'nuvem-privada/icone-io.png', png(256)],
  ['2023/10/cabo-do-telefone.png', 'nuvem-privada/icone-perifericos.png', png(256)],
  ['2023/10/perda-de-dinheiro.png', 'nuvem-privada/icone-custos.png', png(256)],
  // Ícones de "Nossos Diferenciais" (carrossel da seção fe784af), na ordem dos itens.
  ['2023/10/costumizacao-2.png', 'nuvem-privada/diferencial-personalizavel.png', png(256)],
  ['2023/10/protecao.png', 'nuvem-privada/diferencial-seguranca.png', png(256)],
  ['2023/10/suporte-tecnico-3.png', 'nuvem-privada/diferencial-suporte.png', png(256)],
  ['2023/10/conectar.png', 'nuvem-privada/diferencial-conectividade.png', png(256)],
  ['2023/10/brasil.png', 'nuvem-privada/diferencial-nacional.png', png(256)],
  ['2023/10/arquivo-de-backup-2.png', 'nuvem-privada/diferencial-backup.png', png(256)],
  // Fundo do "Fale com um especialista" (seção 3e5ca8b): desktop e celular.
  ['2023/10/CTA-FDO-2.png', 'nuvem-privada/especialista.jpg', jpg],
  ['2023/10/contac.png', 'nuvem-privada/especialista-celular.jpg', jpg],
  // Parceiros (carrossel da seção 7800ae9), na ordem do carrossel.
  ...['REDHAT-2', 'MICROSOFT-2', 'INTEL-2', 'HP-2', 'GOOGLE-2', 'EQUINIZ', 'DELL-2', 'CISCO-2', 'CIRION-2', 'AZURE-2', 'AWS-2'].map((n) => [`2023/11/${n}.png`, `nuvem-privada/parceiros/${n.replace(/-2$/, '').toLowerCase()}.png`, png(287)]),

  // ——— Extensão de Garantia (página 6727) ———
  ['2023/10/windows-server-licenciamento.jpeg', 'garantia/abertura.jpg', jpg],
  ['2023/08/cloud-mobile-2.png', 'garantia/abertura-celular.jpg', jpg],
  // Fundo de "Porque contratar…" (seção 6790bd7, âncora #funciona).
  ['2023/08/fdo-cloud.png', 'garantia/fundo-cloud.jpg', jpg],
  // "Facilidade na aquisição" (seção 3fc465a): celular com o app e o QR code das lojas.
  ['2023/10/mao-celular.png', 'garantia/app-celular.png', png(1024)],
  ['2023/10/QR-CODE-1.png', 'garantia/qr-code-app.png', png(1024)],
  // Fundo das seções do vídeo (37d6e5e e 4fd840b).
  ['2023/10/fundo-2.png', 'garantia/fundo-video.jpg', jpg],

  // ——— Backup em Nuvem (página 6641) ———
  ['2023/09/capa-landingpage-backup-em-nuvem.png', 'backup/abertura.jpg', jpg],
  ['2023/08/cloud-mobile-2.png', 'backup/abertura-celular.jpg', jpg],
  // Ícones das "5 vantagens", na ordem da página.
  ['2023/09/ICONES-BACKUP-NUVEM-04.png', 'backup/icone-seguranca.png', png(512)],
  ['2023/09/ICONES-BACKUP-NUVEM-03.png', 'backup/icone-acessibilidade.png', png(512)],
  ['2023/08/2-2.png', 'backup/icone-automatizacao.png', png(512)],
  ['2023/09/ICONES-BACKUP-NUVEM-02.png', 'backup/icone-espaco.png', png(512)],
  ['2023/09/ICONES-BACKUP-NUVEM_Prancheta-1.png', 'backup/icone-recuperacao.png', png(512)],
  // "Alguns de nossos parceiros" (seção f6701ef): a faixa com os logos, sem a margem branca vazia
  // em volta (os logos não mudam).
  ['2023/10/parceiros-1.png', 'backup/parceiros.png', (b) => sharp(b).trim({ background: '#ffffff', threshold: 12 }).extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' }).png({ compressionLevel: 9 }).toBuffer()],

  // ——— Consultoria (página 7247) ———
  ['2023/12/CONSULTORIA-2.png', 'consultoria/abertura.jpg', jpg],
  ['2023/12/home-111-2.png', 'consultoria/abertura-celular.jpg', jpg],
  // "Eficiência Operacional" (imagem 5) e as quatro frentes (1 a 4), na ordem da página.
  ['2023/12/5.png', 'consultoria/eficiencia.png', png(300)],
  ['2023/12/1.png', 'consultoria/continuidade.png', png(300)],
  ['2023/12/2.png', 'consultoria/projetos.png', png(300)],
  ['2023/12/3.png', 'consultoria/multicloud.png', png(300)],
  ['2023/12/4.png', 'consultoria/seguranca.png', png(300)],
  // Fundo do formulário (seção 2296226, âncora #contato): desktop e celular.
  ['2023/12/contato-5-2.png', 'consultoria/contato.jpg', jpg],
  ['2023/12/contato-6-2.png', 'consultoria/contato-celular.jpg', jpg],
];

for (const [src, dest, fn] of FILES) {
  const file = path.join(ROOT, 'src/assets/solucoes', dest);
  await mkdir(path.dirname(file), { recursive: true });
  const out = await fn(await download(`${UP}/${src}`));
  await writeFile(file, out);
  const m = await sharp(out).metadata();
  console.log('  ✓', dest, `${m.width}×${m.height}`, `${Math.round(out.length / 1024)} KB`);
}

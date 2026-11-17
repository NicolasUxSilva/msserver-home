// Publica a landing aprovada de Soluções Cloud em /solucoes-cloud/ dentro do build deste site.
//
// A landing é outro projeto (repositório NicolasUxSilva/cloud-ms, o mesmo do preview aprovado em
// cloud-ms-beige.vercel.app). Nada nela é alterado: o script baixa o commit fixado abaixo, instala as
// dependências travadas (npm ci), gera o build com o caminho /solucoes-cloud/ e o endereço oficial
// (canonical e og:url) e copia o resultado para dist/solucoes-cloud/. Assim existe uma única versão da
// oferta, a aprovada, no endereço que o menu usa.
//
// Para atualizar a landing, troque o COMMIT por outro já aprovado no repositório da landing.
//
// Variáveis (as mesmas da landing, ver o README dela):
//  - PUBLIC_NOINDEX=true: repassada (homologação/preview não indexam).
//  - PUBLIC_GTM_ID: fica vazia de propósito. A landing carrega o GTM sem consultar o consentimento
//    deste site; o rastreamento dela só deve ser ligado junto com a decisão sobre consentimento
//    (docs/PRIVACIDADE.md). Para ligar: CLOUD_GTM_ID=GTM-XXXX.
//
// Uso: node scripts/landing-cloud.mjs   (depois do astro build; usa .cache/ entre execuções)
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const REPO = 'https://github.com/NicolasUxSilva/cloud-ms';
/** Commit aprovado (main de 30/10/2026: "Merge pull request #2 … feat/cloud-responsavel-ti"). */
const COMMIT = '3199d6f89df785c135e61761b2e0d8b9d9c4782c';
const BASE = '/solucoes-cloud';
const CANONICAL = 'https://msserver.com.br/solucoes-cloud/';
const CACHE = path.join(ROOT, '.cache', 'cloud-ms');
const OUT = path.join(ROOT, 'dist', BASE.slice(1));

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', ...opts });
const exists = (p) => stat(p).then(() => true, () => false);

if (!(await exists(path.join(ROOT, 'dist', 'index.html')))) throw new Error('Rode o astro build antes (dist/ não existe).');

// 1. Código da landing no commit aprovado.
const head = (await exists(path.join(CACHE, '.git'))) ? run('git', ['-C', CACHE, 'rev-parse', 'HEAD']).trim() : '';
if (head !== COMMIT) {
  await rm(CACHE, { recursive: true, force: true });
  await mkdir(CACHE, { recursive: true });
  run('git', ['init', '-q', CACHE]);
  run('git', ['-C', CACHE, 'remote', 'add', 'origin', REPO]);
  run('git', ['-C', CACHE, 'fetch', '-q', '--depth', '1', 'origin', COMMIT]);
  run('git', ['-C', CACHE, 'checkout', '-q', 'FETCH_HEAD']);
  if (run('git', ['-C', CACHE, 'rev-parse', 'HEAD']).trim() !== COMMIT) throw new Error('Commit da landing não confere.');
}

// 2. Dependências travadas da própria landing (reaproveitadas enquanto o lockfile não muda).
const lock = await readFile(path.join(CACHE, 'package-lock.json'), 'utf8');
const stamp = path.join(CACHE, 'node_modules', '.lock-stamp');
if (!(await exists(stamp)) || (await readFile(stamp, 'utf8')) !== lock) {
  run('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: CACHE });
  await (await import('node:fs/promises')).writeFile(stamp, lock);
}

// 3. Build da landing no endereço oficial.
const env = {
  ...process.env,
  BASE_PATH: BASE,
  PUBLIC_CANONICAL_URL: CANONICAL,
  PUBLIC_NOINDEX: process.env.PUBLIC_NOINDEX === 'true' ? 'true' : 'false',
  PUBLIC_GTM_ID: process.env.CLOUD_GTM_ID ?? '',
};
await rm(path.join(CACHE, 'dist'), { recursive: true, force: true });
run('node', ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: CACHE, env });

// 4. Cópia para dist/solucoes-cloud/ (substitui a anterior).
await rm(OUT, { recursive: true, force: true });
await cp(path.join(CACHE, 'dist'), OUT, { recursive: true });
const html = await readFile(path.join(OUT, 'index.html'), 'utf8');
if (!html.includes(`href="${CANONICAL}"`)) throw new Error('A landing não saiu com o canonical oficial.');
console.log(`Landing Cloud (${COMMIT.slice(0, 7)}) publicada em dist${BASE}/`);

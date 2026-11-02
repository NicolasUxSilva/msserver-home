// Servidor estático do build (dist/) usado pelos testes E2E, com compressão como em produção.
// Uso: node scripts/serve-dist.mjs [porta]
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] ?? 4330);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    const type = types[path.extname(file)] ?? 'application/octet-stream';
    const compress = /text|javascript|svg|json/.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '');
    res.writeHead(200, { 'Content-Type': type, ...(compress ? { 'Content-Encoding': 'gzip' } : {}) });
    res.end(compress ? gzipSync(body) : body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`dist em http://localhost:${port}`));

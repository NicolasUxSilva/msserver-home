// Capturas de QA da home em várias larguras (página inteira).
// Uso: node scripts/qa-screenshots.mjs [url] [larguras separadas por vírgula] [pasta]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:4330/';
const widths = (process.argv[3] ?? '390,768,1024,1440').split(',').map(Number);
const dir = process.argv[4] ?? 'reports/shots';
await mkdir(dir, { recursive: true });
// Usa o Chromium do sistema quando definido (ex.: PW_CHROMIUM=/opt/pw-browsers/chromium).
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, hasTouch: w < 600, isMobile: w < 600 });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  for (let y = 0; y < 20000; y += 400) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${dir}/home-${w}.png`, fullPage: true });
  console.log(w, 'overflow:', overflow, 'erros:', errors.length ? errors : 'nenhum');
  await page.close();
}
await browser.close();

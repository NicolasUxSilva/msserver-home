// Sincroniza os dados da finalização de compra (/finalizar-compra/) a partir da página publicada do
// WooCommerce em msserver.com.br. Só leitura (um GET da página, sem carrinho): nada é criado na loja.
//
//  - Países aceitos pela loja (a lista do campo "País/Região") e o país e o estado já marcados.
//  - Estados de cada país (wc_country_select_params) e as regras de endereço de cada país
//    (wc_address_i18n_params: campos obrigatórios, ocultos, nomes e ordem), as mesmas que o
//    WooCommerce aplica ao trocar de país.
//  - Formas de pagamento oferecidas (id, nome e as bandeiras exibidas) e os nomes dos campos do
//    cartão, que o WooCommerce repassa à forma de pagamento.
//  - Texto de privacidade, título, robots e JSON-LD (All in One SEO).
//  - Ícones das bandeiras de cartão do WooCommerce (src/assets/cards).
//
// O WooCommerce só mostra o formulário com algum item no carrinho, e a sessão do carrinho fica no
// navegador. Por isso o script lê uma cópia da página: com um item no carrinho, abra a finalização de
// compra do WordPress, salve o HTML (Ctrl+S, "somente HTML") e rode
//   CHECKOUT_HTML=caminho/finalizar-compra.html npm run sync:checkout
// Nada é enviado à loja; só os ícones das bandeiras são baixados (arquivos públicos do WooCommerce).
// Com o certificado HTTPS do site fora do ar, acrescente WP_ORIGIN=http://msserver.com.br.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://msserver.com.br';
const ORIGIN = (process.env.WP_ORIGIN || SITE).replace(/\/$/, '');
const PAGE = `${SITE}/finalizar-compra/`;
const FILE = process.env.CHECKOUT_HTML;
if (!FILE) throw new Error('Informe CHECKOUT_HTML (cópia da finalização de compra com um item no carrinho).');
const UA = 'Mozilla/5.0 (MSSERVER checkout build script)';
const viaOrigin = (url) => url.replace(/^https?:\/\/msserver\.com\.br/, ORIGIN);

async function get(url) {
  const res = await fetch(viaOrigin(url), { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res;
}

const decode = (s = '') =>
  s
    .replace(/&hellip;/g, '…')
    .replace(/&bull;/g, '•')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();

console.log(`Cópia: ${FILE}`);
const html = await readFile(FILE, 'utf8');
if (!html.includes('name="checkout"')) throw new Error('A cópia não tem o formulário da finalização de compra (carrinho vazio?).');

/** Variável que o WooCommerce escreve na página (wp_localize_script). */
function param(name) {
  const m = html.match(new RegExp(`${name} = (\\{[\\s\\S]*?\\});\\n`));
  if (!m) throw new Error(`${name} não encontrado`);
  return JSON.parse(m[1]);
}

// Países: as opções do campo "País/Região" (os países aceitos na cobrança) e o já marcado.
const select = html.match(/<select name="billing_country"[\s\S]*?<\/select>/)?.[0];
if (!select) throw new Error('Campo billing_country não encontrado');
const options = [...select.matchAll(/<option value="([A-Z]{2})"([^>]*)>([^<]*)<\/option>/g)];
const countries = options.map((o) => ({ code: o[1], name: decode(o[3]) }));
const defaultCountry = options.find((o) => /selected/.test(o[2]))?.[1] ?? '';
const stateSelect = html.match(/<select name="billing_state"[\s\S]*?<\/select>/)?.[0] ?? '';
const defaultState = stateSelect.match(/<option value="([^"]+)"\s*selected/)?.[1] ?? '';

const states = JSON.parse(param('wc_country_select_params').countries);
const i18n = param('wc_address_i18n_params');
const rawLocale = JSON.parse(i18n.locale);
// Só o que a página usa de cada regra: nome, texto de exemplo, obrigatório, oculto e ordem.
const KEYS = ['label', 'placeholder', 'required', 'hidden', 'priority'];
const locale = Object.fromEntries(
  Object.entries(rawLocale).map(([cc, fields]) => [
    cc,
    Object.fromEntries(Object.entries(fields).map(([f, rule]) => [f, Object.fromEntries(KEYS.filter((k) => k in rule).map((k) => [k, rule[k]]))])),
  ]),
);

// Campos de cobrança da página: nome, obrigatório e autocomplete (incluem telefone e e-mail).
const fields = [...html.matchAll(/<p class="form-row ([^"]*)" id="billing_([a-z_0-9]+)_field" data-priority="(\d+)">([\s\S]*?)<\/p>/g)].map((m) => ({
  key: m[2],
  required: /validate-required/.test(m[1]),
  priority: Number(m[3]),
  label: decode(m[4].match(/<label[^>]*>([\s\S]*?)(?:&nbsp;)?<(?:abbr|span)/)?.[1] ?? ''),
  type: m[4].match(/<input type="([a-z]+)"/)?.[1] ?? (m[4].includes('<select') ? 'select' : 'text'),
  autocomplete: m[4].match(/autocomplete="([^"]*)"/)?.[1] ?? '',
}));
if (!fields.some((f) => f.key === 'email') || !fields.some((f) => f.key === 'phone')) throw new Error('Campos de cobrança incompletos');
const notes = /id="order_comments"/.test(html);

// Formas de pagamento oferecidas e os campos de cada uma.
const gateways = [...html.matchAll(/<li class="wc_payment_method payment_method_([a-z0-9_-]+)">([\s\S]*?)<\/li>/g)].map((m) => {
  const block = m[2];
  const label = block.match(/<label for="payment_method_[^"]+">([\s\S]*?)<\/label>/)?.[1] ?? '';
  return {
    id: m[1],
    title: decode(label.replace(/<img[\s\S]*?>/g, '').replace(/<[^>]+>/g, '')),
    icons: [...label.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((i) => ({ src: i[1], alt: decode(i[2]) })),
    fields: [...block.matchAll(/<input[^>]*name="([^"]+)"[^>]*>/g)].map((i) => {
      const tag = i[0];
      const attr = (a) => tag.match(new RegExp(`${a}="([^"]*)"`))?.[1];
      return { name: i[1], autocomplete: attr('autocomplete') ?? '', maxlength: attr('maxlength') ? Number(attr('maxlength')) : null, placeholder: decode(attr('placeholder') ?? '') };
    }),
  };
});
if (!gateways.length) throw new Error('Nenhuma forma de pagamento encontrada');

const privacy = html.match(/<div class="woocommerce-privacy-policy-text"><p>([\s\S]*?)<\/p>/)?.[1] ?? '';
const privacyLink = privacy.match(/href="([^"]+)"/)?.[1] ?? null;
const coupons = /woocommerce-form-coupon-toggle/.test(html);
const shipping = /id="ship-to-different-address"/.test(html);
const account = /id="createaccount"/.test(html);
const terms = /id="terms"/.test(html);

const pick = (re) => html.match(re)?.[1];
const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const seo = {
  title: decode(pick(/<title>([\s\S]*?)<\/title>/)),
  description: decode(pick(/<meta name="description" content="([^"]*)"/) ?? ''),
  robots: pick(/<meta name="robots" content="([^"]*)"/) ?? '',
  canonical: pick(/<link rel="canonical" href="([^"]*)"/) ?? '',
  schema: ld.length === 1 ? ld[0] : ld,
};
if (!seo.title || !ld.length) throw new Error('SEO não encontrado');

// Bandeiras: os SVG do próprio WooCommerce, guardados no projeto.
const CARD_DIR = path.join(ROOT, 'src/assets/cards');
await mkdir(CARD_DIR, { recursive: true });
for (const g of gateways) {
  for (const icon of g.icons) {
    const file = path.basename(new URL(icon.src).pathname);
    await writeFile(path.join(CARD_DIR, file), Buffer.from(await (await get(icon.src)).arrayBuffer()));
    icon.file = file;
    delete icon.src;
  }
}

const data = {
  source: PAGE,
  fields,
  notes,
  coupons,
  shipping,
  account,
  terms,
  defaultCountry,
  defaultState,
  countries,
  states,
  locale,
  gateways,
  privacy: { html: privacy, link: privacyLink },
  seo,
};
await writeFile(path.join(ROOT, 'src/data/checkout-wc.json'), JSON.stringify(data, null, 1) + '\n');
console.log(`Campos: ${fields.map((f) => f.key).join(', ')}`);
console.log(`Países: ${countries.length} (marcado: ${defaultCountry}/${defaultState}); estados: ${Object.keys(states).length}; regras: ${Object.keys(locale).length}`);
console.log(`Pagamento: ${gateways.map((g) => `${g.id} (${g.title}; ${g.fields.map((f) => f.name).join(', ')})`).join('; ')}`);
console.log(`Cupom: ${coupons}; entrega: ${shipping}; conta: ${account}; termos: ${terms}`);

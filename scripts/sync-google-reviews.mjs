// Busca as avaliações do Perfil da Empresa da MSSERVER no Google pela API oficial do Google
// Places (New), "Place Details", e grava em src/data/google-reviews.json para a página
// "Sobre nós". Roda no build (Node), nunca no navegador: a chave não vai para o site publicado.
//
// Variáveis de ambiente (sem prefixo PUBLIC_, para não serem expostas ao frontend):
//   GOOGLE_PLACES_API_KEY  chave de API de um projeto Google Cloud com a "Places API (New)" ativa
//   GOOGLE_PLACE_ID        Place ID do perfil da MSSERVER no Google
//
// Uso:
//   npm run sync:reviews            busca e grava (falha se faltar credencial ou se a API falhar)
//   node scripts/sync-google-reviews.mjs --optional
//                                   usado no build: sem credenciais, não faz nada; se a API
//                                   falhar, mantém o arquivo atual e o build continua
//
// A API devolve até 5 avaliações. Elas são gravadas como o Google as entrega (texto original,
// nome público do autor, nota e data), ordenadas da mais recente para a mais antiga.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/google-reviews.json');
const optional = process.argv.includes('--optional');
const key = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;

function stop(text) {
  const message = /[.!?]$/.test(text) ? text : `${text}.`;
  if (optional) {
    console.log(`[avaliações do Google] ${message} Mantendo src/data/google-reviews.json como está.`);
    process.exit(0);
  }
  console.error(`[avaliações do Google] ${message}`);
  process.exit(1);
}

if (!key || !placeId) stop('GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID não estão definidas.');

const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`;
let place;
try {
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews',
    },
  });
  if (!res.ok) stop(`A API do Google respondeu HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  place = await res.json();
} catch (err) {
  stop(`Não foi possível consultar a API do Google: ${err.message}`);
}

const reviews = (place.reviews ?? [])
  .map((r) => ({
    // Texto original do avaliador (não a tradução automática), quando disponível.
    text: (r.originalText?.text ?? r.text?.text ?? '').trim(),
    language: r.originalText?.languageCode ?? r.text?.languageCode ?? null,
    rating: r.rating,
    author: r.authorAttribution?.displayName ?? '',
    authorUri: r.authorAttribution?.uri ?? null,
    publishTime: r.publishTime ?? null,
    googleMapsUri: r.googleMapsUri ?? null,
  }))
  .filter((r) => r.text && r.author && typeof r.rating === 'number')
  .sort((a, b) => String(b.publishTime).localeCompare(String(a.publishTime)));

const data = {
  source: 'Google Places API (New) — Place Details',
  fetchedAt: new Date().toISOString(),
  place: {
    name: place.displayName?.text ?? null,
    rating: place.rating ?? null,
    total: place.userRatingCount ?? null,
    url: place.googleMapsUri ?? null,
  },
  reviews,
};

await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`[avaliações do Google] ${reviews.length} avaliação(ões) de "${data.place.name}" gravada(s) em src/data/google-reviews.json.`);

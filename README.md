# Site MSSERVER · reformulação visual (home e "Sobre nós")

Home institucional de [msserver.com.br](https://msserver.com.br/) reconstruída na identidade
visual das landings de servidores físicos e de Cloud, **com a mesma estrutura, os mesmos
conteúdos, materiais, links e funcionalidades** da home atual do WordPress.

- **Stack:** Astro 7 (saída estática), TypeScript, CSS próprio. Mesma base das landings
  (tokens, fontes, ícones, scripts de página e testes).
- **Saída:** `dist/index.html` com CSS e JS embutidos e imagens otimizadas em `dist/_astro/`.
- **Conteúdo dinâmico:** produtos (WooCommerce Store API) e últimas postagens (REST API do
  WordPress) são sincronizados com `npm run sync`.
- O que foi preservado e as poucas correções técnicas estão em
  [docs/PRESERVACAO.md](docs/PRESERVACAO.md). O sistema visual para as próximas páginas está em
  [docs/SISTEMA-VISUAL.md](docs/SISTEMA-VISUAL.md).

## Requisitos

Node.js 22.23 ou superior.

## Instalar e rodar

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

## Conteúdo e materiais

| O quê | Comando / arquivo |
| --- | --- |
| Produtos das abas e últimas postagens | `npm run sync` → `src/data/products.json`, `src/data/posts.json` |
| Logo, banners, imagens das seções, logos de clientes | `npm run assets` (baixa de msserver.com.br) e `node scripts/client-logos.mjs` (versão monocromática dos logos) |
| Textos | `src/data/content.ts` (home) e `src/data/sobre.ts` ("Sobre nós") |
| Fotos, ícones e fundos da página "Sobre nós" | `node scripts/prepare-sobre-assets.mjs` (baixa de msserver.com.br) |
| Avaliações do Google ("O que os clientes dizem", em "Sobre nós") | `npm run sync:reviews` → `src/data/google-reviews.json` (ver abaixo) |
| Menu, links, contatos, WhatsApp, vídeo, rastreamento | `src/config/site.ts` |
| Metadados JSON-LD (cópia do All in One SEO) | `src/data/schema.json` |

As IDs dos produtos de cada aba (Rack, Torre, Escala Nuvem) estão em `scripts/sync-content.mjs`.

### Avaliações do Google

A seção "O que os clientes dizem" mostra só avaliações públicas do Perfil da Empresa da MSSERVER
no Google, buscadas pela API oficial (Google Places API (New), Place Details) por
`scripts/sync-google-reviews.mjs`. O script roda no Node, antes do build (`prebuild`); a chave
fica em variável de ambiente sem prefixo `PUBLIC_` e nunca vai para o site publicado.

1. Num projeto do Google Cloud com faturamento, ative a "Places API (New)" e crie uma chave de
   API restrita a essa API.
2. Encontre o Place ID do perfil da MSSERVER (Place ID Finder do Google).
3. Defina `GOOGLE_PLACES_API_KEY` e `GOOGLE_PLACE_ID` no `.env` (local) ou nas variáveis do
   ambiente de build.
4. `npm run sync:reviews` (falha se faltar credencial ou se a API recusar) ou `npm run build`
   (sem credenciais, ou com a API fora do ar, mantém o arquivo atual e o build continua).

A API devolve no máximo 5 avaliações, escolhidas pelo Google. Elas são gravadas como o Google as
entrega (texto original, nome público e link do autor, nota e data), da mais recente para a mais
antiga. Enquanto `src/data/google-reviews.json` não tiver avaliações, a seção não aparece na
página. Os termos da Google Maps Platform limitam o armazenamento do conteúdo do Places: rode o
build com frequência (por exemplo, diariamente) para que as avaliações publicadas acompanhem o
perfil.

## Testes

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

41 testes, executados em desktop 1440 px e celular 390 px (82 execuções; alguns só se aplicam a
um dos dois). Home (`tests/e2e/home.spec.ts`, 30): preservação de links e textos contra a home
original (`tests/fixtures/original-home.json`), ordem das seções, SEO, imagens, console,
rolagem horizontal, abas, hero de tela cheia (arte cobrindo a seção sem deformar, 3 pontos indicadores, teclado, troca automática, pausa com o mouse, deslize no celular, sem deslocamento de layout), busca, WhatsApp, vídeo, cartões clicáveis, coluna lateral fixa e carrosséis de servidores e postagens, acordeão de soluções no celular, submenus, menu móvel (meia tela, camadas, fechar tocando fora, sem mover a página), acessibilidade
(axe) e redução de movimento. Chamadas externas são bloqueadas durante os testes.

"Sobre nós" (`tests/e2e/sobre.spec.ts`, 11): textos, títulos, ordem dos blocos, imagens e fundos,
destino do botão contra a página original (`tests/fixtures/original-sobre.json`), SEO, menu com a
página atual, ausência dos depoimentos antigos, avaliações do Google iguais às do arquivo
sincronizado (ou seção oculta sem avaliações), carrossel de avaliações (setas, pontos, volta ao
início, troca automática, parada após interação, redução de movimento; só roda quando há
avaliações), composição das colunas e acessibilidade (axe).

Capturas de QA: `node scripts/qa-screenshots.mjs http://localhost:4330/ 390,768,1024,1440`.

## Publicação

Variáveis (ver `.env.example`):

- `PUBLIC_TRACKING=true` carrega GTM, Google Ads, Meta Pixel, Clarity e RD Station (os mesmos
  da home atual). Deixe desligado em previews.
- `PUBLIC_NOINDEX=true` em ambientes de teste.
- `GOOGLE_PLACES_API_KEY` e `GOOGLE_PLACE_ID`: avaliações do Google em "Sobre nós" (só no build;
  ver "Avaliações do Google").

A home atual é servida pelo WordPress. Para colocar esta versão no ar é preciso decidir como
ela substitui a página inicial (por exemplo, servir o `dist/` na raiz e manter o WordPress nas
demais rotas, ou portar o HTML/CSS para um template do tema). Essa etapa não foi feita: nenhuma
alteração foi aplicada ao WordPress ou à produção.

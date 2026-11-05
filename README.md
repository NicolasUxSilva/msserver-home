# Home MSSERVER · reformulação visual (etapa 01)

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
| Textos | `src/data/content.ts` |
| Menu, links, contatos, WhatsApp, vídeo, rastreamento | `src/config/site.ts` |
| Metadados JSON-LD (cópia do All in One SEO) | `src/data/schema.json` |

As IDs dos produtos de cada aba (Rack, Torre, Escala Nuvem) estão em `scripts/sync-content.mjs`.

## Testes

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

49 testes (desktop 1440 px e celular 390 px): preservação de links e textos contra a home
original (`tests/fixtures/original-home.json`), ordem das seções, SEO, imagens, console,
rolagem horizontal, abas, hero de tela cheia (arte cobrindo a seção sem deformar, 3 pontos indicadores, teclado, troca automática, pausa com o mouse, deslize no celular, sem deslocamento de layout), busca, WhatsApp, vídeo, cartões clicáveis, coluna lateral fixa e carrosséis de servidores e postagens, acordeão de soluções no celular, submenus, menu móvel (meia tela, camadas, fechar tocando fora, sem mover a página), acessibilidade
(axe) e redução de movimento. Chamadas externas são bloqueadas durante os testes.

Capturas de QA: `node scripts/qa-screenshots.mjs http://localhost:4330/ 390,768,1024,1440`.

## Publicação

Variáveis (ver `.env.example`):

- `PUBLIC_TRACKING=true` carrega GTM, Google Ads, Meta Pixel, Clarity e RD Station (os mesmos
  da home atual). Deixe desligado em previews.
- `PUBLIC_NOINDEX=true` em ambientes de teste.

A home atual é servida pelo WordPress. Para colocar esta versão no ar é preciso decidir como
ela substitui a página inicial (por exemplo, servir o `dist/` na raiz e manter o WordPress nas
demais rotas, ou portar o HTML/CSS para um template do tema). Essa etapa não foi feita: nenhuma
alteração foi aplicada ao WordPress ou à produção.

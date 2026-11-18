# Arquitetura

## 1. Visão geral

```
                     ┌──────────────────────────── msserver.com.br (nginx) ───────────────────────────┐
 visitante ──HTTPS──▶│ GET/HEAD + rota da lista + sem parâmetro do WP ──▶ dist/ (site novo, estático) │
                     │ todo o resto (POST, /wp-json/, /wp-admin/, conta, suporte, landings antigas) ──▶ WP│
                     └────────────────────────────────────────────────────────────────────────────────┘
 navegador (site novo) ──▶ /wp-json/wc/store/v1/cart…  (carrinho, mesma sessão do WooCommerce)
                       ──▶ /wp-admin/admin-ajax.php      (formulários do Elementor)
                       ──▶ wa.me/5511985991837            (orçamento pelo WhatsApp)

 build (Node) ◀── leitura pública ── WordPress/WooCommerce (Store API, REST API, HTML publicado)
```

- **Site novo.** Astro 7 com saída **estática**: 175 páginas, mais arquivos gerados. O HTML, o CSS embutido e as imagens otimizadas saem no build. O JavaScript roda só no navegador, para as partes interativas.
- **WordPress.** Continua sendo a fonte dos dados e o sistema de:
  - produtos e preços (WooCommerce);
  - carrinho e sessão (Store API);
  - envio dos formulários (Elementor);
  - blog (posts);
  - suporte (Awesome Support);
  - conta.
- **Sincronização no build.** O site novo não guarda dados digitados à mão: catálogo, produtos, blog e SEO são lidos do WordPress pelos scripts de sincronização e gravados em `src/data/*.json`.
- **Roteamento.** Quem decide, em produção, que endereço é servido por quem é o nginx (`docs/ROTEAMENTO.md`).

## 2. Pastas

| Pasta | Conteúdo |
| --- | --- |
| `src/config/site.ts` | Rotas internas (`ROUTES`), links externos (`LINKS`), menu (`NAV`), contatos e WhatsApp, Store API, rastreamento (`TRACKING`) e consentimento (`CONSENT`). **Ponto único** para mudar destinos e contatos. |
| `src/data/` | Textos de cada página (`content.ts`, `sobre.ts`, `solucoes.ts`, `cases.ts`, `produto.ts`, `carrinho.ts`, `finalizacao.ts`, `privacidade.ts`) e dados sincronizados (`catalog.json`, `product-seo.json`, `blog.json`, `products.json`, `google-reviews.json`, `*-schema.json`, `*-seo.json`). `catalog.ts` e `blog.ts` derivam listagens, paginação e índices de busca. `landings/` tem os dados das duas landings (conteúdo, contatos, catálogo de Servidores Físicos, opções de Cloud). |
| `src/pages/` | Rotas (abaixo). |
| `src/components/` | Componentes por área: `catalog/`, `product/`, `cart/`, `finalizacao/`, `blog/`, `cases/`, `solucoes/`, `orcamento/`, `sobre/`. Na raiz, cabeçalho, rodapé, aviso de cookies, botão de WhatsApp etc. `landings/` tem as seções das landings de Servidores Físicos e Soluções Cloud (`docs/LANDINGS.md`). |
| `src/layouts/Base.astro` | Documento-base: SEO (title, description, canonical, robots, Open Graph, JSON-LD), consentimento e scripts comuns. |
| `src/scripts/` | Comportamento no navegador (seção 4). `landings/` tem o simulador de Cloud e o botão flutuante das landings. |
| `src/styles/` | `global.css` (tokens, base), `site.css` (cabeçalho, rodapé, componentes comuns) e uma folha por área. |
| `src/lib/` | Funções de build: limpeza do HTML dos produtos (`product-html.ts`) e das postagens (`post-html.ts`), ícones, partes comuns do catálogo. |
| `src/assets/` | Imagens processadas no build: catálogo, galeria, blog, cases, soluções, home, sobre. |
| `public/` | Arquivos servidos como estão (ícones, imagens fixas). |
| `scripts/` | Sincronização, validação, pós-build, empacotamento e verificação (seção 5). |
| `wordpress/` | Plugins para o WordPress: `msserver-suporte` (suporte na identidade nova) e `msserver-orcamento` (bloqueio de pagamento). **Instalação manual e autorizada.** |
| `tests/e2e/` | Suíte Playwright (seção 6). `tests/fixtures/` guarda o conteúdo publicado capturado do WordPress, usado para conferir a preservação. |
| `tests/unit/` | Testes de unidade das landings (vitest), vindos dos repositórios delas. |
| `docs/` | Documentação (índice no README). |

## 3. Rotas e geração

| Rota | Arquivo | Dados |
| --- | --- | --- |
| `/` | `pages/index.astro` | `content.ts`, `products.json`, `blog.json` |
| `/sobre/`, `/orcamento/` | `pages/sobre/`, `pages/orcamento/` | `sobre.ts`, `orcamento.ts`, `google-reviews.json` |
| `/servidores/`, `/categoria-produto/{slug}/` (e `/page/N/`) | `pages/servidores/…`, `pages/categoria-produto/[categoria]/…` → `CatalogPage.astro` | `catalog.json` (`LISTINGS`, `FORMATS` em `catalog.ts`) |
| `/servidor/{slug}/` | `pages/servidor/[slug].astro` → `ProductPage.astro` | `catalog.json`, `product-seo.json` |
| `/carrinho/`, `/finalizar-compra/` | `CartPage.astro`, `FinalizacaoPage.astro` | Itens lidos no navegador pela Store API |
| Soluções (4) | `pages/{slug}/` → `solucoes/*Page.astro` | `solucoes.ts`, `solucoes-seo.json` |
| `/solucoes-cloud/`, `/servidores-fisicos/` | `pages/solucoes-cloud/`, `pages/servidores-fisicos/` → `components/landings/` (cabeçalho e rodapé do site) | `data/landings/` (Servidores Físicos: catálogo próprio, `sync:servidores-fisicos`) |
| `/blog/`, `/blog/page/N/`, `/category/{slug}/…`, `/{slug}/` | `pages/blog/…`, `pages/category/…`, `pages/[slug].astro` → `components/blog/` | `blog.json` (`blog.ts`) |
| `/cases-de-sucesso/` | `CasesPage.astro` | `cases.ts`, `cases-seo.json` |
| `/politica-de-privacidade/` | `pages/politica-de-privacidade/` | `privacidade.ts` |
| `404.html` | `pages/404.astro` | — |
| `/busca.json`, `/blog/busca.json` | Endpoints estáticos | Índices de busca (catálogo, blog) |
| `/robots.txt`, `/sitemap-site.xml` | Endpoints estáticos | Páginas indexáveis, a partir de `catalog.ts`, `blog.ts` e `ROUTES` |
| `/parciais/suporte/` | Casca do suporte (não pública) | Usada por `npm run build:suporte` |

`src/pages/[slug].astro` gera **só** as postagens do `blog.json`. Os slugs são conferidos pelo `validate-data` para não colidir com páginas do site.

## 4. No navegador

**`page.ts`** roda em todas as páginas:
- menu e submenus;
- menu do celular;
- animações de entrada;
- consentimento;
- busca do cabeçalho;
- contador do carrinho;
- ano do rodapé;
- cliques medidos (`data-track`).

**Carrinho e finalização:**
- **`store-api.ts`:** cliente da Store API. Faz o nonce, com renovação automática, e trata erros: `StoreUnavailable` quando a resposta não é a da loja; `StoreError` com a mensagem do WooCommerce.
- **`cart.ts`, `cart-totals.ts`, `cart-badge.ts`:** carrinho, totais e contador do cabeçalho. A quantidade fica em `localStorage`, atualizada a cada resposta da loja.
- **`finalizacao.ts`, `finalizacao-mensagem.ts`:** resumo, conferência dos dados e montagem da mensagem do WhatsApp. Não há pagamento.
- **`product.ts`:** escolha da variação, quantidade e "Orçamento", que adiciona pela Store API. Se a loja não responder, oferece o WhatsApp.

**Catálogo, busca e blog:**
- **`catalog.ts`:** busca, ordenação e paginação no navegador, com o estado na URL.
- **`header-search.ts`:** sugestões a partir de `/busca.json`. A busca completa abre `/servidores/?busca=`.
- **`blog.ts`:** busca nos artigos e compartilhamento.

**Formulários:**
- **`quote-form.ts`, `sol-lead-form.ts`, `np-configurador.ts`, `elementor-form.ts`:** enviam ao `admin-ajax.php` com o mesmo protocolo do Elementor.

**Medição e consentimento:**
- **`analytics.ts`:** eventos no `dataLayer` (`docs/TRACKING.md`).
- **`consent.ts`:** aviso, categorias e Consent Mode. Carrega as ferramentas só depois da escolha.

## 5. Scripts

| Script | Quando | O que faz |
| --- | --- | --- |
| `sync-content.mjs` (`npm run sync`) | Antes do build | Produtos das abas da home |
| `sync-catalog.mjs` (`sync:catalog`) | Antes do build | Catálogo completo: produtos, variações, ordenações, imagens e SEO das páginas de produto. **Para sem gravar** se a contagem de uma categoria divergir. |
| `sync-blog.mjs` (`sync:blog`) | Antes do build | Postagens, categorias, imagens destacadas e o SEO (All in One SEO) de cada artigo |
| `sync-google-reviews.mjs` (`sync:reviews`, `prebuild`) | Antes do build | Avaliações do Google (opcional) |
| `validate-data.mjs` (`validate:data`) | Antes do build | Coerência dos dados. Com `--online`, compara com o publicado. |
| `sync-servidores-fisicos.mjs` (`sync:servidores-fisicos`) | Antes do build | Catálogo da landing de Servidores Físicos (preços e variações dos modelos em destaque) |
| `routes.mjs` | Depois do build | `dist/_rotas/rotas.txt` e `nginx-rotas.map` |
| `package-suporte.mjs` (`build:suporte`) | Depois do build | `dist-plugins/msserver-suporte.zip` |
| `traducoes-suporte.mjs` | Quando o Awesome Support mudar | Regera a tradução do suporte |
| `testar-nginx.mjs` (`test:nginx`) | Antes de aplicar o nginx | Testa o exemplo de nginx localmente |
| `verificar-roteamento.mjs` | Depois de aplicar o nginx | Confere o roteamento num domínio |
| `serve-dist.mjs` | Testes | Servidor local do `dist/`, com status 404 |
| `prepare-*-assets.mjs`, `client-logos.mjs`, `qa-screenshots.mjs` | Manutenção | Baixa e prepara imagens publicadas; capturas de QA |

## 6. Testes

**Playwright** (`tests/e2e/`) roda em desktop (1440 px) e celular (Pixel 7, 390 px), contra o build servido por `serve-dist.mjs`.

**Regras:**
- **Nenhuma requisição sai para a produção.**
  - A Store API é simulada por `store-mock.ts`, no formato do WooCommerce 8.2.
  - O `admin-ajax.php` é simulado em cada teste.
  - Os domínios externos são bloqueados.
- **Os testes de preservação comparam com o conteúdo publicado** no WordPress, capturado em `tests/fixtures/`.

**Cobertura por área:**

| Spec | Área |
| --- | --- |
| `home`, `sobre`, `navegacao`, `cabecalho` | Páginas institucionais, menu, busca do cabeçalho, contador do carrinho e rodapé |
| `catalogo`, `produto`, `carrinho`, `finalizacao` | Jornada comercial, sem caminho para pagamento |
| `solucoes`, `orcamento` | Formulários |
| `blog`, `paginas` | Blog, cases, 404, privacidade, robots, sitemap, Soluções Cloud, suporte e formatos |
| `rastreamento` | Eventos GA4 e consentimento |
| `servidores-fisicos`, `solucoes-cloud`, `solucoes-cloud-simulador` | As landings integradas: os testes dos repositórios delas e a integração ao site |

**Acessibilidade:** axe (WCAG 2.1 AA) em cada área e sem rolagem lateral.

## 7. Decisões

- **Estático, não SSR.** Não há servidor de aplicação novo para manter. O que é dinâmico continua no WordPress: carrinho (Store API), formulários e suporte.
- **Os mesmos endereços do WordPress.** Produtos, categorias, artigos e soluções mantêm as URLs indexadas, sem redirecionamentos.
- **Sem pagamento.** A finalização encaminha o orçamento pelo WhatsApp. Nenhum caminho do site novo chega ao checkout do WooCommerce: o teste `paginas.spec.ts` varre o build inteiro.
- **Suporte no WordPress, com casca do site.** O Awesome Support depende de sessão e nonces. Reescrevê-lo seria trocar o sistema de chamados.
- **Landings integradas de forma nativa,** com o código dos repositórios aprovados (só os caminhos de importação mudaram) e o cabeçalho e o rodapé do site. `src/styles/landings/landing.css` mantém o visual original dentro do conteúdo delas. A comparação pixel a pixel está em `docs/LANDINGS.md`.
- **Rastreamento desligado por padrão e condicionado ao consentimento.**

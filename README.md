# Site MSSERVER · reformulação visual (home, "Sobre nós", Orçamento e catálogo de servidores)

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
| Banners da hero | `src/assets/hero/slide-N-desktop` e `slide-N-mobile` (JPG, PNG ou WebP) + textos e destino em `SLIDES` (`src/data/content.ts`) |
| Logo, banners, imagens das seções, logos de clientes | `npm run assets` (baixa de msserver.com.br) e `node scripts/client-logos.mjs` (versão monocromática dos logos) |
| Textos | `src/data/content.ts` (home) e `src/data/sobre.ts` ("Sobre nós") |
| Fotos, ícones e fundos da página "Sobre nós" | `node scripts/prepare-sobre-assets.mjs` (baixa de msserver.com.br) |
| Catálogo de servidores (`/servidores/` e categorias Dell, HP e IBM) | `npm run sync:catalog` → `src/data/catalog.json` e `src/assets/catalog/` (ver abaixo) |
| Avaliações do Google ("O que os clientes dizem", em "Sobre nós") | `npm run sync:reviews` → `src/data/google-reviews.json` (ver abaixo) |
| Menu, links, contatos, WhatsApp, vídeo, rastreamento | `src/config/site.ts` |
| Metadados JSON-LD (cópia do All in One SEO) | `src/data/schema.json` |

As IDs dos produtos de cada aba (Rack, Torre, Escala Nuvem) estão em `scripts/sync-content.mjs`.

### Catálogo de servidores

`scripts/sync-catalog.mjs` lê o WooCommerce pela Store API pública e grava, sem nada digitado à
mão: todos os produtos publicados (nome, link, tipo, categorias, preço ou faixa de preço,
disponibilidade, avaliações, atributos das variações, texto e destino do botão), a ordem de cada
listagem em cada uma das 6 ordenações do WooCommerce (calculada pelo próprio servidor), a imagem
destacada de cada produto (baixada e enquadrada como nos cards de "Nossa linha", sem cortar o
equipamento) e o conteúdo da barra lateral original (postagens recentes e categorias do blog).
Produtos, preços e imagens continuam sendo editados no WooCommerce; para refletir mudanças, rode
de novo e gere o site. Enquanto o HTTPS de msserver.com.br estiver fora do ar, use
`WP_ORIGIN=http://msserver.com.br npm run sync:catalog`.

As páginas (`src/pages/servidores/` e `src/pages/categoria-produto/[categoria]/`) usam um único
componente (`src/components/catalog/CatalogPage.astro`). Cada página já vem gerada na ordem
padrão e paginada como no WordPress (12 por página em `/servidores/`, 16 nas categorias);
busca, filtro por categoria, ordenação e troca de página funcionam no navegador
(`src/scripts/catalog.ts`), com o estado na URL (`/page/N/`, `?orderby=`, `?tipo=`, `?busca=`).
Os cards de produto levam às páginas do produto no WordPress (variações, carrinho e compra
continuam lá).

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

82 testes, executados em desktop 1440 px e celular 390 px (164 execuções; alguns só se aplicam a
um dos dois). Home (`tests/e2e/home.spec.ts`, 34): preservação de links e textos contra a home
original (`tests/fixtures/original-home.json`), ordem das seções, SEO, imagens, console,
rolagem horizontal, abas, hero de tela cheia (arte cobrindo a seção sem deformar, um ponto indicador por banner, banner de locação com a arte certa em cada tela, texto sem cobrir a arte e botão para o orçamento, teclado, troca automática, pausa com o mouse, deslize no celular, sem deslocamento de layout), busca, WhatsApp, vídeo, cartões clicáveis, coluna lateral fixa e carrosséis de servidores e postagens, acordeão de soluções no celular, submenus, menu móvel (meia tela, camadas, fechar tocando fora, sem mover a página), acessibilidade
(axe) e redução de movimento. Chamadas externas são bloqueadas durante os testes.

"Sobre nós" (`tests/e2e/sobre.spec.ts`, 11): textos, títulos, ordem dos blocos, imagens e fundos,
destino do botão contra a página original (`tests/fixtures/original-sobre.json`), SEO, menu com a
página atual, ausência dos depoimentos antigos, avaliações do Google iguais às do arquivo
sincronizado (ou seção oculta sem avaliações), carrossel de avaliações (setas, pontos, volta ao
início, troca automática, parada após interação, redução de movimento; só roda quando há
avaliações), composição das colunas e acessibilidade (axe).

Navegação (`tests/e2e/navegacao.spec.ts`, 9): clique em "Sobre nós" no menu (desktop e menu
móvel) e em "Quem somos" no rodapé leva a `/sobre/` reconstruída; "Orçamento" (menu, rodapé e
banner de locação) leva a `/orcamento/`; logo, "Início" do menu e do rodapé levam de volta à Home
reconstruída; nenhum link aponta para as versões antigas dessas páginas no WordPress, e os itens
ainda não reformulados mantêm os destinos do WordPress.

Orçamento (`tests/e2e/orcamento.spec.ts`, 13): etapas, perguntas, campos (nomes, ids, tipos,
obrigatoriedade), textos e campos ocultos contra o formulário original
(`tests/fixtures/original-orcamento.json`); pedido de envio idêntico ao do Elementor (mesmas
partes, na mesma ordem, e o widget certo para a tela); "Próximo" valida, "Anterior" volta sem
perder dados, Enter avança, progresso ligado ao estado real dos campos, linha do tempo
navegável, rascunho que sobrevive a recarregar; estados de envio (carregando, sem envio
duplicado, confirmação só com resposta do servidor, erro por campo, falha de rede com novo envio,
resposta inesperada, redirecionamento configurado no Elementor); layout no celular e no desktop,
menu com a página atual, console e acessibilidade (axe) no início, com erros e na confirmação.
O endpoint é sempre respondido pelo próprio teste: nenhum pedido chega ao servidor real.

Catálogo (`tests/e2e/catalogo.spec.ts`, 15): contra o catálogo publicado no WordPress
(`tests/fixtures/original-catalog.json`, capturado das 11 páginas originais): os 74 produtos, as
mesmas páginas (mesmos produtos em cada uma, na mesma ordem), nomes, links, preços, textos e
destinos dos botões, imagem destacada original de cada produto e as 6 ordenações iguais às do
WordPress (`?orderby=`); busca (sem acentos, também nos atributos), filtro por categoria, estado
na URL e no histórico, paginação que mantém busca e filtro, endereço antigo `?product-page=N`,
navegação entre fabricantes mantendo a busca, SEO, menu, layout (4 colunas no desktop, card
horizontal no celular, sem rolagem lateral), console e acessibilidade (axe) com e sem resultados.

Capturas de QA: `node scripts/qa-screenshots.mjs http://localhost:4330/ 390,768,1024,1440`.

## Publicação

Variáveis (ver `.env.example`):

- `PUBLIC_TRACKING=true` carrega GTM, Google Ads, Meta Pixel, Clarity e RD Station (os mesmos
  da home atual). Deixe desligado em previews.
- `PUBLIC_NOINDEX=true` em ambientes de teste.
- `GOOGLE_PLACES_API_KEY` e `GOOGLE_PLACE_ID`: avaliações do Google em "Sobre nós" (só no build;
  ver "Avaliações do Google").
- `PUBLIC_QUOTE_ENDPOINT` (opcional): para onde o formulário de orçamento envia. Padrão:
  `https://msserver.com.br/wp-admin/admin-ajax.php`, o mesmo do formulário do WordPress.

### Formulário de orçamento

O formulário de `/orcamento/` envia o mesmo pedido do widget de formulário do Elementor Pro da
página 509 do WordPress (`action=elementor_pro_forms_send_form`, `post_id=509`, `form_id`
`3c9067f` no desktop/tablet ou `65ca7d8` no celular, os mesmos `form_fields[...]` e
`referrer`). Quem recebe e o que acontece depois (email, integrações, registro do envio) continua
configurado no Elementor, no WordPress. Para funcionar:

- **A página precisa ser servida no domínio msserver.com.br**, a mesma origem do `admin-ajax.php`.
  Fora dele (por exemplo, num preview na Vercel) o navegador exige uma autorização de CORS que o
  WordPress não dá: o pedido é bloqueado antes de sair e a página mostra o aviso de falha, com os
  dados preservados e o WhatsApp/email como alternativa. Nada é enviado sem confirmação.
- **A página 509 e os dois widgets de formulário precisam continuar existindo no WordPress**
  (mesmo que a rota `/orcamento/` passe a ser servida por este projeto): o servidor procura a
  configuração do formulário por esses ids.
- **O certificado HTTPS de msserver.com.br precisa estar válido** (o envio usa `https://`).
### Reformulação gradual: rotas e links

| Rota | Origem |
| --- | --- |
| `/` | Home reconstruída (`src/pages/index.astro`) |
| `/sobre/` | "Sobre nós" reconstruída (`src/pages/sobre/index.astro`) |
| `/orcamento/` | Orçamento reconstruído (`src/pages/orcamento/index.astro`); o envio continua no WordPress |
| `/servidores/` (e `/servidores/page/N/`) | Catálogo geral reconstruído; `?product-page=N` (endereço antigo) é convertido |
| `/categoria-produto/dell/`, `/hp/`, `/ibm/` (e `/page/N/`) | Categorias de fabricante reconstruídas, nos mesmos endereços do WooCommerce |
| Páginas de produto (`/servidor/…`), carrinho, checkout e categorias de componentes | WordPress (WooCommerce) |
| Demais páginas (soluções, blog, suporte, cases, landings) | WordPress em `https://msserver.com.br` |

Os links entre páginas já reconstruídas são internos (`ROUTES` em `src/config/site.ts`, com o
`BASE_PATH` do build); os demais continuam absolutos para o WordPress. Ao reconstruir outra
página, crie a rota em `src/pages/` e acrescente-a em `ROUTES`, para que menu e rodapé passem a
apontar para ela. `canonical`, Open Graph e JSON-LD continuam com as URLs de produção.

A home atual é servida pelo WordPress. Para colocar esta versão no ar é preciso que o servidor
entregue `/`, `/sobre/`, `/orcamento/`, `/servidores/` e `/categoria-produto/{dell,hp,ibm}/`
(com as páginas `/page/N/`) a partir do `dist/` e mantenha o WordPress nas demais rotas,
incluindo as páginas de produto, o carrinho e `/wp-admin/admin-ajax.php` (ou que o HTML/CSS seja portado para templates do
tema). Essa etapa não foi feita: o repositório não tem configuração de deploy (há um preview em
`msserver-home.vercel.app`, configurado fora do repositório) e nenhuma alteração foi aplicada ao
WordPress ou à produção.

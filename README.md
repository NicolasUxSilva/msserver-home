# Site MSSERVER

Este repositório é o novo site de [msserver.com.br](https://msserver.com.br/).

O site foi reconstruído na identidade visual das landings aprovadas: [Servidores Físicos](https://msserver.com.br/servidores-fisicos/), [Soluções Cloud](https://cloud-ms-beige.vercel.app) e a [home](https://msserver-home.vercel.app). Ele mantém os mesmos conteúdos, endereços, produtos, preços e funcionalidades do WordPress.

- **Stack.** Astro 7 com saída estática, TypeScript e CSS próprio. Os testes usam Playwright e axe.
- **Dados.** Produtos, preços, variações, postagens e SEO vêm do WordPress/WooCommerce pelos scripts de sincronização. Nada é digitado à mão.
- **Ponte com o WordPress.** O carrinho usa a Store API do WooCommerce, na mesma sessão. Os formulários enviam ao Elementor. O suporte continua no Awesome Support, com a identidade nova.
- **Comércio.** O site **não recebe pagamentos**. O carrinho reúne os produtos e a finalização envia o pedido de orçamento pelo WhatsApp do comercial.

**Estado atual.** Pronto para homologação. **Não publicado.** Veja [docs/ESTADO-DO-PROJETO.md](docs/ESTADO-DO-PROJETO.md).

## Documentação

| Documento | Para quê |
| --- | --- |
| [docs/ESTADO-DO-PROJETO.md](docs/ESTADO-DO-PROJETO.md) | O que está pronto, o que falta, testes e medições |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Como o site é montado: pastas, rotas, scripts e decisões |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Variáveis de ambiente, fluxo de versão, homologação, publicação e volta |
| [docs/ROTEAMENTO.md](docs/ROTEAMENTO.md) | O que o site novo serve e o que fica no WordPress; nginx de exemplo e testes; URLs antigas |
| [docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md) | Roteiro de homologação: navegação, busca, jornada, os 5 formulários, suporte, consentimento e SEO |
| [docs/PENDENCIAS-EXTERNAS.md](docs/PENDENCIAS-EXTERNAS.md) | O que depende do servidor, do WordPress, do Google ou de decisões da MSSERVER |
| [docs/SEGURANCA-WORDPRESS.md](docs/SEGURANCA-WORDPRESS.md) | Achados de segurança do WordPress, com procedimento e validação |
| [docs/TRACKING.md](docs/TRACKING.md) | Eventos GA4, consentimento e mapeamento no GTM e no Google Ads |
| [docs/PRIVACIDADE.md](docs/PRIVACIDADE.md) | Política de privacidade (estrutura) e consentimento de cookies |
| [docs/SUPORTE.md](docs/SUPORTE.md) | Plugin do suporte (Awesome Support) na identidade nova |
| [docs/PRESERVACAO.md](docs/PRESERVACAO.md) | O que foi preservado de cada página e as correções feitas |
| [docs/SISTEMA-VISUAL.md](docs/SISTEMA-VISUAL.md) | Sistema visual: tokens, componentes e padrões |
| [docs/AUDITORIA-2026-11-15.md](docs/AUDITORIA-2026-11-15.md) | Auditoria de 15/11/2026, ponto de partida desta etapa |

## Requisitos

- Node.js 22.23.4 ou superior.
- Chromium para os testes: `npx playwright install chromium`, ou `PW_CHROMIUM=/caminho/do/chromium`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run sync:all` | Sincroniza tudo do WordPress: produtos da home, catálogo, blog e avaliações (opcional) |
| `npm run validate:data` | Confere os dados sincronizados. Com `-- --online`, compara com o publicado. |
| `npm run build` | `astro check`, build, landing de Soluções Cloud e lista de rotas para o nginx → `dist/` |
| `npm run test:e2e` | Suíte Playwright, em desktop e celular |
| `npm run test:nginx` | Testa o exemplo de nginx localmente (precisa do `nginx` instalado) |
| `npm run build:suporte` | Gera o plugin do suporte → `dist-plugins/msserver-suporte.zip` |
| `npm run release` | Tudo, em ordem: sincroniza, valida, gera, testa e empacota (`docs/DEPLOY.md`) |

## Páginas

| Endereço | Página |
| --- | --- |
| `/` | Home |
| `/sobre/` | Sobre nós (avaliações reais do Google, quando configuradas) |
| `/orcamento/` | Orçamento em etapas (formulário do Elementor) |
| `/servidores/` | Catálogo, com busca, ordenação e paginação |
| `/categoria-produto/{dell,hp,ibm}/` | Fabricantes |
| `/categoria-produto/{rack,torre,escala-nuvem}/` | Formatos |
| `/categoria-produto/{componentes,baterias,dissipadores,fans,fontes,gavetas,placas-de-rede}/` | Componentes |
| `/servidor/{slug}/` | 74 páginas de produto |
| `/carrinho/` | Carrinho (Store API) |
| `/finalizar-compra/` | Finalização de orçamento, pelo WhatsApp, sem pagamento |
| `/nuvem-privada/`, `/extencao-de-garantia/`, `/backup-em-nuvem/`, `/consultoria-em-implantacao-de-servidores/` | Soluções |
| `/solucoes-cloud/` | Landing aprovada de Soluções Cloud |
| `/blog/`, `/category/{slug}/`, `/{slug}/` | Blog: 51 artigos, nos mesmos endereços do WordPress |
| `/cases-de-sucesso/` | Cases |
| `/politica-de-privacidade/` | Estrutura da política. O texto aguarda aprovação jurídica. |
| 404 | Página de endereço não encontrado |

**Continuam no WordPress:** conta, suporte (com a identidade nova pelo plugin), Aplicativo de Gestão, Servidores Físicos, landings, `/wp-json/` e `/wp-admin/`. A lista completa e a regra estão em [docs/ROTEAMENTO.md](docs/ROTEAMENTO.md).

## Onde mudar o quê

| O quê | Onde |
| --- | --- |
| Menu, links, contatos, WhatsApp, IDs de rastreamento | `src/config/site.ts` |
| Textos fixos das páginas | `src/data/*.ts`: `content.ts` (home), `sobre.ts`, `orcamento.ts`, `solucoes.ts`, `cases.ts`, `produto.ts`, `carrinho.ts`, `finalizacao.ts`, `privacidade.ts` |
| Produtos, preços, fotos, variações, categorias | **No WooCommerce**. Depois, `npm run sync:catalog` e build. |
| Artigos do blog | **No WordPress**. Depois, `npm run sync:blog` e build. |
| Produtos das abas da home | IDs em `scripts/sync-content.mjs`. Depois, `npm run sync`. |
| Banners da home | `src/assets/hero/` e `SLIDES` em `src/data/content.ts` |
| Landing de Soluções Cloud | `COMMIT` em `scripts/landing-cloud.mjs` (versão aprovada do repositório `cloud-ms`) |
| Imagens publicadas (sobre, soluções, cases, logos) | `node scripts/prepare-*-assets.mjs`. Baixa do WordPress. |

Para ler pelo HTTP enquanto o HTTPS de msserver.com.br estiver fora do ar: `WP_ORIGIN=http://msserver.com.br`.

## Funcionalidades principais

**Busca do cabeçalho:**
- Sugere produtos e categorias durante a digitação. Encontra nomes, fabricantes, códigos de peça e atributos, sem acentos.
- Funciona com teclado e no celular.
- Enter leva a `/servidores/?busca=…`, a busca do catálogo, com o estado na URL. Nunca leva à busca antiga do WordPress.

**Catálogo:**
- 14 listagens com busca, as 6 ordenações do WooCommerce e paginação iguais às do WordPress.
- Endereço antigo `?product-page=N` preservado.

**Produto e carrinho:**
- **Produto:** variações com preço e disponibilidade. "Orçamento" adiciona ao carrinho pela Store API. Se a loja não responder, o pedido do produto vai pelo WhatsApp. Produto sem preço tem "Fale com um consultor".
- **Carrinho:** quantidades, remover, "Desfazer?" e totais do WooCommerce. Há um contador no cabeçalho.

**Finalização:** resumo, dados de contato conferidos e mensagem completa ao WhatsApp do comercial. **Nenhum caminho leva ao checkout com pagamento:** um teste varre o build inteiro.

**Formulários:** Orçamento, configurador da Nuvem Privada e contato das soluções. Enviam ao `admin-ajax.php` com o protocolo do Elementor, com validação e estados de envio, sucesso e falha. **Só funcionam servidos no domínio msserver.com.br** (mesma origem); em previews, avisam e oferecem o WhatsApp.

**Medição e consentimento:**
- Eventos GA4 (`view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `generate_lead` etc.) no `dataLayer`.
- As ferramentas só carregam com `PUBLIC_TRACKING=true` e depois do consentimento ([docs/TRACKING.md](docs/TRACKING.md)).

## Avaliações do Google

A seção "O que os clientes dizem", em "Sobre nós", mostra só avaliações públicas do Perfil da Empresa no Google. As avaliações vêm da Places API (New), por `scripts/sync-google-reviews.mjs`, que roda no build (`prebuild`). A chave fica em variável sem prefixo `PUBLIC_` e nunca vai para o site publicado.

1. Num projeto do Google Cloud com faturamento, ative a "Places API (New)" e crie uma chave restrita a ela.
2. Encontre o Place ID do perfil da MSSERVER (Place ID Finder do Google).
3. Defina `GOOGLE_PLACES_API_KEY` e `GOOGLE_PLACE_ID` no `.env` ou no ambiente de build.
4. Rode `npm run sync:reviews`, que falha sem credencial, ou `npm run build`, que sem credencial mantém o arquivo atual.

A API devolve no máximo 5 avaliações. Sem avaliações em `src/data/google-reviews.json`, a seção não aparece. Os termos da Google Maps Platform limitam o armazenamento: rode o build com frequência.

## Formulário de orçamento

O formulário de `/orcamento/` envia o mesmo pedido do widget do Elementor Pro da página 509:
- `action=elementor_pro_forms_send_form`;
- `post_id=509`;
- `form_id` `3c9067f` (desktop/tablet) ou `65ca7d8` (celular);
- os mesmos campos.

Quem recebe e o que acontece depois continua configurado no Elementor. Para funcionar:
- A página precisa ser servida em msserver.com.br, a mesma origem do `admin-ajax.php`.
- A página 509 e os dois widgets precisam continuar existindo no WordPress.
- O HTTPS de msserver.com.br precisa estar válido.

O mesmo vale para os formulários das soluções ([docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md), seção 5).

## Testes

```bash
npm run test:e2e
```

A suíte tem 180 testes, executados em desktop (1440 px) e celular (Pixel 7, 390 px): 360 execuções. Nenhuma requisição chega à produção:
- a Store API e o `admin-ajax.php` são simulados;
- os domínios externos são bloqueados.

A preservação de conteúdo é conferida contra o HTML publicado no WordPress, capturado em `tests/fixtures/`. O resultado da última execução está em [docs/ESTADO-DO-PROJETO.md](docs/ESTADO-DO-PROJETO.md).

| Spec | Cobre |
| --- | --- |
| `home` | Preservação de links e textos, SEO, hero, abas, carrosséis, vídeo, menu móvel e axe |
| `sobre`, `navegacao` | Sobre nós (preservação, avaliações), links entre as páginas reconstruídas |
| `cabecalho` | Busca com sugestões (dados reais, teclado, sem acento, código de peça, índice indisponível), contador do carrinho e axe |
| `catalogo`, `produto` | As 14 listagens e as 74 páginas contra o publicado; busca, ordenação, paginação, variações, Store API, WhatsApp sem a loja |
| `carrinho`, `finalizacao` | Itens e totais, nonce, loja indisponível, `?add-to-cart=`, mensagem do WhatsApp, jornada completa e axe |
| `solucoes`, `orcamento` | Formulários: conteúdo, envio no formato do Elementor, erros, falha de rede e axe |
| `blog` | Listagem, paginação, categorias, busca, os 51 artigos (texto completo, SEO, canonical), compartilhamento e axe |
| `paginas` | Cases, 404, privacidade, robots, sitemap, Soluções Cloud, casca do suporte, Rack, Torre e Escala Nuvem, e a varredura "nenhum caminho para pagamento" |
| `rastreamento` | Eventos GA4 e consentimento (nada carrega antes da escolha; cada categoria carrega só as suas ferramentas) |

Capturas de QA: `node scripts/qa-screenshots.mjs http://localhost:4330/ 390,768,1024,1440`.

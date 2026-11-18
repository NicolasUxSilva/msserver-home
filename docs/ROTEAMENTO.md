# Roteamento de produção: site novo e WordPress no mesmo domínio

`msserver.com.br` continua sendo servido pelo WordPress (nginx, PHP). O site novo é um build estático (`dist/`). Na publicação, o servidor passa a entregar as páginas reconstruídas a partir do `dist/` e mantém o WordPress em todo o resto.

**Nada disto foi aplicado.** O roteamento é aplicado pelo administrador do servidor, primeiro em homologação, com backup e plano de volta (seção 6).

## 1. A regra

O site novo responde por uma requisição **somente quando todas as condições abaixo são verdadeiras**:

1. **Método GET ou HEAD.** Todo POST vai para o WordPress: formulários do Elementor, AJAX, login, comentários e Store API.
2. **Caminho exato da lista de rotas do build.** A lista fica em `dist/_rotas/nginx-rotas.map` e é gerada por `scripts/routes.mjs` a cada build. Ela tem as 176 páginas e os arquivos públicos (`/busca.json`, `/blog/busca.json`, `/robots.txt`, `/sitemap-site.xml`, ícones e as imagens de compartilhamento das landings). Os arquivos de `/_astro/` têm regra própria.
3. **Sem parâmetro do WordPress na URL.** Os parâmetros são: `s`, `p`, `page_id`, `preview`, `preview_id`, `preview_nonce`, `rest_route`, `wc-ajax`, `post_type`, `attachment_id`, `feed`, `cat`, `tag`, `author`, `m`, `year`, `monthnum`, `day`, `replytocom`, `wc-api`, `order`, `key` e `pay_for_order`.
   - `/?s=…` (busca do WordPress) e `/?wc-ajax=…` (AJAX do WooCommerce) **continuam no WordPress**, mesmo sendo o caminho `/`.
   - Parâmetros de campanha (`utm_*`, `gclid`, `fbclid`) **não** contam: `/?utm_source=x` é a home nova.
4. **`?add-to-cart=` só no carrinho.** `/carrinho/?add-to-cart=ID` é o carrinho novo, que adiciona pela Store API. Em qualquer outro caminho, o parâmetro vai para o WordPress (comportamento antigo de links externos).

Não existe fallback genérico para o site novo. Endereço fora da lista vai para o WordPress. Isso inclui:
- postagens publicadas depois do último build, até o rebuild seguinte;
- landings;
- páginas de suporte;
- `/minha-conta/`.

### 1.1 O que o site novo serve

| Rota | Origem no repositório |
| --- | --- |
| `/` | Home |
| `/sobre/`, `/orcamento/` | Institucional |
| `/servidores/` (e `/page/N/`) | Catálogo geral |
| `/categoria-produto/{dell,hp,ibm,rack,torre,escala-nuvem,componentes,baterias,dissipadores,fans,fontes,gavetas,placas-de-rede}/` (e `/page/N/`) | Categorias |
| `/servidor/{slug}/` (74) | Páginas de produto |
| `/carrinho/` | Carrinho, pela Store API |
| `/finalizar-compra/` (só GET) | Finalização de orçamento, sem pagamento |
| `/nuvem-privada/`, `/extencao-de-garantia/`, `/backup-em-nuvem/`, `/consultoria-em-implantacao-de-servidores/` | Soluções |
| `/solucoes-cloud/` | Landing aprovada de Soluções Cloud (`cloud-ms` 3199d6f), integrada ao site com o cabeçalho e o rodapé dele (`docs/LANDINGS.md`) |
| `/servidores-fisicos/` | Landing aprovada de Servidores Físicos (`landins-servidores-fisicos` a8439e1), integrada ao site; substitui a versão servida hoje pelo plugin `msserver-landing-servidores-fisicos` do WordPress (`docs/LANDINGS.md`) |
| `/blog/` (e `/page/N/`), `/{slug}/` (51 artigos), `/category/{slug}/` (e `/page/N/`) | Blog |
| `/cases-de-sucesso/` | Cases |
| `/politica-de-privacidade/` | Política (estrutura; conteúdo em aprovação, `noindex`) |
| `/robots.txt`, `/sitemap-site.xml`, `/busca.json`, `/blog/busca.json` | Arquivos gerados |
| `404.html` | Página 404 do site (endereços dentro da área do site que não existem) |

### 1.2 O que continua no WordPress

**Técnico:**
- `/wp-json/`, incluindo a Store API usada pelo carrinho e pela finalização;
- `/wp-content/`, `/wp-includes/` e `/wp-admin/` (com `admin-ajax.php`, usado pelos formulários);
- `/wp-login.php`, `/wp-cron.php` e `/xmlrpc.php`;
- `/wc-api/`, com os retornos de gateways.

**SEO:**
- `/sitemap.xml`, os `*-sitemap.xml`, `/default-sitemap.xsl` e `/sitemap.rss` (All in One SEO);
- `/feed/`.

**Conta e suporte:**
- `/minha-conta/`;
- `/obter-suporte/`, `/enviar-chamado/`, `/meus-chamados/`, `/ticket/…` e `/ticket_channel/…` (com a identidade do site pelo plugin `msserver-suporte`).

**Páginas:**
- `/aplicativo-ms-server/` (sem alteração);
- landings antigas e de campanha (seção 4);
- `/categoria-produto/sem-categoria/`.

**WooCommerce:**
- POST em `/finalizar-compra/`;
- `/finalizar-compra/order-received/…`;
- e, enquanto houver, `/finalizar-compra/order-pay/…`, que o exemplo redireciona (seção 3).

**Outras requisições:**
- toda requisição com os parâmetros do item 3 da seção 1;
- postagens novas até o próximo build.

## 2. Configuração de exemplo (nginx)

O arquivo completo e comentado está em [`docs/nginx/msserver-site.conf`](nginx/msserver-site.conf). Os pontos principais:

- **`map_hash_bucket_size 128`** (contexto `http`): os endereços dos artigos passam de 64 caracteres; sem isso, o nginx recusa a lista de rotas.
- **Três `map`** (contexto `http`) decidem `$msserver_novo`:
  - rota da lista;
  - parâmetros do WordPress;
  - `add-to-cart`;
  - e o método da requisição.
- **`location /`:** com `$msserver_novo`, faz `rewrite` interno para `/@site-novo$uri`, servido de `/var/www/msserver-site/current` com `try_files $uri $uri/index.html =404`. Sem ele, segue o `try_files … /index.php?$args` atual do WordPress.
- **Arquivos com hash:** `/_astro/` sai do build com cache de 1 ano.
- **HTTP → HTTPS:** redirecionamento 301 em todas as URLs. Hoje, as páginas internas respondem por `http://` sem redirecionar.
- **Cabeçalhos de segurança recomendados:** HSTS (começando com `max-age` curto), `X-Content-Type-Options`, `Referrer-Policy` e `X-Frame-Options`, em [`docs/nginx/msserver-seguranca.conf`](nginx/msserver-seguranca.conf).
  - O arquivo é incluído no `server` e repetido em cada `location` que tem `add_header` próprio, porque o nginx não herda `add_header` nesses blocos.
- **Bloqueios de pagamento** (seção 3) e redirecionamentos de URLs antigas (seção 4, comentados).
- **Publicação atômica:** `current` é um link simbólico para a pasta da versão (`releases/AAAA-MM-DD-HHMM`). Trocar o link publica; voltar o link desfaz.

## 3. Bloqueios de pagamento

O site não recebe pagamentos. Mesmo assim, o WooCommerce ainda tem o gateway `woo_paypal_stripe_gateway_set` ativo. A Store API pública confirmou isso em 17/11/2026.

Com o roteamento, o site novo não oferece nenhum caminho para pagar. Do lado do WordPress, há duas proteções, e as duas dependem de autorização:

1. **Plugin `wordpress/msserver-orcamento`** (recomendado). Ele:
   - remove os meios de pagamento oferecidos;
   - bloqueia o checkout clássico e o da Store API;
   - redireciona a página de pagamento de pedido;
   - tira o "Pagar" de "Minha conta".

   Não desativa o plugin do gateway e é reversível: basta desativá-lo.
2. **Regras no nginx** (no exemplo):
   - `POST /wp-json/wc/store/v1/checkout` → 403;
   - `?wc-ajax=checkout` → 403;
   - `/finalizar-compra/order-pay/…` → 302 para `/finalizar-compra/`.

A solução definitiva é a MSSERVER identificar o plugin do gateway e decidir se ele deve ser desativado. Veja `docs/SEGURANCA-WORDPRESS.md`.

## 4. URLs antigas e duplicadas: recomendação

Cada destino foi conferido em 17/11/2026. **Os redirecionamentos estão preparados, mas comentados no exemplo de nginx** até a MSSERVER confirmar se há campanhas ou links externos usando cada endereço. Essa confirmação depende do Google Ads, do Search Console e do RD Station, que não são acessíveis daqui.

| URL | O que é hoje | Recomendação | Por quê |
| --- | --- | --- | --- |
| `/solucoes-cloud-msserver/` | Página 7552 do Elementor, versão antiga da oferta Cloud (alterada em 03/07/2026); era o destino do banner "Nuvem" da home | **301 → `/solucoes-cloud/`** | Mesma oferta; o site novo já não aponta para ela |
| `/cloud/` | Página 6430, de 2023 | **301 → `/solucoes-cloud/`** | Versão antiga da mesma oferta |
| `/cloud-privada/` | Landing Cloud **divergente** da aprovada (plugin `msserver-landing-cloud`, publicada em 04/11/2026), indexável | Se houver campanha ativa: manter com `noindex` e canonical para `/solucoes-cloud/` até a campanha mudar de destino; depois, **301 → `/solucoes-cloud/`** | Evita duas versões indexadas da mesma oferta sem quebrar anúncios |
| `/solucoes-cloud-campanha/` | Landing de campanha (8232, 24/03/2026) | Manter, com **`noindex`** | Finalidade própria (campanha); não deve competir no Google |
| `/servidores-dedicados/` | Página 6913 (2023); saiu do menu. **É o destino do "Saiba mais" de "Servidor dedicado em data center" na landing de Soluções Cloud aprovada** | **Rever:** manter no WordPress, com conteúdo atualizado, ou redirecionar para uma página da oferta de servidor dedicado em data center. **Não** redirecionar para `/servidores-fisicos/`. | Servidores Físicos é a venda de equipamentos; a landing de Cloud trata esta página como a oferta de hospedagem em data center (revisado em 18/11/2026, `docs/LANDINGS.md`) |
| `/servidores-dedicados-para-empresas/`, `…-pt/` | Landings de 2025 (campanhas) | Manter, com **`noindex`** | Podem estar em anúncios |
| `/cyber-seguranca/` | Página de 2023 | Manter (sem substituta) | Não há página nova equivalente |
| `/teste/`, `/pagina-exemplo/` | Rascunhos publicados e no sitemap | **Despublicar no WordPress** (ou 301 → `/`) | Conteúdo sem finalidade, indexado |
| `/ticket_channel/standard-ticket-form/` | Arquivo vazio do Awesome Support | 301 → `/obter-suporte/` ou `noindex` | Página vazia indexada |
| `/categoria-produto/sem-categoria/` | Categoria padrão do WooCommerce (contagem 3, nenhum produto visível) | `noindex` no WordPress | Ver `docs/PENDENCIAS-EXTERNAS.md` |

## 5. Verificação

### 5.1 Teste local do exemplo (antes de aplicar)

```bash
npm run build
```

```bash
npm run test:nginx
```

`scripts/testar-nginx.mjs` sobe um nginx local, numa pasta temporária, com o arquivo de exemplo **sem mudar as regras**. Só se trocam:
- as portas, sem TLS;
- os caminhos do `dist/` e do arquivo de cabeçalhos;
- o PHP-FPM, por um "WordPress" de mentira que responde `wordpress`.

Ele confere 65 pontos e sai com erro se algum falhar:
- **Quem responde (site novo ou WordPress)** cada método, endereço e parâmetro da seção 1: home com `?s=`, `?wc-ajax=`, `?p=` e `utm_*`; POST; `?add-to-cart=` dentro e fora do carrinho; finalização em GET e em POST; conta; suporte; Store API; `admin-ajax`; sitemaps; feed; postagem nova; casca do suporte.
- **Os bloqueios de pagamento.**
- **Os redirecionamentos:** `http://` para `https://` (com caminho e parâmetros) e `www`.
- **Cache e cabeçalhos:** o cache longo de `/_astro/` e os cabeçalhos de segurança, inclusive nas `location` com `add_header` próprio.
- **As rotas da lista do build** (185: 176 páginas e 9 arquivos), todas por HEAD.

Requer o `nginx` instalado na máquina (`apt install nginx-core`). Sem ele, o script avisa e sai com código 2.

Executado em 17/11/2026 com nginx 1.24: **64 de 64 conferidos.** Em 18/11/2026, com as landings integradas (Servidores Físicos passou a ser servida pelo site novo): **65 de 65**. O teste encontrou e corrigiu dois problemas do exemplo:
- o `map_hash_bucket_size`;
- a perda dos cabeçalhos de segurança nas `location` com `add_header`.

### 5.2 Verificação no domínio de homologação

Depois de aplicar a configuração em homologação, rode o verificador:

```bash
node scripts/verificar-roteamento.mjs https://homologacao.msserver.com.br
```

O verificador só lê. Ele confere:
- que as páginas do site novo respondem pelo site novo (meta `generator` "Astro" ou cabeçalho `X-Msserver-Origem`);
- que `/?s=`, `/minha-conta/`, `/obter-suporte/`, `/wp-login.php`, `/wp-json/`, os sitemaps e o feed continuam no WordPress;
- o HTTP → HTTPS de uma página interna;
- que o checkout da Store API recusa o POST e que nenhum meio de pagamento é oferecido;
- com HEAD, que **todas** as rotas da lista são servidas pelo site novo.

Ele sai com erro se algo não conferir.

## 6. Plano de volta

1. **Antes de aplicar:** backup da configuração atual do nginx e do WordPress (arquivos e banco).
2. **Aplicar:** publicar o build numa pasta nova, apontar `current` para ela, testar com `nginx -t` e só então dar `reload`.
3. **Para desfazer:**
   - comentar o bloco `if ($msserver_novo) { … }` em `location /` e dar `reload`: o domínio volta a ser 100% WordPress;
   - ou apontar `current` para o build anterior.
4. **Os plugins do WordPress** (`msserver-suporte`, `msserver-orcamento`) se desfazem desativando-os no painel.

# Auditoria do novo site MSSERVER

**Data:** 15/11/2026
**Base auditada:**
- Repositório `NicolasUxSilva/msserver-home`, branch `main` em `068f9fe`.
- Site publicado em `msserver.com.br`.
- Preview em `msserver-home.vercel.app`.
- Landing Cloud em `cloud-ms-beige.vercel.app`.

**Modo:** somente leitura.
- Nenhum arquivo do projeto foi alterado.
- Nenhum commit, merge ou publicação.
- Nenhuma escrita no WordPress, no carrinho real ou em formulários.
- Os rastreadores (GTM, Meta, Clarity, RD) ficaram bloqueados nas capturas, para não gerar dados em produção.

**Legenda de evidência:**

| Marca | Significado |
| --- | --- |
| **[COMPROVADO]** | Verificado nesta auditoria, com teste, leitura ao vivo ou medição. |
| **[NÃO TESTADO]** | Identificado no código ou no site, sem execução real. |
| **[NÃO VERIFICÁVEL]** | Exige acesso que não existe daqui (painel do WordPress, servidor, Vercel). |
| **[DEPENDE DE VOCÊ]** | Decisão, credencial ou autorização sua ou de terceiros. |

---

## A. Visão geral

**1. O que está no ar hoje [COMPROVADO]**

`msserver.com.br` continua sendo inteiramente o WordPress: WordPress 7.1.2, WooCommerce 8.2.5, Elementor 3.31 e Elementor Pro 3.32, sobre nginx, no IP 189.39.167.252.

Nenhuma página reconstruída está publicada no domínio. A única exceção são as duas landings independentes, servidas por plugins próprios do WordPress:
- `/servidores-fisicos/`, pelo plugin `msserver-landing-servidores-fisicos`;
- `/cloud-privada/`, pelo plugin `msserver-landing-cloud`.

**2. O que está pronto no repositório [COMPROVADO]**

O build gera 102 páginas:

| Página | Quantidade |
| --- | --- |
| Home | 1 |
| Sobre nós | 1 |
| Orçamento | 1 |
| Catálogo (com a paginação) | 7 |
| Categorias e suas páginas `/page/2/` (Dell, HP, IBM e 7 de componentes) | 12 |
| Páginas de produto | 74 |
| Carrinho | 1 |
| Finalização de orçamento | 1 |
| Soluções | 4 |

A suíte completa roda 300 testes:
- 284 passam e 16 são pulados de propósito: são testes só de desktop ou só de celular, e os de avaliações do Google, que estão ocultas. Nenhum falha.
- Duração: 5,9 minutos.
- A árvore de trabalho continuou limpa depois da execução.

**3. O preview da Vercel [COMPROVADO]**

`msserver-home.vercel.app` serve um build idêntico ao da `main` atual. Comparei o HTML normalizado de 4 páginas.

**4. Situação geral**

O novo site está tecnicamente maduro como build estático. A jornada comercial está implementada e coberta por testes com uma loja simulada.

**O que impede a publicação está quase todo fora do código:**
- falta o roteamento no servidor;
- o gateway de pagamento continua ativo no WooCommerce;
- falta validar formulários e carrinho reais no domínio;
- faltam decisões de escopo (Soluções Cloud, busca, páginas que ficam no WordPress);
- há higiene e segurança pendentes no WordPress.

**5. Mudanças desde a última sessão [COMPROVADO]**

- **HTTPS.** O certificado voltou a ser aceito. Um cliente TLS que rejeita certificados vencidos (testei com um site de controle vencido) acessou `https://msserver.com.br` normalmente. A validade e o emissor não podem ser lidos daqui, porque a rede desta sessão reemite o certificado.
- **Uma nova versão da landing Cloud foi publicada em `/cloud-privada/`** (modificada em 04/11). O conteúdo é diferente do preview aprovado em `cloud-ms-beige.vercel.app`.
- **Há 5 postagens novas no blog** (06 a 14/11). A home do novo site ainda mostra as de 27 a 31/10.

**6. Estado do GitHub**

O último estado que você tinha registrado era `9f78c44`, com 246 testes passando e 16 pulados. O estado real é `068f9fe`, com 284 passando e 16 pulados. Os detalhes estão na seção E.1.

---

## B. Inventário completo de páginas

Critério: a classificação considera a página como entrega completa, visual e funcional. Ter um arquivo ou uma rota não basta.

| Classificação | Quando se aplica |
| --- | --- |
| CONCLUÍDA E APROVADA | Visual aprovado por você, função testada e nenhuma correção pendente na própria página. |
| DEPENDE DE INFRAESTRUTURA | Visual aprovado, mas a função principal só pode ser validada com a página servida em `msserver.com.br`, por causa da mesma origem, dos cookies da sessão do WooCommerce e do `admin-ajax`. |
| IMPLEMENTADA, MAS NÃO VALIDADA | Pronta e testada com simulação, mas sem sua aprovação visual e sem validação real. |
| PRECISA DE REVISÃO | Exige mudança de conteúdo, visual ou decisão antes de ser considerada pronta. |
| NÃO IMPLEMENTADA | Continua no WordPress com o visual antigo, ou não existe. |

### B.1 Páginas da app nova (repositório, ainda não publicadas no domínio)

Todas as páginas abaixo estão no menu, quando aplicável. Os testes de layout (sem rolagem lateral) e de acessibilidade (axe) passam em desktop e celular, salvo observação.

| # | Página | URL | Classificação | Precisa de intervenção antes de publicar? |
| --- | --- | --- | --- | --- |
| 1 | Home | `/` | **CONCLUÍDA E APROVADA** | Sim: ressincronizar as postagens (P12). |
| 2 | Sobre nós | `/sobre/` | **CONCLUÍDA E APROVADA** | Não. Opcional: chave do Google para as avaliações (P13). |
| 3 | Orçamento (5 etapas) | `/orcamento/` | **DEPENDE DE INFRAESTRUTURA** | Sim: um envio real autorizado (P09). |
| 4 | Catálogo geral | `/servidores/` e `/page/2/` a `/7/` | **CONCLUÍDA E APROVADA** | Não. |
| 5 | Categorias de fabricante | `/categoria-produto/dell/` (e `/page/2/`), `/hp/`, `/ibm/` | **CONCLUÍDA E APROVADA** | Não. |
| 6 | Categorias de componentes | `/categoria-produto/componentes/` (e `/page/2/`), `/baterias/`, `/dissipadores/`, `/fans/`, `/fontes/`, `/gavetas/`, `/placas-de-rede/` | **CONCLUÍDA E APROVADA** | Não. |
| 7 | Páginas de produto (74) | `/servidor/{slug}/` | **DEPENDE DE INFRAESTRUTURA** | Sim: decidir o caminho alternativo (P03) e validar no domínio (P10). |
| 8 | Carrinho | `/carrinho/` | **IMPLEMENTADA, MAS NÃO VALIDADA** | Sim: P03, P10 e sua aprovação visual. |
| 9 | Finalização de orçamento | `/finalizar-compra/` (só GET) | **IMPLEMENTADA, MAS NÃO VALIDADA** | Sim: P10 e sua aprovação visual. |
| 10 | Nuvem Privada | `/nuvem-privada/` | **PRECISA DE REVISÃO** (implementada; revisão visual e de UX) | Decisão sua (P25). |
| 11 | Extensão de Garantia | `/extencao-de-garantia/` | **PRECISA DE REVISÃO** (implementada; revisão visual e de UX) | Decisão sua (P25). |
| 12 | Backup em Nuvem | `/backup-em-nuvem/` | **PRECISA DE REVISÃO** (implementada; revisão visual e de UX) | Decisão sua (P25). |
| 13 | Consultoria | `/consultoria-em-implantacao-de-servidores/` | **PRECISA DE REVISÃO** (implementada; revisão visual e de UX) | Decisão sua (P25). |
| 14 | Página 404 | — | **NÃO IMPLEMENTADA** | Recomendável (P16). |

**1. Home [COMPROVADO]**
- O blog da home mostra 3 postagens de 27 a 31/10; já existem 5 mais novas.
- O banner "Nuvem" leva a `/solucoes-cloud-msserver/`, uma página antiga, enquanto o menu leva a `/solucoes-cloud/`.
- A busca do topo abre os resultados do WordPress (P08).

**2. Sobre nós [COMPROVADO]**
- A seção de avaliações do Google está oculta: `google-reviews.json` está vazio, porque não há chave da API.

**3. Orçamento**
- O envio vai para o `admin-ajax` do Elementor (página 509, formulários `3c9067f` e `65ca7d8`). Os IDs batem com a página ao vivo **[COMPROVADO]**.
- O envio real nunca foi feito **[NÃO TESTADO]**. Só funciona servido em `msserver.com.br`.

**4. Catálogo geral [COMPROVADO]**
- Busca (sem acentos, também nos atributos e no código de peça), ordenação, paginação, estado na URL e o endereço antigo `?product-page=N` funcionam e estão testados.
- Os dados são reais: um snapshot do WooCommerce de 09/11, igual ao que está no ar hoje (seção C.2).
- A página não tem meta description, como já acontece no WordPress.

**5. Categorias de fabricante [COMPROVADO]**
- As contagens batem com o WooCommerce: Dell 31, HP 15 e IBM 4.

**6. Categorias de componentes [COMPROVADO]**
- As contagens batem: Componentes 18, Baterias 3, Dissipadores 5, Fans 5, Fontes 4, Gavetas 4 e Placas de Rede 2.
- Os 19 itens sem preço aparecem como "Sob consulta". O botão "Orçamento" desses itens leva à página do produto.

**7. Páginas de produto (74)**

Comprovado **[COMPROVADO]**:
- Preço, faixa de preço e variações (160 no total) estão corretos.
- Galeria, descrição e garantia estão completas.
- Os itens sem preço mostram "Fale com um consultor" pelo WhatsApp.

Não testado **[NÃO TESTADO]**:
- O botão "Orçamento" adiciona ao carrinho pela Store API e só funciona na mesma origem.
- Sem JavaScript, ou com a loja indisponível, o formulário faz um POST para `/finalizar-compra/` do WordPress, que mostra o checkout antigo com pagamento (P03).

**8. Carrinho**

Comprovado com loja simulada **[COMPROVADO]**:
- adicionar, mudar a quantidade, remover e desfazer;
- totais;
- nonce vencido;
- carrinho vazio;
- loja indisponível.

Problemas e lacunas:
- **Caminho para o checkout do WordPress.** Com a loja indisponível, um link "adicionar" redireciona para `/finalizar-compra/?add-to-cart=` do WordPress (P03).
- **Sem atalho no topo.** Não há ícone de carrinho no cabeçalho: só se chega ao carrinho adicionando um produto (P36).
- **Fora da sua lista de páginas aprovadas.** A página não está entre as que você aprovou visualmente.

**9. Finalização de orçamento**

Comprovado **[COMPROVADO]**:
- Não há pagamento: nenhuma chamada a `/checkout`, nenhum campo de cartão, nenhum gateway no build.
- A mensagem do WhatsApp vai para 5511985991837.
- O preenchimento automático usa a sessão do WooCommerce.

Ainda falta:
- Foi validada com a loja real só em leitura, com 1 produto, em sessão anterior.
- O envio ponta a ponta com a loja real não foi testado **[NÃO TESTADO]**.
- Não está entre as páginas que você aprovou visualmente.

**10. As quatro soluções (Nuvem Privada, Extensão de Garantia, Backup em Nuvem e Consultoria)**
- **Nuvem Privada:** o configurador e o formulário (post 7016, `1b2c23a` e `74046a9`) batem com a página ao vivo **[COMPROVADO]**. O envio real não foi testado.
- **Extensão de Garantia:** o formulário (6727, `f07f805`) bate com a página ao vivo. O envio real não foi testado.
- **Backup em Nuvem:** o formulário (6641, `58d3284`) bate com a página ao vivo. O envio real não foi testado.
- **Consultoria:** o formulário (7247, `716f78c`) bate com a página ao vivo. O envio real não foi testado.
- **Rolagem lateral na Consultoria.** No celular, depois de rolar a página, a largura do documento passa a 411px numa tela de 390px. A página não rola para o lado, porque `scrollX` fica em 0, e o efeito não é visível no Chromium. O teste mede antes da rolagem e passa (P30).

**14. Página 404 [COMPROVADO]**
- Não existe página 404 no projeto. O preview mostra o 404 padrão da Vercel.
- Em produção, com o roteamento recomendado, o WordPress responderá com o 404 de visual antigo.

### B.2 Páginas próprias, fora deste repositório

| # | Página | URL | Onde está | Classificação | Precisa de intervenção? |
| --- | --- | --- | --- | --- | --- |
| 15 | Servidores Físicos | `/servidores-fisicos/` | Build Astro servido pelo plugin `msserver-landing-servidores-fisicos` (no ar) | **CONCLUÍDA E APROVADA** | Não. |
| 16 | Soluções Cloud (versão aprovada) | aprovada em `cloud-ms-beige.vercel.app`; a URL `/solucoes-cloud/` ainda serve a página antiga do Elementor | Vercel (preview) | **DEPENDE DE INFRAESTRUTURA** | Sim (P06). |
| 17 | `/cloud-privada/` ("Servidores em Nuvem para Empresas \| MSCloud") | `/cloud-privada/` | Plugin `msserver-landing-cloud` (no ar desde 04/11) | **PRECISA DE REVISÃO** | Decisão sua (P06). |

**15. Servidores Físicos [COMPROVADO]**
- A página está publicada e indexável. Tem cabeçalho próprio só com âncoras, sem o menu do site, e links para `/servidores-dedicados-para-empresas-pt/`.

**16. Soluções Cloud [COMPROVADO]**
- O menu "Soluções Cloud" leva a `/solucoes-cloud/`, que ainda é a página antiga, com um slider cujo primeiro slide é "Servidores Dedicados".
- O preview aprovado está corretamente marcado como `noindex`.

**17. `/cloud-privada/` [COMPROVADO]**
- É uma segunda versão da landing Cloud: mesma estrutura, mas título, textos e hero diferentes do preview aprovado.
- Está publicada e indexável, com canonical para si mesma.

### B.3 Páginas que continuam no WordPress (visual antigo)

Todas usam o cabeçalho antigo, com o menu antigo ("Servidores Dedicados" e o grupo "Servidores em Nuvem"), e o rodapé antigo.

| # | Página | URL | Classificação | Precisa de intervenção? |
| --- | --- | --- | --- | --- |
| 18 | Aplicativo de Gestão | `/aplicativo-ms-server/` | **NÃO IMPLEMENTADA** (fora do escopo por decisão sua: manter como está) | Não. |
| 19 | Blog e 50 postagens | `/blog/`, postagens em `/{slug}/`, 6 categorias em `/category/{slug}/` | **NÃO IMPLEMENTADA** | Só o menu (P07). |
| 20 | Cases de sucesso | `/cases-de-sucesso/` | **NÃO IMPLEMENTADA** | Sim (P22). |
| 21 | Suporte | `/obter-suporte/`, `/enviar-chamado/`, `/meus-chamados/`, `/ticket_channel/standard-ticket-form/` | **NÃO IMPLEMENTADA** | Recomendável (P23). |
| 22 | Minha conta | `/minha-conta/` | **NÃO IMPLEMENTADA** (precisa continuar no WordPress) | Sim, por causa do pagamento de pedidos (P03). |
| 23 | Resultados da busca | `/?s=…&post_type=product` | **NÃO IMPLEMENTADA** | Sim (P05, P08). |
| 24 | Categorias não reconstruídas | `/categoria-produto/rack/` (37), `/torre/` (13), `/escala-nuvem/` (8), `/sem-categoria/` (3 na contagem do WordPress, 0 visíveis) | **NÃO IMPLEMENTADA** | Decisão sua (P26). |
| 25 | Landings antigas e duplicadas | `/servidores-dedicados/`, `/servidores-dedicados-para-empresas/`, `/servidores-dedicados-para-empresas-pt/`, `/solucoes-cloud-msserver/`, `/solucoes-cloud-campanha/`, `/cloud/`, `/cyber-seguranca/` | **NÃO IMPLEMENTADA** | Decisão sua (P19, P06). |
| 26 | Páginas de rascunho publicadas | `/teste/`, `/pagina-exemplo/` | **PRECISA DE REVISÃO** | Sim (P19). |
| 27 | Política de privacidade | — | **NÃO IMPLEMENTADA** | Sim (P21). |
| 28 | Versões antigas das páginas já reconstruídas | `/`, `/sobre/`, `/orcamento/`, `/servidores/`, categorias, produtos, `/carrinho/`, `/finalizar-compra/` e as 4 soluções | São as que estão **no ar hoje** | Serão substituídas pelo roteamento (P01). |

**18. Aplicativo de Gestão [COMPROVADO]**
- A página tem cerca de 8 MB e não tem `h1`.

**19. Blog [COMPROVADO]**
- A página do blog tem 2,3 MB e não tem `h1`.
- No tablet (820px), a página rola para o lado.

**20. Cases de sucesso [COMPROVADO]**
- O botão "Falar no WhatsApp" aponta para o número fictício `5511999999999`.

**21. Suporte [COMPROVADO]**
- O suporte usa o plugin Awesome Support.
- O login e o cadastro aparecem em inglês ("Log in", "Register", "Forgot password?").
- No tablet, a página rola para o lado.

**22. Minha conta**
- A página é necessária para a conta e os pedidos.
- Pedidos pendentes podem ser pagos por `/finalizar-compra/order-pay/` **[NÃO TESTADO]**.

**23. Resultados da busca [COMPROVADO]**
- A busca do topo do novo site cai nesta página, com o visual e o menu antigos.

**24. Categorias não reconstruídas [COMPROVADO]**
- As 4 URLs estão no sitemap e indexáveis. Nenhum link do novo site leva a elas.
- O produto "Fan Dell R520" não tem nenhuma categoria e não aparece em "Fans".

**25. Landings antigas e duplicadas [COMPROVADO]**
- Todas estão indexáveis e no sitemap.
- `/solucoes-cloud-msserver/` recebe o link do banner da nova home.

**26. Páginas de rascunho [COMPROVADO]**
- `/teste/` e `/pagina-exemplo/` estão publicadas, indexáveis e no sitemap.

**27. Política de privacidade [COMPROVADO]**
- `/?page_id=3` e `/politica-de-privacidade/` dão 404.
- Os formulários coletam nome, e-mail e telefone sem nenhum aviso de privacidade.

**Outras rotas do WordPress que precisam continuar respondendo:**
- `/wp-json/` (a Store API), `/wp-content/`, `/wp-includes/` e `/wp-admin/` (inclusive `admin-ajax.php`);
- `/wp-login.php`, `/wp-cron.php` e `/xmlrpc.php`;
- `/feed/`, `/robots.txt`, `/sitemap.xml`, os `*-sitemap.xml`, `/default-sitemap.xsl` e `/sitemap.rss`;
- `/wc-api/…` (retornos de gateways);
- todas as postagens em `/{slug}/`.

---

## C. Funcionalidades

### C.1 Navegação e estrutura

| Funcionalidade | Situação | Evidência |
| --- | --- | --- |
| Menu desktop (submenus "Servidores" e "Componentes" em camadas, "Soluções" com 7 itens) | Implementada e validada | Testes `navegacao`, `home` e `solucoes`, desktop e celular **[COMPROVADO]** |
| Menu móvel (painel do topo, camadas, fechar tocando fora) | Implementada e validada | Testes **[COMPROVADO]** |
| Links internos | Todos resolvem para rotas do build (0 quebrados) | Varredura das 102 páginas **[COMPROVADO]** |
| Links para o WordPress | 21 destinos distintos, todos com 200 ou 301→200 | Requisições ao vivo **[COMPROVADO]** |
| Links externos (redes sociais, lojas de aplicativo) | Presentes | Não requisitados um a um **[NÃO TESTADO]** |
| PDFs de fabricantes nas descrições de produto | Presentes | Não requisitados **[NÃO TESTADO]** |
| Busca do cabeçalho | Funciona, mas leva aos resultados do WordPress (visual antigo) e não tem o autocompletar que o FiboSearch oferece no site atual | Código e requisição ao vivo **[COMPROVADO]** |
| Busca do catálogo | Funciona no próprio catálogo; "buscar em todo o site" leva ao WordPress | Testes **[COMPROVADO]** |
| WhatsApp | 215 links e o botão flutuante, todos com 5511985991837 | Varredura **[COMPROVADO]** |
| Telefones e e-mails do rodapé | (11) 4858-5358, (11) 98599-1837, contato@ e comercial@ | **[COMPROVADO]** |
| Atalho para o carrinho no topo | Não existe | **[COMPROVADO]** (P36) |
| Página 404 | Não existe | **[COMPROVADO]** (P16) |
| Estados de carregamento e erro | Esqueletos no carrinho e na finalização; avisos de loja indisponível e de erro por campo | Testes **[COMPROVADO]** |

### C.2 Catálogo e dados

**Origem dos dados [COMPROVADO]**
- Os dados são reais, sincronizados da Store API do WooCommerce no build. Não há dados fictícios.
- Comparação feita hoje entre a loja ao vivo e o snapshot de 09/11:
  - **Mesmos produtos:** 74 nos dois, nenhum novo, nenhum removido.
  - **Mesmos dados:** zero diferenças de preço, estoque, slug, URL, quantidade de imagens e atributos.
  - **Diferenças só de representação:** preço "0" contra vazio nos 19 itens "Sob consulta", e um espaço duplo no nome de uma bateria.
- O sitemap de produtos do WordPress não muda desde 20/03/2026.

**Variações [COMPROVADO]**
- A loja tem 50 produtos variáveis e 24 simples, num total de 160 variações.
- As variações sem preço ficam fora da escolha, como no WordPress.

**Avaliações [COMPROVADO]**
- Nenhum produto tem avaliações (`review_count` é 0 em todos), então não há aba de avaliações a preservar.

**Abas de produtos da home [COMPROVADO]**
- Os 16 produtos (snapshot de 02/11) estão com o mesmo preço que hoje.

**Atualização dos dados: limitação [COMPROVADO]**
- Os dados são estáticos até o próximo `npm run sync:catalog` ou `npm run sync` seguido de novo build.
- Não existe rotina automática no repositório.
- O carrinho e a finalização leem a loja em tempo real.

### C.3 Jornada comercial

| Etapa | Situação |
| --- | --- |
| Produto: escolher variação e quantidade, "Orçamento" | Implementada; validada com loja simulada **[COMPROVADO]**; real **[NÃO TESTADO]**, só na mesma origem |
| Carrinho: adicionar, remover, desfazer, quantidades, totais | Implementado; validado com loja simulada, inclusive o nonce vencido **[COMPROVADO]**; real só em leitura, com 1 produto, em sessão anterior |
| "Orçamento pelo WhatsApp" no carrinho | Implementado (mensagem do plugin do WordPress) **[COMPROVADO]** |
| Finalização: resumo, contato, validação, mensagem do WhatsApp, sem pagamento | Implementada e validada com loja simulada **[COMPROVADO]** |
| Jornada ponta a ponta com a loja real | **[NÃO TESTADO]**: depende da publicação no domínio (P10) |

### C.4 Formulários e integrações

| Formulário | Endpoint | IDs batem com o site ao vivo? | Envio real |
| --- | --- | --- | --- |
| Orçamento | `admin-ajax`, post 509 | Sim **[COMPROVADO]** | **[NÃO TESTADO]** |
| Nuvem Privada (desktop/tablet e celular) | 7016 | Sim | **[NÃO TESTADO]** |
| Extensão de Garantia | 6727 | Sim | **[NÃO TESTADO]** |
| Backup em Nuvem | 6641 | Sim | **[NÃO TESTADO]** |
| Consultoria | 7247 | Sim | **[NÃO TESTADO]** |

- Os formulários só funcionam com a página servida em `msserver.com.br`, porque o WordPress recusa a verificação de CORS de outra origem.
- As páginas 509, 7016, 6727, 6641 e 7247 precisam continuar existindo no WordPress, mesmo depois que as rotas passarem para o novo site.
- Quem recebe os envios e o que acontece depois (e-mail, RD Station) está configurado no Elementor **[NÃO VERIFICÁVEL]**.

### C.5 Rastreamento e conversões

**O que está implementado [COMPROVADO]**
- GTM, Google Ads (AW-715484072), Meta Pixel, Clarity e RD Station.
- Só carregam com `PUBLIC_TRACKING=true`, o que é correto para o preview.
- Os eventos próprios vão para o dataLayer: `product_quote_submit`, `view_cart`, `quote_view`, `quote_whatsapp_submit`, `quote_submit_success`, `solution_form_*` e outros, sem dados pessoais.

**Funcionalidade do site atual que pode se perder [COMPROVADO no site atual / NÃO TESTADO no novo]**
- O plugin Google Listings & Ads envia `view_item` e `add_to_cart` por gtag para o AW-715484072 nas páginas de produto do WordPress. O novo site não emite esses eventos com esses nomes.
- Se o contêiner do GTM não mapear os eventos novos, conversões e remarketing do Google Ads deixam de receber dados (P14). O contêiner do GTM **[NÃO VERIFICÁVEL]**.

**Outros pontos**
- O pop-up do RD Station no celular depende do loader, que está incluído.
- Não existe aviso de cookies, nem no site atual nem no novo (P21).

### C.6 Funcionalidades do site antigo e o que acontece com elas

| Funcionalidade do WordPress | No novo site |
| --- | --- |
| Autocompletar da busca (FiboSearch) | Perdido; a busca leva aos resultados do WordPress (P08) |
| Botão flutuante do Click to Chat | Preservado (mesmo número e mensagem) |
| "Pedido pelo WhatsApp" (`woo-order-on-whatsapp`) | Equivale ao "Orçamento pelo WhatsApp" do carrinho e à finalização |
| Texto "Orçamento" nos botões (`woo-add-to-cart-text-change`) | Preservado |
| Eventos do Google Listings & Ads | Não equivalentes (P14) |
| Minicarrinho do WordPress | Não existe atalho (P36) |
| Conta do cliente e pedidos | Permanecem no WordPress |
| Abas e avaliações de produto | Não havia avaliações; descrição e garantia preservadas |

---

## D. Identidade visual e UX

### D.1 Medições nas 3 larguras (1440, 820 e 390) [COMPROVADO]

**O que é igual em todas as páginas da app nova:**
- títulos em Sora 600, com escala proporcional por largura;
- texto em Inter 16px;
- cabeçalho de 73px, translúcido e claro;
- o mesmo rodapé (conferido rolando a página no celular: menu, redes, selos e projetos socioambientais);
- botão primário laranja `#F98305`, com raio de 8px;
- um único `h1` por página;
- nenhuma imagem sem `alt`.

**Outras medições:**
- **Peso transferido:** de 170 a 500 KB por página, com as imagens carregadas depois da rolagem.
- **JavaScript:** nenhum arquivo passa de 13 KB.
- **Comparação com o WordPress:** de 1,4 a 8,3 MB por página.

### D.2 O que está aprovado

- **Home, Sobre nós, Orçamento, Catálogo e Produtos.** São coerentes entre si: mesmo cabeçalho, faixa azul-marinho no topo com trilha, cartões brancos sobre o fundo bege e os mesmos botões. No celular, a hierarquia e os toques estão bem resolvidos.
- **Servidores Físicos e Soluções Cloud (landings).** Linguagem própria e consistente entre as duas: fundo claro editorial, grifo laranja, cartão escuro de especificação à direita e cabeçalho só com âncoras.

### D.3 O que precisa de ajuste

**1. As quatro páginas de soluções (revisão já decidida por você, P25).**

O que está fraco:
- **Linguagem dividida.** Nuvem Privada e Backup abrem com um herói escuro em tela cheia e ilustrações 3D de banco de imagens (as do site original). Garantia e Consultoria abrem com um herói claro.
- **Identidade.** Nenhuma das quatro repete a composição editorial das landings de referência (fundo claro, cartão de especificação, grifo e faixa de dados), nem a do catálogo.
- **Título longo.** O da Garantia ocupa 6 linhas no desktop e pesa na primeira dobra.
- **Problemas herdados do conteúdo original.** Os detalhes estão em `docs/PRESERVACAO.md`:
  - a âncora "#funciona" do Backup não leva a lugar nenhum;
  - as mensagens do WhatsApp da Garantia e do Backup dizem "…sobre Cloud";
  - os formulários da Nuvem Privada oferecem opções diferentes no desktop e no celular;
  - há erros de grafia, como "Extenção" e "servidore";
  - as descriptions foram geradas automaticamente pelo AIOSEO.

**2. Navegação entre o site e as landings.**
- Quem entra em "Soluções Cloud" ou "Servidores Físicos" pelo menu cai em páginas sem o menu principal: o cabeçalho tem só âncoras.
- As landings levam a páginas antigas, como `/servidores-dedicados/`.
- Não altero nada nas landings sem sua autorização, porque estão aprovadas.

**3. Transição para as páginas que continuam no WordPress.**
- Blog, cases, suporte, busca, minha conta e aplicativo trocam de identidade de repente:
  - cabeçalho em duas faixas, com busca e barra azul-marinho;
  - o menu antigo;
  - no celular, cerca de 650px de cabeçalho antes do conteúdo;
  - textos em inglês no suporte.
- Hoje é o ponto de maior inconsistência visual da experiência (P07).

**4. Carrinho e finalização.**
- Seguem o sistema do catálogo e estão consistentes.
- Ainda precisam da sua aprovação visual.
- O carrinho no desktop fica vazio abaixo da dobra quando tem poucos itens. É aceitável, mas pode ganhar a continuação da compra.

**5. Pequenos pontos.**
- O botão flutuante do WhatsApp cobre parte de textos no celular: o fim do título dos cartões e o copyright (P31).
- O placeholder "Perquisar produtos..." e o "© 2023" foram mantidos do original (P29).

### D.4 Redesenhos pendentes

| Redesenho | Motivo |
| --- | --- |
| As 4 páginas de soluções | Nova direção criativa, por decisão sua |
| Soluções Cloud | Só publicação: o redesenho já está aprovado no preview |
| Blog, Cases, Suporte, Busca, 404 e Política de privacidade | Ainda não fazem parte do escopo; dependem de decisão sua |
| Aplicativo de Gestão | Fica de fora, por decisão sua |

---

## E. Infraestrutura e integrações

### E.1 GitHub e deploy [COMPROVADO]

**Branches e commits**
- **Branch atual:** `main`, em `068f9fe` ("Soluções: diferenciais completos, ajustes de layout e documentação", 13/11).
- **Sincronização:** idêntica a `origin/main`. A árvore de trabalho está limpa.
- **Últimos commits:**
  - `068f9fe` e `d2d7ed0`: soluções;
  - `9f78c44`: finalização de orçamento;
  - `d3a226f`: finalização de compra, depois substituída;
  - `2cb1883`: catálogo;
  - `466f3b7`: carrinho;
  - `fe75244`: produtos.
- **Branches de trabalho:** 20 antigas, locais e remotas, incluindo `origin/evolucao-ui-etapa-03`.
  - Nenhuma tem commits fora da `main`, então não há trabalho perdido ou pendente de integração.
  - Podem ser apagadas, mas só com sua autorização.

**Implementações incompletas no código:** nenhuma marcada (sem TODOs pendentes, sem rotas sem página).

**Deploy**
- Não existe configuração de deploy nem CI no repositório: nem `vercel.json`, nem `.github/workflows`.
- A pasta `.vercel` está no `.gitignore`.
- **Preview `msserver-home.vercel.app`:**
  - serve o build atual da `main` (HTML idêntico ao build local);
  - não tem `noindex` (`PUBLIC_NOINDEX` não está ativo), mas o canonical aponta para produção;
  - não tem `robots.txt`, sitemap nem página 404 própria.
- Na Vercel, não verifiquei se o deploy dispara automaticamente a cada push na `main`, nem quais variáveis existem **[NÃO VERIFICÁVEL]**.

### E.2 Domínio, servidor e HTTPS

**Comprovado [COMPROVADO]**
- **DNS:** `msserver.com.br` aponta para 189.39.167.252, servido por nginx.
- **Redirecionamentos para HTTPS:**
  - `www`, por http ou https, vai com 301 para `https://msserver.com.br/`;
  - `http://msserver.com.br/` vai com 301 para https.
- **Páginas internas por HTTP:** respondem 200 por `http://` sem redirecionar (`http://msserver.com.br/sobre/`). Uma das tentativas deu 503 e a seguinte deu 200 (P04).
- **Certificado HTTPS:** aceito hoje por um cliente que verifica certificados.

**Não verificável [NÃO VERIFICÁVEL]**
- Validade, emissor e renovação automática do certificado.
- Configuração do nginx.
- Acesso à hospedagem.

**Cabeçalhos de segurança [COMPROVADO]**
- O WordPress não envia HSTS, X-Frame-Options, Content-Security-Policy nem X-Content-Type-Options.
- Toda página define `PHPSESSID` sem `Secure` e sem `HttpOnly`.

### E.3 WordPress e WooCommerce

**Versões visíveis [COMPROVADO]**

| Componente | Versão |
| --- | --- |
| WordPress | 7.1.2 |
| WooCommerce | 8.2.5 |
| Elementor | 3.31.1 |
| Elementor Pro | 3.32.1 |
| All in One SEO | 4.5.7.3 |
| Contact Form 7 | 5.8.2 |
| Essential Addons | 5.8.10 |
| ElementsKit Lite | 3.0.2 |
| Awesome Support | 6.1.5 |
| Click to Chat | 3.30.1 |
| Order on WhatsApp | 2.3.2 |
| FiboSearch | 1.26.1 |
| Google Listings & Ads | presente |

- O WooCommerce 8.2.5 é de 2023, rodando sobre o WordPress 7.1.
- Várias extensões estão bem defasadas.
- Não consultei bases de vulnerabilidade específicas: não usei serviços externos com dados do site.

**Exposição pública [COMPROVADO]**
- `/wp-json/wp/v2/users` lista 2 usuários.
- `/readme.html` está acessível.
- `/wp-login.php` está acessível.
- Há um namespace REST desconhecido: `soro/v1`.

**Pagamento [COMPROVADO hoje]**
- A Store API pública informa que o meio de pagamento ativo é `payment_methods: ['woo_paypal_stripe_gateway_set']`.
- Ele continua sendo o único meio de pagamento e continua ativo.
- O plugin não aparece nos arquivos públicos **[NÃO VERIFICÁVEL]**.

**Sessão e cookies**
- O carrinho usa a sessão do WooCommerce por cookie, na mesma origem, com nonce.
- No preview da Vercel, isso não funciona, por desenho: o carrinho mostra "indisponível".

### E.4 SEO e indexação [COMPROVADO]

**App nova**
- **Metadados completos:** as 102 páginas têm `title`, canonical, Open Graph e JSON-LD, e um único `h1`.
- **Sem meta description (21 páginas):** catálogo, categorias, carrinho e finalização. É igual no WordPress, preservado da origem.
- **`noindex`:** só o carrinho tem. A finalização está indexável, como no WordPress, mas deveria ser `noindex`.
- **Paginação:** as páginas `/page/N/` apontam o canonical para a página 1.
- **Títulos duplicados:** dois produtos se chamam "Servidor Dell PowerEdge R640" (dado do WooCommerce).
- **Sitemap e robots.txt:** a app não tem. O WordPress tem (AIOSEO, com 27 páginas, 74 produtos, 14 categorias de produto, 51 posts e 6 categorias), e o roteamento precisa mantê-los.

**WordPress**
- `/teste/`, `/pagina-exemplo/`, `/minha-conta/`, `/meus-chamados/` e `/finalizar-compra/` estão no sitemap.
- As landings duplicadas estão todas indexáveis.

### E.5 Acessibilidade e desempenho

**Comprovado [COMPROVADO]**
- O axe passa em todos os tipos de página, desktop e celular.
- Com os rastreadores bloqueados, não aparece nenhum erro de console nas páginas da app.

**Não testado**
- O axe roda numa amostra dos produtos, não nas 74 páginas.
- Lighthouse e Core Web Vitals não foram medidos.
- Não houve teste com leitor de tela real nem em iPhone real.

### E.6 Variáveis de ambiente

| Variável | Para que serve | Estado |
| --- | --- | --- |
| `PUBLIC_TRACKING` | Liga os rastreadores | Precisa ser `true` só no build de produção **[DEPENDE DE VOCÊ]** |
| `PUBLIC_NOINDEX` | Bloqueia a indexação | Deveria ser `true` no preview (P15) |
| `PUBLIC_STORE_API` | Endereço da Store API | Vazio está correto em produção (mesma origem) |
| `PUBLIC_QUOTE_ENDPOINT` | Endereço do formulário de orçamento | Vazio usa o `admin-ajax` de produção |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Avaliações do Google em "Sobre nós" | Ausentes: as avaliações ficam ocultas (P13) |

### E.7 Pendências já conhecidas: situação atual

| # | Pendência | Situação hoje | Evidência |
| --- | --- | --- | --- |
| 1 | WhatsApp +55 11 98599-1837 | É o número usado em todo o site atual (Click to Chat em todas as páginas), nas landings e nos 215 links do novo site. A exceção é o botão de Cases, com o número fictício 5511999999999. Falta só você confirmar que é o número comercial. | **[COMPROVADO]** / **[DEPENDE DE VOCÊ]** |
| 2 | Caminhos alternativos para o checkout do WordPress | Continuam existindo (lista em P03) | **[COMPROVADO]** no código |
| 3 | Plugin de pagamento | O gateway `woo_paypal_stripe_gateway_set` continua ativo. O plugin não pode ser identificado de fora. | **[COMPROVADO]** / **[NÃO VERIFICÁVEL]** |
| 4 | Certificado HTTPS vencido | Parece renovado: aceito por cliente que verifica. Falta confirmar a validade e a renovação automática, e as páginas internas ainda respondem por http sem redirecionar. | **[COMPROVADO]** indiretamente |
| 5 | Configuração de roteamento do servidor | Não feita: produção é 100% WordPress. O nginx não é acessível daqui. | **[COMPROVADO]** / **[NÃO VERIFICÁVEL]** |
| 6 | Preservar as rotas do WordPress | Documentado no README, mas faltam a query string em `/` e as rotas técnicas (P05) | **[COMPROVADO]** |
| 7 | Pedido "TESTE NOVA FINALIZACAO – NAO PROCESSAR" | Não verificável sem o painel | **[NÃO VERIFICÁVEL]** / **[DEPENDE DE VOCÊ]** |
| 8 | Integração real catálogo → produto → carrinho → orçamento | Catálogo e produtos com dados reais **[COMPROVADO]**. Carrinho e orçamento só com loja simulada, mais uma leitura real. O fluxo real **[NÃO TESTADO]**. | — |
| 9 | Finalização sem fluxo de pagamento | A finalização nova está livre de pagamento **[COMPROVADO]**. A plataforma ainda aceita pagamento pelo checkout do WordPress e pela `wc/store/v1/checkout` enquanto o gateway estiver ativo. | — |

---

## F. Lista completa de pendências

Na coluna **Onde resolve**:
- **Projeto** significa mudança neste repositório, com sua autorização.
- **Externo** significa acesso ao WordPress, ao servidor ou à Vercel, ou uma decisão sua.

| ID | Problema | Página / funcionalidade afetada | Impacto | Prioridade | Dependências | Ação | Onde resolve |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Produção continua 100% WordPress; o novo site não está publicado | Todas as rotas novas | Nada do novo site chega ao público | **CRÍTICA** | P05, acesso ao servidor | Configurar o nginx para servir as rotas novas exatas, em GET, a partir do `dist/`, mantendo o WordPress no resto | Externo (servidor) |
| P02 | Gateway `woo_paypal_stripe_gateway_set` ativo, coletando cartão no servidor; plugin não identificado | Checkout do WordPress, Store API `/checkout` e "Minha conta" | Contradiz o modelo de orçamento; risco legal e de segurança | **CRÍTICA** | Painel do WordPress | Identificar o plugin, avaliar se é legítimo e desativar o gateway ou o checkout | Externo (autorização sua) |
| P03 | Caminhos para o checkout com pagamento: POST do formulário de produto sem JavaScript ou com a loja indisponível; redirecionamento do carrinho com a loja indisponível; "Pagar" de pedidos em `/minha-conta/`; Store API `/checkout` pública | Produto, carrinho e conta | Visitante pode cair no checkout antigo com cartão | **ALTA** | P02 | Decidir o comportamento alternativo: levar ao WhatsApp em vez do checkout. Com o P02 resolvido, o risco cai muito. | Projeto e externo |
| P04 | Páginas internas respondem por `http://` sem redirecionar para https; 503 intermitente | Todo o site | Dados de formulário trafegam sem criptografia; SEO duplicado | **ALTA** | Servidor | Redirecionar tudo com 301 para https e ativar HSTS | Externo |
| P05 | O roteamento documentado não cobre a query string em `/` nem as rotas técnicas (`/wc-api/`, `/wp-login.php`, `/wp-cron.php`, `/feed/`, `/default-sitemap.xsl`, `/sitemap.rss`, postagens em `/{slug}/`) | Busca, AJAX do WooCommerce, retornos de gateway, blog | A busca e os retornos do WordPress quebrariam se `/` for servido estático para qualquer query | **ALTA** | P01 | Lista de permissão por caminho exato, só GET e sem query de WordPress (`s`, `wc-ajax`, `p`, `page_id`, `add-to-cart`, `rest_route`, `preview`); todo o resto vai para o WordPress. Documentar no README. | Projeto (doc) e externo |
| P06 | Soluções Cloud: a versão aprovada não está em `/solucoes-cloud/`; `/cloud-privada/` é uma versão divergente e indexável; a home aponta para `/solucoes-cloud-msserver/` | Menu "Soluções Cloud", banner da home | Três versões da mesma oferta; o menu leva à página antiga | **ALTA** | Decisão sua | Definir a URL e a versão oficial, publicar, redirecionar as outras com 301 e alinhar o link da home | Externo, mais projeto (link da home) |
| P07 | Menu do WordPress antigo nas páginas que ficam lá | Blog, cases, suporte, busca, conta, aplicativo, categorias não reconstruídas | Navegação inconsistente depois da publicação | **ALTA** | Painel do WordPress | Atualizar o menu do WordPress para os mesmos itens do novo site | Externo |
| P08 | A busca do topo leva aos resultados do WordPress (visual antigo), sem autocompletar | Todas as páginas | Ruptura de experiência no principal atalho de compra | **MÉDIA** | Decisão sua | Apontar a busca para `/servidores/?busca=` (o catálogo já busca) ou reconstruir os resultados | Projeto |
| P09 | Formulários (Orçamento e 4 soluções) nunca enviados de verdade | Orçamento e soluções | Lead perdido sem perceber | **ALTA** | P01 e autorização para um envio de teste avisado à equipe | Um envio real autorizado de cada formulário, conferindo o e-mail e o RD Station | Externo e você |
| P10 | Jornada real produto → carrinho → finalização → WhatsApp não validada ponta a ponta | Comercial | Bug de sessão ou nonce só aparece em produção | **ALTA** | P01, de preferência em homologação no domínio | Roteiro de validação real (seção H) | Externo e projeto |
| P11 | Pedido de teste "TESTE NOVA FINALIZACAO – NAO PROCESSAR" (12/11) | WooCommerce | Pedido indevido nos relatórios e na conta | **MÉDIA** | Painel | Conferir e cancelar ou excluir | Externo (você) |
| P12 | Postagens da home (02/11) e da barra do catálogo (09/11) desatualizadas; sem rotina de ressincronização | Home, catálogo | Conteúdo antigo na vitrine | **MÉDIA** | P17 | Rodar `npm run sync` e `sync:catalog` no build de publicação e agendar um rebuild diário | Projeto e externo |
| P13 | Avaliações do Google ocultas (sem chave) | Sobre nós | Prova social ausente | **BAIXA** | Credencial sua | Criar a chave da Places API e o Place ID | Externo (você) |
| P14 | Eventos do Google Listings & Ads (`view_item` e `add_to_cart` pelo AW) não reproduzidos | Produto, carrinho | Perda de conversões e remarketing do Google Ads | **MÉDIA** | Acesso ao GTM | Mapear os eventos do dataLayer no GTM ou emitir eventos GA4 padrão | Projeto e externo |
| P15 | Preview da Vercel indexável | Preview | Risco baixo de duplicidade (o canonical atenua) | **BAIXA** | Painel da Vercel | `PUBLIC_NOINDEX=true` no ambiente de preview | Externo |
| P16 | Sem página 404 própria | Rotas inexistentes | 404 de visual antigo ou padrão da Vercel | **BAIXA** | — | Criar a 404 no sistema visual; em produção, decidir quem responde | Projeto |
| P17 | Sem configuração de deploy nem CI no repositório | Publicação | Build e testes manuais, sem rastreabilidade | **MÉDIA** | Decisão de hospedagem | Definir o pipeline: build com sincronização, testes e publicação do `dist/` | Projeto e externo |
| P18 | SEO da app: finalização indexável; 21 páginas sem description (já era assim); canonical da paginação para a página 1; título duplicado do R640 | Catálogo, finalização | SEO marginal | **BAIXA** | — | `noindex` na finalização; descriptions do catálogo; avaliar canonical próprio na paginação | Projeto e WooCommerce |
| P19 | Higiene do WordPress: `/teste/` e `/pagina-exemplo/` publicadas; páginas transacionais e landings duplicadas no sitemap | SEO | Páginas indevidas no Google | **MÉDIA** | Painel | Despublicar os rascunhos; `noindex` nas transacionais; decidir as landings antigas | Externo |
| P20 | Segurança do WordPress: extensões defasadas, usuários expostos na REST, `readme.html`, sem cabeçalhos de segurança, `PHPSESSID` sem flags, namespace `soro/v1` desconhecido | Plataforma | Superfície de ataque; o checkout com cartão agrava | **ALTA** | Painel, backup e homologação | Atualizar com backup, fechar a listagem de usuários, adicionar cabeçalhos, revisar o `soro/v1` | Externo |
| P21 | Sem política de privacidade e sem aviso de cookies; formulários coletam dados pessoais; rastreadores sem consentimento | Todos os formulários | Exposição à LGPD | **ALTA** | Texto jurídico seu | Publicar a política, linkar no rodapé e nos formulários e definir o consentimento | Projeto e você |
| P22 | O botão "Falar no WhatsApp" de Cases aponta para 5511999999999 | Cases (no menu do novo site) | Lead perdido | **MÉDIA** | Painel | Corrigir o link no Elementor | Externo |
| P23 | Suporte em inglês (Awesome Support) e com cadastro obrigatório | Suporte | Fricção no pós-venda | **BAIXA** | Painel | Traduzir as strings ou rever o fluxo | Externo |
| P24 | Landings sem o menu do site e com links para páginas antigas | Servidores Físicos, Cloud | Visitante sem caminho de volta pelo topo | **BAIXA** | Autorização sua (páginas aprovadas) | Avaliar um link "Site MSSERVER" e atualizar os links antigos | Externo |
| P25 | As 4 soluções abaixo do padrão visual e de UX, mais os problemas herdados do original | Soluções | Percepção de qualidade | **MÉDIA** | Nova direção criativa | Redesenho futuro; corrigir o conteúdo herdado com seu aval | Projeto |
| P26 | Categorias Rack, Torre, Escala nuvem e Sem categoria sem página nova; "Fan Dell R520" sem categoria | Catálogo e SEO | Páginas indexadas com visual antigo | **BAIXA** | Decisão sua | Reconstruir, redirecionar para os filtros do catálogo ou `noindex`; categorizar o produto | Projeto e externo |
| P27 | Blog, cases e suporte fora do escopo atual | Conteúdo | Inconsistência visual permanente | **BAIXA** (escopo) | Decisão sua | Definir se entram numa próxima etapa | Você |
| P28 | Páginas do WordPress pesadas (aplicativo 8 MB, Soluções Cloud antiga 7–8 MB, cases 3,6 MB, blog 2,3 MB) | WordPress | Lentidão no celular | **BAIXA** | Painel | Otimizar imagens ou substituir as páginas | Externo |
| P29 | "Perquisar produtos..." e "© 2023" mantidos do original | Cabeçalho, rodapé | Detalhe de acabamento | **BAIXA** | Seu aval | Corrigir com sua autorização | Projeto |
| P30 | Consultoria no celular: largura do documento de 411px depois da rolagem, sem rolagem visível | Consultoria | Nenhum visível no Chromium | **BAIXA** | — | Confirmar em iPhone real; incluir a medição depois da rolagem no teste | Projeto |
| P31 | O botão flutuante do WhatsApp cobre parte de textos no celular | Catálogo, rodapé | Leitura prejudicada em pontos isolados | **BAIXA** | — | Respiro inferior ou recolhimento ao rolar | Projeto |
| P32 | 20 branches antigas já integradas | Repositório | Organização | **BAIXA** | Sua autorização | Apagar as branches integradas | Projeto (Git) |
| P33 | Dependências com atualizações menores (Astro 7.4.12, Sharp 0.35, TypeScript 7, Playwright 1.65) | Build | Nenhum identificado | **BAIXA** | — | Atualizar numa etapa própria, com a suíte | Projeto |
| P34 | Confirmar o número comercial do WhatsApp | Todos os CTAs | — | **BAIXA** | Você | Confirmar | Você |
| P35 | Validade e renovação automática do certificado | HTTPS | Risco de novo vencimento | **MÉDIA** | Hospedagem | Confirmar a data e a renovação automática | Externo |
| P36 | Sem atalho para o carrinho no topo | Jornada de orçamento com vários itens | Quem sai do carrinho não acha o caminho de volta | **MÉDIA** | Decisão sua | Ícone com contador no cabeçalho | Projeto |

---

## G. Plano de conclusão

**Fase 0 — Decisões suas (não precisam de código).** Resolva primeiro, porque destravam o resto.
1. Escolher a versão e a URL oficiais da Soluções Cloud, e o que fazer com `/cloud-privada/`, `/solucoes-cloud-msserver/` e as outras landings antigas (P06, P19).
2. Autorizar a desativação do gateway de pagamento e definir o comportamento alternativo do produto e do carrinho (P02, P03).
3. Escolher o destino da busca (P08), o atalho do carrinho (P36) e o escopo das páginas que ficam no WordPress (P26, P27).
4. Definir a política de privacidade e o consentimento de cookies (P21).
5. Confirmar o número do WhatsApp (P34).

**Fase 1 — WordPress e servidor.** Feita pelo administrador ou pela hospedagem, com sua autorização. Pode correr em paralelo à fase 2.
1. Fazer backup completo.
2. Desativar o gateway e cancelar o pedido de teste (P02, P11).
3. Redirecionar tudo para https com HSTS e confirmar o certificado (P04, P35).
4. Atualizar as extensões numa cópia de homologação e depois em produção; fechar a listagem de usuários; adicionar cabeçalhos; revisar o `soro/v1` (P20).
5. Ajustar o menu do WordPress, o link do Cases e os rascunhos e `noindex` (P07, P19, P22).

**Fase 2 — Ajustes no projeto.** Cada item só com sua autorização.
1. Comportamento alternativo sem checkout (P03).
2. Busca e atalho do carrinho (P08, P36).
3. Página 404 (P16).
4. `noindex` na finalização (P18).
5. Link da política no rodapé e nos formulários (P21).
6. Link do banner da home conforme a decisão Cloud (P06).
7. Pipeline de build com sincronização, testes e rebuild agendado (P12, P17).
8. Mapeamento de eventos para o GTM (P14).
9. Documentar no README as regras completas de roteamento (P05).

**Fase 3 — Homologação no domínio.** Depende de infraestrutura.
- Servir o `dist/` com as regras de roteamento num ambiente que compartilhe a origem e a sessão do WordPress. Pode ser uma janela controlada em produção, com plano de volta, ou uma cópia do WordPress em subdomínio.
- Sem a mesma origem, formulários e carrinho não podem ser validados.

**Fase 4 — Validação real.** Roteiro na seção H, com os envios de teste avisados à equipe comercial (P09, P10).

**Fase 5 — Publicação e monitoramento.**
- Ligar `PUBLIC_TRACKING`.
- Conferir no Search Console e no GTM em modo de visualização.
- Acompanhar o 404 e os leads na primeira semana.

**Fase 6 — Próxima etapa criativa.**
- Redesenho das 4 soluções (P25).
- Páginas que ficaram no WordPress, conforme o escopo que você decidir.

**O que precisa da sua autorização explícita:**
- tudo da fase 1;
- cada mudança da fase 2;
- envios reais de formulário e pedido;
- apagar branches;
- alterar as landings aprovadas;
- ligar o rastreamento em produção.

---

## H. Critérios objetivos de conclusão

O site pode ser considerado concluído e publicado quando todos os itens abaixo forem verdadeiros e conferidos com evidência.

**1. Roteamento**
- [ ] As rotas novas (lista do README) respondem pelo build novo em GET.
- [ ] Respondem pelo WordPress:
  - `/?s=`, `/?wc-ajax=`, `/wp-json/`, `/wp-admin/admin-ajax.php`, `/minha-conta/`;
  - POST em `/finalizar-compra/`, `/wc-api/`;
  - os sitemaps, `/robots.txt`, `/feed/` e uma postagem do blog.
- [ ] Conferido com `curl` em cada uma.

**2. Pagamento**
- [ ] `GET /wp-json/wc/store/v1/cart` não lista nenhum meio de pagamento com cartão, ou o checkout do WooCommerce está desativado.
- [ ] Nenhum caminho do site leva a uma tela que peça cartão.

**3. HTTPS**
- [ ] Toda URL `http://` responde 301 para `https://`.
- [ ] O certificado é válido, com renovação automática confirmada pela hospedagem.

**4. Formulários**
- [ ] Um envio real de cada um dos 5 formulários, avisado à equipe, chega ao destino configurado (e-mail e RD Station).
- [ ] A tela confirma só depois da resposta do servidor.

**5. Jornada comercial real**
- [ ] Com produtos reais (um variável e um simples), no domínio:
  - adicionar e mudar quantidade;
  - remover e desfazer;
  - totais iguais aos do WooCommerce;
  - finalização com o resumo correto;
  - o WhatsApp abre com a mensagem completa para o número confirmado;
  - nenhum pedido pago criado.

**6. Navegação**
- [ ] Os menus do novo site e do WordPress estão iguais.
- [ ] "Soluções Cloud" leva à versão aprovada.
- [ ] Nenhum link leva a página de rascunho ou a um número fictício.

**7. Testes automatizados**
- [ ] Suíte completa sem falhas.
- [ ] `astro check` sem erros, avisos ou dicas.
- [ ] Axe sem violações em todos os tipos de página.

**8. SEO**
- [ ] Canonical de produção em todas as páginas.
- [ ] Sitemap do WordPress acessível e sem páginas de rascunho.
- [ ] Finalização e carrinho com `noindex`.
- [ ] Preview com `noindex`.

**9. Dados**
- [ ] O build de publicação foi gerado depois de `npm run sync` e `sync:catalog`, com zero diferenças contra a loja.
- [ ] O rebuild periódico está configurado.

**10. Rastreamento**
- [ ] Com `PUBLIC_TRACKING=true` em produção, o GTM em modo de visualização recebe os eventos de produto, carrinho, orçamento e formulários.
- [ ] As conversões do Google Ads estão mapeadas.

**11. Conformidade**
- [ ] Política de privacidade publicada e linkada no rodapé e nos formulários.
- [ ] Consentimento de cookies definido.

**12. Sua aprovação**
- [ ] Aprovação visual do carrinho e da finalização.
- [ ] Decisão registrada sobre as soluções (publicar como estão ou aguardar o redesenho).

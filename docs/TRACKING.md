# Medição: eventos, consentimento e mapeamento no GTM

## 1. Estado

- **Desligado por padrão.** Sem `PUBLIC_TRACKING=true` no build, nenhuma ferramenta de medição é incluída e nenhum aviso de cookies aparece. É o caso dos previews e dos testes.
- **Os eventos existem sempre.** O site registra os eventos no `dataLayer` do navegador, mas eles só saem do navegador se o GTM ou o gtag.js forem carregados. Isso exige `PUBLIC_TRACKING=true` **e** o consentimento da pessoa na categoria da ferramenta.
- **Ligar depende de autorização.** A MSSERVER precisa autorizar e fazer o mapeamento do GTM (seção 4). O texto da política e a classificação das ferramentas dependem do jurídico (`docs/PRIVACIDADE.md`).
- **Nada foi ligado em produção nem enviado a nenhuma conta.**

## 2. Ferramentas e consentimento

As ferramentas são as mesmas instaladas hoje na home do WordPress. Os IDs ficam em `src/config/site.ts` (`TRACKING`).

| Ferramenta | ID | Categoria (proposta) | Carrega quando |
| --- | --- | --- | --- |
| Google Tag Manager | `GTM-KTDRRP3` | Análise | A pessoa aceita "Análise" |
| Microsoft Clarity | `hfpiyea4bu` | Análise | A pessoa aceita "Análise" |
| Google Ads (gtag.js) | `AW-715484072` | Publicidade (`marketing`) | A pessoa aceita "Publicidade" |
| Meta Pixel | `4553103271463659` | Publicidade (`marketing`) | A pessoa aceita "Publicidade" |
| RD Station (loader) | `df434ab1-…-loader.js` | Publicidade (`marketing`) | A pessoa aceita "Publicidade" |

Como o consentimento funciona (`src/scripts/consent.ts` e `src/components/CookieConsent.astro`):

- **Consent Mode v2.** Antes de qualquer script, o site define `ad_storage`, `ad_user_data`, `ad_personalization` e `analytics_storage` como `denied`. A escolha da pessoa atualiza esses valores (`gtag('consent', 'update', …)`).
- **Escolha guardada.** Fica em `localStorage` (`msserver:consent`), com a versão em `CONSENT.version`. Mudar a versão pede a escolha de novo a todos os visitantes.
- **Botões.** O aviso oferece "Aceitar todos", "Só os necessários" e "Personalizar". O link "Preferências de cookies", no rodapé, reabre o painel com a escolha atual.
- **Retirar o consentimento** recarrega a página para descarregar as ferramentas já carregadas.
- **Cobertura dos testes** (`tests/e2e/rastreamento.spec.ts`):
  - nenhuma ferramenta carrega antes da escolha;
  - "Só os necessários" mantém tudo desligado, mesmo depois de recarregar;
  - aceitar só "Análise" carrega apenas o GTM e o Clarity;
  - "Aceitar todos" carrega as cinco.

> **Atenção, GTM.** Hoje o GTM é carregado em "Análise". Se o contêiner disparar tags de marketing (Ads, Meta etc.), elas precisam respeitar o Consent Mode, com as tags configuradas para exigir `ad_storage`. Isso deve ser conferido no próprio GTM antes de ligar (seção 4).

## 3. Eventos do site

### 3.1 Comércio (padrão GA4)

Cada evento envia `{ event, ecommerce: { currency: 'BRL', value, items: [...] } }`, precedido de `{ ecommerce: null }`, como o GA4 recomenda. Cada item tem:
- `item_id`: id do produto no WooCommerce; nas variações, o do produto pai;
- `variation_id`;
- `item_name`;
- `item_brand`: Dell, HP ou IBM, quando a categoria existe;
- `item_variant`: a opção escolhida, por exemplo "32GB";
- `price`;
- `quantity`.

| Evento | Quando | Onde (código) | Parâmetros extras |
| --- | --- | --- | --- |
| `view_item` | Ao abrir a página de um produto (uma vez) | `src/scripts/product.ts` | — |
| `add_to_cart` | A Store API confirmou a adição: pela página do produto, pelo link do catálogo (`/carrinho/?add-to-cart=`) ou pelo aumento de quantidade no carrinho | `product.ts`, `cart.ts` | `location`: `produto`, `catalogo`, `carrinho` |
| `remove_from_cart` | Remoção ou redução de quantidade confirmada | `cart.ts` | `location`: `carrinho` |
| `view_cart` | Ao abrir o carrinho com itens (uma vez) | `cart.ts` | — |
| `begin_checkout` | Ao abrir a finalização de orçamento com itens (uma vez) | `src/scripts/finalizacao.ts` | — |
| `generate_lead` | Pedido de orçamento enviado pelo WhatsApp, a partir da finalização (dados conferidos) ou do botão "Orçamento pelo WhatsApp" do carrinho | `finalizacao.ts`, `cart.ts` | `form`: `finalizacao-orcamento` ou `carrinho`; `method`: `whatsapp` |

`view_item` e `add_to_cart` **também** saem no formato do plugin Google Listings & Ads do WordPress, se o gtag.js estiver carregado (consentimento de publicidade). O formato é:
- `gtag('event', …, { send_to: 'GLA', ecomm_pagetype, value, items })`;
- itens com `id: 'gla_<id da variação ou do produto>'`, `google_business_vertical: 'retail'`, `name` e `category`.

Assim, o remarketing e o Merchant Center continuam recebendo os mesmos dados que recebem hoje.

### 3.2 Leads de formulário

| Evento | Quando | Parâmetros |
| --- | --- | --- |
| `generate_lead` | O WordPress confirmou o envio do formulário (resposta de sucesso do `admin-ajax.php`). Nunca dispara no clique, só com a confirmação. | `form`: `orcamento`, `solucao` ou `nuvem-privada`; `form_id` (o do widget do Elementor); `method`: `formulario` |
| `quote_step`, `quote_submit`, `quote_submit_error` | Etapas, envio e falha do formulário de Orçamento | `step`, `form_id`, `reason` |
| `quote_validation_error` | Dados incompletos na finalização de orçamento | `fields` (quantidade de campos com erro) |
| `solution_form_submit`, `solution_form_error`, `solution_form_invalid` | Formulários das soluções e configurador da Nuvem Privada | `form_id`, `reason`, `fields` |

### 3.3 Cliques e buscas

| Evento | Quando | Parâmetros |
| --- | --- | --- |
| `contact_whatsapp_click` | Qualquer botão de WhatsApp: flutuante, rodapé, cases, soluções, produto sem preço, loja indisponível | `location`: o lugar do botão |
| `cart_checkout_click` | "Avançar para o orçamento", no carrinho | `location` |
| `catalog_product_click` | Card de produto no catálogo | `location` |
| `hero_click`, `cta_click`, `app_click`, `app_store_click`, `social_click`, `share_click` | Banners, chamadas, aplicativo, redes sociais e compartilhamento | `location` |
| `search_submit` | Busca do cabeçalho enviada | `from`: `cabecalho` |
| `search_suggestion_click` | Escolha de uma sugestão da busca do cabeçalho | `target`: o nome do produto ou da categoria escolhida |
| `catalog_search`, `catalog_sort` | Busca e ordenação no catálogo | `listing`, `results`, `orderby` |
| `blog_search` | Busca nos artigos | — |

**Regras:**
- Nenhum evento leva nome, e-mail, telefone ou texto digitado (nem o termo buscado).
- Nenhuma conversão é disparada sem a ação real: o envio confirmado pelo servidor, ou o envio ao WhatsApp depois da conferência dos dados.
- Os testes conferem que cada evento sai uma única vez por ação.

## 4. Mapeamento no GTM (a fazer pela MSSERVER)

O contêiner `GTM-KTDRRP3` não é acessível daqui. Antes de ligar o rastreamento, um responsável pelo GTM deve:

1. **GA4.** Criar ou conferir a tag de configuração do GA4 e uma tag de evento GA4 que use os eventos `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout` e `generate_lead`, com "Enviar dados de comércio eletrônico", origem `dataLayer`.
2. **Google Ads, conversões.** O WordPress tem hoje três funções `gtag_report_conversion`, no HTML publicado, com estes rótulos da conta `AW-715484072`:
   - `AW-715484072/G0gwCJWtl70YEKjXldUC`
   - `AW-715484072/KerECNflyo0DEKjXldUC`
   - `AW-715484072/zp8DCOuG0fMCEKjXldUC`

   A associação mais provável, pelo lugar onde aparecem, é Orçamento, Leadster e WhatsApp, respectivamente. **Confirme no Google Ads** (Metas → Conversões) qual ação cada rótulo representa. Depois, crie no GTM:
   - Conversão de **orçamento/lead**: acionador `generate_lead`, com valor `{{ecommerce.value}}` quando existir.
   - Conversão de **WhatsApp**: decidir se conta só o pedido de orçamento enviado (`generate_lead` com `method = whatsapp`, recomendado) ou também cada clique em `contact_whatsapp_click`. Contar os cliques infla as conversões.
   - **Leadster:** o widget do Leadster não está no site novo. Se for necessário, reinstale pelo GTM, na categoria de publicidade.
3. **Remarketing dinâmico:** já atendido pelos eventos `GLA`. Se o GTM tiver uma tag de remarketing própria, use os eventos GA4 para não duplicar.
4. **Consent Mode:** confira, em cada tag de marketing, "Configurações de consentimento → Exigir consentimento adicional: `ad_storage`".
5. **Teste no modo de visualização do GTM,** sem gerar conversão real (seção 5).

## 5. Como validar sem gerar dados reais

1. Num build de homologação com `PUBLIC_TRACKING=true` e `PUBLIC_NOINDEX=true`, abra o site com o **modo de visualização do GTM** (Tag Assistant).
2. Percorra o fluxo **produto → carrinho → finalização**. Confira a sequência `view_item` → `add_to_cart` → `view_cart` → `begin_checkout`.
3. **Não** envie pedido pelo WhatsApp nem formulário com dados reais. Para conferir `generate_lead`, use o ambiente de homologação com o WordPress de homologação, ou o teste automático (`tests/e2e/rastreamento.spec.ts`, `finalizacao.spec.ts`), que simula o servidor.
4. No Google Ads, filtre as conversões de teste pelo modo de visualização, ou use um rótulo de teste.

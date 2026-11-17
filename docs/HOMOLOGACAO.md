# Roteiro de homologação

Este roteiro é para quem vai aprovar o site antes da publicação. Ele parte de um ambiente de homologação montado conforme `docs/DEPLOY.md`, seção 4: o build com `PUBLIC_NOINDEX=true`, o roteamento de `docs/ROTEAMENTO.md` e os plugins `msserver-suporte` e `msserver-orcamento` instalados no WordPress de homologação.

Marque cada item com ✅ (ok), ❌ (problema, com print e endereço) ou ➖ (não se aplica).

> **Sem leads reais e sem pedidos.**
> - Envie formulários **só para um WordPress de homologação**, ou para produção com autorização e com o comercial avisado.
> - Use dados identificados como teste: nome "TESTE HOMOLOGAÇÃO – descartar", e-mail de teste da equipe.
> - Não abra o WhatsApp com o botão de envio final em produção: confira a mensagem e feche sem enviar.
> - Nunca digite dados de cartão. O site não tem e não deve ter campo de pagamento.

## 0. Antes de começar (automático)

```bash
npm run release
```

Ele deve terminar sem erro: dados conferidos, `astro check`, build, testes e pacote do suporte.

```bash
node scripts/verificar-roteamento.mjs https://homologacao.msserver.com.br
```

Ele deve terminar com "Roteamento conferido."

## 1. Navegação geral (desktop e celular)

- [ ] **Menu principal:** cada item e subitem abre a página certa.
  - Servidores: Todos, Dell, HP, IBM, Rack, Torre e Escala Nuvem.
  - Componentes e subcategorias.
  - Soluções, com os sete itens.
  - Soluções Cloud.
  - Blog.
  - Cases.
  - Suporte.
  - Orçamento.
- [ ] **Menu do celular:** abre, navega pelas camadas e fecha tocando fora.
- [ ] **Rodapé:**
  - links, contatos e redes sociais;
  - o ano do copyright é o atual;
  - "Política de privacidade" abre a estrutura da política.
- [ ] **WhatsApp flutuante:** não cobre botões, totais nem o rodapé em 390 px, 768 px e 1440 px.
- [ ] **Endereço que não existe** (ex.: `/servidores/xyz/`): mostra a 404 do site, com busca e atalhos.

## 2. Busca do cabeçalho

- [ ] Digite `r740`, `dell`, `fonte`, `memoria` (sem acento) e um código de peça de uma descrição. As sugestões aparecem durante a digitação.
- [ ] Teclado: setas sobem e descem, Enter abre a sugestão escolhida, Esc fecha.
- [ ] Enter sem escolher sugestão abre `/servidores/?busca=…` com os resultados, e a busca continua na URL.
- [ ] Um termo sem resultados (`xyzabc`) mostra a mensagem de "nenhum produto".
- [ ] A busca nunca leva à busca antiga do WordPress (`/?s=`).
- [ ] No celular: o ícone de lupa abre o campo e as sugestões cabem na tela.

## 3. Catálogo e produto

- [ ] `/servidores/`, Dell, HP, IBM, Rack (37), Torre (13), Escala Nuvem (8) e as categorias de componentes funcionam:
  - contagem igual à do WooCommerce;
  - ordenação;
  - paginação;
  - busca dentro da listagem.
- [ ] Um produto com variações (ex.: Dell R740): escolher memória muda o preço; quantidade; "Orçamento" leva ao carrinho com a variação certa.
- [ ] Um produto simples e um sem preço: no produto sem preço, "Fale com um consultor" abre o WhatsApp com o nome do produto.
- [ ] Etiquetas Rack/Torre levam à listagem do formato.

## 4. Jornada comercial (catálogo → produto → carrinho → finalização → WhatsApp)

- [ ] **Contador do carrinho:**
  - adicione dois produtos;
  - o contador do cabeçalho mostra a quantidade e acompanha alterações e remoções no carrinho.
- [ ] **Carrinho:**
  - quantidades;
  - remover e "Desfazer?";
  - totais iguais aos do WooCommerce;
  - "Orçamento pelo WhatsApp" monta a mensagem com os itens (conferir e **não enviar**).
- [ ] **Finalização (`/finalizar-compra/`):**
  - mostra o resumo;
  - pede nome, empresa, e-mail e WhatsApp;
  - confere os campos;
  - abre o WhatsApp com a mensagem completa (conferir e **não enviar**).
- [ ] **Nenhum caminho leva a pagamento:**
  - nenhuma página mostra forma de pagamento, campo de cartão ou "Pagar";
  - com o plugin `msserver-orcamento` ativo:
    - `POST /wp-json/wc/store/v1/checkout` responde erro;
    - `/finalizar-compra/order-pay/…` redireciona;
    - "Minha conta → Pedidos" não oferece "Pagar".
- [ ] **Link antigo do catálogo:** `/carrinho/?add-to-cart=ID` adiciona o produto e limpa o endereço.
- [ ] **Loja indisponível** (simular desligando a Store API em homologação, se possível): o carrinho mostra o aviso e o pedido pelo WhatsApp.

## 5. Formulários (5) — só em homologação ou com autorização

Os formulários do site novo enviam ao `admin-ajax.php` do Elementor, com os mesmos IDs de página e de formulário do WordPress. O destino (e-mail, RD Station) é o que está configurado em cada formulário no Elementor.

| # | Página | Formulário (Elementor) | Conferir |
| --- | --- | --- | --- |
| 1 | `/orcamento/` | post 509, `3c9067f` (desktop) / `65ca7d8` (celular) | Etapas, "Próximo" valida, "Anterior" mantém os dados, rascunho ao recarregar, envio, mensagem de sucesso do servidor |
| 2 | `/nuvem-privada/` (configurador) | post 7016, `1b2c23a` (desktop) / `74046a9` (celular) | Etapas Processador → Memória → Armazenamento → IP → Contato; resumo ao lado; envio |
| 3 | `/extencao-de-garantia/` | post 6727, `f07f805` | Nome, e-mail, telefone; erros por campo; envio |
| 4 | `/backup-em-nuvem/` | post 6641, `58d3284` | Idem |
| 5 | `/consultoria-em-implantacao-de-servidores/` | post 7247, `716f78c` | Idem |

Em cada formulário:

- [ ] Enviar vazio mostra erros por campo, e o foco vai ao primeiro erro.
- [ ] Um e-mail inválido é recusado antes do envio.
- [ ] Durante o envio, o botão fica em "Enviando…" e não permite envio duplicado.
- [ ] Com sucesso, aparece a mensagem do servidor, e o e-mail ou a integração configurada no Elementor recebe o envio de teste. **Confira com o comercial e descarte o envio.**
- [ ] Com falha (por exemplo, rede desligada), aparece o aviso com os dados mantidos e o WhatsApp como alternativa.
- [ ] O link "Política de privacidade" está junto do formulário.

## 6. Suporte (com o plugin `msserver-suporte`)

- [ ] `/obter-suporte/` deslogado: cabeçalho e rodapé do site novo, formulário de login e de cadastro em português.
- [ ] Cadastro de um usuário de teste: o e-mail de boas-vindas chega, se estiver configurado.
- [ ] Login com o usuário de teste. Erro de senha mostra mensagem (em inglês enquanto o idioma do WordPress for inglês; ver `docs/SUPORTE.md`).
- [ ] `/enviar-chamado/`: abrir um chamado de teste com anexo; ele aparece em `/meus-chamados/`.
- [ ] Abrir o chamado: histórico, responder, e a resposta do agente (pelo painel) aparece.
- [ ] Sair (logout).
- [ ] Nada do tema antigo ou do Elementor aparece misturado; a barra do administrador funciona logado como admin.
- [ ] **Desativar o plugin:** as páginas voltam ao tema atual sem perda de chamados.
- [ ] Excluir o usuário e o chamado de teste no painel de homologação.

## 7. Consentimento e medição (com `PUBLIC_TRACKING=true` só em homologação)

- [ ] **Primeira visita:** aparece o aviso de cookies. Na aba de rede do navegador, nenhuma chamada para `googletagmanager`, `facebook`, `clarity` ou `cloudfront` antes da escolha.
- [ ] **"Só os necessários":** o aviso fecha. Recarregando, continua sem nenhuma dessas chamadas.
- [ ] **"Preferências de cookies"** (rodapé) reabre o painel com a escolha atual.
- [ ] **Aceitar só "Análise":** carrega o GTM e o Clarity, e não carrega o Meta nem o RD.
- [ ] **Com o GTM em modo de visualização:** os eventos `view_item`, `add_to_cart`, `view_cart`, `begin_checkout` e os cliques aparecem uma vez cada (`docs/TRACKING.md`).

## 8. SEO

- [ ] `view-source:` de uma página de produto, de um artigo do blog e da home:
  - `title`, `description` e `canonical` em `https://msserver.com.br/...`;
  - Open Graph;
  - JSON-LD.
- [ ] `/robots.txt`:
  - em homologação, `Disallow: /`;
  - em produção, liberado, com os sitemaps.
- [ ] `/sitemap-site.xml`: lista as páginas do site novo e não lista carrinho, finalização, 404, política (enquanto pendente) nem a casca do suporte.
- [ ] `noindex` no carrinho, na finalização, na 404 e na política pendente.

## 9. Depois da publicação (produção, roteiro curto)

- [ ] O verificador de roteamento passa contra `https://msserver.com.br`.
- [ ] Home, um produto, o carrinho com um item (remover depois), um artigo, Cases, Soluções Cloud e `/obter-suporte/` abrem corretamente.
- [ ] `/wp-admin/`, `/minha-conta/` e `/servidores-fisicos/` continuam funcionando.
- [ ] No Search Console: envie o `/sitemap-site.xml`. Nos dias seguintes, acompanhe 404 e cobertura.

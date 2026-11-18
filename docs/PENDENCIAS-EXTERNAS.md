# Pendências externas

Esta lista reúne o que **não depende do código** deste repositório. Cada item precisa de um destes: acesso ao servidor, acesso ao painel do WordPress ou do Google, uma decisão da MSSERVER ou aprovação jurídica.

O código e os procedimentos estão prontos. Nenhum item abaixo foi executado em produção.

Os itens estão em ordem de prioridade. Cada um traz: **procedimento** · **depende de** · **critério de validação**. Os números "Pxx" são os da auditoria (`docs/AUDITORIA-2026-11-15.md`).

## Bloqueiam a publicação

### 1. Roteamento no servidor (P01, P05)
- **Procedimento.** `docs/ROTEAMENTO.md` e `docs/DEPLOY.md`, seções 4 e 5:
  1. Teste o exemplo com `npm run test:nginx`.
  2. Faça o backup.
  3. Aplique em homologação.
  4. Rode o verificador.
  5. Siga o roteiro de `docs/HOMOLOGACAO.md`.
  6. Só então aplique em produção.
- **Depende de.** Administrador do servidor (acesso SSH ou painel do nginx) e autorização para publicar.
- **Validação.** `node scripts/verificar-roteamento.mjs https://msserver.com.br` termina com "Roteamento conferido.".

### 2. Gateway de pagamento ativo (P02, P03)
- **Procedimento.** `docs/SEGURANCA-WORDPRESS.md`, itens 1 e 2:
  - identificar o plugin `woo_paypal_stripe_gateway_set`;
  - decidir com a direção;
  - desativar o meio de pagamento, ou instalar o plugin `wordpress/msserver-orcamento` enquanto a decisão não sai.
- **Depende de.** Administrador do WordPress e decisão da direção.
- **Validação.** `GET /wp-json/wc/store/v1/cart` → `payment_methods: []` e `POST /wp-json/wc/store/v1/checkout` recusado.

### 3. HTTPS em todas as URLs (P04, P35)
- **Procedimento.**
  - 301 de `http://` para `https://` em todo o domínio (exemplo de nginx).
  - Conferir a validade e a renovação automática do certificado (`docs/SEGURANCA-WORDPRESS.md`, itens 3 e 12).
- **Depende de.** Administrador do servidor ou da hospedagem.
- **Validação.**
  - `curl -I http://msserver.com.br/sobre/` → 301 para https.
  - A data de expiração do certificado está documentada, com renovação automática testada.

### 4. Homologação da jornada e dos formulários (P09, P10)
- **Procedimento.** `docs/HOMOLOGACAO.md`:
  - seções 4 e 5;
  - um envio de teste de cada um dos 5 formulários **avisado ao comercial**, com dados identificados como teste;
  - a jornada produto → carrinho → finalização → WhatsApp, conferindo a mensagem **sem enviar**.
- **Depende de.** O ambiente de homologação no domínio, ou autorização para testar em produção, e o comercial avisado.
- **Validação.**
  - Cada formulário chegou ao destino configurado no Elementor (e-mail ou RD Station) e foi descartado.
  - A mensagem do WhatsApp está completa.

## Necessárias logo após a publicação

### 5. Plugin do suporte (P23)
- **Procedimento.** `docs/SUPORTE.md`:
  - `npm run build:suporte`;
  - instalar `dist-plugins/msserver-suporte.zip` em homologação;
  - roteiro de `docs/HOMOLOGACAO.md`, seção 6;
  - depois, em produção.
- **Depende de.** Administrador do WordPress.
- **Validação.**
  - Login, cadastro, abrir chamado, lista e resposta funcionam com a identidade nova e em português.
  - Desativar o plugin volta ao tema sem perda.

### 6. Menu do WordPress nas páginas que continuam lá (P07)
- **Procedimento.** Em *Aparência → Menus* (ou no cabeçalho do Elementor), deixar os mesmos itens e destinos do site novo (`NAV` em `src/config/site.ts`). Isso vale para as páginas que ficam no WordPress com o tema atual:
  - "Minha conta";
  - "Aplicativo de Gestão";
  - as landings antigas.
- **Depende de.** Administrador do WordPress.
- **Validação.** Os menus das páginas do WordPress e do site novo levam aos mesmos endereços.

### 7. Redirecionamentos e `noindex` das URLs antigas (P06, P19)
- **Procedimento.** `docs/ROTEAMENTO.md`, seção 4:
  1. Confirmar no Google Ads, no RD Station e no Search Console se `/solucoes-cloud-msserver/`, `/cloud/`, `/cloud-privada/`, `/solucoes-cloud-campanha/`, `/servidores-dedicados/` e as landings de 2025 recebem tráfego de campanha.
  2. Descomentar os 301 aprovados no nginx.
  3. Aplicar `noindex` (All in One SEO) nas landings de campanha mantidas.
- **Depende de.** Marketing (decisão) e administrador do servidor.
- **Validação.** Cada URL responde como decidido. Depois de algumas semanas, o Search Console não mostra as duplicadas como indexadas.

### 8. Páginas sem finalidade, comentários e idioma (P19)
- **Procedimento.**
  - Despublicar `/teste/` e `/pagina-exemplo/`.
  - Fechar os comentários (0 publicados).
  - Mudar o idioma do WordPress para Português do Brasil (`docs/SEGURANCA-WORDPRESS.md`, item 11).
- **Depende de.** Autorização e administrador do WordPress.
- **Validação.** As URLs respondem 404 ou 301, não há formulário de comentário e o `wp-login.php` está em português.

### 9. Pedido de teste (P11)
- **Procedimento.** Cancelar o pedido "TESTE NOVA FINALIZACAO – NAO PROCESSAR", de 12/11/2026, em *WooCommerce → Pedidos*.
- **Depende de.** Administrador do WooCommerce.
- **Validação.** O pedido está como "Cancelado".

## Medição e privacidade

### 10. Política de privacidade (P21)
- **Procedimento.** `docs/PRIVACIDADE.md`, seção 2:
  - o jurídico redige ou aprova o texto;
  - preencher `src/data/privacidade.ts`;
  - `approved: true`;
  - build.
- **Depende de.** Jurídico da MSSERVER.
- **Validação.** A página sem o aviso "em preparação", com a data da versão e indexável.

### 11. Ligar o rastreamento (P14, P21)
- **Procedimento.** `docs/TRACKING.md`, seções 4 e 5:
  1. Confirmar no Google Ads qual ação é cada um dos 3 rótulos de conversão.
  2. Mapear no GTM os eventos GA4 e as conversões.
  3. Conferir o Consent Mode nas tags.
  4. Validar em homologação com o modo de visualização.
  5. Gerar o build de produção com `PUBLIC_TRACKING=true`.
- **Depende de.** Acesso ao GTM e ao Google Ads, item 10 (ou decisão jurídica sobre o aviso) e autorização.
- **Validação.**
  - O modo de visualização do GTM mostra a sequência `view_item` → `add_to_cart` → `view_cart` → `begin_checkout`, uma vez cada.
  - Nenhuma ferramenta carrega antes do consentimento.

### 12. Consentimento nas páginas que continuam no WordPress
- **Procedimento.** Instalar no WordPress um gestor de consentimento com as mesmas categorias, ou adaptar o script deste site. As landings de Soluções Cloud e Servidores Físicos já seguem o consentimento do site, porque foram integradas em 18/11/2026 (`docs/LANDINGS.md`).
- **Depende de.** Jurídico e administrador do WordPress.
- **Validação.** Nenhuma página do domínio carrega rastreadores antes da escolha.

## Segurança do WordPress (P20)

### 13. Atualizações e exposição
- **Procedimento.** `docs/SEGURANCA-WORDPRESS.md`, itens 4, 5, 6, 8 e 9:
  - atualizar as extensões numa cópia de homologação e depois em produção;
  - fechar `/wp-json/wp/v2/users`;
  - avaliar o XML-RPC;
  - aplicar os cabeçalhos;
  - ocultar o `readme.html`.
- **Depende de.** Backup, homologação do WordPress e administrador.
- **Validação.** Os critérios de cada item naquele documento. A suíte E2E e o `validate:data -- --online` continuam passando.

### 14. Identificar o `soro/v1`
- **Procedimento.** `docs/SEGURANCA-WORDPRESS.md`, item 7.
  - Indícios: é a integração que publica o blog automaticamente.
  - **Não remover** sem confirmar com o marketing.
- **Depende de.** Marketing e administrador do WordPress.
- **Validação.** O fornecedor está identificado. O endpoint `publish` exige credencial; o teste é feito pelo administrador.

## Conteúdo e dados a confirmar

### 15. WhatsApp comercial (P34)
- **Situação.** O site usa **+55 11 98599-1837** em todos os botões. É o mesmo número do plugin Click to Chat do WordPress. O botão de Cases, que apontava para `5511999999999`, foi corrigido para ele.
- **Depende de.** Confirmação da MSSERVER.
- **Validação.** O comercial confirma o número. Se for outro, troque `WHATSAPP.number` em `src/config/site.ts`: todos os botões, o carrinho e a finalização usam esse valor.

### 16. Telefone de suporte nos dados estruturados
- **Situação.** O All in One SEO publica, nos dados estruturados de todas as páginas, um `contactPoint` com `+5511988130598` e o tipo "Technical Support". O site novo copia esses dados do WordPress (`src/data/schema.json` e os arquivos de SEO sincronizados). É diferente do WhatsApp comercial.
- **Procedimento.** Confirmar se o número está correto. Se não estiver, corrigir em *All in One SEO → Aparência na busca → Organização* e sincronizar de novo.
- **Depende de.** MSSERVER e administrador do WordPress.
- **Validação.** O número confirmado nos dados estruturados (`view-source:`, bloco `application/ld+json`).

### 17. Certificações em Cases
- **Situação.** A página publicada lista "ISO 27001", "AWS Partner", "Microsoft Gold" e "VMware Certified". O site novo mantém o texto publicado. O programa "Microsoft Gold" foi substituído pela Microsoft em 2022 pelas designações de "Solutions Partner".
- **Procedimento.** A MSSERVER confirma quais certificações estão vigentes e os nomes atuais. Depois, ajustar `certs` em `src/data/cases.ts`.
- **Depende de.** MSSERVER.
- **Validação.** Lista confirmada por escrito.

### 18. Produto sem categoria e "Sem categoria" (P26)
- **Situação.**
  - O produto 7856, "Fan Dell R520 05fx8x-5fx8x", não tem nenhuma categoria. Aparece em `/servidores/` e na busca, mas não em "Fans".
  - A categoria padrão `sem-categoria` informa contagem 3, com nenhum produto visível. Isso indica produtos em rascunho ou privados.
- **Procedimento.**
  - No WooCommerce, decidir a categoria do produto (provavelmente "Fans") e sincronizar.
  - Para `/categoria-produto/sem-categoria/`: `noindex` no All in One SEO, ou 301 para `/servidores/`.
- **Depende de.** Decisão do catálogo e administrador do WooCommerce.
- **Validação.** Depois de `npm run sync:catalog`, o produto aparece na listagem da categoria escolhida, e `sem-categoria` fica fora do índice.

### 19. Postagem vazia no blog
- **Situação.** A postagem "servidores-usados-dell" (id 2116) está publicada **sem conteúdo** no WordPress. O site novo mantém o endereço com `noindex` e um aviso.
- **Procedimento.** Escrever o conteúdo ou despublicar a postagem no WordPress.
- **Depende de.** Marketing.
- **Validação.** `npm run validate:data` sem o aviso dessa postagem.

### 20. Avaliações do Google (P13)
- **Procedimento.** README, "Avaliações do Google": criar a chave da Places API (New) restrita e obter o Place ID.
- **Depende de.** Conta Google Cloud da MSSERVER, com faturamento.
- **Validação.** `npm run sync:reviews` grava as avaliações, e a seção aparece em "Sobre nós".

## Infraestrutura do projeto

### 21. Preview na Vercel (P15)
- **Procedimento.** No projeto da Vercel, `PUBLIC_NOINDEX=true` no ambiente de preview.
- **Depende de.** Acesso à Vercel.
- **Validação.** `robots.txt` do preview com `Disallow: /`.

### 22. Atualização diária dos dados
- **Procedimento.** No GitHub, *Settings → Actions → General*, permitir "Allow GitHub Actions to create and approve pull requests". O workflow `.github/workflows/atualizacao-dados.yml` passa a abrir um PR por dia quando os dados mudam. A publicação continua manual.
- **Depende de.** Administrador do repositório.
- **Validação.** Uma execução manual (*Actions → Atualização dos dados → Run workflow*) termina verde.

### 23. Branches antigas (P32)
- **Procedimento.** Apagar as branches já integradas, se autorizado. Este projeto não apaga branches.
- **Depende de.** Autorização.
- **Validação.** `git branch -r --merged origin/main` só com as branches ativas.

### 24. Landings integradas ao site (P24): decisões que restam
- **Situação.** Desde 18/11/2026, as landings de Servidores Físicos e Soluções Cloud são páginas do site, com o cabeçalho e o rodapé dele e os links internos (`docs/LANDINGS.md`). As seções estão idênticas às aprovadas.
- **Procedimento.** A MSSERVER decide:
  1. **Navegação por seções.** As âncoras do cabeçalho próprio das landings saíram com ele. Elas podem voltar como uma faixa abaixo do cabeçalho do site.
  2. **Versão para Portugal.** O link para `/servidores-dedicados-para-empresas-pt/` ficava no rodapé próprio de Servidores Físicos. Decida onde ele deve ficar, se a página continuar.
  3. **Plugin `msserver-landing-servidores-fisicos`.** Depois que o roteamento servir `/servidores-fisicos/` pelo site, o plugin deixa de ser usado. Ele pode ser desativado no WordPress, com autorização.
  4. **`/servidores-dedicados/`.** A landing de Cloud usa essa página para a oferta de servidor dedicado em data center. Rever a recomendação de 301 de `docs/ROTEAMENTO.md`, seção 4.
  5. **Notas de preço dos rodapés próprios** ("Preços e condições sujeitos a alteração…" e "O simulador gera um levantamento preliminar…"). O sentido continua no conteúdo das páginas. Decida se a frase exata deve voltar no fim da chamada final (`docs/LANDINGS.md`, seção 2).
- **Depende de.** MSSERVER (decisões) e administrador do WordPress (plugin).
- **Validação.** As decisões estão registradas neste documento e aplicadas.

### 25. Leadster
- **Situação.** O WordPress tem um rótulo de conversão do Google Ads associado ao Leadster (`docs/TRACKING.md`). O widget do Leadster não está no site novo.
- **Procedimento.** Decidir se o Leadster continua. Se continuar, instalar pelo GTM, na categoria de publicidade.
- **Depende de.** Marketing.
- **Validação.** A decisão está registrada.

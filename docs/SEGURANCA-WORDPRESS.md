# Segurança do WordPress: achados e procedimentos

As evidências abaixo foram coletadas de fora, só com leitura pública (GET), em 15/11/2026 (auditoria) e 17/11/2026 (conferência). **Nada foi alterado no WordPress nem no servidor.**

Todas as ações dependem de acesso ao painel ou ao servidor e de autorização da MSSERVER. A ordem recomendada é a da tabela: o item 1 é o mais urgente.

Formato de cada item: problema · evidência · risco · ação · dependência · responsável · validação.

| # | Item | Prioridade |
| --- | --- | --- |
| 1 | Gateway de pagamento ativo | Crítica |
| 2 | Caminhos de pagamento no WordPress | Alta |
| 3 | HTTP sem redirecionamento nas páginas internas | Alta |
| 4 | Extensões defasadas | Alta |
| 5 | Usuários expostos na REST API | Média |
| 6 | Cabeçalhos de segurança e cookie de sessão | Média |
| 7 | Namespace `soro/v1` | Média (investigar, **não remover**) |
| 8 | XML-RPC ativo | Média |
| 9 | `readme.html` e versões visíveis | Baixa |
| 10 | Pedido de teste no WooCommerce | Média |
| 11 | Páginas sem finalidade publicadas, comentários abertos e idioma | Baixa |
| 12 | Certificado HTTPS | Média |

---

## 1. Gateway de pagamento ativo

- **Problema.** O WooCommerce tem um meio de pagamento ativo, `woo_paypal_stripe_gateway_set` (PayPal/Stripe), num site que trabalha só com orçamento.
- **Evidência.**
  - `GET https://msserver.com.br/wp-json/wc/store/v1/cart` → `"payment_methods": ["woo_paypal_stripe_gateway_set"]`, conferido em 17/11/2026.
  - O plugin que registra esse gateway não aparece nos arquivos públicos.
- **Risco.** Um visitante pode pagar por um caminho do WordPress (seção 2) por um produto que o comercial ainda não confirmou: estoque, configuração, frete. Também há dados de cartão trafegando por um plugin não identificado.
- **Ação.**
  1. No painel, *WooCommerce → Configurações → Pagamentos*, identifique o plugin do gateway. Em *Plugins*, veja o autor, a versão e a origem.
  2. Confirme com a direção se algum pagamento online é esperado.
  3. Se não for: desative **o meio de pagamento** em *WooCommerce → Pagamentos*. Desative o plugin depois, se ele não tiver outra função.
  4. Enquanto a decisão não sai: instale o plugin `wordpress/msserver-orcamento`. Ele remove os meios de pagamento da oferta, bloqueia o checkout clássico, o checkout da Store API e o pagamento de pedido, sem desativar nada.
- **Dependência.** Acesso ao painel; decisão da direção.
- **Responsável.** Administrador do WordPress e direção da MSSERVER.
- **Validação.**
  - `GET /wp-json/wc/store/v1/cart` → `payment_methods: []`.
  - `POST /wp-json/wc/store/v1/checkout` é recusado.
  - `/finalizar-compra/` (página do WordPress, em POST) não mostra campo de cartão.

## 2. Caminhos de pagamento no WordPress

- **Problema.** Mesmo com o site novo sem nenhum caminho para pagar, o WordPress ainda oferece pagamento:
  - pelo checkout clássico;
  - pela Store API (`/checkout`);
  - pela página de pagamento de pedido (`/finalizar-compra/order-pay/…`);
  - pelo botão "Pagar" em "Minha conta → Pedidos".
- **Evidência.** Auditoria, P02 e P03, que apontou quatro caminhos.
  - Os dois que estavam no site novo foram eliminados neste projeto: o envio do produto sem JavaScript ao checkout e o redirecionamento do carrinho com a loja indisponível. Os dois passaram a levar ao WhatsApp.
  - O teste `paginas.spec.ts` ("nenhum caminho para pagamento") varre todas as páginas e scripts do build.
  - Os outros dois são do WordPress: o "Pagar" de "Minha conta" e o `/checkout` da Store API. Ficam cobertos pelo plugin e pelo nginx abaixo.
- **Risco.** O mesmo do item 1.
- **Ação.**
  - Item 1.
  - Plugin `msserver-orcamento`.
  - As regras de nginx de `docs/nginx/msserver-site.conf`, na seção "Bloqueios de pagamento".
- **Dependência.** Autorização para instalar o plugin e aplicar o nginx.
- **Responsável.** Administrador do WordPress e administrador do servidor.
- **Validação.** `node scripts/verificar-roteamento.mjs <domínio>`: as verificações "checkout recusa POST" e "nenhum meio de pagamento".

## 3. HTTP sem redirecionamento nas páginas internas

- **Problema.** A home redireciona `http://` para `https://`, mas as páginas internas respondem 200 por `http://`.
- **Evidência.** `curl -I http://msserver.com.br/sobre/` → 200, sem `Location`. Houve um 503 intermitente na auditoria.
- **Risco.**
  - Dados de formulário e cookies de sessão trafegam sem criptografia.
  - Conteúdo duplicado para os buscadores.
- **Ação.**
  - No nginx: `server { listen 80; return 301 https://$host$request_uri; }` para todo o domínio, como está no exemplo.
  - Depois, o cabeçalho HSTS (item 6).
- **Dependência.** Acesso ao servidor.
- **Responsável.** Administrador do servidor.
- **Validação.** `curl -I http://msserver.com.br/sobre/` → 301 para `https://msserver.com.br/sobre/`. O verificador de roteamento também confere.

## 4. Extensões defasadas

- **Problema.** Versões antigas e visíveis, entre elas:
  - WooCommerce 8.2.5 (de 2023), sobre o WordPress 7.1.2;
  - All in One SEO 4.5.7.3;
  - Contact Form 7 5.8.2;
  - Essential Addons 5.8.10;
  - ElementsKit Lite 3.0.2.
- **Evidência.** Os números de versão estão nos endereços dos arquivos públicos e no `readme.txt` dos plugins (auditoria, seção E.3). Não foram consultadas bases de vulnerabilidade com dados do site.
- **Risco.** Falhas conhecidas corrigidas em versões novas, ainda abertas aqui.
- **Ação.**
  1. Faça backup completo (arquivos e banco).
  2. Numa cópia de homologação, atualize um plugin por vez, começando pelo WooCommerce. Teste: catálogo, Store API do carrinho, formulários do Elementor, suporte (Awesome Support) e a landing de Servidores Físicos.
  3. Repita em produção, numa janela de baixo movimento.
  4. Remova os plugins inativos.
- **Dependência.** Homologação do WordPress e backup.
- **Responsável.** Administrador do WordPress.
- **Validação.**
  - *Painel → Atualizações* sem pendências.
  - `npm run validate:data -- --online` e a suíte E2E continuam passando, porque a Store API mantém o formato.

> **Atenção, atualização do WooCommerce.** O site novo depende da Store API `wc/store/v1`: carrinho, adicionar item e nonce. Ela é estável entre as versões 8 e 9, mas confira o carrinho em homologação depois de atualizar.

## 5. Usuários expostos na REST API

- **Problema.** `GET /wp-json/wp/v2/users` lista os usuários do WordPress com o nome de login (slug).
- **Evidência.** Em 17/11/2026, a resposta foi 200 com 2 usuários. Os nomes não são reproduzidos aqui.
  - O nome de login de um deles também aparece nos endereços de autor (`/author/…/`) e nos dados estruturados que o All in One SEO publica nas postagens antigas.
  - O site novo copia esses dados estruturados sem alteração (`src/data/blog.json`).
- **Risco.** Facilita ataques de força bruta ao `wp-login.php`.
- **Ação.** Restringir o endpoint a usuários autenticados, de uma destas formas:
  - com um plugin de segurança;
  - com um filtro `rest_endpoints` num plugin próprio;
  - com `location ~ ^/wp-json/wp/v2/users { return 403; }` no nginx, depois de conferir que nenhum plugin público usa o endpoint.

  Também convém:
  - ativar a autenticação em dois fatores;
  - limitar as tentativas de login;
  - tirar o login dos endereços e dos dados estruturados:
    - **Nome exibido:** em *Usuários → Perfil*, escolha em "Exibir nome publicamente como" um nome diferente do login.
    - **Endereço de autor** (`/author/…/`): usa o `user_nicename`, que por padrão é o login e não muda pelo painel. Altere com um plugin de segurança ou pelo administrador do banco, ou desative os arquivos de autor no All in One SEO.
    - Depois, rode `npm run sync:blog`.
- **Dependência.** Acesso ao painel ou ao servidor.
- **Responsável.** Administrador do WordPress.
- **Validação.** `curl https://msserver.com.br/wp-json/wp/v2/users` → 401 ou 403 (deslogado).

## 6. Cabeçalhos de segurança e cookie de sessão

- **Problema.**
  - Não há HSTS, `X-Content-Type-Options`, `X-Frame-Options` nem `Referrer-Policy`.
  - O cookie `PHPSESSID` é criado em todas as páginas, sem `Secure` e sem `HttpOnly`.
- **Evidência.** Cabeçalhos das respostas de `https://msserver.com.br/` (auditoria, E.2).
- **Risco.** Clickjacking, interpretação errada de tipos de arquivo e sessão exposta por HTTP.
- **Ação.**
  - **Cabeçalhos:** os do exemplo de nginx (`docs/nginx/msserver-site.conf`). Ligue o HSTS só **depois** do item 3, primeiro com `max-age` curto.
  - **PHPSESSID:** identifique qual plugin abre a sessão PHP. Ajuste `session.cookie_secure=1` e `session.cookie_httponly=1` no PHP, ou corrija o plugin.
  - **Content-Security-Policy:** fica para uma etapa própria, porque o Elementor e as ferramentas de medição exigem uma lista grande de origens.
- **Dependência.** Acesso ao servidor.
- **Responsável.** Administrador do servidor.
- **Validação.** `curl -I https://msserver.com.br/` mostra os cabeçalhos, e o `PHPSESSID` tem `Secure; HttpOnly`.

## 7. Namespace REST `soro/v1` (investigar, não remover)

- **Problema.** Há um namespace de API não identificado no WordPress.
- **Evidência** (17/11/2026, só GET):
  - `GET /wp-json/soro/v1` lista cinco rotas:
    - `/soro/v1/publish` (POST);
    - `/soro/v1/verify` (GET);
    - `/soro/v1/setup-indexnow` (POST);
    - `/soro/v1/indexnow-status` (GET);
    - a raiz.
  - `GET /verify` e `GET /indexnow-status` respondem **401** ("Sorry, you are not allowed to do that"), ou seja, exigem autenticação.
  - As postagens do blog são publicadas **a cada 2 ou 3 dias, por volta da meia-noite, com `author: 0`** (sem autor do WordPress). Exemplos: 8484 em 17/11 às 00:01, 8482 em 14/11 às 23:54, 8480 em 13/11 às 00:02. É o padrão de uma publicação automática por API.
- **Conclusão provável.** É a integração de uma ferramenta externa de conteúdo, que publica os artigos do blog e avisa os buscadores pelo IndexNow. **Removê-la pode interromper o blog.** Por isso não foi bloqueada, nem no nginx de exemplo.
- **Risco.**
  - Se a autenticação de `publish` for fraca, terceiros poderiam publicar conteúdo. Isso não foi testado: exigiria um POST.
  - Plugin de origem desconhecida, sem atualização conhecida.
- **Ação.**
  1. No painel, procure em *Plugins* (e em `wp-content/plugins` e `mu-plugins`) o que registra `soro`.
  2. Confirme com o marketing qual ferramenta publica o blog e se ela ainda é contratada.
  3. Se for legítima: mantenha, troque a chave de API ou o token da integração e registre o fornecedor.
  4. Se não for reconhecida: desative-a em homologação, observe se o blog para de receber postagens e decida.
- **Dependência.** Acesso ao painel e ao marketing.
- **Responsável.** Marketing e administrador do WordPress.
- **Validação.** O fornecedor está identificado e documentado. `POST /wp-json/soro/v1/publish` sem credencial responde 401: o teste deve ser feito pelo administrador, em homologação.

> **Efeito no site novo.** Postagens novas aparecem no WordPress na hora. No site novo, entram no próximo build (`sync:blog`). Enquanto isso, o endereço da postagem continua servido pelo WordPress, porque o roteamento só serve as rotas da lista do build. O workflow diário (`docs/DEPLOY.md`) reduz essa janela.

## 8. XML-RPC ativo

- **Problema.** `/xmlrpc.php` está habilitado.
- **Evidência.** `GET /xmlrpc.php` → 405, "XML-RPC server accepts POST requests only.", em 17/11/2026.
- **Risco.** Força bruta com várias senhas por requisição (`system.multicall`) e pingbacks.
- **Ação.**
  - Confirme que nenhum serviço usa XML-RPC: aplicativo do WordPress, Jetpack (o namespace `jetpack/v4` existe) ou a ferramenta do item 7.
  - Se nenhum usar, bloqueie: `location = /xmlrpc.php { return 403; }`, ou desligue por plugin de segurança.
- **Dependência.** Confirmar o uso.
- **Responsável.** Administrador do WordPress.
- **Validação.** `POST /xmlrpc.php` → 403, e o blog e o Jetpack continuam funcionando.

## 9. `readme.html` e versões visíveis

- **Problema.** `/readme.html` é público e mostra a versão do WordPress. As versões dos plugins aparecem nos endereços dos arquivos.
- **Evidência.** `GET /readme.html` → 200, em 17/11/2026.
- **Risco.** Baixo: facilita mirar falhas conhecidas.
- **Ação.**
  - `location = /readme.html { return 404; }` (e `license.txt`).
  - Manter as versões atualizadas (item 4) é o que realmente resolve.
- **Responsável.** Administrador do servidor.
- **Validação.** `GET /readme.html` → 404.

## 10. Pedido de teste no WooCommerce

- **Problema.** Existe um pedido de teste, "TESTE NOVA FINALIZACAO – NAO PROCESSAR", de 12/11/2026, criado numa etapa anterior.
- **Evidência.** Auditoria, P11.
- **Risco.** Distorce relatórios e pode ser processado por engano.
- **Ação.** No painel, *WooCommerce → Pedidos*, conferir e **cancelar**. Excluir só com autorização: este projeto não exclui pedidos.
- **Responsável.** Administrador do WooCommerce.
- **Validação.** O pedido aparece como "Cancelado".

## 11. Páginas sem finalidade, comentários e idioma

- **Problema.**
  - `/teste/` e `/pagina-exemplo/` estão publicadas e no sitemap.
  - Os comentários estão abertos nas postagens, sem nenhum comentário publicado.
  - O idioma do WordPress é inglês.
- **Risco.** Spam de comentários e páginas indevidas no Google. As telas de login ficam em inglês.
- **Ação.**
  - Despublicar as duas páginas, com autorização: este projeto não despublica conteúdo.
  - *Configurações → Discussão*: desmarcar "Permitir comentários em novos posts" e fechar os existentes, se for a decisão.
  - Mudar o idioma para Português do Brasil (`docs/SUPORTE.md`).
- **Responsável.** Marketing e administrador do WordPress.
- **Validação.** As páginas respondem 404 ou 301. O formulário de comentário não aparece. O `wp-login.php` está em português.

## 12. Certificado HTTPS

- **Problema.** Não foi possível verificar de fora a renovação automática. O HTTPS já ficou fora do ar numa etapa anterior: o README orientava sincronizar por `WP_ORIGIN=http://…`. Hoje o certificado é aceito.
- **Ação.** Confirmar a data de expiração e a renovação automática (certbot ou painel da hospedagem), com um alerta de vencimento.
- **Responsável.** Administrador do servidor ou da hospedagem.
- **Validação.**
  - `openssl s_client -connect msserver.com.br:443 -servername msserver.com.br | openssl x509 -noout -dates`.
  - Renovação testada com `certbot renew --dry-run`, se for o caso.

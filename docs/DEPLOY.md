# Build, homologação e publicação

Este documento descreve como gerar uma versão do site, conferir e homologar. A publicação no domínio principal é decisão da MSSERVER: **nada aqui publica automaticamente.**

## 1. Requisitos

- **Node.js 22.23.4** ou superior (`engines` do `package.json`) e npm.
- **Git**, usado pela etapa da landing de Soluções Cloud, que baixa o repositório público `NicolasUxSilva/cloud-ms`.
- **Navegador para os testes:** Chromium do Playwright (`npx playwright install chromium`) ou um já instalado, com `PW_CHROMIUM=/caminho/do/chromium`.
- **Acesso de leitura a `https://msserver.com.br`** (API pública do WooCommerce e REST API do WordPress), para sincronizar e validar os dados.

## 2. Variáveis de ambiente

As variáveis estão modeladas em `.env.example`. As que começam com `PUBLIC_` vão para o navegador; as demais ficam só no build.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PUBLIC_TRACKING` | `false` | `true` inclui o aviso de cookies e as ferramentas de medição: GTM `GTM-KTDRRP3`, Google Ads `AW-715484072`, Meta Pixel, Clarity e RD Station. Cada ferramenta carrega só depois do consentimento da sua categoria. **Ligar somente no build de produção, com autorização** (`docs/TRACKING.md`, `docs/PRIVACIDADE.md`). |
| `PUBLIC_NOINDEX` | `false` | `true` aplica `noindex` em todas as páginas e no `robots.txt` (`Disallow: /`). Também é repassada à landing de Soluções Cloud. **Use `true` em homologação e em previews.** |
| `PUBLIC_STORE_API` | `/wp-json/wc/store/v1` | Store API do WooCommerce usada pelo carrinho, pela finalização e pelo botão "Orçamento" do produto. O caminho relativo é o correto em produção: a sessão do carrinho é o cookie do WordPress, no mesmo domínio. |
| `PUBLIC_QUOTE_ENDPOINT` | `https://msserver.com.br/wp-admin/admin-ajax.php` | Para onde os formulários do Elementor enviam (Orçamento e soluções). |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | vazias | Avaliações do Google em "Sobre nós" (só no build). Sem elas, o build mantém `src/data/google-reviews.json` como está. |
| `CLOUD_GTM_ID` | vazia | GTM da landing de Soluções Cloud. Fica vazia de propósito: a landing carrega o GTM sem consultar o consentimento deste site (`docs/PRIVACIDADE.md`). |
| `WP_ORIGIN` | `https://msserver.com.br` | De onde os scripts de sincronização leem os dados. Use `http://msserver.com.br` quando o HTTPS estiver fora do ar. |
| `BASE_PATH` | `/` | Para gerar o site num subcaminho (preview). Em produção, deixe vazio. |

Nenhuma credencial do WordPress é necessária: a sincronização lê apenas dados públicos.

## 3. Fluxo de uma versão

```bash
npm ci
```

```bash
npm run release
```

`npm run release` executa, em ordem, e para no primeiro erro:

1. **`npm run sync:all`**: sincroniza os dados do WordPress.
   - Produtos da home (`sync`).
   - Catálogo e páginas de produto (`sync:catalog`).
   - Blog (`sync:blog`).
   - Avaliações do Google (`sync:reviews`, opcional).
2. **`node scripts/validate-data.mjs --online`**:
   - confere a coerência dos arquivos;
   - compara com o que está publicado agora: produtos, preços, estoque, slugs, total de postagens e postagem mais recente.
3. **`npm run build`**: `astro check`, `astro build`, a landing de Soluções Cloud (`scripts/landing-cloud.mjs`) e a lista de rotas (`scripts/routes.mjs`, que gera `dist/_rotas/`).
4. **`npm run test:e2e`**: a suíte Playwright completa, em desktop e celular.
5. **`npm run build:suporte`**: gera `dist-plugins/msserver-suporte.zip` (plugin do suporte, com a casca gerada no build).

O resultado é `dist/`, uma pasta estática, mais o zip do plugin.

**Diferenças de dados.** Se o WordPress mudou durante o processo, por exemplo se um produto foi editado, rode o release de novo. Se o validador apontar diferença de contagem numa categoria, a sincronização do catálogo para sem gravar; investigue no WooCommerce.

### Atualização automática dos dados (proposta)

`.github/workflows/atualizacao-dados.yml` roda todo dia às 06:17 de Brasília e também pode ser disparado à mão. Ele:
- sincroniza e valida;
- roda `astro check`, o build e a suíte de testes;
- **abre um pull request** com os dados novos.

Ele **não publica**. Para funcionar, o repositório precisa permitir que o GitHub Actions abra pull requests: em *Settings → Actions → General*, a opção "Allow GitHub Actions to create and approve pull requests".

## 4. Homologação

1. Gere o build com `PUBLIC_NOINDEX=true` e `PUBLIC_TRACKING=false`.
2. Publique numa pasta do servidor de homologação e aplique o roteamento de `docs/ROTEAMENTO.md` a um domínio de homologação que use o mesmo WordPress (ou uma cópia).
3. Instale, no WordPress de homologação, os plugins `msserver-suporte` e `msserver-orcamento` (`docs/SUPORTE.md`, `docs/SEGURANCA-WORDPRESS.md`).
4. Rode o verificador:

   ```bash
   node scripts/verificar-roteamento.mjs https://homologacao.msserver.com.br
   ```

5. Siga o roteiro de `docs/HOMOLOGACAO.md`.

**Preview na Vercel (`msserver-home.vercel.app`).** Serve para avaliar o visual. Como não está no domínio da loja:
- o carrinho e a finalização mostram "loja indisponível";
- os formulários avisam que não conseguem enviar.

Esse comportamento é esperado.

## 5. Publicação (somente com autorização)

1. Faça um **backup**: a configuração atual do nginx, os arquivos do WordPress e o banco.
2. Gere o build de produção:

   ```bash
   PUBLIC_NOINDEX=false PUBLIC_TRACKING=true npm run release
   ```

   Use `PUBLIC_TRACKING=true` somente se o rastreamento e a política de privacidade estiverem aprovados. Sem aprovação, use `false`: o site funciona sem medição e sem aviso de cookies.
3. Copie `dist/` para `/var/www/msserver-site/releases/AAAA-MM-DD-HHMM/`.
4. Aponte o link `current` para essa pasta.
5. Aplique (ou confirme) a configuração de `docs/nginx/msserver-site.conf`. Rode `nginx -t` e depois `systemctl reload nginx`.
6. Rode o verificador contra `https://msserver.com.br` e o roteiro curto de `docs/HOMOLOGACAO.md` (seção 9).
7. **Depois da publicação:**
   - envie o sitemap do site (`/sitemap-site.xml`) no Search Console;
   - acompanhe os erros 404 e a cobertura por duas semanas.

## 6. Plano de volta

| Situação | Ação |
| --- | --- |
| Problema numa página do site novo | Aponte `current` para a pasta da versão anterior e dê `reload`. |
| Problema no roteamento | Comente o bloco `if ($msserver_novo) { … }` em `location /` e dê `reload`. O domínio volta a ser 100% WordPress. |
| Problema no suporte | Desative o plugin `msserver-suporte`. As páginas voltam ao tema atual. |
| Problema no bloqueio de pagamento | Desative o plugin `msserver-orcamento`. Volta o comportamento atual do WooCommerce, com o gateway. |

Nenhuma etapa da publicação altera conteúdo do WordPress, então a volta não perde dados.

## 7. O que depende de terceiros

| Item | Depende de |
| --- | --- |
| Aplicar o nginx | Administrador do servidor (`docs/ROTEAMENTO.md`) |
| Instalar os plugins | Administrador do WordPress |
| Ligar o rastreamento | Aprovação da MSSERVER e do jurídico; mapeamento no GTM (`docs/TRACKING.md`) |
| Publicar a política de privacidade | Texto aprovado pelo jurídico (`docs/PRIVACIDADE.md`) |
| Workflow de dados | Permissão no GitHub (seção 3) |
| Avaliações do Google | Chave da Places API e Place ID |

A lista completa, com procedimento e critério de validação de cada item, está em `docs/PENDENCIAS-EXTERNAS.md`.

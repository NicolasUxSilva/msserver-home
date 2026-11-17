# Política de privacidade e consentimento de cookies

## 1. O que está pronto e o que depende de aprovação

| Item | Estado |
| --- | --- |
| Página `/politica-de-privacidade/` | **Estrutura pronta.** As seções têm títulos, mas o conteúdo está marcado como pendente (`[Conteúdo jurídico pendente de aprovação]`). A página mostra um aviso de "em preparação" e sai com `noindex`. Não afirma conformidade com a LGPD. |
| Texto jurídico | **Pendente.** Precisa ser redigido ou aprovado pelo jurídico da MSSERVER. Nenhum texto foi inventado. |
| Inventário técnico das tecnologias | **Pronto** (`TECHNOLOGIES` em `src/data/privacidade.ts`). São fatos da implementação, exibidos na seção "Cookies", para orientar a redação. |
| Aviso de cookies | **Pronto, aparece só com `PUBLIC_TRACKING=true`.** Sem rastreamento, o site só usa armazenamento necessário e não mostra aviso. |
| Link nos formulários | **Pronto** ("Consulte a Política de privacidade") no Orçamento, nos formulários das soluções, no configurador da Nuvem Privada e na finalização. |
| Link no rodapé | **Pronto**, junto com "Preferências de cookies", que só aparece com rastreamento. |

## 2. Como publicar o texto aprovado

1. Em `src/data/privacidade.ts`, preencha o `body` de cada seção (HTML simples: `<p>`, `<ul>`, `<a>`).
   - As seções seguem a estrutura usual: controlador, dados coletados, finalidades, bases legais, compartilhamento, cookies, direitos do titular, retenção, segurança, encarregado e alterações.
   - Seções podem ser renomeadas, incluídas ou removidas conforme o texto aprovado.
2. Preencha `updatedAt` com a data da versão aprovada e mude `approved` para `true`.
3. Com `approved: true`, a página:
   - deixa de mostrar o aviso de "em preparação";
   - mostra a data da versão;
   - passa a ser indexável.
4. Revise os textos do aviso de cookies (`CONSENT_TEXT`), que também dependem de aprovação.
5. Rode `npm run build` e `npm run test:e2e`.
   - O teste "política de privacidade" confere a estrutura.
   - Com `approved: true`, ajuste nesse teste a expectativa de `noindex`.

Hoje o WordPress não tem página nesse endereço: `/politica-de-privacidade/` respondeu 404 em 17/11/2026. O endereço passa a ser servido pelo site novo (`docs/ROTEAMENTO.md`).

## 3. Consentimento: o que o site faz

- **Antes da escolha, nada de rastreamento.** Só o armazenamento necessário funciona: o cookie do carrinho do WooCommerce, o `localStorage` e o `sessionStorage` do próprio site, e o login do suporte.
- **Consent Mode v2** com todos os sinais em `denied` até a escolha (`docs/TRACKING.md`).
- **Categorias:**
  - **Necessários:** sempre ativos.
  - **Análise:** GTM e Clarity.
  - **Publicidade:** Google Ads, Meta Pixel e RD Station.

  A classificação é uma **proposta técnica**. A final depende do jurídico. Para mudar, edite `CONSENT.categories` em `src/config/site.ts` e incremente `CONSENT.version`: todos os visitantes escolhem de novo.
- **Recusar é tão fácil quanto aceitar.** "Só os necessários" fica na primeira camada do aviso, ao lado de "Aceitar todos" e com o mesmo tamanho. "Aceitar todos" tem a cor de destaque; se o jurídico pedir o mesmo destaque visual para os dois, troque a classe em `src/components/CookieConsent.astro`.
- **A escolha pode ser revista** pelo link "Preferências de cookies", no rodapé. Retirar um consentimento recarrega a página, para descarregar as ferramentas.
- **Vídeos do YouTube:**
  - nas soluções, só carregam quando a pessoa clica para assistir (capa estática antes do clique);
  - na home, o player carrega quando a seção se aproxima da tela, como no WordPress hoje (`src/components/VideoSection.astro`);
  - nos artigos do blog, os vídeos incorporados no WordPress continuam como `iframe` do YouTube (carregamento preguiçoso), como no site atual. Se o jurídico pedir, troque para `youtube-nocookie.com` ou para capa com clique (`src/lib/post-html.ts`).

## 4. Pontos de atenção para o jurídico e para o marketing

1. **Landing de Soluções Cloud.** A versão aprovada (`cloud-ms`) carrega o GTM sem consultar o consentimento deste site. Por isso, o build publica a landing **sem GTM** (`CLOUD_GTM_ID` vazio). Para medir a landing, é preciso:
   - adaptar a landing para ler a escolha guardada em `localStorage` (`msserver:consent`);
   - ou aceitar o carregamento direto, com decisão jurídica documentada.
2. **Landing de Servidores Físicos e páginas do WordPress.** Continuam com os scripts atuais do WordPress, sem gestor de consentimento. O mesmo aviso precisa ser instalado no WordPress (plugin de consentimento ou o mesmo script), para que o domínio inteiro tenha uma política só.
3. **RD Station.** O loader exibe um pop-up de conversão no celular. Com o consentimento, ele volta a aparecer como hoje.
4. **Formulários.** Os dados enviados vão para o WordPress (Elementor). Quem recebe, por quanto tempo os dados ficam guardados e as integrações (e-mail, RD Station) estão configurados no WordPress e devem constar da política.
5. **Finalização pelo WhatsApp.** Os dados de contato digitados ficam na sessão do navegador (`sessionStorage`) até a aba ser fechada, e vão na mensagem do WhatsApp que a própria pessoa envia. O site não grava esses dados em servidor.

# Landings integradas: Servidores Físicos e Soluções Cloud

As duas landings aprovadas foram desenvolvidas em repositórios próprios e agora são **páginas nativas do site**. Elas usam:
- o cabeçalho, o rodapé, o layout, o consentimento e os scripts gerais do site;
- as seções, os textos, as imagens, as animações, o simulador e os CTAs aprovados, sem alteração.

Não há `iframe` nem cópia de build.

| Página | Endereço | Origem (versão aprovada) |
| --- | --- | --- |
| Servidores Físicos | `/servidores-fisicos/` | `NicolasUxSilva/landins-servidores-fisicos`, commit `a8439e1`. É a mesma versão publicada hoje no WordPress pelo plugin `msserver-landing-servidores-fisicos`. |
| Soluções Cloud | `/solucoes-cloud/` | `NicolasUxSilva/cloud-ms`, commit `3199d6f` (o preview aprovado `cloud-ms-beige.vercel.app`). Até 17/11/2026, o build dessa landing era copiado para `dist/solucoes-cloud/` por `scripts/landing-cloud.mjs`, que foi removido. |

Os endereços são os já publicados, sem redirecionamentos.

## 1. Onde está cada parte

| Parte | Arquivos |
| --- | --- |
| Páginas | `src/pages/servidores-fisicos/index.astro`, `src/pages/solucoes-cloud/index.astro`. Mesma composição do `index.astro` de cada repositório, com o `Header` e o `Footer` do site. |
| Seções | `src/components/landings/servidores-fisicos/`: Hero, OfertaFisicos, Differentiators, Catalog, Process, Proof, Faq, FinalCta, ServerIllustration. `src/components/landings/solucoes-cloud/`: Hero, Challenges, Support, Solutions, Simulator, Differentiators, Process, Proof, Faq, FinalCta, CloudIllustration. `src/components/landings/ClientLogos.astro` é idêntico nas duas e fica compartilhado. |
| Simulador de Cloud | `src/scripts/landings/cloud-simulator/` (opções, regras, resumo, interface e eventos) e `src/styles/landings/cloud-simulator.css`, carregado só em `/solucoes-cloud/` |
| Dados | `src/data/landings/servidores-fisicos/`: `site.ts`, `content.ts`, `catalog.json` e `catalog.ts`, `featured.ts`, `platform-map.json`. `src/data/landings/solucoes-cloud/`: `site.ts`, `content.ts`, `cloud.ts`. `src/data/landings/clients.json` é compartilhado. |
| Imagens | `src/assets/landings/`: logos dos clientes e foto da equipe, compartilhados; fotos dos modelos em `servidores-fisicos/products/`. `public/og-servidores-dedicados.jpg` e `public/og-cloud-msserver.jpg` são as imagens de compartilhamento. |
| Estilos de preservação | `src/styles/landings/landing.css` (seção 3) |
| Botão flutuante | `src/scripts/landings/fab.ts`: o comportamento original de cada landing |
| Sincronização | `scripts/sync-servidores-fisicos.mjs`: o script de catálogo da landing |
| Testes | `tests/e2e/servidores-fisicos.spec.ts`, `solucoes-cloud.spec.ts`, `solucoes-cloud-simulador.spec.ts` e `solucoes-cloud-helpers.ts`; testes de unidade em `tests/unit/` (vitest, como nos repositórios) |

Os arquivos de seção, simulador, estilos do simulador e testes são **cópias dos originais com apenas os caminhos de importação trocados**. Isso foi conferido com `diff`, ignorando as linhas de importação: idênticos.

## 2. Cabeçalho e rodapé

- **Componentes:** as duas páginas usam `src/components/Header.astro` e `src/components/Footer.astro`, os mesmos de todas as páginas do site. O `Header.astro` e o `Footer.astro` das landings não foram trazidos.
- **Composição:** o cabeçalho do site tem a mesma altura do das landings (`--header-h: 72px`), o mesmo comportamento fixo no topo e o mesmo fundo. Por isso a abertura de cada landing fica na mesma posição e no mesmo alinhamento, sem nenhum ajuste.
- **Página atual:** o menu marca a página atual (`current`), como nas páginas de soluções. "Soluções" leva às duas landings.
- **Estilos:** cabeçalho e rodapé ficam fora do `<main class="lp">`, com os estilos do site. Os estilos de cada seção das landings ficam isolados nos componentes (CSS com escopo do Astro). Não há regras globais vindas das landings, além de `cloud-simulator.css`, cujas classes são as do simulador e que só é carregado na página de Cloud.
- **Scripts:** o `page.ts` das landings (cabeçalho, menu móvel, entradas e cliques medidos) foi substituído pelo do site, que faz o mesmo com os mesmos atributos (`data-reveal`, `data-track`). Fica só o botão flutuante próprio (`fab.ts`).

O que saiu junto com o cabeçalho e o rodapé próprios:
- a navegação por âncoras (Servidores Físicos: Para que serve, Diferenciais, Modelos, Dúvidas; Cloud: Soluções, Simulador, Diferenciais, Implantação, Dúvidas);
- os botões do cabeçalho: "Falar no WhatsApp"; e, no Cloud, "Falar com especialista" e "Avaliar meu ambiente";
- o WhatsApp do menu móvel;
- o rodapé próprio, com o link "Versão para Portugal" (`/servidores-dedicados-para-empresas-pt/`) na de Servidores Físicos;
- as notas do rodapé próprio:
  - Servidores Físicos: "Preços e condições sujeitos a alteração e à disponibilidade de estoque.";
  - Cloud: "O simulador gera um levantamento preliminar. Valores e condições são definidos na proposta comercial.".

  O sentido delas continua na página: a nota do catálogo de modelos ("…confirmados na proposta, conforme estoque") e, no Cloud, o aviso do simulador ("Sem preço calculado… levantamento preliminar") e a resposta das dúvidas.

As mesmas ações continuam na página: o WhatsApp do hero, do botão flutuante e das seções, e "Avaliar minha infraestrutura" no hero do Cloud. Se a MSSERVER quiser a navegação por seções de volta, ela pode virar uma faixa abaixo do cabeçalho do site, em uma etapa própria.

## 3. Preservação visual: `landing.css`

As landings foram feitas sobre o `global.css`, que é o mesmo do site. O `site.css` (camada do site, carregada em todas as páginas) muda quatro padrões que as seções das landings usam:
1. **Rótulos `.eyebrow`:** Inter e linha animada, no lugar de JetBrains Mono e linha fixa.
2. **Botão principal:** sombra extra.
3. **Botão de contorno:** fundo branco e elevação no hover.
4. **Foco e clique:** botões que encolhem ao clicar e foco com raio de 12 px.

Sem compensação, as landings mudariam nesses pontos. `src/styles/landings/landing.css` devolve os valores do `global.css` **só dentro de `<main class="lp">`**:
- com `:where(.lp)`, a especificidade fica igual à do `site.css`, e a regra vale por vir depois;
- os estilos próprios das seções continuam valendo, como no original;
- o cabeçalho, o rodapé e as demais páginas do site não mudam.

## 4. Comparação visual com os originais (18/11/2026)

**Método:**
- **O que foi comparado:** os builds dos dois repositórios, nos commits aprovados, servidos lado a lado com as páginas integradas.
- **Larguras:** 390, 768, 1024 e 1440 px.
- **Captura:** cada elemento do `<main>`, com redução de movimento para as entradas animadas terminarem, o botão flutuante oculto e o cabeçalho sem posição fixa, para não cobrir as seções.
- **Comparação:** pixel a pixel.

**Resultado:**
- **80 seções visíveis** (Servidores Físicos 9 × 4 larguras; Cloud 11 × 4) com **as mesmas dimensões e idênticas pixel a pixel**, sem nenhuma diferença.
- Os 8 elementos ocultos (os painéis fechados do simulador) estão ocultos nos dois.
- A diferença visual entre original e integrada é só o cabeçalho e o rodapé.
- A altura do `<main>` é a mesma em todas as larguras, sem rolagem lateral nas duas versões.
- **Estados de interação**, para cobrir o que a captura parada não mostra: os estilos calculados de todos os botões visíveis do conteúdo, parados e com o mouse em cima (fundo, sombra, deslocamento, borda, cor e fonte), e de todos os rótulos `.eyebrow` são **idênticos** aos originais. São 10 botões e 6 rótulos em Servidores Físicos, e 12 botões e 8 rótulos em Cloud.

Os scripts da comparação não fazem parte do projeto. O procedimento para repetir está na seção 8.

## 5. Adaptações técnicas (todas as diferenças em relação aos repositórios)

| O quê | Por quê |
| --- | --- |
| Caminhos de importação | Nova organização das pastas |
| `src/data/landings/*/site.ts` só com `SITE`, `CONTACT`, `SOCIAL`, `WA` e `whatsappUrl`, com os mesmos valores | `LINKS`, `APP_STORES` e `ANALYTICS` eram usados só pelo cabeçalho, pelo rodapé e pelo layout próprios |
| Canonicals | Servidores Físicos: `https://msserver.com.br/servidores-fisicos/`, o mesmo da versão no ar (o repositório apontava para `/servidores-dedicados-para-empresas/`). Cloud: `https://msserver.com.br/solucoes-cloud/`, definido na etapa anterior (o repositório saía sem canonical e com `noindex`). As duas são indexáveis (`index, follow, max-image-preview:large`). |
| `hreflang` pt-PT (repositório de Servidores Físicos) | Não incluído: a versão publicada hoje também não tem, e o par PT é uma landing antiga do WordPress |
| Links para páginas que já existem no site | "Como funciona a extensão" → `/extencao-de-garantia/`. "Saiba mais" de Nuvem privada → `/nuvem-privada/`, e de Híbrida e multicloud → `/consultoria-em-implantacao-de-servidores/`. "Conheça o backup em nuvem" → `/backup-em-nuvem/`. Mesmos destinos, agora internos e sem o redirecionamento da URL sem barra. |
| "Saiba mais" de "Servidor dedicado em data center" | **Mantido** em `https://msserver.com.br/servidores-dedicados/`, a página do WordPress. É a oferta de hospedagem em data center, diferente da venda de servidores físicos. Ver `docs/ROTEAMENTO.md`, seção 4. |
| Dados estruturados | Os mesmos (Organização e FAQ). O layout do site publica um bloco `ld+json` por item. |
| `og:site_name` | O do site, igual em todas as páginas. A imagem, o título, a descrição e o tamanho da imagem são os da landing. |
| Botão flutuante | O mesmo, com o mesmo comportamento. Agora fica dentro de uma região identificada para leitores de tela e usa `data-lp-fab`, para não receber o comportamento do botão do site, que aparece logo ao abrir. |
| `analytics.ts` do simulador | Tipo do `dataLayer` alinhado ao do site (`unknown[]`). Só tipagem, sem mudança de comportamento. |
| Rastreamento | O GTM próprio das landings (`PUBLIC_GTM_ID`) saiu. As páginas seguem o rastreamento do site: `PUBLIC_TRACKING` e o consentimento. Os eventos de clique (`contact_whatsapp_click`, `cta_click`) e do simulador (`simulation_*`) continuam no `dataLayer`. Ver `docs/TRACKING.md`. |

## 6. Dados

- **Catálogo próprio de Servidores Físicos** (`catalog.json`, com preços e variações): continua com o snapshot aprovado (26/10/2026).
  - É atualizado pelo script da própria landing (`npm run sync:servidores-fisicos`, incluído em `npm run sync:all`).
  - `scripts/validate-data.mjs` confere que os 6 modelos em destaque têm preço e o mesmo "a partir de" do catálogo do site. Em 18/11/2026, os 6 conferem.
  - Quando o release rodar a sincronização, a data "Preços publicados em msserver.com.br em …" passa a ser a do dia.
- **Cloud:** não tem dados externos. O configurador usa as opções de `cloud.ts`, publicadas pela MSSERVER.

## 7. Testes

- **Unidade (vitest):** os testes dos dois repositórios, idênticos exceto pelas importações. Cobrem as regras do simulador, as opções, o resumo, as mensagens de WhatsApp, o catálogo e o conteúdo.
- **E2E:** os testes dos repositórios, nas páginas integradas. As adaptações estão comentadas em cada arquivo:
  - endereço e canonical publicados;
  - CTAs da landing (conteúdo e botão flutuante), já que o cabeçalho e o rodapé são os do site;
  - menu móvel do site;
  - simulador aberto pelo CTA do hero.

  Há também testes novos de integração: cabeçalho e rodapé do site, Soluções sem o Aplicativo de Gestão, links internos, nenhum endereço de preview e o simulador abrindo abaixo do cabeçalho fixo.

## 8. Atualizar a partir dos repositórios originais

Quando uma nova versão de uma landing for aprovada no repositório dela:
1. **Atualize o repositório:** `git pull` no clone e anote o commit.
2. **Copie os arquivos alterados** de `src/components/` (exceto `Header.astro`, `Footer.astro` e `Icon.astro`), `src/data/`, `src/cloud-simulator/` e `src/styles/simulator.css` para as pastas da seção 1. Ajuste só os caminhos de importação, seguindo os arquivos atuais.
3. **Se a landing mudar o `config/site.ts`,** reflita em `src/data/landings/*/site.ts` (`CONTACT`, `WA`) e mantenha o canonical publicado.
4. **Se a landing mudar o `global.css`,** compare com o do site. Hoje são idênticos. Uma diferença precisa ir para `landing.css` (só dentro de `.lp`) ou ser decidida para o site todo.
5. **Rode as verificações:** `npm run build`, `npm run test:unit` e `npm run test:e2e`.
6. **Repita a comparação visual da seção 4:**
   - gere o build do repositório (`npm ci && npx astro build`) e sirva o `dist/`;
   - sirva o `dist/` do site;
   - capture os elementos de `<main>` das duas versões nas quatro larguras e compare.
7. **Atualize** o commit de origem na tabela do início deste documento e nos comentários das páginas.

## 9. Pendências e limitações

- **Plugin do WordPress.** O `msserver-landing-servidores-fisicos` continua instalado e servindo `/servidores-fisicos/` até o roteamento ser aplicado. Depois, o nginx entrega a página do site. O plugin deixa de ser usado, mas **não foi desativado**: é uma decisão da MSSERVER, depois da publicação.
- **Rastreamento.** A versão no ar hoje carrega Meta Pixel, Clarity, gtag (Ads) e GTM sem consentimento. A integrada segue o site: nada carrega sem `PUBLIC_TRACKING=true` e o consentimento. Ao publicar sem rastreamento ligado, essa landing deixa de medir até a decisão de `docs/TRACKING.md`.
- **Navegação por seções e CTAs do cabeçalho** das landings: substituídos pelo cabeçalho do site (seção 2).
- **Link para a versão de Portugal:** estava só no rodapé próprio de Servidores Físicos. Se a MSSERVER quiser manter essa página, defina onde o link deve ficar.
- **Notas de preço dos rodapés próprios** (seção 2): o conteúdo das páginas já diz o mesmo. Se o jurídico ou o comercial quiserem a frase exata, ela pode entrar no fim da chamada final de cada landing, com aprovação, porque muda o conteúdo aprovado.
- **`/servidores-dedicados/`:** a recomendação anterior de redirecioná-la para `/servidores-fisicos/` deve ser revista, porque a landing de Cloud usa essa página para a oferta de servidor dedicado em data center (`docs/ROTEAMENTO.md`).

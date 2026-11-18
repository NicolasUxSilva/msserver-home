# Estado do projeto — 18/11/2026

- **Situação:** pronto para homologação. **Não publicado.**
- **Etapa de conclusão:** branch `conclusao`, a partir de `068f9fe`, levada para a `main` em `0838d37` (17/11/2026).
- **Integração das landings:** branch `integracao-landings`, a partir de `0838d37`, **sem merge na `main`**. As landings de Servidores Físicos e Soluções Cloud passaram a ser páginas nativas do site, e o Aplicativo de Gestão saiu do menu Soluções (seção 0 abaixo e `docs/LANDINGS.md`).
- **Ponto de partida:** a auditoria de 15/11/2026 (`docs/AUDITORIA-2026-11-15.md`).
- **Pendências:** o que depende de terceiros está em `docs/PENDENCIAS-EXTERNAS.md`.

## 0. Integração das landings (18/11/2026)

| Item | Situação |
| --- | --- |
| `/servidores-fisicos/` | Landing aprovada (`landins-servidores-fisicos` a8439e1), nativa, com o cabeçalho e o rodapé do site. Substitui, depois do roteamento, a versão servida pelo plugin do WordPress. |
| `/solucoes-cloud/` | Landing aprovada (`cloud-ms` 3199d6f), nativa, com o simulador. Não é mais a cópia do build. |
| Comparação com os originais | 80 seções visíveis, em 390, 768, 1024 e 1440 px: **idênticas pixel a pixel**. Mesma altura do conteúdo e nenhuma rolagem lateral. |
| Menu Soluções | Seis itens. O Aplicativo de Gestão saiu só do menu: a página, a rota e os links da home continuam. |
| O que saiu com o cabeçalho e o rodapé próprios | Navegação por âncoras, botões de WhatsApp e "Avaliar meu ambiente" do cabeçalho, link "Versão para Portugal" (pendência 24) |

## 1. Decisões de escopo aplicadas

| Tema | Decisão | Onde |
| --- | --- | --- |
| Soluções Cloud | `/solucoes-cloud/` com a versão aprovada (`cloud-ms` 3199d6f), sem alteração; desde 18/11/2026, integrada ao site (`docs/LANDINGS.md`). O menu e o banner da home apontam para ela. Os 301 das URLs antigas estão preparados e documentados, mas não aplicados. | `docs/LANDINGS.md`, `docs/ROTEAMENTO.md` §4 |
| Busca do cabeçalho | No catálogo (`/servidores/?busca=`), com sugestões. Nunca usa a busca do WordPress. | `header-search.ts`, `busca.json` |
| Blog, Cases, Suporte | Blog e Cases reconstruídos com o conteúdo real. Suporte continua no Awesome Support, com a identidade nova via plugin. | `docs/SUPORTE.md` |
| Catálogo | Rack, Torre e Escala Nuvem adicionados. O produto sem categoria e `sem-categoria` ficaram documentados, sem invenção. | `catalog.ts`, pendências 18 |
| 4 soluções | Sem redesenho. Só correções técnicas: overflow da Consultoria e nomes de eventos. Problemas visuais registrados (seção 3). | — |
| Aplicativo de Gestão | Sem alteração. Continua no WordPress. Desde 18/11/2026, fora do menu Soluções (a página e os links da home continuam). | `src/config/site.ts` |
| Jornada comercial | Nenhum caminho para pagamento. Sessão, nonce, variações, quantidades e totais mantidos. Atalho do carrinho com contador. | `docs/PRESERVACAO.md` (fim) |
| 404, privacidade, cookies | 404 própria. Política só com a estrutura, sem texto jurídico. Consentimento que respeita a escolha. | `docs/PRIVACIDADE.md` |
| SEO | `noindex` no carrinho, na finalização, na 404 e na política pendente; canonicals; descrições; OG; JSON-LD; `robots.txt` e `sitemap-site.xml`. Títulos e slugs duplicados **não** foram alterados. | — |
| Dados | Fluxo sincronizar → validar → testar → gerar. Publicação manual e autorizada. Workflow diário que abre PR. | `docs/DEPLOY.md` |
| Medição | Eventos GA4 e GLA no `dataLayer`. `PUBLIC_TRACKING` desligado. Mapeamento no GTM documentado. | `docs/TRACKING.md` |
| Roteamento | Regra completa: GET/HEAD, lista exata e parâmetros do WordPress. Exemplo de nginx testado localmente. | `docs/ROTEAMENTO.md` |
| Segurança do WordPress | Documentada, com o `soro/v1` investigado e não removido. | `docs/SEGURANCA-WORDPRESS.md` |

## 2. Páginas por situação

### Prontas para homologação (site novo)

| Página | Endereço | Observação |
| --- | --- | --- |
| Home | `/` | Banner "Nuvem" → `/solucoes-cloud/`; postagens do blog sincronizadas |
| Sobre nós | `/sobre/` | Avaliações do Google aparecem quando houver chave (pendência 20) |
| Orçamento | `/orcamento/` | Envio real depende de homologação (pendência 4) |
| Catálogo | `/servidores/` e 13 categorias (Dell, HP, IBM, Rack, Torre, Escala Nuvem, Componentes e 6 subcategorias) | Rack, Torre e Escala Nuvem são **novas** |
| Produtos | `/servidor/{slug}/` (74) | Sem a loja, o pedido vai pelo WhatsApp |
| Carrinho | `/carrinho/` | Contador no cabeçalho |
| Finalização de orçamento | `/finalizar-compra/` | `noindex`, sem pagamento |
| Soluções Cloud | `/solucoes-cloud/` | Landing aprovada, nativa, com o simulador (**integrada em 18/11**) |
| Servidores Físicos | `/servidores-fisicos/` | Landing aprovada, nativa (**integrada em 18/11**) |
| Blog | `/blog/`, `/category/{slug}/`, 51 artigos | **Novo** |
| Cases de sucesso | `/cases-de-sucesso/` | **Novo**. Certificações a confirmar (pendência 17). |
| 404 | — | **Nova** |

### Prontas, com ressalva

| Página | Ressalva |
| --- | --- |
| Nuvem Privada, Extensão de Garantia, Backup em Nuvem, Consultoria | Funcionais e testadas, mas visualmente abaixo das referências (seção 3). Redesenho fora deste escopo. |
| Política de privacidade | Só a estrutura. O texto depende do jurídico (pendência 10). Fica com `noindex` até a aprovação. |

### No WordPress, com a identidade nova (dependem de instalação)

| Página | Dependência |
| --- | --- |
| Suporte: `/obter-suporte/`, `/enviar-chamado/`, `/meus-chamados/`, `/ticket/…` | Plugin `msserver-suporte` (pendência 5) |

### Continuam no WordPress, sem alteração

- Aplicativo de Gestão (`/aplicativo-ms-server/`).
- Minha conta.
- Landings antigas e de campanha (pendência 7).
- `/categoria-produto/sem-categoria/`.

## 3. Problemas visuais registrados nas 4 soluções (não corrigidos)

Estes problemas vêm da auditoria (P25) e foram mantidos por decisão de escopo:

- **Linguagem dividida.** Nuvem Privada e Backup abrem escuras, com ilustrações 3D do site original. Garantia e Consultoria abrem claras.
- **Identidade.** Nenhuma das quatro repete a composição editorial das landings de referência: fundo claro, cartão de especificação, grifo e faixa de dados.
- **Título longo.** O da Garantia ocupa 6 linhas no desktop.
- **Conteúdo herdado do original**, preservado e documentado em `docs/PRESERVACAO.md`:
  - a âncora `#funciona` do Backup não leva a lugar nenhum;
  - as mensagens de WhatsApp da Garantia e do Backup dizem "…sobre Cloud";
  - o configurador da Nuvem Privada tem opções diferentes no desktop e no celular;
  - há grafias como "Extenção" e "servidore";
  - as descriptions foram geradas pelo All in One SEO.

## 4. Funcionalidades

| Funcionalidade | Situação | Como foi verificada |
| --- | --- | --- |
| Busca com sugestões (nome, fabricante, código, atributos, sem acento; teclado; celular; estados) | Pronta | `cabecalho.spec.ts` |
| Busca, ordenação e paginação do catálogo, com estado na URL e `?product-page=` | Pronta | `catalogo.spec.ts`, contra o WordPress |
| Variações, quantidade e "Orçamento" pela Store API, com nonce | Pronta | `produto.spec.ts`, `carrinho.spec.ts` (Store API simulada) |
| Carrinho: quantidade, remover, desfazer e totais; contador no cabeçalho | Pronta | `carrinho.spec.ts`, `cabecalho.spec.ts` |
| Finalização: conferência dos dados e mensagem completa ao WhatsApp | Pronta | `finalizacao.spec.ts` |
| Nenhum caminho para pagamento no site novo | Pronta | Varredura do build em `paginas.spec.ts` |
| Bloqueio de pagamento no WordPress | **Preparado** (plugin + nginx), não aplicado | `npm run test:nginx`; o plugin depende de instalação |
| Formulários (Orçamento, 3 soluções, configurador) | Prontos; **envio real não testado** | `orcamento.spec.ts`, `solucoes.spec.ts` (`admin-ajax` simulado) |
| Blog: listagem, categorias, busca, artigos com SEO, compartilhar | Pronta | `blog.spec.ts`: os 51 artigos, texto completo |
| Cases com WhatsApp correto | Pronta | `paginas.spec.ts` |
| Suporte na identidade nova | **Preparado**, não instalado | Executado em PHP com o HTML real do Awesome Support (`docs/SUPORTE.md`) |
| Consentimento de cookies | Pronto (aparece só com rastreamento) | `rastreamento.spec.ts` |
| Eventos GA4/GLA | Prontos; rastreamento desligado | `rastreamento.spec.ts`, `finalizacao.spec.ts` |
| Sincronização e validação dos dados | Pronta | `validate-data --online` em 17/11/2026: 74 produtos, 160 variações, 51 postagens |
| Roteamento nginx | **Exemplo testado localmente** (64/64), não aplicado | `npm run test:nginx` |

## 5. Testes e medições (17/11/2026)

### Suíte E2E

`npm run test:e2e`: 180 testes × 2 telas = 360 execuções.

| Resultado | Quantidade |
| --- | --- |
| Passaram | 344 |
| Falharam | 0 |
| Pulados | 16 (por desenho, abaixo) |

**Os 16 pulados:**
- **11 na home:** testes só de desktop (submenus, acordeão, coluna fixa, pausa com o mouse) ou só de celular (menu móvel, carrossel, deslizar na hero, acordeão e postagens), pulados na outra tela.
- **4 em "Sobre nós":** carrossel de avaliações (2 testes × 2 telas), pulados porque não há avaliações do Google sincronizadas, já que não há chave da API.
- **1 em "Sobre nós":** composição de duas colunas, só no desktop.

**O que mudou nos testes nesta etapa:**
- **Novos:** `blog`, `cabecalho`, `paginas` e `rastreamento`.
- **Atualizados conforme as decisões desta etapa:**
  - o fallback do produto e do carrinho passou do checkout para o WhatsApp;
  - a busca do cabeçalho;
  - os links do menu;
  - o SEO da finalização;
  - os eventos.
- **Nenhum teste foi removido ou afrouxado.** Duas expectativas foram corrigidas para refletir o comportamento real:
  - o atalho do carrinho fica marcado como página atual no carrinho;
  - "Tentar de novo", com a loja fora do ar, para na consulta da sessão antes do `add-item`.
- **Varredura de pagamento:** passou a ignorar a meta `twitter:card`, que não é campo de cartão.

### Outras verificações

| Verificação | Resultado |
| --- | --- |
| `astro check` | 0 erros, 0 avisos, 0 dicas (138 arquivos) |
| `npm run build` | OK: 175 páginas, landing Cloud e lista de rotas |
| `npm run test:nginx` (nginx 1.24) | 64/64 |
| `validate-data --online` | OK. Um aviso: a postagem 2116 está vazia no WordPress (pendência 19). |
| Rolagem lateral | 23 tipos de página × 3 larguras (390, 820 e 1440 px), medidas depois de rolar a página inteira: nenhuma. Os testes de cada área também conferem. |
| Acessibilidade (axe) | Sem violações em todas as áreas: WCAG 2.1 AA nas áreas já existentes. Nas novas (blog, cases, 404, cabeçalho), também as boas práticas do axe. |

### Lighthouse 12.8.2

Medido no build local (servidor estático local, sem CDN e sem compressão), com chamadas externas bloqueadas. Celular: perfil padrão do Lighthouse, Moto G Power com 4G lento simulado. Desktop: preset desktop. Notas de Desempenho / Acessibilidade / Boas práticas / SEO:

| Página | Celular | LCP celular | Desktop |
| --- | --- | --- | --- |
| Home | 94 / 100 / 100 / 100 | 3,0 s | 100 / 100 / 100 / 100 |
| Catálogo | 98 / 100 / 100 / 100 | 2,3 s | 100 / 100 / 100 / 100 |
| Produto (R740) | 98 / 98¹ / 100 / 100 | 2,3 s | 100 / 98¹ / 100 / 100 |
| Carrinho | 96 / 100 / 96² / 69³ | 2,7 s | 100 / 100 / 96² / 69³ |
| Blog | 93 / 100 / 100 / 100 | 3,1 s | 100 / 100 / 100 / 100 |
| Artigo | 98 / 100 / 100 / 100 | 2,1 s | 100 / 100 / 100 / 100 |
| Cases | 98 / 100 / 100 / 100 | 2,3 s | 100 / 100 / 100 / 100 |
| Sobre nós | 97 / 100 / 100 / 100 | 2,5 s | 100 / 100 / 100 / 100 |
| Nuvem Privada | 96 / 100 / 100 / 100 | 2,6 s | 100 / 100 / 100 / 100 |
| Soluções Cloud | 98 / 100 / 100 / 100 | 2,2 s | 100 / 100 / 100 / 100 |

Em todas as páginas, TBT 0 ms e CLS ≤ 0,02.

**Notas da tabela:**
1. O título da descrição do produto pulava um nível (h2 → h4). Foi **corrigido depois da medição**: os títulos da descrição são renumerados no build, sem mudar o texto.
2. O erro no console é a Store API, que não existe no servidor local. No domínio da loja, ela responde.
3. `noindex` proposital no carrinho.

Os números de produção vão depender do servidor (compressão, cache e HTTP/2). Depois da publicação, acompanhe os dados reais no Search Console (Core Web Vitals).

## 6. Riscos conhecidos

- **Pagamento.** Enquanto o gateway estiver ativo no WordPress e o plugin `msserver-orcamento` não estiver instalado, o checkout do WordPress continua acessível a quem chegar a ele por fora do site novo.
- **Formulários.** Nunca foram enviados de ponta a ponta para o WordPress real. A homologação é obrigatória (pendência 4).
- **Postagens novas** (publicadas automaticamente a cada 2 ou 3 dias) aparecem no WordPress até o próximo build. O roteamento cobre isso; o workflow diário reduz a janela.
- **Dependências** com atualizações menores disponíveis (Astro, Sharp, TypeScript, Playwright; auditoria P33). A atualização fica para uma etapa própria, com a suíte.

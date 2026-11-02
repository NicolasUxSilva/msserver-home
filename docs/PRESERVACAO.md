# Preservação da home original

Referência: HTML publicado em `https://msserver.com.br/` (WordPress 7.1.2 + Elementor 3.31 +
WooCommerce 8.2.5), capturado em 02/11/2026. A lista de links e textos usada nos testes está em
`tests/fixtures/original-home.json`.

## Estrutura (mesma ordem da home atual)

| # | Home no WordPress | Nesta versão | Componente |
| --- | --- | --- | --- |
| 1 | Header: logo + busca de produtos (FiboSearch) e barra de menu fixa | Header fixo único: logo, menu com submenus, busca | `Header.astro` |
| 2 | Slider de 3 banners (versão desktop e versão celular) | Slider de 3 banners, com os textos e destinos de cada versão | `HeroSlider.astro` |
| 3 | "Nossa linha": abas Rack / Torre / Escala Nuvem, 6 produtos cada, "Ver todos" | Mesmas abas, produtos, preços, estrelas e botões | `ProductLine.astro` |
| 4 | Acordeão de imagens (Consultoria, Migração para Nuvem, Cibersegurança) ao lado de "Conheça nosso app" | Mesma faixa em duas colunas | `SolutionsApp.astro` |
| 5 | Vídeo do YouTube (1MQYjMeyX6w, playlist do canal), automático e sem som | Mesmo vídeo, automático e sem som, carregado ao se aproximar | `VideoSection.astro` |
| 6 | "Confira nossas últimas postagens" (3 posts) | Mesmos 3 posts (REST API do WordPress) | `LatestPosts.astro` |
| 7 | "Acompanhe nossas redes" | Mesmos 4 links | `SocialClients.astro` |
| 8 | "Alguns clientes" (10 logos em carrossel) | Mesmos 10 logos em grade | `SocialClients.astro` |
| 9 | Rodapé: contato, certificações, Menu, Nossas redes, Projetos socioambientais, copyright | Mesmos blocos | `Footer.astro` |
| 10 | Botão flutuante do WhatsApp (Click to Chat) | Mesmo número e mensagem | `pages/index.astro` |

## Textos

As palavras, a pontuação e a ordem foram mantidas. A única alteração é tipográfica: textos
publicados em CAIXA ALTA passam a usar caixa de frase, padrão das landings. Originais:

| Original (WordPress) | Exibido |
| --- | --- |
| SERVIDORES USADOS E SEMI-NOVOS | Servidores usados e semi-novos |
| CONFIRA MODELOS COM SUPORTE ON-SITE E GARANTIA ESTENDIDA DE ATÉ 5 ANOS. | Confira modelos com suporte on-site e garantia estendida de até 5 anos. |
| CONFIRA NOSSOS MODELOS COM SUPORTE ON-SITE E GARANTIA ESTENDIDA DE ATÉ 5 ANOS. | Confira nossos modelos com suporte on-site e garantia estendida de até 5 anos. |
| VER MODELOS / BAIXAR O APP / NUVEM / OBTER SUPORTE | Ver modelos / Baixar o app / Nuvem / Obter suporte |
| O UNICO COM APP GRATUITO PARA GESTÃO DE SERVIDORES | O unico com app gratuito para gestão de servidores |
| RECURSOS E SERVIÇOS PARA MITIGAR INDISPONIBILIDADES. | Recursos e serviços para mitigar indisponibilidades. |
| NUVEM PRIVADA SUPORTE E MONITORAMENTO 24H | Nuvem privada suporte e monitoramento 24h |
| O RECURSO CERTO PARA SEU PROJETO VOCÊ ENCONTRA AQUI. | O recurso certo para seu projeto você encontra aqui. |
| GERENCIE SEUS SERVIDORES COM O APP DA MSSERVER | Gerencie seus servidores com o app da MSSERVER |
| SUPORTE E MONITORAMENTO 24H | Suporte e monitoramento 24h |
| FORNECIMENTO DE SERVIDORES E PEÇAS PARA EMPRESAS E DATACENTERS EM TODO O BRASIL, O RECURSO CERTO PARA SEU PROJETO VOCÊ ENCONTRA AQUI. | Fornecimento de servidores e peças para empresas e datacenters em todo o Brasil, o recurso certo para seu projeto você encontra aqui. |
| NOSSA LINHA / VER TODOS | Nossa linha / Ver todos |
| CONHEÇA / NOSSO APP / QUERO CONHECER | Conheça / Nosso app / Quero conhecer |
| CONFIRA NOSSAS ÚLTIMAS POSTAGENS | Confira nossas últimas postagens |
| ACOMPANHE NOSSAS REDES / ALGUNS CLIENTES | Acompanhe nossas redes / Alguns clientes |
| MENU / NOSSAS REDES / PROJETOS SOCIOAMBIENTAIS | Menu / Nossas redes / Projetos socioambientais (rótulos em fonte mono maiúscula via CSS) |

Textos mantidos exatamente como estão, inclusive com possíveis erros, porque corrigir copy
não faz parte desta etapa (sugestões para a MSSERVER decidir):

- "O **unico** com app gratuito…" (sem acento).
- Placeholder da busca "**Perquisar** produtos...".
- "Horário de funcionamento: **8 am as 18 pm**."
- "© **2023** MSServer."
- "No Comments" nos posts (texto do widget do Elementor, em inglês).

## Correções técnicas feitas (sem mudar conteúdo)

- **Data dos posts:** o WordPress exibe "31 de **October** de 2026" (locale em inglês). Aqui a
  mesma data aparece como "31 de outubro de 2026".
- **Idioma do documento:** `lang="en-US"` → `lang="pt-BR"`; `og:locale` `en_US` → `pt_BR`.
- **H1:** a home atual não tem H1. O título do primeiro slide ("Servidores usados e semi-novos")
  passou a ser o H1. Os títulos de seção continuam H2.
- **Texto alternativo:** o logo da McDonald's tinha `alt="Design sem nome - 2023-05-23T161719.488 (1)"`;
  agora tem o nome do cliente. Os demais logos usam o nome do cliente.
- **Shortcode quebrado:** a home exibe o texto cru
  `[automatic_youtube_gallery playlist=”PLD5Luy6JY9pB9oSb0IRJZsyHrZEDxRqQW” cache=”604800″]`
  (plugin inativo ou aspas tipográficas no shortcode). O texto não foi reproduzido. A playlist
  continua acessível pelo player, que é carregado com `list=PLD5Luy…`. Se a galeria for desejada,
  o plugin precisa ser corrigido no WordPress.
- **Painel "Cibersegurança":** no WordPress aponta para `#/` (não leva a lugar nenhum). Aqui é um
  painel sem link, com o mesmo conteúdo. No celular, os três painéis do WordPress apontavam para
  `#/`; aqui usam os destinos da versão desktop (Consultoria e Migração para Nuvem).
- **"Soluções" e "Servidores em Nuvem"** no menu eram links `href="#"` que só abriam submenus;
  aqui são botões que abrem os mesmos submenus.
- **Telefones do rodapé** passaram a ser links `tel:` (antes eram texto).
- **"Alguns clientes":** o carrossel automático (4 por vez) virou uma grade com os 10 logos
  visíveis ao mesmo tempo, padrão das landings. Mesmos arquivos, mesma ordem.
- **Vídeo:** mantido automático e sem som; os controles do player ficam visíveis para que seja
  possível pausar (acessibilidade). Com "reduzir movimento" ativado no sistema, não começa sozinho.
- **Busca:** o formulário envia para a mesma busca do WooCommerce
  (`/?s=…&post_type=product&dgwt_wcas=1`). As sugestões instantâneas do FiboSearch dependem do
  AJAX do WordPress e só funcionarão quando esta página for servida dentro do WordPress.

## Materiais visuais

Todos os arquivos vêm da home atual (`npm run assets` e `npm run sync`): logo, 6 banners do
slider (3 desktop + 3 celular), 6 imagens do acordeão, colagem do app, selos das lojas,
certificações, projetos socioambientais, 10 logos de clientes, 16 fotos de produto e 3 imagens
dos posts. Nenhum foi substituído ou gerado. As fotos de produto foram apenas recortadas no fundo
branco e enquadradas na mesma área (mesmo tratamento da landing de servidores físicos).

## Rastreamento

GTM `GTM-KTDRRP3`, Google Ads `AW-715484072`, Meta Pixel `4553103271463659`, Clarity
`hfpiyea4bu` e loader do RD Station (que exibe o pop-up "Quer receber a Melhor Proposta…" no
celular) são os mesmos da home. Só carregam com `PUBLIC_TRACKING=true`. Os eventos de conversão
do Google Ads (`gtag_report_conversion`) presentes no HTML do WordPress não estão ligados a nenhum
elemento da home; se forem usados via GTM, continuam funcionando pelo container.

## Etapa 02 (refinamento visual e de interação)

Nada de conteúdo, link ou funcionalidade foi removido. Mudanças de apresentação que vale saber:

- **Cartões de produto e de post:** o cartão inteiro passou a ser clicável. O link da foto do
  produto/post virou parte do link do título (mesmo destino); o botão "Selecionar opções" e o
  "Leia mais »" continuam como links próprios.
- **Slider:** o contador "01 / 03" saiu de dentro do texto; a barra de controle (progresso,
  número e título de cada slide, pausa e setas) foi para dentro do banner.
- **App:** o cartão "Conheça nosso app" voltou a ter fundo claro, para o qual a colagem
  original de telas foi desenhada (no WordPress ela também fica sobre branco).
- **Clientes:** os mesmos 10 logos, na versão monocromática usada nas landings
  (`scripts/client-logos.mjs` gera `src/assets/clients-mono/` a partir dos originais, que
  continuam em `src/assets/clients/`).
- **Redes sociais:** os nomes (Facebook, Instagram, Linkedin, Youtube), que no WordPress eram
  texto para leitores de tela, agora aparecem ao lado dos ícones.
- **Vídeo:** enquanto o player carrega, a moldura mostra a miniatura do próprio vídeo no
  YouTube (`i.ytimg.com`). Se ela não carregar, some sem deixar ícone quebrado.
- **Rodapé:** as certificações passaram da coluna de contato para a coluna de projetos
  socioambientais, formando um bloco de selos.
- **WhatsApp flutuante:** mostra o rótulo "WhatsApp" (texto do plugin Click to Chat) no hover
  e dá um pulso discreto ao aparecer.

## Etapa 03 (auditoria e evolução de UI/UX)

Conteúdo, ordem das seções, materiais, links e funcionalidades continuam os mesmos (testes de
preservação contra a home original seguem passando). Mudanças de apresentação:

- **Nossa linha:** no desktop, título, abas e "Ver todos" ficam numa coluna lateral fixa
  durante a rolagem pela grade (2 colunas). As abas mostram a contagem de modelos (06),
  calculada dos dados; cada cartão ganhou o índice (01–06). No celular, os 6 cartões deslizam
  na horizontal com indicador de posição; todos continuam no HTML.
- **Soluções e postagens no celular:** mesmo padrão de carrossel com indicador.
- **Postagens no desktop:** composição editorial; o título da seção encabeça a coluna dos dois
  posts secundários e o post mais recente ocupa a coluna da esquerda.
- **Header:** recolhe ao rolar para baixo e volta ao rolar para cima; nunca recolhe com menu,
  busca, submenu aberto ou foco dentro dele.
- **Submenu Soluções:** ícones nos itens (apresentação) e véu leve sobre a página enquanto um
  submenu do desktop está aberto. A ordem dos itens é a do WordPress (testada).
- **Vídeo:** continua com reprodução automática e sem som, como na home original. O formato
  "só carrega ao clicar", comum em outros sites, foi descartado porque mudaria esse
  comportamento.

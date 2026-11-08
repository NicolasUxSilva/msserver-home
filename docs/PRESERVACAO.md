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

- **Links para páginas reconstruídas:** "Início" (menu e rodapé), as logos e "Sobre nós" / "Quem
  somos" apontavam para `https://msserver.com.br/` e `https://msserver.com.br/sobre(/)`, isto é,
  para as versões antigas no WordPress. Agora levam às rotas deste projeto (`/` e `/sobre/`), para
  que a Home e a "Sobre nós" reconstruídas se liguem uma à outra. Os demais itens mantêm os
  destinos do WordPress. (06/11/2026)
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

## Seção de servidores (trazida da etapa 03)

Da etapa 03 foi mantida apenas a apresentação da seção "Nossa linha". O restante da página
segue a etapa 02.

- **Desktop:** título, abas e "Ver todos" ficam numa coluna lateral fixa durante a rolagem pela
  grade de cartões: 3 colunas × 2 fileiras a partir de 1180 px (2 colunas entre 1100 e 1179 px).
  As abas ficam na vertical; cada cartão ganhou o índice (01–06).
- **Celular:** os 6 cartões de cada aba deslizam na horizontal (rolagem nativa com encaixe).
  Todos continuam no HTML.

## Hero de fundo inteiro (substitui o slider)

Os 3 banners do slider passaram a ser 3 temas de uma mesma seção (`src/components/Hero.astro`,
que substitui `HeroSlider.astro`). Textos, imagens (versão larga e versão vertical do celular)
e destinos de cada banner continuam os mesmos.

- **Fundo inteiro, altura de hero comum:** a seção ocupa a tela inteira abaixo do header e a arte
  do banner a preenche de ponta a ponta com recorte proporcional (`object-fit: cover`), sem
  deformar, com o texto por cima, como nos banners do WordPress. Texto à direita no desktop (a
  arte fica na metade esquerda) e no topo no celular e no tablet em pé (que usam o banner
  vertical). No celular, a faixa de cima do banner vertical, com o logotipo desenhado, sai do
  enquadramento para não ficar atrás do título.
- **Troca automática a cada 7 s, sem botão de play/pause nem setas:** a arte nova surge por
  esmaecimento lento (nada desliza), com uma aproximação muito leve enquanto o tema está ativo,
  e a mensagem entra em cascata. A troca não desloca a página.
- **Pontos centralizados na base (um por banner; 4 desde o banner de locação):** indicam o tema
  exibido (o ativo em laranja) e permitem escolher um; setas do teclado também funcionam. Os nomes
  "Servidores", "App", "Data Center" e "Locação para IA" ficam só como rótulo acessível dos pontos. No celular, deslizar o dedo também troca.
- **Resolução:** os banners originais têm 1713 px (largos) e 941 px (verticais) de largura. Em
  telas muito grandes ou de alta densidade eles são ampliados um pouco; não há versão maior no
  WordPress.
- **Pausas automáticas:** com o mouse ou o foco sobre a seção, quando ela sai da tela e com
  "reduzir movimento" ativado (nesse caso não troca sozinha).
- **Clique na arte:** no desktop leva ao destino do tema (no WordPress o banner inteiro era um
  link); no celular, o botão é o link, como no slider móvel do WordPress.

## Banner "Locação para IA" (08/11/2026)

Quarto tema da hero, depois de "Data Center", a pedido da MSSERVER. Os três banners anteriores
não mudaram (comparação pixel a pixel com a versão anterior em 7 resoluções, fora a faixa dos
pontos, que passou de 3 para 4).

- **Artes:** as duas enviadas pela MSSERVER, usadas sem nenhuma alteração:
  `src/assets/hero/slide-4-desktop.webp` (1714 × 918, só desktop) e
  `src/assets/hero/slide-4-mobile.webp` (941 × 1672, só celular e telas em pé). Chegaram como
  WebP, no mesmo tamanho dos outros banners; para usar os PNG originais, basta colocá-los na mesma
  pasta com o mesmo nome (`slide-4-desktop.png`, `slide-4-mobile.png`) e apagar os WebP.
- **Copy:** título "Potência para IA. / Sua infraestrutura por locação.", texto "Tenha acesso a
  servidores equipados com GPUs de alto desempenho para inteligência artificial, sem precisar
  investir na aquisição dos equipamentos." e botão "Conheça a locação". Sem a sigla HaaS.
- **Destino do botão (e da arte, no desktop):** `https://msserver.com.br/orcamento/`. Não há página
  publicada específica de locação (menu, rodapé e links da home atual conferidos); o pedido de
  orçamento é o caminho comercial existente para contratar. Quando houver uma página de locação,
  troque o `href` do slide `locacao` em `src/data/content.ts`.
- **Composição:** a arte larga deste banner ocupa mais da largura que as outras (servidores até
  ~61%), então o texto não usa a coluna fixa dos outros banners: é posicionado a partir do
  enquadramento real da arte, à direita dos servidores, com a base alinhada à dos equipamentos.
  Em paisagem mais "quadrada" (tablets deitados, 16:10, celular deitado) a arte aparece inteira
  na largura e o piso continua abaixo dela na mesma cor. Em telas em pé, a arte vertical é
  enquadrada pelo logotipo (que fica fora do quadro, como nos outros banners) e o texto ocupa a
  área livre acima da palavra "LOCAÇÃO", com tamanhos ajustados à altura disponível. Conferido
  sem sobreposição em 26 resoluções, de 360 × 640 a 2560 × 1305 (teste automático
  `banner de locação para IA` na suíte).
- **Limitação conhecida:** celular deitado com menos de 768 px de largura (ex.: 667 × 375) usa a
  arte vertical numa tela deitada, como todos os banners da hero; ali o texto cobre parte da arte.
  É um comportamento anterior da hero, não deste banner.

## Menu móvel (painel do topo)

- **Correção:** o menu não abria nos celulares. O painel ficava dentro do `<header>`, que usa
  desfoque (`backdrop-filter`); nos navegadores dos celulares isso faz o painel fixo se
  posicionar dentro do header, com altura zero. Agora ele é um elemento próprio da página
  (fora do header). O teste do menu simula esse comportamento para o defeito não voltar.
- **Formato:** painel que desce do topo e cobre metade da tela (em telas muito baixas, o mínimo
  que cabe o menu); a outra metade fica escurecida e tocar nela fecha. Logo da MSSERVER
  centralizada no topo do painel, com ✕ à direita; itens centralizados em duas colunas.
- **Organização:** em cada camada, os itens que abrem submenu vêm primeiro, como botões de mesma
  largura lado a lado (Servidores e Soluções; dentro deles, Componentes e Servidores em Nuvem), e
  os links vêm abaixo, nas mesmas duas colunas. É a única mudança de ordem em relação ao
  WordPress, e só no menu do celular.
- **Submenus:** abrem em camadas dentro do painel, com "Voltar". Os nomes e destinos são os do
  menu do WordPress. Servidores e Componentes, que no WordPress eram ao mesmo tempo link e
  submenu, viraram botões de abrir; os destinos continuam no título da camada aberta (que leva à
  página do item) e, em Servidores, também em "Ver todos".
- **Rolagem preservada:** abrir e fechar o menu (ou a busca, ou um submenu do desktop com Esc)
  não move mais a página; antes, ao devolver o foco ao botão do header, a página voltava ao topo.

## Soluções e postagens no celular

- **Soluções:** o acordeão do desktop também no celular, na horizontal. As três soluções ficam
  sempre na tela: a aberta ocupa a maior parte e as outras viram faixas estreitas que mostram o
  título desenhado na própria imagem (como as faixas recolhidas do desktop). Tocar numa faixa
  abre a solução (sem seguir o link); deslizar para o lado abre a vizinha; tocar na solução
  aberta segue o link. No tablet (768–1099 px) os painéis continuam empilhados.
- **Postagens:** no celular, as três postagens deslizam na horizontal, como a linha de
  servidores; todas continuam no HTML.

## Ajustes finais (06/11/2026)

- **"Nossa linha":** a partir de 1180 px, os 6 produtos de cada aba ficam em 3 colunas × 2
  fileiras. A coluna lateral (título, abas, "Ver todos") ficou mais estreita e os cartões,
  proporcionalmente menores (foto, nome, nota, faixa de preço numa linha e botão mantidos).
  Produtos, abas e informações não mudaram; tablet e celular seguem como antes.
- **Rótulos de seção** ("01 Servidores —", "02 Soluções —", "03 Blog —") e o título "Alguns
  clientes": passaram da fonte mono para a Inter, a mesma dos textos da home. Caixa alta,
  números, traço, posição e tamanho foram mantidos.
- **Banner do app (2º tema da hero):** copy reescrita a pedido da MSSERVER para apresentar o app
  como plataforma (SaaS). Usa só o que o site já publica em `/aplicativo-ms-server/` e na home:
  monitoramento em tempo real, suporte, backups em nuvem, upgrades e extensão de garantia; app
  gratuito para iPhone e Android. Nada de planos, preços ou recursos novos. Layout, imagens,
  cores, destinos dos botões e o rótulo "App" do seletor não mudaram.

| | Antes | Agora |
| --- | --- | --- |
| Título (desktop) | O unico com app gratuito para gestão de servidores | Controle total dos seus servidores em uma só plataforma |
| Descrição (desktop) | Acompanhamento em tempo real do seu servidor. | Monitore em tempo real, acione o suporte, faça backups em nuvem, solicite upgrades e estenda a garantia, tudo pelo app da MSSERVER. |
| Destaque (desktop) | Recursos e serviços para mitigar indisponibilidades. | Gratuita, para iPhone e Android, com as ferramentas para garantir a continuidade dos seus serviços. |
| Palavras-chave (desktop) | Servidores Dell, Servidores HP, Servidores Ibm | Monitoramento · Suporte · Backups · Upgrades · Extensão de garantia |
| Título (celular) | Gerencie seus servidores com o app da MSSERVER | Controle total dos seus servidores em uma só plataforma |
| Descrição (celular) | Acompanhamento em tempo real do seu servidor. Recursos e Serviços para mitigar indisponibilidades. | Monitore em tempo real, acione o suporte, faça backups e estenda a garantia pelo app gratuito da MSSERVER. |
| Botão (desktop e celular) | Baixar o app | Conhecer a plataforma |
| Destino do botão | `/aplicativo-ms-server/` (nova aba) no desktop; `#appmobile` no celular | Os mesmos |

# Página "Sobre nós" (`/sobre/`)

Referência: HTML publicado em `https://msserver.com.br/sobre/` (página 480 do WordPress),
capturado em 05/11/2026. Textos, títulos, links e imagens usados nos testes estão em
`tests/fixtures/original-sobre.json`.

## Estrutura (mesma ordem da página original)

| # | WordPress | Nesta versão | Componente |
| --- | --- | --- | --- |
| 1 | Faixa "QUEM SOMOS" (fundo próprio) | Faixa escura com o mesmo fundo, título centralizado | `sobre/SobreBand.astro` |
| 2 | Duas colunas: retrato, PROPÓSITO, foto do evento / VISÃO E MISSÃO, foto da equipe, FOCO NO ATENDIMENTO, botão | Mesmas colunas e mesma ordem; no celular, a coluna da esquerda inteira antes da direita | `sobre/SobreHistoria.astro` |
| 3 | "ESPECIALIDADES" + 8 cartões (2 fileiras de 4) | Mesmos 8 cartões e ícones, na mesma ordem | `sobre/Especialidades.astro` |
| 4 | "O QUE OS CLIENTES DIZEM" (fundo próprio) + carrossel de 4 depoimentos | Mesmo título, fundo e carrossel, agora com as avaliações públicas do Google; oculta enquanto não houver avaliações sincronizadas (ver "Ajustes finais") | `sobre/Depoimentos.astro` |
| — | Header, rodapé e WhatsApp flutuante | Os mesmos da home; no menu, "Sobre nós" marcado como página atual | `Header.astro`, `Footer.astro`, `WhatsAppFab.astro` |

## Textos

Palavras, pontuação e erros de digitação mantidos ("precisamoss", "oumigração", "mas ágil",
"Servidores fisicos", "tecnologico" etc.). Como na home, a única mudança é tipográfica: o que
estava em CAIXA ALTA passou para caixa de frase.

| Original | Exibido |
| --- | --- |
| QUEM SOMOS | Quem somos |
| PROPÓSITO / VISÃO E MISSÃO / FOCO NO ATENDIMENTO | Propósito / Visão e missão / Foco no atendimento |
| CONTE CONOSCO | Conte conosco |
| ESPECIALIDADES | Especialidades |
| SERVIDORES FISICOS, SERVIDORES EM NUVEM PRIVADA, CIBERSEGURANÇA, EXTENSÃO DE GARANTIA, MONITORAMENTO, SUPORTE E MANUTENÇÃO, RECOMPRA, ROTINAS DE BACKUP | Servidores fisicos, Servidores em nuvem privada, Cibersegurança, Extensão de garantia, Monitoramento, Suporte e manutenção, Recompra, Rotinas de backup |
| O QUE OS CLIENTES DIZEM | O que os clientes dizem |

## Imagens

Os mesmos arquivos da página (`node scripts/prepare-sobre-assets.mjs`), na maior resolução
publicada: retrato (1709 × 2560), foto do evento (1071 × 827), foto da equipe (2048 × 1367), os 8
ícones das especialidades (200 × 200) e os 2 fundos das faixas. Nenhum foi substituído ou gerado.
A foto do evento aparece inteira (o texto do painel fica na base); o retrato é enquadrado em 4:5
(quadrado no tablet) com o rosto preservado.

## Funcionalidades

- **Botão "Conte conosco":** mesmo destino (WhatsApp com a mensagem original), mesma aba.
- **Carrossel de avaliações:** 3 por vez no desktop (2 no tablet, 1 no celular), setas, pontos,
  troca automática a cada 5 s, volta ao início depois do último, pausa com o mouse ou o foco e,
  depois que a pessoa usa os controles, deixa de trocar sozinho (como no Elementor). Os pontos
  mostram as posições possíveis do carrossel (com 5 avaliações: 3 no desktop, 5 no celular); se
  todas cabem de uma vez, setas e pontos somem. Com "reduzir movimento", não troca sozinho.

## Ajustes finais (06/11/2026)

- **Depoimentos → avaliações do Google:** a pedido da MSSERVER, os 4 depoimentos fixos do
  WordPress saíram da página e do código, para não serem exibidos como atuais. A seção passa a
  mostrar só avaliações públicas do Perfil da Empresa no Google, lidas pela API oficial no build
  (`scripts/sync-google-reviews.mjs` → `src/data/google-reviews.json`; ver o README). Cada
  cartão mantém o padrão anterior (aspas, texto, nome) e mostra a nota em estrelas, o texto
  original, o nome público do autor (com link para o perfil dele no Google, quando houver) e o
  mês da avaliação; acima do carrossel, a nota geral e o link "Ver no Google Maps". Sem
  credenciais da API no ambiente desta etapa, o arquivo está vazio e a seção não aparece.
  Depoimentos retirados, para registro: Fernando (Perfilados Nardi), Sara (RD Concretos),
  Jessica (Senior Engenharia) e Pedro Hermano (Attri); textos em
  `tests/fixtures/original-sobre.json`.
- **Especialidades:** hover discreto em cada cartão (só com mouse): leve elevação, fundo e
  borda que se destacam, filete laranja no topo e ícone que sobe um pouco. Sem mudar conteúdo,
  tamanhos ou cursor (os cartões continuam sem link). Desligado com "reduzir movimento".
- **Faixa "Quem somos":** só o fundo mudou, para o azul profundo dos banners escuros da home
  (`--c-navy-950` → `--c-navy-900`, com a textura original em luminosidade e uma luz azul no
  topo). Texto, losango, tamanho e o retrato sobre a borda continuam iguais.

## Correções técnicas (sem mudar conteúdo)

- **H1:** a página original não tem H1 (todos os títulos são H2); "Quem somos" passou a ser o H1.
- **Texto alternativo:** as fotos não tinham `alt`; agora descrevem o que mostram. Os ícones
  continuam decorativos (o título do cartão diz o que é).
- **Idioma e Open Graph:** `lang="pt-BR"` e `og:locale` `pt_BR`; `og:type` `article`, como no
  All in One SEO. Title, description, canonical e JSON-LD são os da página publicada.
- **Textos justificados** passaram a alinhados à esquerda (legibilidade).

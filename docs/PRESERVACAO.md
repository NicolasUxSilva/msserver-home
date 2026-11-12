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
  enquadramento real da arte, à direita dos servidores. Na vertical, o texto fica na mesma
  altura das mensagens dos outros banners (centrado na mesma linha no desktop; no mesmo ponto do
  topo no celular).
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

# Página "Orçamento" (`/orcamento/`)

Referência: HTML publicado em `https://msserver.com.br/orcamento/` (página 509 do WordPress,
Elementor Pro 3.32), capturado em 08/11/2026 pelo endereço `http://` (o certificado HTTPS do site
estava vencido). Etapas, campos, textos, campos ocultos e endpoint usados nos testes estão em
`tests/fixtures/original-orcamento.json`, gerado automaticamente a partir desse HTML.

## O que a página original tinha

- Título "ORÇAMENTO" sobre uma imagem de fundo com camada roxa e, abaixo, o formulário de várias
  etapas do Elementor Pro, em duas cópias com as mesmas perguntas: o widget `3c9067f` (desktop e
  tablet) e o `65ca7d8` (celular, com os nomes das etapas vazios).
- Indicador de etapas com número e nome; botões "Próximo" e "Anterior" (a primeira etapa só tem
  "Próximo"; a última tem "Anterior" e "Enviar").
- "Próximo" valida os campos da etapa (validação do navegador); "Anterior" volta sem validar; os
  dados ficam nos campos enquanto a pessoa navega.
- Envio por AJAX para `https://msserver.com.br/wp-admin/admin-ajax.php` com os campos do
  formulário mais `action=elementor_pro_forms_send_form` e `referrer` (endereço da página). Na
  resposta: sucesso mostra a mensagem do servidor e limpa o formulário (e redireciona, se houver
  `redirect_url`); erro marca os campos devolvidos pelo servidor e mostra a mensagem geral.
- Sem reCAPTCHA nem campo-armadilha. Rastreamento da página: GTM, Google Ads, Meta Pixel, Clarity
  e o script do RD Station, os mesmos da home.

## Etapas e campos (todos obrigatórios, como no original)

| Etapa | Campo (`name`) | Rótulo | Texto de exemplo | Controle |
| --- | --- | --- | --- | --- |
| 1 Dados Pessoais | `form_fields[name]` | Nome e Sobrenome | Digite seu nome e Sobrenome | texto |
| 2 Dados da Empresa | `form_fields[field_ba71415]` | Razão Social | Digite a razão social da sua empresa | texto |
| 3 Email e Telefone | `form_fields[field_f66ed12]` | Email | Digite seu email | email |
| 3 Email e Telefone | `form_fields[field_2e1002c]` | Telefone | Digite seu telefone | telefone |
| 4 Aplicação | `form_fields[field_1d74bd8]` | Nos dê uma breve descrição da aplicação de uso do seu servidor ou configuração desejada. | Digite aqui... | área de texto (era texto de uma linha) |
| 5 Serviço especializado | `form_fields[field_9919f95]` | Necessita de mão de obra especializada para o projeto? | Digite aqui... | texto |

Campos ocultos mantidos: `post_id=509`, `form_id`, `referer_title=Orçamento - MSSERVER`,
`queried_id=509`. O envio usa `form_id=3c9067f` em telas acima de 767 px e `65ca7d8` até 767 px
(o mesmo ponto em que o Elementor alterna os dois widgets), porque as ações do servidor (email,
integrações) são configuradas em cada widget. O pedido foi comparado com o do formulário original,
preenchido com os mesmos dados no desktop e no celular, com os dois envios interceptados no
navegador: mesmas 12 partes, na mesma ordem e com os mesmos valores.

## Textos

| Original | Exibido |
| --- | --- |
| ORÇAMENTO | Orçamento |
| Próximo / Anterior | Próximo / Anterior |
| Enviar | Enviar solicitação de orçamento (deixa claro o que o botão envia) |
| Nomes das etapas, rótulos e textos de exemplo | Iguais (tabela acima) |
| — | "Cinco passos rápidos para a equipe comercial da MSSERVER entender o seu projeto." (contexto curto, novo) |
| — | "Todos os campos são obrigatórios." (todos já eram) |
| Mensagens padrão do navegador ("Preencha este campo") | Mensagens em português por campo (ex.: "Informe seu nome e sobrenome.") |
| "Only numbers and phone characters (#, -, *, etc) are accepted." (título do campo de telefone) | "Use apenas números e caracteres de telefone, como ( ) - + # *." |
| Mensagem de sucesso | A mesma que o servidor devolver (configurada no Elementor), sob o título "Solicitação de orçamento enviada" |

Novos, sem mudar o que é pedido: resumo do que foi enviado na confirmação; bloco "Prefere falar
com a equipe?" com o WhatsApp (mesma mensagem do botão "Conte conosco" de "Sobre nós") e o email
comercial do rodapé; aviso de falha com os mesmos contatos.

## Correções técnicas (sem mudar o que é coletado)

- **Telefone:** o `pattern` do campo no Elementor (`[0-9()#&+*-=.]+`) é inválido para os
  navegadores atuais, que o ignoram; a regra só valia no servidor, que recusa espaços. Aqui a
  mesma regra é conferida antes do envio, e os espaços digitados são retirados no envio
  ("(11) 98599-1837" chega como "(11)98599-1837").
- **Espaços:** espaços no início/fim e repetidos são retirados dos demais campos (o servidor do
  WordPress também os remove em campos de texto).
- **Aplicação:** área de texto em vez de campo de uma linha; quebras de linha são enviadas como
  espaço, como o servidor já faria.
- **Rascunho:** as respostas ficam guardadas na sessão do navegador enquanto a pessoa preenche
  (sobrevivem a recarregar a página) e são apagadas depois de um envio confirmado.
- **Envio duplicado:** o botão fica bloqueado enquanto o envio está em andamento.
- **Falha de rede ou resposta inesperada:** aviso com o motivo, dados preservados e novo envio
  pelo mesmo botão (no original aparecia só o código do erro do jQuery).
- **Fora do domínio do site:** o pedido leva o cabeçalho `X-Requested-With` (o mesmo do jQuery do
  Elementor); em outra origem, isso exige uma autorização de CORS que o WordPress não dá, então o
  pedido não sai e nada chega ao servidor sem confirmação.
- **Compatibilidade de rastreamento:** a mensagem de sucesso mantém as classes
  `elementor-message elementor-message-success`, caso o GTM use a visibilidade dela como gatilho;
  o `dataLayer` recebe `quote_step`, `quote_submit`, `quote_submit_success` e `quote_submit_error`
  (sem dados pessoais). O `<form>` continua disparando o evento de envio só na última etapa, como
  no original (relevante se o script do RD Station estiver configurado para capturar formulários;
  isso não é visível no código da página e deve ser conferido no RD Station).
- **Links:** "Orçamento" no menu e no rodapé, e o banner de locação da home, passaram a levar à
  página nova (`/orcamento/`), como as outras páginas reconstruídas. Home e "Sobre nós" não
  mudaram em nada além desses endereços.

# Catálogo de servidores (`/servidores/` e categorias Dell, HP e IBM)

Referência: as 11 páginas publicadas (lidas pelo endereço `http://` em 08/11/2026, com o HTTPS do
site fora do ar) e a Store API do WooCommerce. O retrato usado nos testes, gerado do HTML, está em
`tests/fixtures/original-catalog.json`.

## O que as páginas originais tinham

| Página | Origem no WordPress | Produtos | Por página | Paginação | Ordenação |
| --- | --- | --- | --- | --- | --- |
| `/servidores/` (título "SERVIDORES") | Página 4829 com o widget de produtos do Elementor (mais recentes primeiro) | 74 | 12 | `?product-page=2` … `7` | não tinha |
| `/categoria-produto/dell/` ("DELL") | Arquivo de categoria do WooCommerce (template 4851) | 31 | 16 | `/page/2/` | 6 opções |
| `/categoria-produto/hp/` ("HP") | Idem | 15 | 16 | — | 6 opções |
| `/categoria-produto/ibm/` ("IBM") | Idem | 4 | 16 | — | 6 opções |

- Card: miniatura da imagem destacada (recortada em 300 px), nome, estrelas de avaliação (todas
  em 0, nenhum produto avaliado), preço ou faixa de preço e o botão do WooCommerce.
- Botões: "Selecionar opções" nos 50 servidores (produtos variáveis; leva à página do produto,
  onde se escolhe a memória); "Orçamento" nos 24 componentes: em 19 sem preço leva à página do
  produto; em 5 com preço adiciona ao carrinho (`?add-to-cart=ID`).
- Barra lateral: busca de produtos (FiboSearch), busca no site, categorias do blog, postagens
  recentes e redes sociais. Categorias: breadcrumb "Home / DELL" (e "Page 2"), contagem em inglês
  ("Showing 1–16 of 31 results") e ordenação em inglês.
- Todos os produtos em estoque, nenhum em promoção, nenhuma avaliação, nenhuma descrição de
  categoria.

## O que foi preservado

- Os 74 produtos, os 31 da Dell, os 15 da HP e os 4 da IBM, com as mesmas páginas (cada página
  tem os mesmos produtos, na mesma ordem, que a página correspondente do WordPress), os mesmos
  nomes, links, preços e faixas de preço, os mesmos textos e destinos dos botões e a imagem
  destacada original de cada produto (a imagem inteira, sem o recorte quadrado da miniatura).
- As 6 ordenações das categorias (padrão, popularidade, média de classificação, mais recentes,
  preço crescente e decrescente), conferidas uma a uma contra as páginas do WordPress
  (`?orderby=`): 15 de 15 idênticas.
- Título, canonical, Open Graph e JSON-LD (CollectionPage, BreadcrumbList) de cada página; sem
  meta description, como no original.
- A classificação do WooCommerce: o "Servidor HP Proliant ML310 G8" está na categoria IBM no
  WooCommerce e continua aparecendo em IBM (provável erro de cadastro, a corrigir no WooCommerce).
- O conteúdo da barra lateral: postagens recentes, categorias do blog e busca no site, num bloco
  "Blog" ao fim da página; a busca de produtos virou a busca do próprio catálogo; as redes sociais
  já estão no rodapé.

## O que mudou

- **Textos traduzidos** do WooCommerce: contagem ("Mostrando 1–16 de 31 resultados"), ordenação
  ("Ordenação padrão", "Popularidade", "Média de classificação", "Mais recentes", "Preço: menor
  para maior", "Preço: maior para menor"), breadcrumb ("Início / Servidores / Dell / Página 2"),
  "Postagens recentes", "Categorias".
- **Títulos** em caixa de frase, como no resto do site: "Servidores", "Dell", "HP", "IBM".
- **Novos recursos sobre os mesmos dados:** busca instantânea no catálogo (nome, categorias,
  memória), filtro pelas categorias reais do WooCommerce (Rack, Torre, Escala nuvem e as de
  componentes, com a contagem; retirado depois — ver "Ferramentas mais enxutas"), ordenação também no catálogo geral (padrão "Mais recentes", a
  ordem original dele) e navegação entre Todos, Dell, HP e IBM em todas as páginas.
- **Paginação do catálogo geral:** `/servidores/page/N/`, como nas categorias. O endereço antigo
  (`/servidores/?product-page=N`) continua funcionando e é convertido.
- **Card:** etiquetas de fabricante e tipo (categorias reais), as configurações de memória das
  variações ("Memoria RAM: 8GB · 16GB · 32GB…", como cadastradas, em ordem crescente) e "Sob
  consulta" no lugar do preço vazio. As estrelas só aparecem em produtos com avaliações (hoje,
  nenhum). "Sem categoria" não aparece como filtro nem etiqueta.
- **Imagens:** a imagem destacada inteira (no lugar da miniatura recortada), enquadrada em fundo
  branco como em "Nossa linha"; fotos muito pequenas são ampliadas até 3×, a mesma escala que o
  card original aplicava. A do "Servidor Dell PowerEdge R430" tem só 100 × 100 px no WooCommerce
  (a galeria do produto tem fotos maiores): vale trocar a imagem destacada lá.
- **Adicionar ao carrinho:** nos 5 componentes com preço, o botão "Orçamento" leva a
  `página-do-produto/?add-to-cart=ID` (o WooCommerce adiciona ao carrinho e mostra a página do
  produto), em vez do pedido AJAX feito de dentro da página do WordPress.
- **Links:** "Servidores" (menu, submenu "Ver todos", rodapé, "Ver modelos" e "Ver todos" da
  home) e Dell, HP e IBM no submenu passaram a levar ao catálogo novo. As páginas de produto
  seguem no WordPress. (As categorias de componentes foram reconstruídas depois; ver abaixo.)

# Categorias de componentes (Componentes, Baterias, Dissipadores, Fans, Fontes, Gavetas, Placas de Rede)

Continuação do catálogo: as 7 páginas usam o mesmo sistema (`CatalogPage.astro`, `catalog.css`,
`catalog.ts`) e os mesmos dados (`catalog.json`, sincronizado do WooCommerce). Referência: as 8
páginas publicadas (lidas pelo endereço `http://` em 08/11/2026, com o HTTPS fora do ar), as 40
páginas de ordenação (`?orderby=`) e a Store API. O retrato está em
`tests/fixtures/original-catalog.json`, junto das listagens anteriores (que não mudaram).

## O que as páginas originais tinham

Todas no mesmo template das categorias de fabricante (arquivo de categoria do WooCommerce,
Elementor 4851): título da categoria, breadcrumb "Home / Fans", contagem e ordenação em inglês
(6 opções), 16 produtos por página, a mesma barra lateral, sem descrição de categoria.

| Página | Título publicado | Produtos | Páginas | Preços | Botão |
| --- | --- | --- | --- | --- | --- |
| `/categoria-produto/componentes/` | Componentes | 18 (dissipadores, fans, fontes, gavetas) | 2 (`/page/2/`) | nenhum publicado | "Orçamento" → página do produto |
| `/categoria-produto/baterias/` | Baterias | 3 | 1 | R$ 350,00, R$ 430,00, R$ 950,00 | "Orçamento" → adiciona ao carrinho |
| `/categoria-produto/dissipadores/` | Dissipadores | 5 | 1 | nenhum | "Orçamento" → página do produto |
| `/categoria-produto/fans/` | Fans | 5 | 1 | nenhum | idem |
| `/categoria-produto/fontes/` | Fontes | 4 | 1 | nenhum | idem |
| `/categoria-produto/gavetas/` | Gavetas | 4 | 1 | nenhum | idem |
| `/categoria-produto/placas-de-rede/` | Placas de Rede | 2 | 1 | R$ 350,00, R$ 950,00 | "Orçamento" → adiciona ao carrinho |

- 23 produtos distintos: as 18 de Componentes estão também numa subcategoria (Dissipadores, Fans,
  Fontes ou Gavetas); Baterias e Placas de Rede são categorias à parte no WooCommerce, mas ficam
  sob "Componentes" no menu do site.
- Produtos simples, sem variações, atributos, SKU, avaliações ou promoção; todos em estoque. Os
  códigos das peças estão nos nomes (ex.: "723595-101", "0hr6c0"); a descrição longa só aparece
  na página do produto.
- Imagens destacadas de 300 × 300 px (duas maiores), já com fundo branco.

## O que foi preservado

- Os 23 produtos, com a contagem de cada categoria (18, 3, 5, 5, 4, 4, 2), as mesmas páginas
  (Componentes: 16 + 2), a mesma ordem, os mesmos nomes completos, links, preços, textos e
  destinos dos botões e a imagem destacada original de cada um.
- As 6 ordenações de cada categoria, conferidas uma a uma contra o WordPress: 42 de 42 idênticas.
- Título, canonical, Open Graph e JSON-LD (CollectionPage, BreadcrumbList) de cada página; sem meta
  description, como no original. O título continua "Placas de Rede", como publicado e como no
  menu do site.
- A classificação do WooCommerce, sem ajustes: o "Fan Dell R520 05fx8x-5fx8x" (id 7856) não tem
  nenhuma categoria no WooCommerce, por isso não aparece em Fans nem em Componentes (no WordPress
  também não); continua no catálogo geral. Vale classificá-lo no WooCommerce.

## O que mudou

- **Textos traduzidos** como nas demais listagens; trilha como no menu do site: "Início /
  Servidores / Componentes / Baterias".
- **Navegação do catálogo em dois grupos** (depois, só o grupo da página — ver "Ferramentas mais
  enxutas"), os mesmos do menu do site, em todas as 11 listagens:
  Servidores (Todos, Dell, HP, IBM) e Componentes (Componentes, Baterias, Dissipadores, Fans,
  Fontes, Gavetas, Placas de Rede), com a contagem e a atual em destaque. No desktop, uma linha
  por grupo (com o nome do grupo a partir de 1200 px); no celular, uma linha que desliza, já
  posicionada na categoria atual. Trocar de categoria mantém a busca digitada.
- **Filtros só quando filtram** (depois retirados — ver "Ferramentas mais enxutas"): em Componentes, o seletor "Categoria" trazia as 4 subcategorias
  (Dissipadores 5, Fans 5, Fontes 4, Gavetas 4). Nas outras 6, todos os produtos têm as mesmas
  categorias; um filtro "Fans" dentro de Fans não mudaria nada, então a página não mostra o
  seletor. A busca e as 6 ordenações funcionam em todas.

## Ferramentas mais enxutas (09/11/2026)

A pedido da MSSERVER, nas 11 listagens:

- A linha de categorias em chips do cartão de busca saiu; depois, o seletor "Categoria" que a
  substituiu também saiu. O cartão tem só a busca e "Ordenar por". Endereços antigos com `?tipo=`
  abrem a listagem inteira (o parâmetro é ignorado e sai do endereço).
- A navegação da abertura mostra só as categorias do grupo da página: nos servidores (`/servidores/`,
  Dell, HP, IBM), Todos, Dell, HP e IBM; nos componentes, Componentes e as 6 subcategorias. Os dois
  grupos continuam no menu do site (Servidores › Componentes).
- A palavra em contorno ao fundo da abertura ("SERVIDORES", "DELL", "FANS"…) saiu — também das
  páginas de produto e do carrinho, que usam a mesma abertura: o fundo fica só com a cor.

Cards, busca, ordenação, paginação e dados não mudaram.
- **Card:** o mesmo dos servidores. A etiqueta de categoria aparece só quando informa algo (em
  Componentes, a subcategoria; em Fans, nenhuma, já que todos são fans e componentes). "Sob
  consulta" no lugar do preço vazio, como no restante do catálogo.
- **Imagens:** a imagem destacada inteira, enquadrada no fundo branco do card como as dos
  servidores, sem corte nem distorção (peças largas, como fontes e gavetas, ocupam a largura;
  peças altas, como a bateria H710, a altura).
- **Menu:** Componentes e suas 6 subcategorias, no menu do desktop e no do celular de todas as
  páginas reconstruídas, passaram a levar às páginas novas.

## Efeitos nas listagens já entregues (`/servidores/`, Dell, HP, IBM)

Conferido no HTML e na geometria de cada card, antes e depois: cards, ferramentas, paginação,
bloco do blog, rodapé, `<head>` e a configuração do navegador continuam idênticos. Mudou:

- a abertura, que ganhou a segunda linha de navegação (Componentes) e passou a mostrar a contagem
  ao lado do título;
- no celular, os 13 cards de componentes de `/servidores/page/5/` a `7/` mostram o nome completo
  (antes, os mais longos eram cortados na 3ª linha, escondendo o código da peça);
- os links de componentes no menu (agora internos).

# Páginas de produto (`/servidor/slug/`)

Referência: as 74 páginas publicadas (lidas pelo endereço `http://` em 09/11/2026, com o HTTPS fora
do ar) e a Store API do WooCommerce. O retrato usado nos testes está em
`tests/fixtures/original-products.json`.

## O que as páginas originais tinham

Todas no mesmo modelo do Elementor (4844), com os mesmos blocos:

- Galeria do WooCommerce (1 a 4 fotos; miniaturas e zoom), título, descrição do produto, preço.
- Formulário do WooCommerce, com o botão "Orçamento" (o "Adicionar ao carrinho", renomeado pelo
  plugin Woo Add to Cart Text Change), que adiciona ao carrinho (`/carrinho/`):
  - 50 servidores variáveis: "Memoria RAM" (seletor "Choose an option" e "Clear"), quantidade e o
    botão; envia `attribute_pa_memoria-ram` (num produto, `attribute_memoria-ram`), `quantity`,
    `add-to-cart`, `product_id` e `variation_id`. O preço muda conforme a memória escolhida.
  - 5 componentes com preço: quantidade e o botão (`quantity` e `add-to-cart`).
  - 19 componentes sem preço: sem formulário nem botão.
- Bloco "GARANTIA PADRÃO DE 1 ANO." com 3 itens e "Precisa de uma configuração especifica ou ficou
  com duvida? Fale com um consultor." (sem link), repetido para o celular abaixo da descrição.
- Breadcrumb do WooCommerce ("Home / Rack / …"), JSON-LD do All in One SEO (BreadcrumbList,
  ItemPage, Organization, WebSite) e o BreadcrumbList do WooCommerce, em blocos separados.
- Sem abas, avaliações, produtos relacionados, SKU ou descrição curta à vista.

## O que foi preservado

- As 74 páginas, nos mesmos endereços, com o mesmo título, meta description, canonical e os dois
  blocos de JSON-LD.
- Nome, fotos (as mesmas 157, na mesma ordem), preço ou faixa de preço, o texto da descrição (com
  títulos, listas, tabelas e links) e o bloco de garantia, com os textos como publicados.
- O formulário do WooCommerce: os mesmos campos, com os mesmos nomes e valores, enviados por POST
  ao carrinho; as mesmas 157 variações (ids, opções e preços) que o WordPress oferece.
- O comportamento de compra: escolher a memória mostra o preço dela; sem escolher, a mensagem do
  WooCommerce; quantidade a partir de 1; produtos sem preço sem formulário.

## O que mudou

- **Visual** no sistema do site: abertura azul-marinho com trilha, categorias e o nome; galeria em
  estúdio claro; caixa de compra ao lado (acompanha a rolagem no desktop); descrição em cartão.
- **Memória em botões** (em vez da lista "Choose an option"), em ordem crescente, com "Limpar".
  Opções sem variação com preço não aparecem — no WordPress, o script do WooCommerce também as
  remove (ex.: HP DL380 G10 só tem 32GB à venda; 8GB e 16GB estão sem preço). Quando sobra uma
  opção só, ela já vem marcada.
- **Destino do formulário:** o carrinho (`/carrinho/`), que continua no WordPress, em vez da própria
  página do produto (que agora é estática). O WooCommerce adiciona o item da mesma forma.
- **Textos do WooCommerce traduzidos:** "Quantidade", "Limpar", "Selecione uma das opções do
  produto antes de adicioná-lo ao carrinho.".
- **Produtos sem preço:** além do texto do bloco de garantia, um botão "Fale com um consultor"
  (WhatsApp do site), já que o WordPress não oferecia nenhuma ação na página. "Fale com um
  consultor." no bloco de garantia passou a ser link para o mesmo WhatsApp.
- **Trilha** do catálogo deste site ("Início / Servidores / Dell"), no lugar da categoria escolhida
  pelo WooCommerce ("Home / Rack"); o JSON-LD continua o original.
- **Fotos** enquadradas como as do catálogo (fundo branco aparado, sem cortar nem distorcer), na
  resolução que o original permite; a imagem ampliada abre numa janela própria.
- **Descrição:** marcação limpa no build (sem mudar o texto). Um `<h1>` vazio (gaveta 7872) foi
  removido; títulos `<h1>`/`<h2>` da descrição viram `<h3>`; o link do R410 com endereço quebrado
  (`http://Especificações do fabricante`) passou a usar o endereço que ele mostra (a ficha da Dell).
- **Links do site:** cards do catálogo e da home levam às páginas novas; os 5 "Orçamento" com preço
  do catálogo adicionam ao carrinho pelo endereço do carrinho (`/carrinho/?add-to-cart=ID`).

## Correção no catálogo

Os cards mostravam as opções de memória cadastradas no atributo, inclusive as que não têm variação
à venda (ex.: R210 "8GB · 16GB · 32GB", mas o WordPress só oferece 8GB e 16GB). Agora card, busca
e página do produto usam as mesmas opções reais. Mudou em 10 cards: R210, R230, T110 e ML310 G8
(sem 32GB), R540, R640 (5632) e R740 (sem 8GB), DL360 G10 (16GB e 32GB), DL380 G10 e R640 (7502)
(só 32GB).

## Para revisar no WooCommerce (não alterado)

- Textos do bloco de garantia com erros de digitação ("especifica", "duvida", "Todos equipamento").
- Descrições de componentes com o texto de outra empresa: "Somos GPC | PECASDATACENTER — Maior
  estoque de peças para seu DataCenter".
- Variações sem preço (DL380 G10: 8GB e 16GB; DL360 G10: 8GB).
- 21 das 23 imagens destacadas de componentes têm só 300 × 300 px (as fotos ficam ampliadas e um pouco suaves).

# Carrinho (`/carrinho/`)

Referência: a página publicada (lida pelo endereço `http://` em 09/11/2026, com o carrinho vazio), a
Store API do WooCommerce (lista de rotas e o carrinho vazio, só leitura), o código da Store API do
WooCommerce 8.2 e o do plugin "WooCommerce Order on WhatsApp" 2.3.2 (públicos). Nenhum produto foi
adicionado a carrinho algum da loja real; as alterações foram validadas com a Store API simulada no
formato do WooCommerce (`tests/e2e/store-mock.ts`).

## O que a página original tinha

- Página 5290 do WordPress ("Carrinho"), com o widget de carrinho do Elementor Pro (uma coluna):
  o carrinho clássico do WooCommerce. Vazio: "Your cart is currently empty." e "Return to shop"
  (para `/servidores/`).
- Com itens (o All in One SEO guardou um retrato na descrição da página): colunas "Remover item,
  Imagem de miniatura, Produto, Preço, Quantidade, Subtotal", "Atualizar o carrinho", o botão
  "Orçamento pelo WhatsApp" (plugin "WooCommerce Order on WhatsApp"), "Total no carrinho" com
  Subtotal e Total, e "Avançar para o pagamento" (para `/finalizar-compra/`). Sem campo de cupom e
  sem cálculo de frete.
- `noindex`, título "Carrinho - MSSERVER", canonical e JSON-LD (BreadcrumbList, Organization,
  WebPage, WebSite).
- Finalização de compra (`/finalizar-compra/`) no WordPress, com o meio de pagamento
  `woo_paypal_stripe_gateway_set`.

## O que foi preservado

- O endereço, o título, o `noindex`, o canonical e o JSON-LD.
- O mesmo carrinho: os itens são os da sessão do WooCommerce (a mesma da finalização de compra),
  lidos e alterados pela Store API; preços, subtotais e total são os que o WooCommerce calcula.
- As colunas (Produto, Preço, Quantidade, Subtotal, remover), "Total no carrinho" com Subtotal e
  Total, "Avançar para o pagamento" (finalização do WordPress), "Orçamento pelo WhatsApp" e, vazio,
  a mensagem e o caminho para `/servidores/`, com os textos do WooCommerce em português.
- Sem cupom e sem frete na tela, como no original (se a loja passar a aplicar cupom, taxa, frete ou
  imposto, as linhas aparecem no total com os valores do WooCommerce).

## O que mudou

- **Visual** no sistema do site: abertura azul-marinho, lista em cartão (tabela no desktop, cartões
  no celular), resumo ao lado que acompanha a rolagem, estados de carregando, vazio e loja
  indisponível.
- **Quantidade e remoção sem "Atualizar o carrinho":** a alteração vai à loja ao parar de clicar, e
  os totais voltam dela; remover mostra "“Produto” removido. Desfazer?", como no WooCommerce.
- **Itens levam às páginas de produto deste site**, com a foto do catálogo.
- **"Orçamento pelo WhatsApp":** a mensagem no formato do plugin ("-> quantidade x produto = preço"
  por item e o total). O número e a mensagem de abertura configurados no plugin não são públicos;
  foram usados o WhatsApp e a mensagem que o site já usa ("Ola! Mensagem vinda do site.") —
  confirmar com a MSSERVER (`src/data/carrinho.ts`). O rótulo do total ficou em português ("Total do
  carrinho:"; o plugin escreve "Cart Total:") e a opção vai uma vez só ("R210 - 16GB", em vez de
  "R210 - 16GB 16gb").
- **"Orçamento" nas páginas de produto:** adiciona pela Store API e abre o carrinho (com o aviso
  "“Produto” foi adicionado ao seu carrinho."). Sem JavaScript, ou sem a loja no mesmo endereço, o
  formulário original vai para a finalização de compra do WordPress (que adiciona e mostra a
  finalização), já que `/carrinho/` passa a ser esta página.
- **"Orçamento" do catálogo** (5 produtos com preço): `/carrinho/?add-to-cart=ID` neste site; o
  carrinho adiciona ao abrir e limpa o endereço (recarregar não adiciona de novo).
- **Descrição de SEO:** a do All in One SEO era o retrato de um carrinho antigo ("Rack Dell r610 -
  8GB R$ 1.200,00…"), com produto e preço de outra época; saiu da meta description e do JSON-LD.

# Finalização de compra (`/finalizar-compra/`)

Referência: a finalização publicada (lida pelo endereço `http://` em 12/11/2026, vazia e com um item
no carrinho: 1 sessão de carrinho com a Bateria Dell nu209, autorizada para isso), a Store API do
WooCommerce (rotas, só leitura) e o código da Store API do WooCommerce 8.2 (`Checkout`,
`CheckoutTrait`, `Legacy`, `OrderController`, endereços). Validada com a Store API simulada
(`tests/e2e/store-mock.ts`) e com **um pedido de teste real** (ver abaixo).

## O que a página original tinha

- Página 4822 do WordPress ("Finalização de compra"), com a finalização clássica do WooCommerce
  (shortcode), textos do WooCommerce em inglês (a tradução não está carregada na loja).
- "Have a coupon? Click here to enter your code" (cupom em formulário à parte).
- **Billing details:** First name, Last name, Company name (opcional), Country / Region (249 países,
  Brasil marcado), Street address (+ "Apartment, suite, unit, etc.", opcional), Town / City,
  State / County (27 estados, São Paulo marcado), Postcode / ZIP, Phone, Email address — todos
  obrigatórios, menos empresa e complemento. Ao trocar de país, nomes, obrigatórios e ordem mudam
  pelas regras do WooCommerce, e os totais são recalculados.
- **Additional information:** Order notes (opcional).
- Sem entrega ("Ship to a different address?" não aparece: a loja não cobra frete), sem criar conta
  (compra como visitante) e sem termos para aceitar.
- **Your order:** Product / Subtotal por item, Subtotal e Total.
- **Pagamento:** uma forma, `woo_paypal_stripe_gateway_set`, "Credit Card", com as bandeiras Visa,
  Mastercard e Discover e os campos Card number, Expiry (MM/YY) e Card code, enviados ao servidor da
  loja (`card-number`, `card-expiry`, `card-cvc`).
- Texto de privacidade ("Os seus dados pessoais serão utilizados para processar a sua compra…", com o
  link `https://msserver.com.br/?page_id=3`) e o botão "Place order".
- Título "Finalização de compra - MSSERVER", robots `max-image-preview:large`, canonical e JSON-LD.

## O que foi preservado

- O endereço, o título, o robots, o canonical e o JSON-LD.
- **Todo o processo comercial é o do WooCommerce, na mesma sessão do carrinho:** itens e totais,
  cupons (aplicar e remover), o endereço na sessão ao trocar país, estado, CEP ou cidade (impostos e
  frete recalculados pela loja), a forma de entrega (se a loja passar a cobrar frete, com "Enviar
  para um endereço diferente?"), a validação do pedido e a forma de pagamento da loja. Nada é
  calculado aqui: os valores exibidos são sempre os que o WooCommerce devolve.
- Os mesmos campos, com os mesmos nomes (`billing_*`, `order_comments`), a mesma ordem, os mesmos
  obrigatórios (telefone e e-mail inclusive), os 249 países, os estados e as regras de endereço de
  cada país (com a ordem dos campos), o país e o estado da sessão (Brasil, São Paulo).
- A forma de pagamento recebe o mesmo que no formulário original: `card-number` (em grupos de 4),
  `card-expiry` ("MM / AA"), `card-cvc`, `payment_method` e os campos de cobrança e a nota.
- Pedido sem entrega fica sem endereço de entrega, como na finalização clássica.
- O texto de privacidade com o mesmo link; sem termos e sem criar conta, como no original.

## O que mudou

- **Visual e navegação** no sistema do site, na sequência do carrinho: abertura com as etapas
  (Carrinho → Dados e pagamento → Pedido recebido), seções numeradas em cartões, resumo do pedido ao
  lado (acompanha a rolagem; no celular, recolhido no alto com o total), cupom dentro do resumo,
  forma de pagamento com as bandeiras (a do número digitado em destaque), total repetido junto do
  botão "Finalizar pedido" (laranja).
- **Textos em português** (traduções oficiais do WooCommerce: "Detalhes de faturamento", "Finalizar
  pedido"…); países em português; o link de privacidade como "política de privacidade".
- **Conferência antes do envio:** obrigatórios, e-mail, telefone (a regra do WooCommerce), CEP
  (00000-000, com máscara), estado da lista, cartão (Luhn), validade (vencido) e código, com a
  mensagem em cada campo e uma lista no alto que leva a cada um e se atualiza ao corrigir. Os erros
  que a loja devolve (endereço, pagamento) aparecem do mesmo jeito.
- **Envio pela Store API do WooCommerce** (`POST /wp-json/wc/store/v1/checkout`), e não pelo
  `/?wc-ajax=checkout` da finalização clássica: este exige um nonce que só a página do WordPress
  traz, e a Store API é o caminho do próprio WooCommerce para finalizações fora do tema (é o que o
  bloco de finalização usa). Consequências: o pedido é registrado com origem `store-api` (e não
  `checkout`); a forma de pagamento é chamada pela camada de compatibilidade do WooCommerce, que
  monta o `$_POST` com os mesmos campos e chama `validate_fields()` e `process_payment()`; plugins
  que só escutam ganchos da finalização clássica (`woocommerce_checkout_process`,
  `woocommerce_checkout_order_processed`) não rodam — nenhum dos plugins da página publicada depende
  disso para a compra (o Google Listings & Ads registra a compra na página "pedido recebido", que
  continua no WordPress). A Store API não exige telefone no servidor: a página exige, como antes.
- **Proteções:** envio travado enquanto processa (sem pedido duplicado; o nonce vencido é renovado
  e o pedido repetido uma vez, com um pedido só); os campos do cartão não têm `name` (não entram num
  envio comum do formulário), não são guardados e não vão para o `dataLayer`; **sem HTTPS a página
  não envia o cartão** e oferece o endereço `https://` (a finalização clássica enviava por `http`).
- **E-mail:** `autocomplete="email"` (o WooCommerce usa "email username", combinação inválida).
- **Carrinho:** "Avançar para o pagamento" passou a levar a esta página (`/finalizar-compra/` neste
  site). Os caminhos sem a loja ou sem JavaScript (o "Orçamento" das páginas de produto e o
  `?add-to-cart=` do catálogo) continuam indo à finalização do WordPress, como antes.
- **Sem JavaScript**, a página avisa que precisa dele e oferece o WhatsApp (a finalização clássica
  funcionava sem JavaScript; a Store API exige o navegador).

## Teste real (12/11/2026)

Com as páginas novas servidas localmente e a Store API de produção (`http://msserver.com.br`), num
navegador sem rastreadores:

1. Página do produto Bateria Dell nu209 → "Orçamento": o WooCommerce adicionou (`add-item` 201) e o
   carrinho novo mostrou o item e R$ 350,00.
2. "Avançar para o pagamento" → a finalização nova mostrou o mesmo item e total, Brasil/São Paulo da
   sessão e a forma de pagamento `woo_paypal_stripe_gateway_set` (vinda do carrinho).
3. Enviar sem preencher: 10 erros na página, nada enviado. Cupom inexistente: a resposta real do
   WooCommerce ("Coupon "teste-inexistente" does not exist!") na página.
4. **Um pedido de teste** (autorizado: "Pedido teste sem pagar"), enviado uma vez, às 09:47 de
   12/11/2026 (horário de Brasília), com o cartão de teste de recusa 4000 0000 0000 0002:
   - Nome "TESTE", sobrenome "NOVA FINALIZACAO – NAO PROCESSAR", empresa "MSSERVER (teste interno)",
     Rua Salvador de Sá, 182, Santo André/SP, 09090-000, (11) 4858-5358,
     `teste-finalizacao@example.com` (domínio que não recebe e-mail); nota "PEDIDO DE TESTE da nova
     página de finalização de compra (cartão de teste recusado). Não processar; pode cancelar.";
     1 × Bateria Dell nu209, R$ 350,00.
   - O WooCommerce recebeu o pedido com todos os campos e chamou a forma de pagamento. Ela não
     devolveu um resultado ao WooCommerce: encerrou a resposta por conta própria, no formato da
     finalização clássica (`{"result":"failure","messages":"…Error processing checkout. Please try
     again.…","refresh":true,"reload":true}`), sem número de pedido. A página mostrou "Erro ao
     processar o pedido. Por favor, tente novamente." (a mesma mensagem, em português), manteve os
     dados e o carrinho (1 item, R$ 350,00, relido da loja).
   - **Para a equipe:** o pedido deve estar em WooCommerce → Pedidos como "Pendente" (ou "Malsucedido",
     se a forma de pagamento o marcou assim), no nome "TESTE NOVA FINALIZACAO – NAO PROCESSAR".
     Cancele ou exclua. Como a resposta não trouxe o número, ele não pôde ser anotado aqui.

## Atenção: forma de pagamento `woo_paypal_stripe_gateway_set` (verificar antes de publicar)

- O nome sugere PayPal/Stripe, mas a página não carrega nenhum script do Stripe nem do PayPal: número
  do cartão, validade e código vão **direto para o servidor da loja** (assim já era na finalização
  clássica). Integrações oficiais do Stripe não recebem o número do cartão no servidor da loja.
- O plugin que registra essa forma de pagamento não carrega arquivos na página, então não foi
  possível identificá-lo de fora.
- No teste, ela respondeu sozinha com uma mensagem genérica, sem motivo de recusa, em vez de devolver
  o resultado ao WooCommerce.
- Com o certificado HTTPS vencido, quem compra pelo endereço `http://` envia os dados do cartão sem
  criptografia.

**Recomendação:** antes de publicar esta página (e independentemente dela), quem administra o
WordPress deve identificar o plugin de `woo_paypal_stripe_gateway_set`, confirmar que é legítimo e que
os pagamentos chegam à conta da MSSERVER (pedidos pagos recentes, painel do Stripe/PayPal), verificar
se o site tem código malicioso e renovar o certificado HTTPS. A página nova envia exatamente o que a
antiga enviava, só por HTTPS; se a forma de pagamento for trocada, os campos vêm de
`npm run sync:checkout`.

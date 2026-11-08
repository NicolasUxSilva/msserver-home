# Sistema visual do site MSSERVER

Base para as próximas páginas. Os tokens e componentes vêm das landings de
[servidores físicos](https://github.com/NicolasUxSilva/landins-servidores-fisicos) e de
[Cloud](https://github.com/NicolasUxSilva/cloud-ms): `src/styles/global.css` é o mesmo arquivo
da landing de Cloud, sem alterações. Ao reformular uma página nova, reutilize-o como está.

O site acrescenta uma segunda camada, `src/styles/site.css`, com o que as páginas
institucionais precisam além das landings (estados de interação, superfícies escuras
compartilhadas, cartões clicáveis). Ela não altera nenhum token do `global.css`.

## Tokens (`:root` em `global.css`)

| Grupo | Tokens | Uso |
| --- | --- | --- |
| Fundo | `--c-paper` `#f5f4f0`, `--c-paper-2`, `--c-surface` `#fff` | Página em papel; cartões e seções claras em branco |
| Texto | `--c-ink`, `--c-ink-2`, `--c-ink-3` | Título, corpo, apoio |
| Índigo | `--c-indigo-950` … `--c-indigo-100` | Seções escuras, abas ativas, botão escuro |
| Laranja | `--c-orange`, `--c-orange-hover`, `--c-orange-deep`, `--c-orange-text` | CTA principal, marcas, ícones de destaque |
| Sobre escuro | `--c-on-dark`, `--c-on-dark-2`, `--c-on-dark-3`, `--c-line-dark(-2)` | Texto e linhas em fundo índigo |
| Fontes | `--f-display` Sora, `--f-text` Inter, `--f-mono` JetBrains Mono | Títulos, texto, rótulos/dados |
| Escala | `--t-hero`, `--t-h2`, `--t-h3`, `--t-lead`, `--t-small`, `--t-label` | Tamanhos fluidos (`clamp`) |
| Espaço | `--container` 1240px, `--gutter`, `--section-y`, `--header-h` 72px | Grade e ritmo vertical |
| Raios | `--r-sm` 8, `--r-md` 14, `--r-lg` 22, `--r-xl` 28 | Cartões `r-lg`, palcos/painéis escuros `r-xl` |
| Movimento | `--ease-out`, `--ease-in-out` | Todas as transições |

## Classes globais

- Layout: `.container`, `.section`, `.section--dark`, `.section--surface`, `.section--tint`,
  `.section-head(--split)`.
- Rótulo editorial: `.eyebrow` com número em `<b>` (`<p class="eyebrow"><b>01</b> Servidores</p>`).
  Na home, os rótulos usam nomes que já existem no menu do site. No site, o rótulo usa a Inter
  (`site.css`), em caixa alta com espaçamento de 0,12em; a mono fica para dados (índices dos
  cartões, palavras-chave da hero, rótulos do rodapé).
- Botões: `.btn` + `--primary` (laranja), `--dark`, `--outline`, `--outline-dark`, `--text`;
  tamanhos `--sm`, `--lg`; seta `.btn-arrow` que desliza no hover.
- `.link`, `.chip`, `.icon-tile`, `.sr-only`, `.skip-link`.
- Entrada ao rolar: atributo `data-reveal` (+ `style="--reveal-i:N"` para escalonar). Só anima
  com JS e sem "reduzir movimento"; `initReveal()` em `src/scripts/page.ts` garante que nada fique
  invisível.

## Camada do site (`site.css`)

| Classe / token | Uso |
| --- | --- |
| `--shadow-lift`, `--dur-1/2/3` | Elevação de cartões em hover; durações curtas (0,18 s), médias (0,32 s) e de entrada (0,7 s) |
| `.btn:active`, sombras do `.btn--primary` | Pressão (escala 0,98) e brilho laranja sob o CTA principal |
| `.has-card-link` + `.card-link` (+ `.card-raise`) | Cartão inteiro clicável: o link do título cobre o cartão; botões internos ficam acima |
| `.u-link` | Sublinhado que cresce da esquerda (rodapé, listas) |
| `.ext-arrow` | Seta ↗ que aparece no hover de links externos |
| `.dark-surface` + `__bg`, `__hatch`, `.glow--indigo/--orange` | Superfície índigo com hachura e brilhos (console e CTA final das landings) |
| `data-reveal="zoom"` | Variação de entrada para mídia |
| `--c-navy-950`, `--c-navy-900`, `--c-navy-glow` | Azul profundo dos banners escuros da home, para faixas de título das páginas internas |
| `.eyebrow` (Inter 500, `b` 700) | Rótulos de seção na mesma família dos textos |

## Ritmo de superfícies da home

Papel (hero + linha de servidores, com a grade técnica do hero se dissolvendo sobre a seção
seguinte) → capítulo escuro único (soluções, app e vídeo) → branco (postagens; o vídeo
avança sobre essa fronteira) → faixa escura (redes) → papel (clientes e rodapé). Alternar
superfícies, e não empilhar blocos do mesmo fundo, é o que dá continuidade sem divisores.

## Padrões de componente usados na home

| Padrão | Onde | Reaproveitar em |
| --- | --- | --- |
| Hero de tela cheia com temas alternados (arte em cover, esmaecimento lento, um ponto indicador por tema, profundidade com o mouse e ao rolar) | `Hero.astro` | Heros de páginas internas com mais de um destaque |
| Texto posicionado pela arte (banner de locação): a coluna do texto é calculada a partir do enquadramento real da imagem, e na vertical ele segue a mesma linha das mensagens dos outros temas (`container-type: size` na hero, unidades `cqw`/`cqh`), e o escurecimento acompanha a troca de tema (`@property --scrim-a/-b`) | `Hero.astro` | Banners cuja arte não deixa a metade direita livre |
| Header translúcido fixo, borda ao rolar, submenus em painel; menu móvel em painel do topo (meia tela, logo centralizada, itens de abrir lado a lado acima dos links, submenus em camadas, fora do `<header>`) | `Header.astro` | Todas as páginas (mesmo `NAV` de `config/site.ts`) |
| "Palco" escuro arredondado com padrão e brilho (console das landings) | Hero, app, vídeo | Heros de páginas internas, destaques |
| Cartão de produto (foto em fundo branco 4:3, título, preço em Sora, botão escuro) | `ProductLine.astro` | Categorias, busca, relacionados |
| Abas segmentadas com indicador deslizante | `ProductLine.astro` | Filtros simples |
| Cartão de post | `LatestPosts.astro` | Blog, cases |
| Faixa escura centralizada | Redes sociais | CTAs finais |
| Grade de logos com linhas | Clientes | Cases, Sobre |
| Rodapé claro com rótulos mono | `Footer.astro` | Todas as páginas |
| Botão flutuante de WhatsApp | `pages/index.astro` | Todas as páginas |

## Padrões da seção de servidores

- **Coluna lateral fixa (desktop):** título e controles de uma seção longa ficam ao alcance
  enquanto o conteúdo passa ao lado (`.line-aside` em `ProductLine.astro`). Abaixo de 1100 px a
  coluna "se desfaz" com `display: contents` e os itens viram uma sequência simples.
- **Carrossel no celular:** a lista rola na horizontal com encaixe nativo (`scroll-snap`), o
  próximo cartão aparecendo na borda; só CSS, sem indicador. Usado em servidores e postagens.
- **Acordeão no celular:** quando os itens precisam ficar todos visíveis (soluções), o acordeão
  do desktop continua na horizontal: aberto largo, os outros em faixas. O toque numa faixa a
  abre; o estado é lido no `pointerdown`, porque o navegador foca o link (e o foco abre o
  painel) antes do clique.

## Padrões de páginas internas ("Sobre nós")

- **Faixa de título:** gradiente `--c-navy-950` → `--c-navy-900` (o azul dos banners da home),
  com o fundo original da página como textura em luminosidade e uma luz azul no topo; losango
  laranja e H1 centralizado; o primeiro elemento da seção seguinte sobe sobre a borda da faixa.
- **Título de bloco:** traço laranja de 2,5 rem acima de cada H2 (`.block-title`, `.specs-title`).
- **Duas colunas editoriais:** colunas 0,82fr / 1,18fr; a da direita distribui os blocos
  (`justify-content: space-between`) para terminar na mesma linha da esquerda.
- **Grade de cartões informativos sem link:** linhas finas compartilhadas e alternância leve de
  fundo. Hover só visual (mouse): o cartão sobe 3 px, ganha fundo branco, borda, cantos e sombra,
  um filete laranja no topo e o ícone se ergue; o cursor não muda, porque não são clicáveis.
- **Carrossel de avaliações (Google):** trilho nativo com encaixe, focável, setas e pontos
  abaixo, troca automática com pausa e parada após interação. Cartão: aspas e estrelas no topo,
  texto original, autor com link e mês; nota geral e link do Google Maps sob o título. Dados só
  do arquivo gerado no build; sem dados, a seção não é renderizada.
- Links entre páginas reconstruídas: use `LINKS`/`ROUTES` de `config/site.ts` (rotas internas);
  nunca o endereço do WordPress para uma página que já existe neste projeto.
- `Header` recebe `current` (página atual no menu) e `Base` recebe `ogType` e `schema`; os
  padrões são os da home.

## Padrões de formulário (Orçamento)

- **Composição:** superfície escura dos banners da home (azul-marinho com luz azul vinda do alto)
  e o formulário num cartão branco, protagonista. Desktop: contexto (losango laranja, título,
  frase curta), linha do tempo das etapas e contatos à esquerda; cartão à direita, alinhado ao
  topo do título (cresce para baixo quando a etapa é mais alta). Celular e tablet: contexto
  compacto, cartão, contatos abaixo.
- **Progresso:** linha do tempo vertical (desktop) com número, nome, estado (concluída ✓ com o
  resumo do que foi preenchido, atual em laranja, pendente) e trilho que se preenche; etapas já
  feitas são clicáveis. No cartão, "Etapa X de 5", barra de 5 segmentos (`role="progressbar"`) e,
  no celular, "A seguir: …". Uma etapa só conta como concluída com os campos válidos.
- **Campos:** rótulo acima (Inter 600), campo de 56 px, borda 1,5 px `--c-line-2`, foco com
  borda `--c-indigo-600` e halo, válido com ✓ verde, inválido com borda e mensagem
  `--c-danger` ligada por `aria-describedby`. Etapa como `<fieldset>`/`<legend>`; etapas inativas
  com `inert`.
- **Ações:** "Anterior" `.btn--outline` à esquerda, "Próximo"/"Enviar" `.btn--primary .btn--lg` à
  direita (no celular, lado a lado com o principal ocupando o resto da linha). Enter avança; dica
  "ou pressione Enter" só com mouse e quando vale.
- **Estados:** carregando (botão bloqueado, ícone girando, `aria-busy`), confirmação (ícone de
  sucesso, mensagem do servidor, resumo, "Enviar outra solicitação"), falha (`role="alert"`,
  motivo, dados preservados, contatos).
- O WhatsApp flutuante sai da frente quando cobriria os botões do formulário ou enquanto se digita
  numa tela de toque.

## Breakpoints

Mobile-first. Pontos usados: 480, 640, 720/768, 900, 1024, 1100/1180 (menu completo; a partir de 1180, grade de 3 colunas em "Nossa linha"), 1360
(busca aberta no header). A hero troca para os banners verticais abaixo de 768 px, mesmo ponto
do Elementor.

## Movimento

- Entradas: 0,7 s, `translateY(14px)` → 0, escalonamento de 70 ms (`data-reveal`). A linha do
  rótulo `.eyebrow` cresce quando o cabeçalho entra.
- Ligado ao scroll (CSS `animation-timeline`, sem JS, só com suporte do navegador e sem
  "reduzir movimento"): o palco do hero recua levemente ao sair da tela e a imagem se desloca
  mais devagar; os brilhos do capítulo escuro derivam em velocidade própria; a moldura do vídeo
  se aproxima ao entrar.
- Hover: 0,18–0,25 s; botões sobem 1 px; setas deslizam 3 px; fotos ampliam 3–4 %.
- Hero: troca de tema a cada 7 s, indicada por 3 pontos; esmaecimento de 1,2 s na arte,
  aproximação leve (8 s, 3%) do tema ativo e cascata curta na mensagem; pausa com mouse/foco e fora
  da tela; sem troca automática com "reduzir movimento".
- Sem scroll hijacking; rolagem suave só sem "reduzir movimento".

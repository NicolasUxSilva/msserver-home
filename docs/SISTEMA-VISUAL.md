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
  Na home, os rótulos usam nomes que já existem no menu do site.
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

## Ritmo de superfícies da home

Papel (hero + linha de servidores, com a grade técnica do hero se dissolvendo sobre a seção
seguinte) → capítulo escuro único (soluções, app e vídeo) → branco (postagens; o vídeo
avança sobre essa fronteira) → faixa escura (redes) → papel (clientes e rodapé). Alternar
superfícies, e não empilhar blocos do mesmo fundo, é o que dá continuidade sem divisores.

## Padrões de componente usados na home

| Padrão | Onde | Reaproveitar em |
| --- | --- | --- |
| Hero de tela cheia com temas alternados (arte em cover, esmaecimento lento, 3 pontos indicadores, profundidade com o mouse e ao rolar) | `Hero.astro` | Heros de páginas internas com mais de um destaque |
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

## Breakpoints

Mobile-first. Pontos usados: 480, 640, 720/768, 900, 1024, 1100/1180 (menu completo), 1360
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

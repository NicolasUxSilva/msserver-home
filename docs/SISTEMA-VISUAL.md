# Sistema visual do site MSSERVER

Base para as próximas páginas. Os tokens e componentes vêm das landings de
[servidores físicos](https://github.com/NicolasUxSilva/landins-servidores-fisicos) e de
[Cloud](https://github.com/NicolasUxSilva/cloud-ms): `src/styles/global.css` é o mesmo arquivo
da landing de Cloud, sem alterações. Ao reformular uma página nova, reutilize-o como está.

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

## Padrões de componente usados na home

| Padrão | Onde | Reaproveitar em |
| --- | --- | --- |
| Header translúcido fixo, borda ao rolar, submenus em painel, menu móvel em tela cheia | `Header.astro` | Todas as páginas (mesmo `NAV` de `config/site.ts`) |
| "Palco" escuro arredondado com padrão e brilho (console das landings) | Slider, app, vídeo | Heros de páginas internas, destaques |
| Cartão de produto (foto em fundo branco 4:3, título, preço em Sora, botão escuro) | `ProductLine.astro` | Categorias, busca, relacionados |
| Abas segmentadas com indicador deslizante | `ProductLine.astro` | Filtros simples |
| Cartão de post | `LatestPosts.astro` | Blog, cases |
| Faixa escura centralizada | Redes sociais | CTAs finais |
| Grade de logos com linhas | Clientes | Cases, Sobre |
| Rodapé claro com rótulos mono | `Footer.astro` | Todas as páginas |
| Botão flutuante de WhatsApp | `pages/index.astro` | Todas as páginas |

## Breakpoints

Mobile-first. Pontos usados: 480, 640, 720/768, 900, 1024, 1100/1180 (menu completo), 1360
(busca aberta no header). O slider troca para os banners verticais abaixo de 768 px, mesmo ponto
do Elementor.

## Movimento

- Entradas: 0,7 s, `translateY(14px)` → 0, escalonamento de 70 ms (`data-reveal`).
- Hover: 0,18–0,25 s; botões sobem 1 px; setas deslizam 3 px; fotos ampliam 3–4 %.
- Slider: troca a cada 5 s, barra de progresso, pausa com mouse/foco/fora da tela e botão de pausa.
- Sem scroll hijacking; rolagem suave só sem "reduzir movimento".

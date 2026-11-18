// Botão flutuante de WhatsApp das landings, com o comportamento das versões aprovadas
// (src/scripts/page.ts de cada repositório):
//  - Servidores Físicos: aparece depois que o hero (#inicio) sai da tela;
//  - Soluções Cloud: o mesmo, e some enquanto o simulador (#simulador) está na tela, para não cobrir
//    a barra do simulador.
// O botão usa data-lp-fab (e não o data-wa-fab do botão do site, que aparece logo ao abrir a página).

export function initLandingFab() {
  const fab = document.querySelector<HTMLElement>('[data-lp-fab]');
  const hero = document.getElementById('inicio');
  if (!fab || !hero) return;
  const sim = document.getElementById('simulador');
  if (!sim) {
    new IntersectionObserver(([e]) => fab.classList.toggle('is-visible', !e.isIntersecting)).observe(hero);
    return;
  }
  let simVisible = false;
  let heroVisible = true;
  const update = () => fab.classList.toggle('is-visible', !simVisible && !heroVisible);
  new IntersectionObserver(([e]) => ((simVisible = e.isIntersecting), update()), { rootMargin: '0px 0px -10% 0px' }).observe(sim);
  new IntersectionObserver(([e]) => ((heroVisible = e.isIntersecting), update())).observe(hero);
}

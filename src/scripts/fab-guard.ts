// O WhatsApp flutuante sai da frente enquanto cobriria os botões de uma área (ex.: quantidade e
// "Orçamento" na página do produto) e volta assim que deixa de cobrir. O contato continua na página.
const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export function guardFab(areas: () => (Element | null | undefined)[]) {
  const fab = document.querySelector<HTMLElement>('[data-wa-fab]');
  if (!fab) return () => {};
  const check = () => {
    const box = fab.getBoundingClientRect();
    const tuck = areas().some((el) => {
      const r = el?.getBoundingClientRect();
      return !!r && r.height > 0 && overlaps(box, r);
    });
    fab.style.opacity = tuck ? '0' : '';
    fab.style.transform = tuck ? 'translateY(14px) scale(0.92)' : '';
    fab.style.pointerEvents = tuck ? 'none' : '';
    fab.inert = tuck;
  };
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(check);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
  return schedule;
}

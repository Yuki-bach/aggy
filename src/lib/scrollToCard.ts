function findScrollContainer(el: HTMLElement): HTMLElement | null {
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}

export function scrollToCard(targetId: string): void {
  // Question codes are user-supplied (from the layout file) and may contain
  // digits, dots or other characters that have special meaning in CSS
  // selectors. CSS.escape sanitizes the id for use inside `#...`.
  const el = document.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
  if (!el) return;
  const sc = findScrollContainer(el);
  if (!sc) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const stickyEl = sc.querySelector<HTMLElement>("[data-sticky-toolbar]");
  const stickyH = stickyEl?.offsetHeight ?? 0;
  const offset =
    el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - stickyH;
  sc.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
}

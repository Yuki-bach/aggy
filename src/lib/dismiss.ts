/** Svelte action: dismiss a dropdown/modal when clicking outside or pressing Escape. */
export function clickOutside(
  node: HTMLElement,
  params: { onClose: () => void },
): { destroy: () => void } {
  const onMousedown = (e: MouseEvent) => {
    if (!node.contains(e.target as Node)) params.onClose();
  };
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") params.onClose();
  };
  document.addEventListener("mousedown", onMousedown);
  document.addEventListener("keydown", onKeydown);
  return {
    destroy() {
      document.removeEventListener("mousedown", onMousedown);
      document.removeEventListener("keydown", onKeydown);
    },
  };
}

/** {@attach}-compatible action: dismiss a dropdown/modal when clicking outside or pressing Escape. */
export function clickOutside(params: { onClose: () => void }): (node: HTMLElement) => () => void {
  return (node: HTMLElement) => {
    const onMousedown = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) params.onClose();
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") params.onClose();
    };
    document.addEventListener("mousedown", onMousedown);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onMousedown);
      document.removeEventListener("keydown", onKeydown);
    };
  };
}

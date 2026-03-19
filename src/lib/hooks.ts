import type { RefObject } from "preact";
import { useEffect, useState } from "preact/hooks";
import { onLocaleChange, offLocaleChange } from "./i18n";

/** Subscribe to locale changes and trigger a re-render. */
export function useLocaleRerender(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((n) => n + 1);
    onLocaleChange(cb);
    return () => offLocaleChange(cb);
  }, []);
}

/**
 * Dismiss a dropdown / modal when clicking outside or pressing Escape.
 * Only attaches listeners while `open` is true.
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  containerRef?: RefObject<HTMLElement>,
): void {
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef?.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (containerRef) document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      if (containerRef) document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, containerRef]);
}

import { render } from "preact";
import { useState } from "preact/hooks";

type DotStatus = "loading" | "ready" | "error";

const STATUS_CLASSES: Record<DotStatus, string> = {
  loading: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
  ready: "bg-[var(--color-success-700)]",
  error: "bg-danger",
};

let rerender: ((s: DotStatus) => void) | null = null;

export function setDotStatus(s: DotStatus): void {
  rerender?.(s);
}

function StatusDotInner({ initial }: { initial: DotStatus }) {
  const [status, setStatus] = useState<DotStatus>(initial);
  rerender = setStatus;
  return (
    <div
      class={`h-2 w-2 rounded-full transition-[background] duration-300 ${STATUS_CLASSES[status]}`}
      aria-hidden="true"
    />
  );
}

export function mountStatusDot(container: HTMLElement, initial: DotStatus = "loading"): void {
  render(<StatusDotInner initial={initial} />, container);
}

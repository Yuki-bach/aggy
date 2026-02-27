import { useState } from "preact/hooks";
import { t } from "../../lib/i18n";

export function setWasmStatus(s: DotStatus, label?: string): void {
  rerender?.(s, label);
}

export default function WasmStatus() {
  const [status, setStatus] = useState<DotStatus>("loading");
  const [label, setLabel] = useState<string>(t("wasm.loading"));

  rerender = (s, l) => {
    setStatus(s);
    if (l !== undefined) setLabel(l);
  };

  return (
    <div
      class="flex min-w-40 items-center justify-end gap-2 text-[0.8125rem] text-muted"
      role="status"
      aria-live="polite"
    >
      <div
        class={`h-2 w-2 rounded-full transition-[background] duration-300 ${STATUS_CLASSES[status]}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

// ─── Internal ───────────────────────────────────────────────

type DotStatus = "loading" | "ready" | "error";

const STATUS_CLASSES: Record<DotStatus, string> = {
  loading: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
  ready: "bg-[var(--color-success-700)]",
  error: "bg-danger",
};

let rerender: ((s: DotStatus, label?: string) => void) | null = null;

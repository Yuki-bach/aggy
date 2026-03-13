import { useEffect, useState } from "preact/hooks";
import { setStatusListener, type DuckStatus } from "../../lib/duckdb";
import { t } from "../../lib/i18n";

export default function WasmStatus() {
  const [status, setStatus] = useState<DuckStatus>("loading");
  const [label, setLabel] = useState<string>(t("wasm.loading"));

  useEffect(() => {
    setStatusListener((s, l) => {
      setStatus(s);
      if (l !== undefined) setLabel(l);
    });
  }, []);

  return (
    <div
      class="flex min-w-40 items-center justify-end gap-2 text-sm text-muted"
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

const STATUS_CLASSES: Record<DuckStatus, string> = {
  loading: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
  ready: "bg-[var(--color-success-700)]",
  error: "bg-danger",
};

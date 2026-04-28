<script lang="ts">
  import { dbStatus, type DuckStatus } from "../../lib/duckdb.svelte";
  import { t } from "../../lib/i18n.svelte";

  const STATUS_CLASSES: Record<DuckStatus, string> = {
    idle: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
    loading: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
    ready: "bg-[var(--color-success-700)]",
    error: "bg-danger",
  };

  let label = $derived.by(() => {
    if (dbStatus.value === "error") {
      return t("wasm.error", { msg: dbStatus.errorMessage ?? "" });
    }
    return t(`wasm.${dbStatus.value}`);
  });
</script>

<div
  class="flex min-w-40 items-center justify-end gap-2 text-sm text-muted"
  role="status"
  aria-live="polite"
>
  <div
    class="h-2 w-2 rounded-full transition-[background] duration-300 {STATUS_CLASSES[
      dbStatus.value
    ]}"
    aria-hidden="true"
  ></div>
  <span>{label}</span>
</div>

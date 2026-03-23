<script lang="ts">
  import { onMount } from "svelte";
  import { setStatusListener, type DuckStatus } from "../../lib/duckdb";
  import { t } from "../../lib/i18n.svelte";

  const STATUS_CLASSES: Record<DuckStatus, string> = {
    loading: "bg-[var(--color-warning-700)] animate-[pulse_1s_infinite]",
    ready: "bg-[var(--color-success-700)]",
    error: "bg-danger",
  };

  let status = $state<DuckStatus>("loading");
  let label = $state<string>(t("wasm.loading"));

  onMount(() => {
    setStatusListener((s, l) => {
      status = s;
      if (l !== undefined) label = l;
    });
  });
</script>

<div
  class="flex min-w-40 items-center justify-end gap-2 text-sm text-muted"
  role="status"
  aria-live="polite"
>
  <div
    class="h-2 w-2 rounded-full transition-[background] duration-300 {STATUS_CLASSES[status]}"
    aria-hidden="true"
  ></div>
  <span>{label}</span>
</div>

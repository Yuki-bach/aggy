<script lang="ts">
  import { t } from "../../lib/i18n.svelte";
  import { clickOutside } from "../../lib/dismiss";
  import type { ExportAction } from "../../lib/export/export";

  interface Props {
    onExport: (action: ExportAction) => void;
  }

  let { onExport }: Props = $props();

  let open = $state(false);
  let feedback = $state<string | null>(null);

  function handleAction(action: ExportAction) {
    open = false;
    onExport(action);

    if (action.startsWith("copy-")) {
      feedback = t("export.copied");
      setTimeout(() => (feedback = null), 1500);
    }
  }

  let showFeedback = $derived(feedback !== null);
</script>

<div class="relative" {@attach clickOutside({ onClose: () => (open = false) })}>
  <button
    class="relative flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
    onclick={() => (open = !open)}
    aria-label={t("export.label")}
    title={t("export.label")}
  >
    {#if showFeedback}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    {:else}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    {/if}
  </button>

  {#if open}
    <div
      class="absolute right-0 z-10 mt-1 min-w-48 rounded-lg border border-border bg-surface shadow-lg"
    >
      <div class="px-3 pt-2.5 pb-1 text-xs font-medium tracking-wide text-muted uppercase">
        {t("export.section.copy")}
      </div>
      <button
        class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
        onclick={() => handleAction("copy-tsv")}>TSV</button
      >
      <button
        class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
        onclick={() => handleAction("copy-markdown")}>Markdown</button
      >
      <button
        class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
        onclick={() => handleAction("copy-json")}>JSON</button
      >

      <div class="mx-3 my-1 border-t border-border"></div>

      <div
        class="px-3 pt-1.5 pb-1 text-xs font-medium tracking-wide text-muted uppercase"
      >
        {t("export.section.download")}
      </div>
      <div class="pb-1.5">
        <button
          class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
          onclick={() => handleAction("download-csv")}>CSV</button
        >
        <button
          class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
          onclick={() => handleAction("download-markdown")}>Markdown (.md)</button
        >
        <button
          class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
          onclick={() => handleAction("download-json")}>JSON (.json)</button
        >
      </div>
    </div>
  {/if}
</div>

<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { t } from "@aggy/ui";

  interface Props {
    rawDataFileName: string | null;
    layoutFileName: string | null;
    onRawDataFile: (text: string, fileName: string) => void;
    onLayoutFile: (text: string, fileName: string) => void;
  }

  let { rawDataFileName, layoutFileName, onRawDataFile, onLayoutFile }: Props = $props();

  async function pickFile(
    extensions: string[],
    onFile: (text: string, fileName: string) => void,
  ) {
    const result = await invoke<[string, string] | null>("pick_and_read_text", { extensions });
    if (!result) return;
    const [text, fileName] = result;
    onFile(text, fileName);
  }
</script>

<div class="flex flex-col gap-3 md:flex-row">
  <div class="flex-1">
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-border-strong px-4 py-5 transition-colors hover:border-accent hover:bg-accent-bg"
      onclick={() => pickFile(["csv"], onRawDataFile)}
    >
      <div class="flex flex-col items-center gap-1">
        <span class="rounded-sm bg-accent-light px-3 py-1 text-xs font-bold tracking-wide text-accent">
          {t("dropzone.csv.icon")}
        </span>
        {#if rawDataFileName}
          <span class="max-w-full truncate text-sm font-medium text-[var(--color-success-700)]">
            {rawDataFileName}
          </span>
        {:else}
          <span class="text-sm font-medium text-text-secondary">{t("dropzone.csv.text")}</span>
        {/if}
      </div>
    </button>
  </div>
  <div class="flex-1">
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-border-strong px-4 py-5 transition-colors hover:border-accent hover:bg-accent-bg"
      onclick={() => pickFile(["json"], onLayoutFile)}
    >
      <div class="flex flex-col items-center gap-1">
        <span class="rounded-sm bg-accent-light px-3 py-1 text-xs font-bold tracking-wide text-accent">
          {t("dropzone.layout.icon")}
        </span>
        {#if layoutFileName}
          <span class="max-w-full truncate text-sm font-medium text-[var(--color-success-700)]">
            {layoutFileName}
          </span>
        {:else}
          <span class="text-sm font-medium text-text-secondary">{t("dropzone.layout.text")}</span>
        {/if}
      </div>
    </button>
  </div>
</div>

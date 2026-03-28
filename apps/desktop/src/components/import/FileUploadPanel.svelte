<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { t } from "@aggy/ui";

  interface Props {
    rawDataFileName: string | null;
    layoutFileName: string | null;
    onRawDataFile: (text: string, fileName: string) => void;
    onLayoutFile: (text: string, fileName: string) => void;
  }

  let { rawDataFileName, layoutFileName, onRawDataFile, onLayoutFile }: Props = $props();

  async function openCsvDialog() {
    const result = await open({
      multiple: false,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!result) return;
    const path = result as string;
    const text = await invoke<string>("read_file_text", { path });
    const fileName = path.split(/[\\/]/).at(-1) ?? "data.csv";
    onRawDataFile(text, fileName);
  }

  async function openJsonDialog() {
    const result = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!result) return;
    const path = result as string;
    const text = await invoke<string>("read_file_text", { path });
    const fileName = path.split(/[\\/]/).at(-1) ?? "layout.json";
    onLayoutFile(text, fileName);
  }
</script>

<div class="flex flex-col gap-3 md:flex-row">
  <div class="flex-1">
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-border-strong px-4 py-5 transition-colors hover:border-accent hover:bg-accent-bg"
      onclick={openCsvDialog}
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
      onclick={openJsonDialog}
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

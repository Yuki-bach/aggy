<script lang="ts">
  import { t } from "../../lib/i18n.svelte";

  interface Props {
    accept: string;
    icon: string;
    text: string;
    loadedFileName: string | null;
    onFile: (file: File) => void;
  }

  let { accept, icon, text, loadedFileName, onFile }: Props = $props();

  let isDragOver = $state(false);
  let inputEl: HTMLInputElement;

  let isLoaded = $derived(loadedFileName !== null);

  function handleChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const f = target.files?.[0];
    if (f) onFile(f);
    target.value = "";
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    const zone = e.currentTarget as HTMLElement;
    if (!zone.contains(e.relatedTarget as Node)) {
      isDragOver = false;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(accept)) return;
    onFile(file);
  }
</script>

<div
  role="button"
  tabindex="0"
  class="relative rounded-lg border-2 border-dashed border-border-strong px-4 py-5 transition-colors hover:border-accent hover:bg-accent-bg{isDragOver
    ? ' drag-over'
    : ''}{isLoaded ? ' loaded' : ''}"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <input
    bind:this={inputEl}
    type="file"
    {accept}
    class="absolute inset-0 cursor-pointer opacity-0"
    onchange={handleChange}
  />
  <div class="pointer-events-none flex flex-col items-center gap-1">
    <span class="rounded-sm bg-accent-light px-3 py-1 text-xs font-bold tracking-wide text-accent">
      {icon}
    </span>
    {#if isLoaded}
      <span class="max-w-full truncate text-sm font-medium text-[var(--color-success-700)]">
        {loadedFileName}
      </span>
    {:else}
      <span class="text-sm font-medium text-text-secondary">{text}</span>
    {/if}
  </div>
</div>

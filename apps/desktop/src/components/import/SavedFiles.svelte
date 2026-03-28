<script lang="ts">
  import type { SavedEntry } from "../../lib/storage";
  import { t } from "@aggy/ui";

  interface Props {
    entries: SavedEntry[];
    onSelectEntry: (folderId: string) => void;
    onDeleteEntry: (folderId: string) => void;
  }

  let { entries, onSelectEntry, onDeleteEntry }: Props = $props();
</script>

{#if entries.length === 0}
  <div class="p-4 text-center text-sm text-muted">{t("saved.empty")}</div>
{:else}
  {#each entries as entry (entry.folderId)}
    {@const date = new Date(entry.timestamp)}
    {@const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`}
    <div
      class="flex items-center gap-2 rounded-lg border border-transparent bg-surface2 transition-colors hover:border-border-strong"
    >
      <button
        class="min-h-11 flex-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-left text-sm text-text hover:text-accent"
        type="button"
        onclick={() => onSelectEntry(entry.folderId)}
      >
        {entry.rawDataName} ({dateStr})
      </button>
      <button
        class="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center px-3 py-2 text-sm text-muted transition-colors hover:text-danger"
        type="button"
        aria-label={t("saved.delete", { name: entry.rawDataName })}
        onclick={(e: MouseEvent) => {
          e.stopPropagation();
          onDeleteEntry(entry.folderId);
        }}
      >
        &times;
      </button>
    </div>
  {/each}
{/if}

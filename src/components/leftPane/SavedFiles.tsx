import { render } from "preact";
import { listSaved, deleteSaved } from "../../lib/opfs";
import { t } from "../../lib/i18n";

type OnSelectCallback = (folderId: string) => void;

let onSelect: OnSelectCallback = () => {};

interface SavedEntry {
  folderId: string;
  csvName: string;
  timestamp: number;
}

function SavedFilesList({
  entries,
  onSelectEntry,
}: {
  entries: SavedEntry[];
  onSelectEntry: OnSelectCallback;
}) {
  if (entries.length === 0) {
    return <div class="p-4 text-center text-[0.875rem] text-muted">{t("saved.empty")}</div>;
  }

  return (
    <>
      {entries.map((entry) => {
        const date = new Date(entry.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

        return (
          <div
            key={entry.folderId}
            class="flex items-center gap-2 rounded-lg border border-transparent bg-surface2 transition-[border-color] duration-150 hover:border-border-strong"
          >
            <button
              class="min-h-11 flex-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap border-none bg-transparent px-4 py-3 text-left font-[var(--font-family-base)] text-[0.875rem] text-text hover:text-accent"
              type="button"
              onClick={() => onSelectEntry(entry.folderId)}
            >
              {entry.csvName} ({dateStr})
            </button>
            <button
              class="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent px-3 py-2 font-[var(--font-family-base)] text-[0.875rem] text-muted transition-[color] duration-150 hover:text-danger"
              type="button"
              aria-label={t("saved.delete", { name: entry.csvName })}
              onClick={async (e) => {
                e.stopPropagation();
                await deleteSaved(entry.folderId);
                refreshList();
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </>
  );
}

export function initSavedFiles(onSelectCb: OnSelectCallback): void {
  onSelect = onSelectCb;
  refreshList();
}

export async function refreshList(): Promise<void> {
  const container = document.getElementById("saved-files-list")!;

  let entries: SavedEntry[];
  try {
    entries = await listSaved();
  } catch {
    render(<></>, container);
    return;
  }

  render(<SavedFilesList entries={entries} onSelectEntry={onSelect} />, container);
}

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
    return <div class="saved-empty">{t("saved.empty")}</div>;
  }

  return (
    <>
      {entries.map((entry) => {
        const date = new Date(entry.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

        return (
          <div key={entry.folderId} class="saved-item">
            <button
              class="saved-item-load"
              type="button"
              onClick={() => onSelectEntry(entry.folderId)}
            >
              {entry.csvName} ({dateStr})
            </button>
            <button
              class="saved-item-del"
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

import { useCallback, useEffect, useState } from "preact/hooks";
import { type SavedEntry, listSaved, deleteSaved } from "../../lib/opfs";
import { t } from "../../lib/i18n";

/** Trigger refresh from outside Preact (e.g. after saving to OPFS) */
export function triggerSavedFilesRefresh(): void {
  for (const fn of listeners) fn();
}

/** Hook that manages saved-files list state */
export function useSavedFiles() {
  const [entries, setEntries] = useState<SavedEntry[]>([]);

  const refresh = useCallback(async () => {
    try {
      setEntries(await listSaved());
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  const deleteEntry = useCallback(
    async (folderId: string) => {
      await deleteSaved(folderId);
      refresh();
    },
    [refresh],
  );

  return { entries, deleteEntry };
}

export function SavedFilesList({
  entries,
  onSelectEntry,
  onDeleteEntry,
}: {
  entries: SavedEntry[];
  onSelectEntry: (folderId: string) => void;
  onDeleteEntry: (folderId: string) => void;
}) {
  if (entries.length === 0) {
    return <div class="p-4 text-center text-sm text-muted">{t("saved.empty")}</div>;
  }

  return (
    <>
      {entries.map((entry) => {
        const date = new Date(entry.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

        return (
          <div
            key={entry.folderId}
            class="flex items-center gap-2 rounded-lg border border-transparent bg-surface2 transition-colors hover:border-border-strong"
          >
            <button
              class="min-h-11 flex-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-left text-sm text-text hover:text-accent"
              type="button"
              onClick={() => onSelectEntry(entry.folderId)}
            >
              {entry.csvName} ({dateStr})
            </button>
            <button
              class="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center px-3 py-2 text-sm text-muted transition-colors hover:text-danger"
              type="button"
              aria-label={t("saved.delete", { name: entry.csvName })}
              onClick={async (e) => {
                e.stopPropagation();
                onDeleteEntry(entry.folderId);
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

// ─── Internal ───────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

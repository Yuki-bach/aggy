import { type SavedEntry, listSaved, deleteSaved } from "./opfs";

let entries = $state<SavedEntry[]>([]);

export function getSavedEntries(): SavedEntry[] {
  return entries;
}

export async function refreshSavedFiles(): Promise<void> {
  try {
    entries = await listSaved();
  } catch {
    entries = [];
  }
}

export async function deleteSavedEntry(folderId: string): Promise<void> {
  await deleteSaved(folderId);
  await refreshSavedFiles();
}

import type { SavedEntry } from "./storage";
import { listEntries, deleteEntry } from "./storage";

let entries = $state<SavedEntry[]>([]);

export function getSavedEntries(): SavedEntry[] {
  return entries;
}

export async function refreshSavedFiles(): Promise<void> {
  try {
    entries = await listEntries();
  } catch {
    entries = [];
  }
}

export async function deleteSavedEntry(folderId: string): Promise<void> {
  await deleteEntry(folderId);
  await refreshSavedFiles();
}

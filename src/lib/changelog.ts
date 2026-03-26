import type { Locale } from "./i18n.svelte";
import entries from "./changelog.json";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Array<Record<Locale, string>>;
}

export const changelog: ChangelogEntry[] = entries;

const STORAGE_KEY = "aggy-changelog-seen";

export function hasUnreadChanges(): boolean {
  if (changelog.length === 0) return false;
  return localStorage.getItem(STORAGE_KEY) !== changelog[0].version;
}

export function markChangelogSeen(): void {
  if (changelog.length === 0) return;
  localStorage.setItem(STORAGE_KEY, changelog[0].version);
}

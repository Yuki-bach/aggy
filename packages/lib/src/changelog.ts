type Locale = "ja" | "en";
import entries from "./changelog.json";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Array<Record<Locale, string>>;
}

export const changelog: ChangelogEntry[] = entries;

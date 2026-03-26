import type { Tab } from "../../agg/types";

export function formatJSON(tabs: Tab[], weightCol: string): string {
  return JSON.stringify({ weightColumn: weightCol || null, results: tabs }, null, 2);
}

import type { Tab } from "../../agg/types";
import { tabsToLongRows } from "./longFormat";

export function formatCSV(tabs: Tab[]): string {
  const rows = tabsToLongRows(tabs);
  return rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

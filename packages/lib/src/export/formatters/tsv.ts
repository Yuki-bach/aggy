import type { Tab } from "../../agg/types";
import { tabsToLongRows } from "./longFormat";

export function formatTSV(tabs: Tab[]): string {
  const rows = tabsToLongRows(tabs);
  return rows.map((r) => r.join("\t")).join("\n");
}

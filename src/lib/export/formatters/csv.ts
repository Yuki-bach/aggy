import type { Tab } from "../../agg/types";
import { downloadFile, today } from "../deliver";
import { tabsToLongRows } from "./longFormat";

export function formatCSV(tabs: Tab[]): string {
  const rows = tabsToLongRows(tabs);
  return rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

export function downloadCSV(tabs: Tab[]): void {
  const bom = "\uFEFF";
  const csv = bom + formatCSV(tabs);
  downloadFile(csv, `result_${today()}.csv`, "text/csv;charset=utf-8;");
}

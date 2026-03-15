import type { Tab } from "../../agg/types";
import { downloadFile, today } from "../download";

export function formatJSON(tabs: Tab[], weightCol: string): string {
  return JSON.stringify({ weightColumn: weightCol || null, results: tabs }, null, 2);
}

export function downloadJSON(tabs: Tab[], weightCol: string): void {
  const json = formatJSON(tabs, weightCol);
  downloadFile(json, `result_${today()}.json`, "application/json;charset=utf-8;");
}

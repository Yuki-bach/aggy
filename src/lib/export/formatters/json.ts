import type { Tally } from "../../agg/types";
import { downloadFile, today } from "../export";

export function formatJSON(tallies: Tally[], weightCol: string): string {
  return JSON.stringify({ weightColumn: weightCol || null, results: tallies }, null, 2);
}

export function downloadJSON(tallies: Tally[], weightCol: string): void {
  const json = formatJSON(tallies, weightCol);
  downloadFile(json, `result_${today()}.json`, "application/json;charset=utf-8;");
}

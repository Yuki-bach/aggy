import type { Tally } from "../../agg/types";
import { downloadFile, today } from "../export";
import { talliesToLongRows } from "../longFormat";

export function formatCSV(tallies: Tally[]): string {
  const rows = talliesToLongRows(tallies);
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export function downloadCSV(tallies: Tally[]): void {
  const bom = "\uFEFF";
  const csv = bom + formatCSV(tallies);
  downloadFile(csv, `result_${today()}.csv`, "text/csv;charset=utf-8;");
}

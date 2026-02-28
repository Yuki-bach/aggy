import type { ExportGrid } from "../exportGrid";
import { downloadFile, today } from "../export";

export function formatCSV(grids: ExportGrid[]): string {
  const allRows: string[][] = [];
  const headers = grids[0]?.headers ?? [];
  for (const row of headers) allRows.push(row);

  for (const grid of grids) {
    for (const row of grid.rows) allRows.push(row);
    allRows.push([]);
  }

  return allRows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export function downloadCSV(grids: ExportGrid[], hasCross: boolean): void {
  const bom = "\uFEFF";
  const csv = bom + formatCSV(grids);
  const prefix = hasCross ? "cross_result" : "gt_result";
  downloadFile(csv, `${prefix}_${today()}.csv`, "text/csv;charset=utf-8;");
}

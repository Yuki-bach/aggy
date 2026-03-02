import type { AggResult } from "../agg/aggregate";
import type { LabelMap } from "../layout";
import { buildExportGrids } from "./exportGrid";
import { pivot } from "../agg/pivot";
import { downloadCSV } from "./formatters/csv";
import { formatTSV, formatHTML } from "./formatters/tsv";
import { formatMarkdown, downloadMarkdown } from "./formatters/markdown";
import { formatJSON, downloadJSON } from "./formatters/json";
import { copyToClipboard } from "./clipboard";

export type ExportAction =
  | "copy-tsv"
  | "copy-markdown"
  | "copy-json"
  | "download-csv"
  | "download-markdown"
  | "download-json";

export async function executeExport(
  action: ExportAction,
  results: AggResult[],
  weightCol: string,
  labelMap: LabelMap,
): Promise<boolean> {
  const hasCross = results.some((r) => pivot(r.cells, r.nBySubLabel).subs.length > 1);

  switch (action) {
    case "download-csv": {
      const grids = buildExportGrids(results, labelMap);
      downloadCSV(grids, hasCross);
      return true;
    }
    case "download-markdown": {
      const grids = buildExportGrids(results, labelMap);
      downloadMarkdown(grids, hasCross);
      return true;
    }
    case "download-json": {
      downloadJSON(results, weightCol, labelMap, hasCross);
      return true;
    }
    case "copy-tsv": {
      const grids = buildExportGrids(results, labelMap);
      const tsv = formatTSV(grids);
      const html = formatHTML(grids);
      await copyToClipboard({ "text/plain": tsv, "text/html": html });
      return true;
    }
    case "copy-markdown": {
      const grids = buildExportGrids(results, labelMap);
      const md = formatMarkdown(grids);
      await copyToClipboard({ "text/plain": md });
      return true;
    }
    case "copy-json": {
      const json = formatJSON(results, weightCol, labelMap);
      await copyToClipboard({ "text/plain": json });
      return true;
    }
  }
}

// ─── Shared helpers ───────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

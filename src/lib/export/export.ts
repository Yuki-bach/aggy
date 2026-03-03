import type { Tally } from "../agg/types";
import { buildExportGrids } from "./exportGrid";
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
  tallies: Tally[],
  weightCol: string,
): Promise<boolean> {
  const hasCross = tallies.some((t) => t.by !== null);

  switch (action) {
    case "download-csv": {
      const grids = buildExportGrids(tallies);
      downloadCSV(grids, hasCross);
      return true;
    }
    case "download-markdown": {
      const grids = buildExportGrids(tallies);
      downloadMarkdown(grids, hasCross);
      return true;
    }
    case "download-json": {
      downloadJSON(tallies, weightCol, hasCross);
      return true;
    }
    case "copy-tsv": {
      const grids = buildExportGrids(tallies);
      const tsv = formatTSV(grids);
      const html = formatHTML(grids);
      await copyToClipboard({ "text/plain": tsv, "text/html": html });
      return true;
    }
    case "copy-markdown": {
      const grids = buildExportGrids(tallies);
      const md = formatMarkdown(grids);
      await copyToClipboard({ "text/plain": md });
      return true;
    }
    case "copy-json": {
      const json = formatJSON(tallies, weightCol);
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

import type { Tally } from "../agg/types";
import { buildExportGrids } from "./exportGrid";
import { downloadCSV } from "./formatters/csv";
import { formatTSV } from "./formatters/tsv";
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
  switch (action) {
    case "download-csv": {
      downloadCSV(tallies);
      return true;
    }
    case "download-markdown": {
      const hasCross = tallies.some((t) => t.by !== null);
      const grids = buildExportGrids(tallies);
      downloadMarkdown(grids, hasCross);
      return true;
    }
    case "download-json": {
      downloadJSON(tallies, weightCol);
      return true;
    }
    case "copy-tsv": {
      const tsv = formatTSV(tallies);
      await copyToClipboard({ "text/plain": tsv });
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

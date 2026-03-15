import type { Tab } from "../agg/types";
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
  tabs: Tab[],
  weightCol: string,
): Promise<boolean> {
  switch (action) {
    case "download-csv": {
      downloadCSV(tabs);
      return true;
    }
    case "download-markdown": {
      downloadMarkdown(tabs);
      return true;
    }
    case "download-json": {
      downloadJSON(tabs, weightCol);
      return true;
    }
    case "copy-tsv": {
      const tsv = formatTSV(tabs);
      await copyToClipboard({ "text/plain": tsv });
      return true;
    }
    case "copy-markdown": {
      const md = formatMarkdown(tabs);
      await copyToClipboard({ "text/plain": md });
      return true;
    }
    case "copy-json": {
      const json = formatJSON(tabs, weightCol);
      await copyToClipboard({ "text/plain": json });
      return true;
    }
  }
}

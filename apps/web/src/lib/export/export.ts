import type { Tab } from "@aggy/lib";
import { formatCSV, formatTSV, formatMarkdown, formatJSON } from "@aggy/lib";
import { copyToClipboard, downloadFile, today } from "./deliver";

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
      const bom = "\uFEFF";
      const csv = bom + formatCSV(tabs);
      downloadFile(csv, `result_${today()}.csv`, "text/csv;charset=utf-8;");
      return true;
    }
    case "download-markdown": {
      const md = formatMarkdown(tabs);
      downloadFile(md, `result_${today()}.md`, "text/markdown;charset=utf-8;");
      return true;
    }
    case "download-json": {
      const json = formatJSON(tabs, weightCol);
      downloadFile(json, `result_${today()}.json`, "application/json;charset=utf-8;");
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

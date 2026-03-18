import type { Tab } from "../../agg/types";
import { buildExportGrids, type ExportGrid } from "./grid";
import { downloadFile, today } from "../deliver";

export function formatMarkdown(tabs: Tab[]): string {
  const grids = buildExportGrids(tabs);
  return gridsToMarkdown(grids);
}

export function downloadMarkdown(tabs: Tab[]): void {
  const md = formatMarkdown(tabs);
  downloadFile(md, `result_${today()}.md`, "text/markdown;charset=utf-8;");
}

// ─── Internal ───────────────────────────────────────────────

function gridsToMarkdown(grids: ExportGrid[]): string {
  const sections: string[] = [];

  for (const grid of grids) {
    const lines: string[] = [];
    lines.push(`### ${grid.questionCode} (${grid.type})`);
    lines.push("");

    // Use last header row as column names, first row (if cross) as context
    const headers = grid.headers;
    if (headers.length === 2) {
      // Cross-tab: merge header rows
      const merged = headers[0].map((h, i) => {
        const sub = headers[1][i];
        if (h && sub) return `${h} ${sub}`;
        return h || sub;
      });
      lines.push(pipeRow(merged));
      lines.push(separatorRow(merged.length));
    } else if (headers.length === 1) {
      lines.push(pipeRow(headers[0]));
      lines.push(separatorRow(headers[0].length));
    }

    for (const row of grid.rows) {
      lines.push(pipeRow(row));
    }

    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

function pipeRow(cells: string[]): string {
  return `| ${cells.map((c) => escapeMarkdown(c)).join(" | ")} |`;
}

function separatorRow(colCount: number): string {
  return `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`;
}

function escapeMarkdown(s: string): string {
  return s.replace(/\|/g, "\\|");
}

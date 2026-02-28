import type { ExportGrid } from "../exportGrid";

export function formatTSV(grids: ExportGrid[]): string {
  const lines: string[] = [];
  const headers = grids[0]?.headers ?? [];
  for (const row of headers) lines.push(row.join("\t"));

  for (const grid of grids) {
    for (const row of grid.rows) lines.push(row.join("\t"));
    lines.push("");
  }

  return lines.join("\n");
}

export function formatHTML(grids: ExportGrid[]): string {
  const parts: string[] = [];

  for (const grid of grids) {
    const rows: string[] = [];
    rows.push("<table>");

    // Headers
    rows.push("<thead>");
    for (const headerRow of grid.headers) {
      rows.push("<tr>");
      for (const cell of headerRow) {
        rows.push(`<th>${escapeHtml(cell)}</th>`);
      }
      rows.push("</tr>");
    }
    rows.push("</thead>");

    // Body
    rows.push("<tbody>");
    for (const dataRow of grid.rows) {
      rows.push("<tr>");
      for (const cell of dataRow) {
        rows.push(`<td>${escapeHtml(cell)}</td>`);
      }
      rows.push("</tr>");
    }
    rows.push("</tbody>");

    rows.push("</table>");
    parts.push(rows.join(""));
  }

  return parts.join("");
}

// ─── Internal ───────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

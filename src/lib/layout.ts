import type { Question } from "./agg/types";

export interface LayoutItem {
  code: string;
  label: string;
}

export type LayoutColType = "SA" | "MA" | "WEIGHT";

export interface LayoutEntry {
  key: string;
  label?: string;
  type: LayoutColType;
  items?: LayoutItem[];
}

export type Layout = LayoutEntry[];

export function parseLayout(jsonText: string): Layout {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSONの解析に失敗しました。ファイルの形式を確認してください。");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("レイアウトファイルはJSON配列である必要があります。");
  }
  for (const entry of parsed as unknown[]) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("各エントリはオブジェクトである必要があります。");
    }
    const e = entry as Record<string, unknown>;
    if (typeof e["key"] !== "string") {
      throw new Error('各エントリに "key"（文字列）が必要です。');
    }
    if (typeof e["type"] !== "string") {
      throw new Error('各エントリに "type"（文字列）が必要です。');
    }
  }
  return parsed as Layout;
}

/** Build Question[] from CSV headers and layout definition */
export function buildQuestions(headers: string[], layout: Layout): Question[] {
  const headerSet = new Set(headers);
  const questions: Question[] = [];

  for (const entry of layout) {
    if (entry.type === "SA") {
      if (!headerSet.has(entry.key)) continue;
      const codes = entry.items?.map((i) => i.code) ?? [];
      const labels: Record<string, string> = {};
      if (entry.items) {
        for (const item of entry.items) {
          labels[item.code] = item.label;
        }
      }
      questions.push({
        type: "SA",
        code: entry.key,
        columns: [entry.key],
        codes,
        label: entry.label ?? entry.key,
        labels,
      });
    } else if (entry.type === "MA" && entry.items) {
      const columns: string[] = [];
      const codes: string[] = [];
      const labels: Record<string, string> = {};
      for (const item of entry.items) {
        const col = `${entry.key}_${item.code}`;
        if (headerSet.has(col)) {
          columns.push(col);
          codes.push(item.code);
          labels[item.code] = item.label;
        }
      }
      if (columns.length > 0) {
        questions.push({
          type: "MA",
          code: entry.key,
          columns,
          codes,
          label: entry.label ?? entry.key,
          labels,
        });
      }
    }
  }

  return questions;
}

/** Find weight column name from layout, or empty string if none */
export function findWeightColumn(layout: Layout): string {
  return layout.find((e) => e.type === "WEIGHT")?.key ?? "";
}

/** Count total layout-defined columns (SA: 1 each, MA: items count, WEIGHT: 1) */
export function countLayoutColumns(layout: Layout): number {
  return layout.reduce((acc, e) => acc + (e.type === "MA" ? (e.items?.length ?? 0) : 1), 0);
}

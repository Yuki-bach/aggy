import type { Question, QuestionType } from "./agg/types";

interface LayoutItem {
  code: string;
  label: string;
}

export type DateGranularity = "year" | "month" | "week" | "day";

interface LayoutEntry {
  key: string;
  label?: string;
  type: QuestionType | "WEIGHT" | "DATE";
  items?: LayoutItem[];
  granularity?: DateGranularity;
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

/** Filter layout entries to only include columns present in CSV headers */
export function filterLayout(headers: string[], layout: Layout): Layout {
  const headerSet = new Set(headers);
  const filtered: Layout = [];

  for (const entry of layout) {
    if (
      entry.type === "SA" ||
      entry.type === "NA" ||
      entry.type === "WEIGHT" ||
      entry.type === "DATE"
    ) {
      if (headerSet.has(entry.key)) filtered.push(entry);
    } else if (entry.type === "MA" && entry.items) {
      const matchedItems = entry.items.filter((item) => headerSet.has(`${entry.key}_${item.code}`));
      if (matchedItems.length > 0) {
        filtered.push({ ...entry, items: matchedItems });
      }
    }
  }

  return filtered;
}

/** Build Question[] from layout definition */
export function buildQuestions(layout: Layout): Question[] {
  return layout
    .filter((e) => e.type === "SA" || e.type === "MA" || e.type === "NA")
    .map((e) => {
      if (e.type === "NA") {
        return {
          type: "NA" as const,
          code: e.key,
          columns: [e.key],
          codes: [],
          label: e.label ?? e.key,
          labels: {},
        };
      }
      return {
        type: e.type as "SA" | "MA",
        code: e.key,
        columns: e.type === "SA" ? [e.key] : (e.items ?? []).map((i) => `${e.key}_${i.code}`),
        codes: (e.items ?? []).map((i) => i.code),
        label: e.label ?? e.key,
        labels: Object.fromEntries((e.items ?? []).map((i) => [i.code, i.label])),
      };
    });
}

/** Find weight column name from layout, or empty string if none */
export function findWeightColumn(layout: Layout): string {
  return layout.find((e) => e.type === "WEIGHT")?.key ?? "";
}

/** Count total layout-defined columns (SA: 1 each, MA: items count, WEIGHT: 1) */
export function countLayoutColumns(layout: Layout): number {
  return layout.reduce((acc, e) => acc + (e.type === "MA" ? (e.items?.length ?? 0) : 1), 0);
}

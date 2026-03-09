import type { Question, QuestionType } from "./agg/types";

interface LayoutItem {
  code: string;
  label: string;
}

export type DateGranularity = "year" | "month" | "week" | "day";

interface LayoutEntry {
  key: string;
  label?: string;
  type: QuestionType | "WEIGHT" | "DATE" | "MATRIX";
  items?: LayoutItem[];
  granularity?: DateGranularity;
  matrixKey?: string;
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
  // Validate matrixKey references
  const parsedLayout = parsed as Layout;
  const matrixKeys = new Set(parsedLayout.filter((e) => e.type === "MATRIX").map((e) => e.key));
  for (const entry of parsedLayout) {
    if (entry.matrixKey && !matrixKeys.has(entry.matrixKey)) {
      throw new Error(
        `matrixKey "${entry.matrixKey}" が指定されていますが、対応する MATRIX エントリが見つかりません。`,
      );
    }
  }
  return parsedLayout;
}

/** Filter layout entries to only include columns present in CSV headers */
export function filterLayout(headers: string[], layout: Layout): Layout {
  const headerSet = new Set(headers);
  const filtered: Layout = [];

  for (const entry of layout) {
    if (entry.type === "MATRIX") {
      // MATRIX parents are always kept initially (pruned below if orphaned)
      filtered.push(entry);
    } else if (
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

  // Remove orphan MATRIX parents (no children survived filtering)
  const survivingMatrixKeys = new Set(filtered.filter((e) => e.matrixKey).map((e) => e.matrixKey));
  return filtered.filter((e) => e.type !== "MATRIX" || survivingMatrixKeys.has(e.key));
}

/** Build Question[] from layout definition */
export function buildQuestions(layout: Layout): Question[] {
  return layout
    .filter((e) => e.type === "SA" || e.type === "MA" || e.type === "NA")
    .map((e) => {
      const base = e.matrixKey ? { matrixKey: e.matrixKey } : {};
      if (e.type === "NA") {
        return {
          type: "NA" as const,
          code: e.key,
          columns: [e.key],
          codes: [],
          label: e.label ?? e.key,
          labels: {},
          ...base,
        };
      }
      return {
        type: e.type as "SA" | "MA",
        code: e.key,
        columns: e.type === "SA" ? [e.key] : (e.items ?? []).map((i) => `${e.key}_${i.code}`),
        codes: (e.items ?? []).map((i) => i.code),
        label: e.label ?? e.key,
        labels: Object.fromEntries((e.items ?? []).map((i) => [i.code, i.label])),
        ...base,
      };
    });
}

/** Find weight column name from layout, or empty string if none */
export function findWeightColumn(layout: Layout): string {
  return layout.find((e) => e.type === "WEIGHT")?.key ?? "";
}

export interface MatrixGroup {
  matrixKey: string;
  matrixLabel: string;
  questionCodes: string[];
}

export function buildMatrixGroups(layout: Layout): MatrixGroup[] {
  return layout
    .filter((e) => e.type === "MATRIX")
    .map((p) => ({
      matrixKey: p.key,
      matrixLabel: p.label ?? p.key,
      questionCodes: layout.filter((e) => e.matrixKey === p.key).map((e) => e.key),
    }));
}

/** Count total layout-defined columns (SA: 1 each, MA: items count, WEIGHT: 1, MATRIX: 0) */
export function countLayoutColumns(layout: Layout): number {
  return layout.reduce(
    (acc, e) => acc + (e.type === "MATRIX" ? 0 : e.type === "MA" ? (e.items?.length ?? 0) : 1),
    0,
  );
}

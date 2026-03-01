import type { QuestionDef } from "./agg/aggregate";

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

export interface LabelMap {
  /** Question labels: CSV column name (or MA group name) → display name */
  questionLabels: Record<string, string>;
  /** Value labels: SA → { colName: { code: label } }, MA → { colName: { "1": itemLabel } } */
  valueLabels: Record<string, Record<string, string>>;
}

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

/** Build QuestionDef[] from CSV headers and layout definition */
export function buildQuestionDefs(headers: string[], layout: Layout): QuestionDef[] {
  // Build a column→type lookup from layout
  const colTypes = new Map<string, string>();
  for (const entry of layout) {
    if (entry.type === "SA") {
      colTypes.set(entry.key, "sa");
    } else if (entry.type === "MA" && entry.items) {
      for (const item of entry.items) {
        colTypes.set(`${entry.key}_${item.code}`, `ma:${entry.key}`);
      }
    }
  }

  const questions: QuestionDef[] = [];
  const maAccum: Record<string, string[]> = {};
  for (const col of headers) {
    const t = colTypes.get(col);
    if (!t) continue;
    if (t === "sa") {
      questions.push({ type: "SA", column: col });
    } else if (t.startsWith("ma:")) {
      (maAccum[t.slice(3)] ??= []).push(col);
    }
  }
  for (const [prefix, cols] of Object.entries(maAccum)) {
    questions.push({ type: "MA", prefix, columns: cols });
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

export function buildLabelMap(layout: Layout): LabelMap {
  const questionLabels: Record<string, string> = {};
  const valueLabels: Record<string, Record<string, string>> = {};

  for (const entry of layout) {
    const { key, label, type, items } = entry;

    if (label) {
      questionLabels[key] = label;
    }

    switch (type) {
      case "SA":
        if (items) {
          const map: Record<string, string> = {};
          for (const item of items) {
            map[item.code] = item.label;
          }
          valueLabels[key] = map;
        }
        break;
      case "MA":
        if (items) {
          for (const item of items) {
            const colName = `${key}_${item.code}`;
            valueLabels[colName] = { "1": item.label };
          }
        }
        break;
    }
  }

  return { questionLabels, valueLabels };
}

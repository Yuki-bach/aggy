import type { QuestionDef } from "./agg/aggregate";

export interface LayoutItem {
  code: string;
  label: string;
  column?: string; // Explicit column name (defaults to `{key}_{code}`)
}

export type LayoutColType = "SA" | "MA" | "ID" | "WEIGHT" | "EXCLUDE";

export interface LayoutEntry {
  key: string;
  label?: string;
  type: LayoutColType;
  items?: LayoutItem[];
}

export type Layout = LayoutEntry[];

export interface LayoutMeta {
  /** Question labels: CSV column name (or MA group name) → display name */
  questionLabels: Record<string, string>;
  /** Value labels: SA → { colName: { code: label } }, MA → { colName: { "1": itemLabel } } */
  valueLabels: Record<string, Record<string, string>>;
  /** Column types: { colName → type string } */
  colTypes: Record<string, string>;
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

/** Build QuestionDef[] from headers and colTypes */
export function buildQuestionDefs(
  headers: string[],
  colTypes: Record<string, string>,
): QuestionDef[] {
  const questions: QuestionDef[] = [];
  const maAccum: Record<string, string[]> = {};
  for (const col of headers) {
    const t = colTypes[col];
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

export function buildLayoutMeta(layout: Layout): LayoutMeta {
  const questionLabels: Record<string, string> = {};
  const valueLabels: Record<string, Record<string, string>> = {};
  const colTypes: Record<string, string> = {};

  for (const entry of layout) {
    const { key, label, type, items } = entry;

    if (label) {
      questionLabels[key] = label;
    }

    switch (type) {
      case "ID":
        colTypes[key] = "id";
        break;
      case "WEIGHT":
        colTypes[key] = "weight";
        break;
      case "EXCLUDE":
        colTypes[key] = "exclude";
        break;
      case "SA":
        colTypes[key] = "sa";
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
            const colName = item.column ?? `${key}_${item.code}`;
            colTypes[colName] = `ma:${key}`;
            // MA columns are 1/0 flags; store item.label as display label for "1"
            valueLabels[colName] = { "1": item.label };
          }
        }
        break;
    }
  }

  return { questionLabels, valueLabels, colTypes };
}

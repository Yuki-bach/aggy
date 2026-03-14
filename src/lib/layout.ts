import type { Question } from "./agg/types";

export interface LayoutItem {
  code: string;
  label: string;
}

export type DateGranularity = "year" | "month" | "week" | "day";

type SALayout = { type: "SA"; key: string; label: string; items: LayoutItem[] };
type MALayout = { type: "MA"; key: string; label: string; items: LayoutItem[] };
type NALayout = { type: "NA"; key: string; label: string };
type WeightLayout = { type: "WEIGHT"; key: string; label: string };
type DateLayout = {
  type: "DATE";
  key: string;
  label: string;
  granularity: DateGranularity;
};

export type LayoutQuestion = SALayout | MALayout | NALayout | WeightLayout | DateLayout;

export type Layout = LayoutQuestion[];

const VALID_TYPES = new Set(["SA", "MA", "NA", "WEIGHT", "DATE"]);
const VALID_GRANULARITIES = new Set(["year", "month", "week", "day"]);

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
    if (typeof e["type"] !== "string" || !VALID_TYPES.has(e["type"])) {
      throw new Error(
        `"${e["key"]}": "type" は ${[...VALID_TYPES].join(", ")} のいずれかである必要があります。`,
      );
    }
    if (typeof e["label"] !== "string") {
      throw new Error(`"${e["key"]}": "label"（文字列）が必要です。`);
    }
    const type = e["type"] as string;
    if (type === "SA" || type === "MA") {
      if (!Array.isArray(e["items"]) || e["items"].length === 0) {
        throw new Error(`"${e["key"]}": ${type} には "items"（1件以上の配列）が必要です。`);
      }
    }
    if (type === "DATE") {
      if (typeof e["granularity"] !== "string" || !VALID_GRANULARITIES.has(e["granularity"])) {
        throw new Error(
          `"${e["key"]}": DATE には "granularity"（${[...VALID_GRANULARITIES].join(", ")}）が必要です。`,
        );
      }
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
    } else if (entry.type === "MA") {
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
      if (e.type === "NA") return buildNAQuestion(e);
      return buildChoiceQuestion(e);
    });
}

function buildNAQuestion(e: NALayout): Question {
  return {
    type: "NA",
    code: e.key,
    columns: [e.key],
    codes: [],
    label: e.label,
    labels: {},
  };
}

function buildChoiceQuestion(e: SALayout | MALayout): Question {
  return {
    type: e.type,
    code: e.key,
    columns: e.type === "SA" ? [e.key] : e.items.map((i) => `${e.key}_${i.code}`),
    codes: e.items.map((i) => i.code),
    label: e.label,
    labels: Object.fromEntries(e.items.map((i) => [i.code, i.label])),
  };
}

/** Find weight column name from layout, or empty string if none */
export function findWeightColumn(layout: Layout): string {
  return layout.find((e) => e.type === "WEIGHT")?.key ?? "";
}

/** Count total layout-defined columns (SA: 1 each, MA: items count, WEIGHT: 1) */
export function countLayoutColumns(layout: Layout): number {
  return layout.reduce((acc, e) => acc + (e.type === "MA" ? e.items.length : 1), 0);
}

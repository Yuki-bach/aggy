import type { Question } from "./agg/types";
import type { Diagnostic } from "./validateRawData";

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

/** Parse JSON text into an unknown array. Throws only on JSON syntax errors or non-array input. */
export function parseLayoutJson(jsonText: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSONの解析に失敗しました。ファイルの形式を確認してください。");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("レイアウトファイルはJSON配列である必要があります。");
  }
  return parsed as unknown[];
}

/** Validate layout structure and return diagnostics (does not throw). */
export function validateLayoutStructure(raw: unknown[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (let i = 0; i < raw.length; i++) {
    const reason = checkEntry(raw[i]);
    if (reason) {
      const entry = raw[i];
      const e =
        typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : null;
      const key = e && typeof e["key"] === "string" ? e["key"] : `[${i}]`;
      const label = e && typeof e["label"] === "string" ? (e["label"] as string) : "";
      diagnostics.push({
        key,
        label,
        severity: "error",
        type: "invalidLayout",
        params: { reason },
      });
    }
  }

  return diagnostics;
}

/** Build Layout from raw entries that pass structure validation. */
export function buildValidLayout(raw: unknown[]): Layout {
  const layout: Layout = [];
  for (let i = 0; i < raw.length; i++) {
    if (!checkEntry(raw[i])) layout.push(raw[i] as LayoutQuestion);
  }
  return layout;
}

/** Return error reason string if entry is invalid, or null if valid. */
function checkEntry(entry: unknown): string | null {
  if (typeof entry !== "object" || entry === null) {
    return "各エントリはオブジェクトである必要があります";
  }
  const e = entry as Record<string, unknown>;
  if (typeof e["key"] !== "string") return '"key"（文字列）が必要です';
  if (typeof e["type"] !== "string" || !VALID_TYPES.has(e["type"])) {
    return `"type" は ${[...VALID_TYPES].join(", ")} のいずれかである必要があります`;
  }
  if (typeof e["label"] !== "string") return '"label"（文字列）が必要です';
  const type = e["type"] as string;
  if ((type === "SA" || type === "MA") && (!Array.isArray(e["items"]) || e["items"].length === 0)) {
    return `${type} には "items"（1件以上の配列）が必要です`;
  }
  if (
    type === "DATE" &&
    (typeof e["granularity"] !== "string" || !VALID_GRANULARITIES.has(e["granularity"]))
  ) {
    return `DATE には "granularity"（${[...VALID_GRANULARITIES].join(", ")}）が必要です`;
  }
  return null;
}

/** Filter layout entries to only include columns present in CSV headers */
export function filterLayout(headers: string[], layout: Layout): Layout {
  const headerSet = new Set(headers);
  const filtered: Layout = [];

  for (const q of layout) {
    if (q.type === "SA" || q.type === "NA" || q.type === "WEIGHT" || q.type === "DATE") {
      if (headerSet.has(q.key)) filtered.push(q);
    } else if (q.type === "MA") {
      const matchedItems = q.items.filter((item) => headerSet.has(`${q.key}_${item.code}`));
      if (matchedItems.length > 0) {
        filtered.push({ ...q, items: matchedItems });
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

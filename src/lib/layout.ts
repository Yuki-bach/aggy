import type { Question } from "./types";
import type { Diagnostic } from "./validateRawData";

export interface LayoutItem {
  code: string;
  label: string;
}

export type DateGranularity = "year" | "month" | "week" | "day";

type SALayout = {
  type: "SA";
  key: string;
  label: string;
  items: LayoutItem[];
  matrixKey?: string;
};
type MALayout = {
  type: "MA";
  key: string;
  label: string;
  items: LayoutItem[];
  matrixKey?: string;
};
type NALayout = { type: "NA"; key: string; label: string; matrixKey?: string };
type WeightLayout = { type: "WEIGHT"; key: string; label: string };
type DateLayout = {
  type: "DATE";
  key: string;
  label: string;
  granularity: DateGranularity;
};
type MatrixLayout = { type: "MATRIX"; key: string; label: string };

export type LayoutQuestion =
  | SALayout
  | MALayout
  | NALayout
  | WeightLayout
  | DateLayout
  | MatrixLayout;

export type Layout = LayoutQuestion[];

const VALID_TYPES = new Set(["SA", "MA", "NA", "WEIGHT", "DATE", "MATRIX"]);
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
  return parsed;
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
      const label = e && typeof e["label"] === "string" ? e["label"] : "";
      diagnostics.push({
        key,
        label,
        severity: "error",
        type: "invalidLayout",
        params: { reason },
      });
    }
  }

  const keySeen = new Map<string, { count: number; label: string }>();
  for (const entry of raw) {
    if (checkEntry(entry)) continue;
    const e = entry as Record<string, unknown>;
    const key = e["key"] as string;
    const label = e["label"] as string;
    const prev = keySeen.get(key);
    keySeen.set(key, { count: (prev?.count ?? 0) + 1, label: prev?.label ?? label });
  }
  for (const [key, { count, label }] of keySeen) {
    if (count > 1) {
      diagnostics.push({
        key,
        label,
        severity: "error",
        type: "invalidLayout",
        params: { reason: `"key" が重複しています: ${key}` },
      });
    }
  }

  const matrixKeys = new Set<string>();
  for (const entry of raw) {
    if (checkEntry(entry)) continue;
    const e = entry as Record<string, unknown>;
    if (e["type"] === "MATRIX") matrixKeys.add(e["key"] as string);
  }
  for (const entry of raw) {
    if (checkEntry(entry)) continue;
    const e = entry as Record<string, unknown>;
    const mk = e["matrixKey"];
    if (typeof mk === "string" && mk !== "" && !matrixKeys.has(mk)) {
      diagnostics.push({
        key: e["key"] as string,
        label: e["label"] as string,
        severity: "error",
        type: "invalidLayout",
        params: { reason: `"matrixKey" が参照する MATRIX エントリが見つかりません: ${mk}` },
      });
    }
  }

  return diagnostics;
}

/** Build Layout from raw entries that pass structure validation (skips duplicates). */
export function buildValidLayout(raw: unknown[]): Layout {
  const layout: Layout = [];
  const seenKeys = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    if (checkEntry(raw[i])) continue;
    const key = (raw[i] as Record<string, unknown>)["key"] as string;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    layout.push(raw[i] as LayoutQuestion);
  }
  return layout;
}

/** Validate items array elements. Return error reason string or null. */
function checkItems(items: unknown[]): string | null {
  const codes = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    if (typeof items[i] !== "object" || items[i] === null) {
      return `"items[${i}]" はオブジェクトである必要があります`;
    }
    const item = items[i] as Record<string, unknown>;
    if (typeof item["code"] !== "string" || typeof item["label"] !== "string") {
      return `"items[${i}]" には "code"（文字列）と "label"（文字列）が必要です`;
    }
    if (codes.has(item["code"])) {
      return `"items" 内に重複した "code" があります: ${item["code"]}`;
    }
    codes.add(item["code"]);
  }
  return null;
}

/** Return error reason string if entry is invalid, or null if valid. */
function checkEntry(entry: unknown): string | null {
  if (typeof entry !== "object" || entry === null) {
    return "各エントリはオブジェクトである必要があります";
  }
  const e = entry as Record<string, unknown>;
  if (typeof e["key"] !== "string") return '"key"（文字列）が必要です';
  if (e["key"] === "") return '"key" は空文字列にできません';
  if (typeof e["type"] !== "string" || !VALID_TYPES.has(e["type"])) {
    return `"type" は ${[...VALID_TYPES].join(", ")} のいずれかである必要があります`;
  }
  if (typeof e["label"] !== "string") return '"label"（文字列）が必要です';
  const { type } = e;
  if ((type === "SA" || type === "MA") && (!Array.isArray(e["items"]) || e["items"].length === 0)) {
    return `${type} には "items"（1件以上の配列）が必要です`;
  }
  if (type === "SA" || type === "MA") {
    const itemErr = checkItems(e["items"] as unknown[]);
    if (itemErr) return itemErr;
  }
  if (
    type === "DATE" &&
    (typeof e["granularity"] !== "string" || !VALID_GRANULARITIES.has(e["granularity"]))
  ) {
    return `DATE には "granularity"（${[...VALID_GRANULARITIES].join(", ")}）が必要です`;
  }
  if ("matrixKey" in e && e["matrixKey"] !== undefined) {
    if (type !== "SA" && type !== "MA" && type !== "NA") {
      return `"matrixKey" は SA/MA/NA でのみ指定できます`;
    }
    if (typeof e["matrixKey"] !== "string" || e["matrixKey"] === "") {
      return '"matrixKey"（非空の文字列）が必要です';
    }
  }
  return null;
}

/** Filter layout entries to only include columns present in CSV headers */
export function filterLayout(headers: string[], layout: Layout): Layout {
  const headerSet = new Set(headers);
  const filtered: Layout = [];

  for (const q of layout) {
    if (q.type === "MATRIX") {
      filtered.push(q);
    } else if (q.type === "SA" || q.type === "NA" || q.type === "WEIGHT" || q.type === "DATE") {
      if (headerSet.has(q.key)) filtered.push(q);
    } else if (q.type === "MA") {
      const matchedItems = q.items.filter((item) => headerSet.has(`${q.key}_${item.code}`));
      if (matchedItems.length > 0) {
        filtered.push({ ...q, items: matchedItems });
      }
    }
  }

  // Remove orphan MATRIX parents whose children did not survive filtering.
  const survivingMatrixKeys = new Set(
    filtered.flatMap((q) =>
      (q.type === "SA" || q.type === "MA" || q.type === "NA") && q.matrixKey ? [q.matrixKey] : [],
    ),
  );
  return filtered.filter((q) => q.type !== "MATRIX" || survivingMatrixKeys.has(q.key));
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
    matrixKey: e.matrixKey ?? null,
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
    matrixKey: e.matrixKey ?? null,
  };
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

/** Build groups of matrix children keyed by MATRIX parent, preserving layout order */
export function buildMatrixGroups(layout: Layout): MatrixGroup[] {
  return layout
    .filter((e): e is Extract<LayoutQuestion, { type: "MATRIX" }> => e.type === "MATRIX")
    .map((parent) => ({
      matrixKey: parent.key,
      matrixLabel: parent.label,
      questionCodes: layout
        .filter(
          (e) =>
            (e.type === "SA" || e.type === "MA" || e.type === "NA") && e.matrixKey === parent.key,
        )
        .map((e) => e.key),
    }));
}

/** Count total layout-defined columns (SA: 1 each, MA: items count, WEIGHT: 1, MATRIX: 0) */
export function countLayoutColumns(layout: Layout): number {
  return layout.reduce(
    (acc, e) => acc + (e.type === "MATRIX" ? 0 : e.type === "MA" ? e.items.length : 1),
    0,
  );
}

/** New aggregation type system */

export interface Question {
  type: "SA" | "MA";
  code: string;
  columns: string[];
  codes: string[];
  label: string;
  labels: Record<string, string>;
}

export interface Cell {
  count: number;
  pct: number;
}

export interface Slice {
  code: string | null;
  n: number;
  cells: Cell[];
}

/** aggregate() の戻り値 — rawdata 由来のみ */
export interface AggResult {
  codes: string[];
  by: string | null; // null = GT, string = cross question code
  slices: Slice[];
}

/** クロス軸情報 */
export interface Axis {
  code: string; // "q1"
  label: string; // "性別"
  labels: Record<string, string>; // { "1": "男性", ... }, NA 含む
}

/** 消費用フラット型 */
export interface Tally {
  question: string;
  type: "SA" | "MA";
  label: string;
  labels: Record<string, string>; // NA 含む
  codes: string[];
  by: Axis | null; // null = GT
  slices: Slice[];
}

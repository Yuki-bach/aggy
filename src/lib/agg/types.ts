/** New aggregation type system */

export interface Question {
  type: "SA" | "MA" | "NA";
  code: string;
  columns: string[];
  codes: string[];
  label: string;
  labels: Record<string, string>;
}

export type AggInput = Pick<Question, "type" | "columns" | "codes">;

export interface Cell {
  count: number;
  pct: number;
}

export interface Slice {
  code: string | null;
  n: number;
  cells: Cell[];
  stats?: NaStats;
}

/** aggregate() の戻り値 — rawdata 由来のみ */
export interface AggOutput {
  codes: string[];
  slices: Slice[];
}

/** クロス軸情報 */
export interface Axis {
  code: string; // "q1"
  label: string; // "性別"
  labels: Record<string, string>; // { "1": "男性", ... }, NA 含む
}

export interface NaStats {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
}

/** 消費用フラット型 */
export interface Tally {
  type: "SA" | "MA" | "NA";
  questionCode: string;
  label: string;
  by: Axis | null;
  codes: string[];
  labels: Record<string, string>;
  slices: Slice[];
}

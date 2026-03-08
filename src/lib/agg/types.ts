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

/** NA (Numerical Answer) 用の型 */
export interface ValueCount {
  value: number;
  count: number;
}

export interface NaStats {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
}

export interface NumericSlice {
  code: string | null;
  freq: ValueCount[];
  stats: NaStats;
}

/** 消費用フラット型 — Discriminated Union */
export interface CategoricalTally {
  type: "SA" | "MA";
  questionCode: string;
  label: string;
  by: Axis | null;
  codes: string[];
  labels: Record<string, string>;
  slices: Slice[];
}

export interface NumericTally {
  type: "NA";
  questionCode: string;
  label: string;
  by: Axis | null;
  slices: NumericSlice[];
}

export type Tally = CategoricalTally | NumericTally;

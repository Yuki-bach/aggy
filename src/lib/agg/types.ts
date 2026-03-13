/** New aggregation type system */

export type QuestionType = "SA" | "MA" | "NA";

export interface Question {
  type: QuestionType;
  code: string;
  columns: string[];
  codes: string[];
  label: string;
  labels: Record<string, string>;
}

export type Shape = Pick<Question, "type" | "columns" | "codes">;

export type Axis = Pick<Question, "code" | "label" | "labels">;

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
  type: QuestionType;
  questionCode: string;
  label: string;
  by: Axis | null;
  codes: string[];
  labels: Record<string, string>;
  slices: Slice[];
}

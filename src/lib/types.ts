export type RawData = { fileName: string; headers: string[]; rowCount: number };
export type LayoutData = { fileName: string; rawJson: unknown[] };

export type QuestionType = "SA" | "MA" | "NA";

export interface Question {
  type: QuestionType;
  code: string;
  columns: string[];
  codes: string[];
  label: string;
  labels: Record<string, string>;
}

export interface Cell {
  count: number;
  /** 百分率。n=0（有効回答なし）のとき null（算出不能） */
  pct: number | null;
}

export interface NaStats {
  n: number;
  mean: number | null;
  median: number | null;
  sd: number | null;
  min: number | null;
  max: number | null;
}

export interface Slice {
  code: string | null;
  n: number;
  cells: Cell[];
  stats?: NaStats;
}

export type Axis = Pick<Question, "code" | "label" | "labels">;

/** 消費用フラット型 */
export interface Tab {
  type: QuestionType;
  questionCode: string;
  label: string;
  by: Axis | null;
  codes: string[];
  labels: Record<string, string>;
  slices: Slice[];
}

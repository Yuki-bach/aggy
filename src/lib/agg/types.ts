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
  /** 百分率。n=0（有効回答なし）のとき null（算出不能） */
  pct: number | null;
}

/** n=0（有効回答なし）のとき null（算出不能）を返す */
export function calcPct(count: number, n: number): number | null {
  return n > 0 ? (count / n) * 100 : null;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("calcPct: normal", () => {
    expect(calcPct(3, 10)).toBeCloseTo(30, 5);
  });

  test("calcPct: n=0 → null", () => {
    expect(calcPct(0, 0)).toBeNull();
    expect(calcPct(5, 0)).toBeNull();
  });

  test("calcPct: count=0, n>0 → 0", () => {
    expect(calcPct(0, 10)).toBe(0);
  });
}

export interface Slice {
  code: string | null;
  n: number;
  cells: Cell[];
  stats?: NaStats;
}

/** aggregate() の戻り値 — rawdata 由来のみ */
export type TabData = Pick<Tab, "codes" | "slices">;

export interface NaStats {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
}

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

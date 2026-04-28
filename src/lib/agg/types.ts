/** Aggregation-internal types */

import type { Question, Tab } from "../types";

export type Shape = Pick<Question, "type" | "columns" | "codes">;

/** aggregate() の戻り値 — rawdata 由来のみ */
export type TabData = Pick<Tab, "codes" | "slices">;

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

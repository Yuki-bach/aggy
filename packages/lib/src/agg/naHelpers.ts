/** Shared helpers for NA (Numerical Answer) aggregation */

import type { Cell, NaStats } from "./types";
import { calcPct } from "./types";
import { esc } from "./sqlHelpers";

export interface BinResult {
  labels: string[];
  cells: Cell[];
}

export interface ValueCount {
  value: number;
  count: number;
}

export function naValExpr(column: string): string {
  return `CAST("${esc(column)}" AS DOUBLE)`;
}

export function naWhereCond(column: string): string {
  return `"${esc(column)}" IS NOT NULL AND TRY_CAST("${esc(column)}" AS DOUBLE) IS NOT NULL`;
}

export const EMPTY_NA_STATS: NaStats = {
  n: 0,
  mean: null,
  median: null,
  sd: null,
  min: null,
  max: null,
};

function toNullableNum(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

export function assembleStats(row: Record<string, unknown>): NaStats {
  return {
    n: Number(row.n ?? 0),
    mean: toNullableNum(row.mean),
    median: toNullableNum(row.median),
    sd: toNullableNum(row.sd),
    min: toNullableNum(row.min_val),
    max: toNullableNum(row.max_val),
  };
}

/** Group numeric values into equal-width bins and compute frequency/pct */
export function binFrequencies(values: number[], binWidth: number): BinResult {
  if (binWidth <= 0 || values.length === 0) return { labels: [], cells: [] };

  const n = values.length;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const binStart = Math.floor(minVal / binWidth) * binWidth;
  const binEnd = Math.floor(maxVal / binWidth) * binWidth + binWidth;

  const bins = new Map<number, number>();
  for (let b = binStart; b < binEnd; b += binWidth) {
    bins.set(b, 0);
  }

  for (const v of values) {
    const b = Math.floor(v / binWidth) * binWidth;
    bins.set(b, (bins.get(b) ?? 0) + 1);
  }

  const sortedKeys = [...bins.keys()].sort((a, b) => a - b);
  const labels = sortedKeys.map((b) => `${b}–${b + binWidth - 1}`);
  const cells = sortedKeys.map((b) => {
    const count = bins.get(b)!;
    return { count, pct: calcPct(count, n) };
  });

  return { labels, cells };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("binFrequencies: basic binning", () => {
    // values: 3,4,5,6,7,8,8,9,10 (8 appears twice)
    const values = [3, 4, 5, 6, 7, 8, 8, 9, 10];
    const result = binFrequencies(values, 5);
    expect(result.labels).toEqual(["0–4", "5–9", "10–14"]);
    // 0-4: 3,4 = 2
    expect(result.cells[0].count).toBe(2);
    // 5-9: 5,6,7,8,8,9 = 6
    expect(result.cells[1].count).toBe(6);
    // 10-14: 10 = 1
    expect(result.cells[2].count).toBe(1);
    // pct check
    expect(result.cells[0].pct).toBeCloseTo((2 / 9) * 100, 1);
  });

  test("binFrequencies: binWidth=1 returns per-value bins", () => {
    const values = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3];
    const result = binFrequencies(values, 1);
    expect(result.labels).toEqual(["1–1", "2–2", "3–3"]);
    expect(result.cells.map((c) => c.count)).toEqual([5, 3, 2]);
  });

  test("binFrequencies: empty input", () => {
    const result = binFrequencies([], 5);
    expect(result.labels).toEqual([]);
    expect(result.cells).toEqual([]);
  });

  test("binFrequencies: binWidth=0 returns empty", () => {
    const result = binFrequencies([1, 2], 0);
    expect(result.labels).toEqual([]);
    expect(result.cells).toEqual([]);
  });
}

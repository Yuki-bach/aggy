import { describe, test, expect } from "vite-plus/test";
import type { Cell } from "../src/lib/types";

/**
 * binFrequencies is a component-local function inside NaChartCardBody.svelte.
 * Since it's private to the component, we test the logic by duplicating the
 * pure function here (no DOM or Svelte dependency).
 */

interface BinResult {
  labels: string[];
  cells: Cell[];
}

function binFrequencies(values: number[], binWidth: number): BinResult {
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
  const cells: Cell[] = sortedKeys.map((b) => {
    const count = bins.get(b)!;
    return { count, pct: n > 0 ? (count / n) * 100 : null };
  });

  return { labels, cells };
}

describe("binFrequencies", () => {
  test("basic binning", () => {
    const values = [3, 4, 5, 6, 7, 8, 8, 9, 10];
    const result = binFrequencies(values, 5);
    expect(result.labels).toEqual(["0–4", "5–9", "10–14"]);
    expect(result.cells[0].count).toBe(2);
    expect(result.cells[1].count).toBe(6);
    expect(result.cells[2].count).toBe(1);
    expect(result.cells[0].pct).toBeCloseTo((2 / 9) * 100, 1);
  });

  test("binWidth=1 returns per-value bins", () => {
    const values = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3];
    const result = binFrequencies(values, 1);
    expect(result.labels).toEqual(["1–1", "2–2", "3–3"]);
    expect(result.cells.map((c) => c.count)).toEqual([5, 3, 2]);
  });

  test("empty input", () => {
    const result = binFrequencies([], 5);
    expect(result.labels).toEqual([]);
    expect(result.cells).toEqual([]);
  });

  test("binWidth=0 returns empty", () => {
    const result = binFrequencies([1, 2], 0);
    expect(result.labels).toEqual([]);
    expect(result.cells).toEqual([]);
  });
});

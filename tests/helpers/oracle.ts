/**
 * Oracle (reference) implementations for aggregation.
 * These are intentionally independent of src/lib/agg/ — no imports from production code
 * except TabData (assertion signature) and calcPct (pure arithmetic).
 */

import { expect } from "vite-plus/test";
import { calcPct } from "../../src/lib/agg/types";
import type { NaStats, TabData } from "../../src/lib/agg/types";

// ── Local types ──

interface OracleCell {
  count: number;
  pct: number | null;
}

interface OracleSlice {
  code: string | null;
  n: number;
  cells: OracleCell[];
  stats?: NaStats;
}

export interface OracleOutput {
  codes: string[];
  slices: OracleSlice[];
}

// ── Constants ──

const NO_ANSWER_VALUE = "N/A";

// ── Public API ──

export function oracleSaTab(
  rows: Record<string, string | null>[],
  column: string,
  codes: string[],
  weightCol: string,
): OracleOutput {
  const valid = rows.filter((r) => r[column] !== null);
  const weighted = weightCol !== "";
  const n = weighted ? sumWeights(valid, weightCol) : valid.length;

  const cells = codes.map((code) => {
    const matching = valid.filter((r) => r[column] === code);
    const count = weighted ? sumWeights(matching, weightCol) : matching.length;
    return { count, pct: calcPct(count, n) };
  });

  return { codes, slices: [{ code: null, n, cells }] };
}

export function oracleMaTab(
  rows: Record<string, string | null>[],
  columns: string[],
  codes: string[],
  weightCol: string,
): OracleOutput {
  const shown = rows.filter((r) => columns.some((col) => r[col] !== null));
  const weighted = weightCol !== "";
  const n = weighted ? sumWeights(shown, weightCol) : shown.length;

  const cells: OracleCell[] = columns.map((col) => {
    const matching = shown.filter((r) => r[col] === "1");
    const count = weighted ? sumWeights(matching, weightCol) : matching.length;
    return { count, pct: calcPct(count, n) };
  });

  const resultCodes = [...codes];

  // N/A: shown rows where ALL columns !== "1"
  const naRows = shown.filter((r) => columns.every((col) => r[col] !== "1"));
  const naCount = weighted ? sumWeights(naRows, weightCol) : naRows.length;
  if (naCount > 0) {
    cells.push({ count: naCount, pct: calcPct(naCount, n) });
    resultCodes.push(NO_ANSWER_VALUE);
  }

  return { codes: resultCodes, slices: [{ code: null, n, cells }] };
}

export function oracleNaTab(
  rows: Record<string, string | null>[],
  column: string,
  weightCol: string,
): OracleOutput {
  const valid = rows.filter((r) => r[column] !== null && !Number.isNaN(Number(r[column])));
  const weighted = weightCol !== "";
  const n = weighted ? sumWeights(valid, weightCol) : valid.length;

  const values = valid.map((r) => Number(r[column]));
  const stats = computeNaStats(
    values,
    weighted ? valid.map((r) => Number(r[weightCol] ?? 0)) : null,
  );

  // Frequency distribution sorted by value ascending
  const freqMap = new Map<number, number>();
  for (let i = 0; i < valid.length; i++) {
    const v = values[i];
    const w = weighted ? Number(valid[i][weightCol] ?? 0) : 1;
    freqMap.set(v, (freqMap.get(v) ?? 0) + w);
  }
  const sortedValues = [...freqMap.keys()].sort((a, b) => a - b);
  const codes = sortedValues.map(String);
  const cells = sortedValues.map((v) => ({
    count: freqMap.get(v)!,
    pct: calcPct(freqMap.get(v)!, n),
  }));

  return { codes, slices: [{ code: null, n, cells, stats }] };
}

export function oracleSaSaCross(
  rows: Record<string, string | null>[],
  mainCol: string,
  mainCodes: string[],
  crossCol: string,
  crossCodes: string[],
  weightCol: string,
): OracleOutput {
  const valid = rows.filter((r) => r[mainCol] !== null && r[crossCol] !== null);
  const weighted = weightCol !== "";

  const slices = crossCodes.map((crossCode) => {
    const sliceRows = valid.filter((r) => r[crossCol] === crossCode);
    const n = weighted ? sumWeights(sliceRows, weightCol) : sliceRows.length;
    const cells = mainCodes.map((mainCode) => {
      const matching = sliceRows.filter((r) => r[mainCol] === mainCode);
      const count = weighted ? sumWeights(matching, weightCol) : matching.length;
      const pct = n > 0 ? (count / n) * 100 : 0;
      return { count, pct };
    });
    return { code: crossCode, n, cells };
  });

  return { codes: mainCodes, slices };
}

export function assertOracleMatch(actual: TabData, expected: OracleOutput): void {
  expect(actual.codes).toEqual(expected.codes);
  expect(actual.slices).toHaveLength(expected.slices.length);

  for (let i = 0; i < expected.slices.length; i++) {
    const aSlice = actual.slices[i];
    const eSlice = expected.slices[i];
    expect(aSlice.code).toBe(eSlice.code);
    expect(aSlice.n).toBeCloseTo(eSlice.n, 3);
    expect(aSlice.cells).toHaveLength(eSlice.cells.length);

    for (let j = 0; j < eSlice.cells.length; j++) {
      expect(aSlice.cells[j].count).toBeCloseTo(eSlice.cells[j].count, 3);
      if (eSlice.cells[j].pct === null) {
        expect(aSlice.cells[j].pct).toBeNull();
      } else {
        expect(aSlice.cells[j].pct).toBeCloseTo(eSlice.cells[j].pct!, 3);
      }
    }

    if (eSlice.stats) {
      expect(aSlice.stats).toBeDefined();
      const a = aSlice.stats!;
      const e = eSlice.stats;
      expect(a.n).toBeCloseTo(e.n, 3);
      expect(a.mean).toBeCloseTo(e.mean, 3);
      expect(a.median).toBeCloseTo(e.median, 3);
      expect(a.sd).toBeCloseTo(e.sd, 3);
      expect(a.min).toBeCloseTo(e.min, 3);
      expect(a.max).toBeCloseTo(e.max, 3);
    }
  }
}

// ── Internal helpers ──

function sumWeights(rows: Record<string, string | null>[], weightCol: string): number {
  return rows.reduce((sum, r) => sum + Number(r[weightCol] ?? 0), 0);
}

/** Compute NA stats matching DuckDB behavior (median always unweighted, STDDEV_SAMP) */
function computeNaStats(values: number[], weights: number[] | null): NaStats {
  if (values.length === 0) return { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };

  const n = weights ? weights.reduce((s, w) => s + w, 0) : values.length;
  const mean = weights
    ? values.reduce((s, v, i) => s + v * weights[i], 0) / n
    : values.reduce((s, v) => s + v, 0) / values.length;

  // Median is always unweighted (matching DuckDB MEDIAN)
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // STDDEV_SAMP: n<=1 → 0 (DuckDB returns NULL, coerced to 0)
  let sd = 0;
  if (values.length > 1) {
    const unweightedMean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance =
      values.reduce((s, v) => s + (v - unweightedMean) ** 2, 0) / (values.length - 1);
    sd = Math.sqrt(variance);
  }

  return { n, mean, median, sd, min: sorted[0], max: sorted[sorted.length - 1] };
}

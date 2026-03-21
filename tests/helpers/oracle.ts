/**
 * Oracle (reference) implementations for aggregation.
 * These are intentionally independent of src/lib/agg/ — no imports from production code
 * except TabData (assertion signature) and calcPct (pure arithmetic).
 */

import { expect } from "vite-plus/test";
import { calcPct } from "../../src/lib/agg/types";
import type { TabData } from "../../src/lib/agg/types";

// ── Local types ──

interface OracleCell {
  count: number;
  pct: number | null;
}

interface OracleSlice {
  code: string | null;
  n: number;
  cells: OracleCell[];
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
  const naRows = shown.filter((r) =>
    columns.every((col) => r[col] !== "1"),
  );
  const naCount = weighted ? sumWeights(naRows, weightCol) : naRows.length;
  if (naCount > 0) {
    cells.push({ count: naCount, pct: calcPct(naCount, n) });
    resultCodes.push(NO_ANSWER_VALUE);
  }

  return { codes: resultCodes, slices: [{ code: null, n, cells }] };
}

export function oracleSaSaCross(
  rows: Record<string, string | null>[],
  mainCol: string,
  mainCodes: string[],
  crossCol: string,
  crossCodes: string[],
  weightCol: string,
): OracleOutput {
  const valid = rows.filter(
    (r) => r[mainCol] !== null && r[crossCol] !== null,
  );
  const weighted = weightCol !== "";

  const slices = crossCodes.map((crossCode) => {
    const sliceRows = valid.filter((r) => r[crossCol] === crossCode);
    const n = weighted ? sumWeights(sliceRows, weightCol) : sliceRows.length;
    const cells = mainCodes.map((mainCode) => {
      const matching = sliceRows.filter((r) => r[mainCol] === mainCode);
      const count = weighted
        ? sumWeights(matching, weightCol)
        : matching.length;
      const pct = n > 0 ? (count / n) * 100 : 0;
      return { count, pct };
    });
    return { code: crossCode, n, cells };
  });

  return { codes: mainCodes, slices };
}

export function assertOracleMatch(
  actual: TabData,
  expected: OracleOutput,
): void {
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
        expect(aSlice.cells[j].pct).toBeCloseTo(eSlice.cells[j].pct, 3);
      }
    }
  }
}

// ── Internal helpers ──

function sumWeights(
  rows: Record<string, string | null>[],
  weightCol: string,
): number {
  return rows.reduce((sum, r) => sum + Number(r[weightCol] ?? 0), 0);
}

import { expect } from "vitest";
import type { AggOutput } from "../../src/lib/agg/types";

export function assertGrandTotalInvariants(
  result: AggOutput,
  type: "SA" | "MA",
): void {
  expect(result.slices).toHaveLength(1);
  const slice = result.slices[0];
  expect(slice.code).toBeNull();
  expect(slice.n).toBeGreaterThanOrEqual(0);

  expect(result.codes.length).toBe(slice.cells.length);

  for (const cell of slice.cells) {
    expect(cell.count).toBeGreaterThanOrEqual(0);
    if (slice.n > 0) {
      expect(cell.pct).toBeCloseTo((cell.count / slice.n) * 100, 3);
    }
  }

  if (type === "SA") {
    const sumCounts = slice.cells.reduce((s, c) => s + c.count, 0);
    expect(sumCounts).toBeCloseTo(slice.n, 3);
    const sumPct = slice.cells.reduce((s, c) => s + c.pct, 0);
    if (slice.n > 0) {
      expect(sumPct).toBeCloseTo(100, 3);
    }
  } else {
    for (const cell of slice.cells) {
      expect(cell.count).toBeLessThanOrEqual(slice.n + 0.001);
    }
  }
}

export function assertCrossInvariants(
  result: AggOutput,
  type: "SA" | "MA",
  expectedSliceCount: number,
): void {
  expect(result.slices).toHaveLength(expectedSliceCount);

  for (const slice of result.slices) {
    expect(slice.code).not.toBeNull();
    expect(slice.n).toBeGreaterThanOrEqual(0);
    expect(result.codes.length).toBe(slice.cells.length);

    for (const cell of slice.cells) {
      expect(cell.count).toBeGreaterThanOrEqual(0);
      if (slice.n > 0) {
        expect(cell.pct).toBeCloseTo((cell.count / slice.n) * 100, 3);
      }
    }

    if (type === "SA") {
      const sumCounts = slice.cells.reduce((s, c) => s + c.count, 0);
      expect(sumCounts).toBeCloseTo(slice.n, 3);
      if (slice.n > 0) {
        const sumPct = slice.cells.reduce((s, c) => s + c.pct, 0);
        expect(sumPct).toBeCloseTo(100, 3);
      }
    } else {
      for (const cell of slice.cells) {
        expect(cell.count).toBeLessThanOrEqual(slice.n + 0.001);
      }
    }
  }
}

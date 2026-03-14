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

export function assertNaGrandTotalInvariants(result: AggOutput): void {
  // 1. Single slice with code === null
  expect(result.slices).toHaveLength(1);
  const slice = result.slices[0];
  expect(slice.code).toBeNull();

  // 2. stats exists
  expect(slice.stats).toBeDefined();
  const stats = slice.stats!;

  // 3. codes.length === cells.length
  expect(result.codes.length).toBe(slice.cells.length);

  // 4. Each cell.pct ≈ (cell.count / n) * 100
  for (const cell of slice.cells) {
    expect(cell.count).toBeGreaterThanOrEqual(0);
    if (slice.n > 0) {
      expect(cell.pct).toBeCloseTo((cell.count / slice.n) * 100, 3);
    }
  }

  // 5. sum(cells.count) ≈ n (each numeric value counted once)
  const sumCounts = slice.cells.reduce((s, c) => s + c.count, 0);
  expect(sumCounts).toBeCloseTo(slice.n, 3);

  // 6. sum(cells.pct) ≈ 100 (when n > 0)
  if (slice.n > 0) {
    const sumPct = slice.cells.reduce((s, c) => s + c.pct, 0);
    expect(sumPct).toBeCloseTo(100, 3);
  }

  // 7. stats.min <= stats.mean <= stats.max (when n > 0)
  if (slice.n > 0) {
    expect(stats.min).toBeLessThanOrEqual(stats.mean + 1e-9);
    expect(stats.mean).toBeLessThanOrEqual(stats.max + 1e-9);
  }

  // 8. stats.min <= stats.median <= stats.max (when n > 0)
  if (slice.n > 0) {
    expect(stats.min).toBeLessThanOrEqual(stats.median + 1e-9);
    expect(stats.median).toBeLessThanOrEqual(stats.max + 1e-9);
  }

  // 9. stats.sd >= 0
  expect(stats.sd).toBeGreaterThanOrEqual(0);

  // 10. stats.n === slice.n
  expect(stats.n).toBeCloseTo(slice.n, 3);

  // 11. codes are sorted in numeric ascending order
  for (let i = 1; i < result.codes.length; i++) {
    expect(Number(result.codes[i])).toBeGreaterThanOrEqual(Number(result.codes[i - 1]));
  }
}

export function assertNaCrossInvariants(
  result: AggOutput,
  expectedSliceCount: number,
): void {
  // 1. slices.length === expectedSliceCount
  expect(result.slices).toHaveLength(expectedSliceCount);

  for (const slice of result.slices) {
    // 2. Each slice code !== null
    expect(slice.code).not.toBeNull();

    // 3. Each slice has stats defined
    expect(slice.stats).toBeDefined();
    const stats = slice.stats!;

    // 4. codes.length === cells.length
    expect(result.codes.length).toBe(slice.cells.length);

    // 5. Each cell: pct ≈ (count / n) * 100
    for (const cell of slice.cells) {
      expect(cell.count).toBeGreaterThanOrEqual(0);
      if (slice.n > 0) {
        expect(cell.pct).toBeCloseTo((cell.count / slice.n) * 100, 3);
      }
    }

    // 6. Each slice (when n > 0): sum(cells.count) ≈ n, sum(cells.pct) ≈ 100
    if (slice.n > 0) {
      const sumCounts = slice.cells.reduce((s, c) => s + c.count, 0);
      expect(sumCounts).toBeCloseTo(slice.n, 3);
      const sumPct = slice.cells.reduce((s, c) => s + c.pct, 0);
      expect(sumPct).toBeCloseTo(100, 3);
    }

    // 7. Stats consistency: min <= mean <= max, min <= median <= max, sd >= 0, stats.n === slice.n
    if (slice.n > 0) {
      expect(stats.min).toBeLessThanOrEqual(stats.mean + 1e-9);
      expect(stats.mean).toBeLessThanOrEqual(stats.max + 1e-9);
      expect(stats.min).toBeLessThanOrEqual(stats.median + 1e-9);
      expect(stats.median).toBeLessThanOrEqual(stats.max + 1e-9);
    }
    expect(stats.sd).toBeGreaterThanOrEqual(0);
    expect(stats.n).toBeCloseTo(slice.n, 3);
  }

  // 8. codes are sorted in numeric ascending order
  for (let i = 1; i < result.codes.length; i++) {
    expect(Number(result.codes[i])).toBeGreaterThanOrEqual(
      Number(result.codes[i - 1]),
    );
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

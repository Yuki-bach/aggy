import type { Cell, Tab } from "../agg/types";

/**
 * Shannon entropy: -Σ(p × log2(p))
 * p = pct/100. Cells with pct=0 or pct=null are skipped.
 * Returns value in bits. Max = log2(k) for k options.
 */
export function entropy(cells: Cell[]): number {
  let sum = 0;
  for (const cell of cells) {
    if (cell.pct === null || cell.pct === undefined || cell.pct === 0) continue;
    const p = cell.pct / 100;
    sum -= p * Math.log2(p);
  }
  return sum;
}

/**
 * Normalized entropy: entropy / log2(k), range [0, 1].
 * 0 = all responses concentrated on one option.
 * 1 = perfectly uniform distribution.
 * Returns NaN if fewer than 2 valid cells.
 */
export function normalizedEntropy(cells: Cell[]): number {
  const validCells = cells.filter((c) => c.pct !== null && c.pct !== undefined);
  const k = validCells.length;
  if (k < 2) return Number.NaN;
  const maxEntropy = Math.log2(k);
  return entropy(cells) / maxEntropy;
}

/**
 * Skewness score: 1 - normalizedEntropy.
 * Higher = more skewed = more notable.
 * Only meaningful for SA/MA tabs with by === null (grand total).
 * Returns NaN for NA tabs or tabs with < 2 valid cells.
 */
export function skewnessScore(tab: Tab): number {
  if (tab.type === "NA") return Number.NaN;
  const slice = tab.slices[0];
  if (!slice) return Number.NaN;
  return 1 - normalizedEntropy(slice.cells);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("entropy: single option with 100% → 0", () => {
    const cells: Cell[] = [
      { count: 100, pct: 100 },
      { count: 0, pct: 0 },
    ];
    expect(entropy(cells)).toBe(0);
  });

  test("entropy: uniform 2 options → 1 bit", () => {
    const cells: Cell[] = [
      { count: 50, pct: 50 },
      { count: 50, pct: 50 },
    ];
    expect(entropy(cells)).toBeCloseTo(1, 10);
  });

  test("entropy: uniform 4 options → 2 bits", () => {
    const cells: Cell[] = [
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
    ];
    expect(entropy(cells)).toBeCloseTo(2, 10);
  });

  test("entropy: skips null pct", () => {
    const cells: Cell[] = [
      { count: 50, pct: 50 },
      { count: 50, pct: 50 },
      { count: 0, pct: null },
    ];
    expect(entropy(cells)).toBeCloseTo(1, 10);
  });

  test("normalizedEntropy: uniform → 1", () => {
    const cells: Cell[] = [
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
      { count: 25, pct: 25 },
    ];
    expect(normalizedEntropy(cells)).toBeCloseTo(1, 10);
  });

  test("normalizedEntropy: max skew → 0", () => {
    const cells: Cell[] = [
      { count: 100, pct: 100 },
      { count: 0, pct: 0 },
      { count: 0, pct: 0 },
    ];
    // Only 1 valid cell with non-zero pct, but normalizedEntropy counts cells with pct!=null
    // pct=0 is not null, so k=3. entropy = -1*log2(1) = 0. normalized = 0/log2(3) = 0
    expect(normalizedEntropy(cells)).toBeCloseTo(0, 10);
  });

  test("normalizedEntropy: fewer than 2 valid cells → NaN", () => {
    const cells: Cell[] = [{ count: 100, pct: 100 }];
    expect(normalizedEntropy(cells)).toBeNaN();
  });

  test("skewnessScore: uniform → 0", () => {
    const tab: Tab = {
      type: "SA",
      questionCode: "q1",
      label: "Q1",
      by: null,
      codes: ["1", "2"],
      labels: { "1": "A", "2": "B" },
      slices: [
        {
          code: null,
          n: 100,
          cells: [
            { count: 50, pct: 50 },
            { count: 50, pct: 50 },
          ],
        },
      ],
    };
    expect(skewnessScore(tab)).toBeCloseTo(0, 10);
  });

  test("skewnessScore: skewed → high", () => {
    const tab: Tab = {
      type: "SA",
      questionCode: "q1",
      label: "Q1",
      by: null,
      codes: ["1", "2", "3"],
      labels: { "1": "A", "2": "B", "3": "C" },
      slices: [
        {
          code: null,
          n: 100,
          cells: [
            { count: 90, pct: 90 },
            { count: 5, pct: 5 },
            { count: 5, pct: 5 },
          ],
        },
      ],
    };
    expect(skewnessScore(tab)).toBeGreaterThan(0.5);
  });

  test("skewnessScore: NA tab → NaN", () => {
    const tab: Tab = {
      type: "NA",
      questionCode: "q1",
      label: "Q1",
      by: null,
      codes: [],
      labels: {},
      slices: [{ code: null, n: 100, cells: [] }],
    };
    expect(skewnessScore(tab)).toBeNaN();
  });
}

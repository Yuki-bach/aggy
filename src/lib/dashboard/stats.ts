import type { Cell, Tab } from "../types";

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

const V_THRESHOLD = 0.3;
const TOP_N_CROSS = 5;
const MIN_EXPECTED_FREQ = 5;
const MAX_LOW_EXPECTED_RATIO = 0.2;

/** Build observed frequency matrix from a cross-tab: rows = question options, cols = slices */
function buildObserved(tab: Tab): number[][] {
  return tab.codes.map((_, ri) => tab.slices.map((s) => s.cells[ri]?.count ?? 0));
}

function computeCramersV(observed: number[][]): number {
  const rows = observed.length;
  const cols = observed[0].length;
  if (rows < 2 || cols < 2) return 0;

  const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = observed[0].map((_, ci) => observed.reduce((a, row) => a + row[ci], 0));
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);
  if (grandTotal === 0) return 0;

  // Check expected frequency validity
  let lowCount = 0;
  const totalCells = rows * cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
      if (expected < MIN_EXPECTED_FREQ) lowCount++;
    }
  }
  if (lowCount / totalCells > MAX_LOW_EXPECTED_RATIO) return Number.NaN;

  // Chi-square
  let chiSq = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
      if (expected > 0) {
        chiSq += (observed[r][c] - expected) ** 2 / expected;
      }
    }
  }

  // Cramér's V
  const minDim = Math.min(rows - 1, cols - 1);
  if (minDim === 0) return 0;
  return Math.sqrt(chiSq / (grandTotal * minDim));
}

/**
 * Rank cross-tabs by Cramér's V (effect size).
 * Returns top 5 tabs with V ≥ 0.3, sorted by V descending.
 * Skips tabs where >20% of cells have expected frequency < 5.
 */
export function rankCrossTabs(crossTabs: Tab[]): Tab[] {
  const scored: { tab: Tab; v: number }[] = [];

  for (const tab of crossTabs) {
    if (tab.slices.length < 2 || tab.codes.length < 2) continue;
    const observed = buildObserved(tab);
    const v = computeCramersV(observed);
    if (Number.isNaN(v) || v < V_THRESHOLD) continue;
    scored.push({ tab, v });
  }

  scored.sort((a, b) => b.v - a.v);
  return scored.slice(0, TOP_N_CROSS).map((s) => s.tab);
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

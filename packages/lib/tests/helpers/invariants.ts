import { expect } from "vite-plus/test";
import type { Slice, TabData } from "../../src/agg/types";

// ── Public composite assertions ─────────────────────────────────────

export function assertTabInvariants(result: TabData, type: "SA" | "MA"): void {
  expect(result.slices).toHaveLength(1);
  const slice = result.slices[0];
  expect(slice.code).toBeNull();
  expect(slice.n).toBeGreaterThanOrEqual(0);

  assertCodesMatchCells(result);
  assertSliceInvariants(slice, type);
}

export function assertNaTabInvariants(result: TabData): void {
  expect(result.slices).toHaveLength(1);
  const slice = result.slices[0];
  expect(slice.code).toBeNull();
  expect(slice.stats).toBeDefined();

  assertCodesMatchCells(result);
  assertCodesSortedAscending(result);

  assertCountsNonNegative(slice);
  assertPctMatchesCount(slice);
  assertSACountsSumToN(slice);
  assertSAPctSumTo100(slice);

  assertStatsMeanInRange(slice);
  assertStatsMedianInRange(slice);
  assertStdDevNonNegative(slice);
  assertStatsNMatchesSliceN(slice);
}

export function assertCrossInvariants(
  result: TabData,
  type: "SA" | "MA",
  expectedSliceCount: number,
): void {
  expect(result.slices).toHaveLength(expectedSliceCount);

  assertCodesMatchCells(result);

  for (const slice of result.slices) {
    expect(slice.code).not.toBeNull();
    expect(slice.n).toBeGreaterThanOrEqual(0);
    assertSliceInvariants(slice, type);
  }
}

// ── Slice-level composite: SA / MA 共通 + 分岐 ─────────────────────

function assertSliceInvariants(slice: Slice, type: "SA" | "MA"): void {
  assertCountsNonNegative(slice);
  assertPctMatchesCount(slice);
  if (type === "SA") {
    assertSACountsSumToN(slice);
    assertSAPctSumTo100(slice);
  } else {
    assertMACountsNotExceedN(slice);
  }
}

// ── Slice-level invariants ──────────────────────────────────────────

/** 各セルの回答数が 0 以上であること */
function assertCountsNonNegative(slice: Slice): void {
  for (const cell of slice.cells) {
    expect(cell.count).toBeGreaterThanOrEqual(0);
  }
}

/** pct が count/n*100 と一致すること（n>0 の場合） */
function assertPctMatchesCount(slice: Slice): void {
  if (slice.n === 0) return;
  for (const cell of slice.cells) {
    expect(cell.pct).toBeCloseTo((cell.count / slice.n) * 100, 3);
  }
}

/** SA: 各セルの count 合計が n と一致すること（単一回答 → 合計=回答者数） */
function assertSACountsSumToN(slice: Slice): void {
  const sum = slice.cells.reduce((s, c) => s + c.count, 0);
  expect(sum).toBeCloseTo(slice.n, 3);
}

/** SA: pct の合計が 100% になること（n>0 の場合） */
function assertSAPctSumTo100(slice: Slice): void {
  if (slice.n === 0) return;
  const sum = slice.cells.reduce((s, c) => s + (c.pct ?? 0), 0);
  expect(sum).toBeCloseTo(100, 3);
}

/** MA: 各セルの count が n 以下であること（複数回答 → 選択肢ごとの回答数 ≤ 回答者数） */
function assertMACountsNotExceedN(slice: Slice): void {
  for (const cell of slice.cells) {
    expect(cell.count).toBeLessThanOrEqual(slice.n + 0.001);
  }
}

// ── Result-level invariants ─────────────────────────────────────────

/** codes の数と cells の数が一致すること */
function assertCodesMatchCells(result: TabData): void {
  for (const slice of result.slices) {
    expect(result.codes.length).toBe(slice.cells.length);
  }
}

/** codes が数値昇順にソートされていること */
function assertCodesSortedAscending(result: TabData): void {
  for (let i = 1; i < result.codes.length; i++) {
    expect(Number(result.codes[i])).toBeGreaterThanOrEqual(Number(result.codes[i - 1]));
  }
}

// ── Stats invariants (NA) ───────────────────────────────────────────

/** min ≤ mean ≤ max であること（n>0 の場合） */
function assertStatsMeanInRange(slice: Slice): void {
  if (slice.n === 0) return;
  const stats = slice.stats!;
  if (stats.min === null || stats.mean === null || stats.max === null) return;
  expect(stats.min).toBeLessThanOrEqual(stats.mean + 1e-9);
  expect(stats.mean).toBeLessThanOrEqual(stats.max + 1e-9);
}

/** min ≤ median ≤ max であること（n>0 の場合） */
function assertStatsMedianInRange(slice: Slice): void {
  if (slice.n === 0) return;
  const stats = slice.stats!;
  if (stats.min === null || stats.median === null || stats.max === null) return;
  expect(stats.min).toBeLessThanOrEqual(stats.median + 1e-9);
  expect(stats.median).toBeLessThanOrEqual(stats.max + 1e-9);
}

/** 標準偏差が 0 以上であること */
function assertStdDevNonNegative(slice: Slice): void {
  const sd = slice.stats!.sd;
  if (sd === null) return;
  expect(sd).toBeGreaterThanOrEqual(0);
}

/** stats.n と slice.n が一致すること */
function assertStatsNMatchesSliceN(slice: Slice): void {
  expect(slice.stats!.n).toBeCloseTo(slice.n, 3);
}

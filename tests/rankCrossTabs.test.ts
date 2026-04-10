import { describe, it, expect } from "vite-plus/test";
import { rankCrossTabs } from "../src/lib/dashboard/stats";
import type { Tab } from "../src/lib/types";

/** Helper to build a cross-tab Tab from an observed frequency matrix */
function makeCrossTab(
  questionCode: string,
  rowCodes: string[],
  colCodes: string[],
  observed: number[][],
): Tab {
  const colTotals = colCodes.map((_, ci) => observed.reduce((sum, row) => sum + row[ci], 0));

  return {
    type: "SA",
    questionCode,
    label: questionCode,
    by: {
      code: "attr",
      label: "Attribute",
      labels: Object.fromEntries(colCodes.map((c) => [c, c])),
    },
    codes: rowCodes,
    labels: Object.fromEntries(rowCodes.map((c) => [c, c])),
    slices: colCodes.map((code, ci) => ({
      code,
      n: colTotals[ci],
      cells: rowCodes.map((_, ri) => ({
        count: observed[ri][ci],
        pct: colTotals[ci] > 0 ? (observed[ri][ci] / colTotals[ci]) * 100 : null,
      })),
    })),
  };
}

describe("rankCrossTabs", () => {
  it("returns empty for no cross-tabs", () => {
    expect(rankCrossTabs([])).toHaveLength(0);
  });

  it("filters out tabs with V < 0.3", () => {
    // Nearly uniform distribution → low V
    const tab = makeCrossTab(
      "q1",
      ["a", "b"],
      ["m", "f"],
      [
        [50, 50],
        [50, 50],
      ],
    );
    expect(rankCrossTabs([tab])).toHaveLength(0);
  });

  it("detects strong association (V ≥ 0.3)", () => {
    // Strong gender difference: males mostly pick A, females mostly pick B
    // observed: [[80, 20], [20, 80]]
    // row totals: [100, 100], col totals: [100, 100], grand: 200
    // expected: [[50, 50], [50, 50]]
    // chi-sq = (80-50)²/50 + (20-50)²/50 + (20-50)²/50 + (80-50)²/50 = 72
    // V = sqrt(72 / (200 * 1)) = sqrt(0.36) = 0.6
    const tab = makeCrossTab(
      "q1",
      ["a", "b"],
      ["m", "f"],
      [
        [80, 20],
        [20, 80],
      ],
    );
    const result = rankCrossTabs([tab]);
    expect(result).toHaveLength(1);
    expect(result[0].questionCode).toBe("q1");
  });

  it("sorts by V descending and limits to top 5", () => {
    const tabs: Tab[] = [];
    // Create 7 tabs with increasingly strong associations
    for (let i = 1; i <= 7; i++) {
      const skew = 50 + i * 6; // 56, 62, 68, 74, 80, 86, 92
      tabs.push(
        makeCrossTab(
          `q${i}`,
          ["a", "b"],
          ["m", "f"],
          [
            [skew, 100 - skew],
            [100 - skew, skew],
          ],
        ),
      );
    }
    const result = rankCrossTabs(tabs);
    expect(result.length).toBeLessThanOrEqual(5);
    // Should be sorted by V desc (q7 first, highest skew)
    if (result.length >= 2) {
      expect(result[0].questionCode).toBe("q7");
      expect(result[1].questionCode).toBe("q6");
    }
  });

  it("skips tabs where >20% of expected frequencies < 5", () => {
    // Very sparse data → expected frequencies too low
    const tab = makeCrossTab(
      "q1",
      ["a", "b", "c", "d", "e"],
      ["m", "f", "x"],
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    );
    expect(rankCrossTabs([tab])).toHaveLength(0);
  });

  it("skips tabs with fewer than 2 slices or 2 codes", () => {
    const singleSlice = makeCrossTab("q1", ["a", "b"], ["m"], [[50], [50]]);
    const singleCode = makeCrossTab("q1", ["a"], ["m", "f"], [[50, 50]]);
    expect(rankCrossTabs([singleSlice, singleCode])).toHaveLength(0);
  });
});

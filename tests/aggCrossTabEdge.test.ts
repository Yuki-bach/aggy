import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggCrossTab } from "../src/lib/agg/aggCrossTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { getAggInput, weightColumn } from "./helpers/fixtures";
import { buildCSV } from "./helpers/csv";
import type { AggInput } from "../src/lib/agg/types";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const q1 = getAggInput("q1");
const q2 = getAggInput("q2");
const q3 = getAggInput("q3");

function sliceCounts(
  result: { slices: { code: string | null; cells: { count: number }[] }[] },
  sliceCode: string,
): number[] {
  const slice = result.slices.find((s) => s.code === sliceCode)!;
  return slice.cells.map((c) => c.count);
}

function sliceN(
  result: { slices: { code: string | null; n: number }[] },
  sliceCode: string,
): number {
  return result.slices.find((s) => s.code === sliceCode)!.n;
}

// ============================================================
// 重みつきクロス集計（test_data.csv 手計算）
// CSV行 (weight値):
//  1:w=1.2  2:w=0.9  3:w=1.5  4:w=0.8  5:w=1.1
//  6:w=1.0  7:w=1.3  8:w=0.7  9:w=1.4 10:w=1.0
// 11:w=1.0 12:w=0.8 13:w=1.1 14:w=1.0
// ============================================================

describe("aggCrossTabEdge - 重みつき手計算", () => {
  it("SA×SA weighted: q2 × q1", async () => {
    const result = await aggCrossTab(getConn(), q2, q1, weightColumn);

    // slice "1" (q1=1): q2有効かつq1=1 → 行1,3,5,7,10 (行12:q2=NULL除外)
    //   n = 1.2+1.5+1.1+1.3+1.0 = 6.1
    //   q2=1: 行7(1.3)+10(1.0) = 2.3
    //   q2=2: 行3(1.5) = 1.5
    //   q2=3: 行1(1.2)+5(1.1) = 2.3
    //   q2=99: 0
    expect(sliceN(result, "1")).toBeCloseTo(6.1, 1);
    const c = sliceCounts(result, "1");
    expect(c[0]).toBeCloseTo(2.3, 1);
    expect(c[1]).toBeCloseTo(1.5, 1);
    expect(c[2]).toBeCloseTo(2.3, 1);
    expect(c[3]).toBeCloseTo(0, 1);
  });

  it("MA×SA weighted: q3 × q1", async () => {
    const result = await aggCrossTab(getConn(), q3, q1, weightColumn);

    // slice "1" (q1=1): q3 shown かつ q1=1 → 行1,3,5,7,10,12
    //   n = 1.2+1.5+1.1+1.3+1.0+0.8 = 6.9
    //   q3_1=1: 行1(1.2)+3(1.5) = 2.7
    //   q3_2=1: 行3(1.5)+5(1.1)+7(1.3) = 3.9
    //   q3_3=1: 行1(1.2)+5(1.1)+10(1.0) = 3.3
    //   N/A: 行12(0.8) = 0.8
    expect(sliceN(result, "1")).toBeCloseTo(6.9, 1);
    const c = sliceCounts(result, "1");
    expect(c[0]).toBeCloseTo(2.7, 1);
    expect(c[1]).toBeCloseTo(3.9, 1);
    expect(c[2]).toBeCloseTo(3.3, 1);
    expect(c[3]).toBeCloseTo(0.8, 1);
  });

  it("SA×MA weighted: q1 × q3", async () => {
    const result = await aggCrossTab(getConn(), q1, q3, weightColumn);

    // slice "1" (q3_1=1): q1有効(非NULL)かつq3_1=1 → 行1,3,4,6,8,9
    //   各行weight: 1.2+1.5+0.8+1.0+0.7+1.4 = 6.6
    //   q1=1: 行1(1.2)+3(1.5) = 2.7
    //   q1=2: 行6(1.0)+9(1.4) = 2.4
    //   q1=3: 行4(0.8)+8(0.7) = 1.5
    //   q1=99: 0
    expect(sliceN(result, "1")).toBeCloseTo(6.6, 1);
    const c = sliceCounts(result, "1");
    expect(c[0]).toBeCloseTo(2.7, 1);
    expect(c[1]).toBeCloseTo(2.4, 1);
    expect(c[2]).toBeCloseTo(1.5, 1);
    expect(c[3]).toBeCloseTo(0, 1);
  });

  it("MA×MA weighted: q3 × q3", async () => {
    const result = await aggCrossTab(getConn(), q3, q3, weightColumn);

    // slice "1" (q3_1=1): q3 shown かつ q3_1=1 → 行1,3,4,6,8,9,14
    //   n = 1.2+1.5+0.8+1.0+0.7+1.4+1.0 = 7.6
    //   q3_1=1: 7.6 (all selected by definition)
    //   q3_2=1: 行3(1.5)+9(1.4) = 2.9
    //   q3_3=1: 行1(1.2)+6(1.0)+8(0.7)+14(1.0) = 3.9
    expect(sliceN(result, "1")).toBeCloseTo(7.6, 1);
    const c = sliceCounts(result, "1");
    expect(c[0]).toBeCloseTo(7.6, 1);
    expect(c[1]).toBeCloseTo(2.9, 1);
    expect(c[2]).toBeCloseTo(3.9, 1);
  });
});

// ============================================================
// 全スライス網羅（test_data.csv 重みなし）
// ============================================================

describe("aggCrossTabEdge - 全スライス網羅", () => {
  it("SA×SA: q2 × q1 → 全4スライス", async () => {
    const result = await aggCrossTab(getConn(), q2, q1, "");

    // q1 codes: ["1","2","3","99"]
    expect(result.slices).toHaveLength(4);

    // slice "2" (q1=2): q2有効かつq1=2 → 行2,6,9
    //   q2=1: 行2 = 1件, q2=2: 行6,9 = 2件, q2=3: 0, q2=99: 0
    expect(sliceCounts(result, "2")).toEqual([1, 2, 0, 0]);

    // slice "3" (q1=3): q2有効かつq1=3 → 行4,8
    //   q2=1: 行4 = 1件, q2=2: 0, q2=3: 行8 = 1件, q2=99: 0
    expect(sliceCounts(result, "3")).toEqual([1, 0, 1, 0]);

    // slice "99" (q1=99): q2有効かつq1=99 → 行11,13
    //   q2=99: 行11 = 1件, q2=2: 行13 = 1件
    expect(sliceCounts(result, "99")).toEqual([0, 1, 0, 1]);
  });

  it("MA×SA: q3 × q1 → 全4スライス", async () => {
    const result = await aggCrossTab(getConn(), q3, q1, "");

    expect(result.slices).toHaveLength(4);

    // slice "2" (q1=2): q3 shown かつ q1=2 → 行2,6,9
    //   q3_1=1: 行6,9 = 2件, q3_2=1: 行2,9 = 2件, q3_3=1: 行2,6 = 2件, N/A: 0
    expect(sliceCounts(result, "2")).toEqual([2, 2, 2, 0]);

    // slice "3" (q1=3): q3 shown かつ q1=3 → 行4,8
    //   q3_1=1: 行4,8 = 2件, q3_2=1: 0件, q3_3=1: 行8 = 1件, N/A: 0
    expect(sliceCounts(result, "3")).toEqual([2, 0, 1, 0]);

    // slice "99" (q1=99): q3 shown かつ q1=99 → 行11 (行13:q3全NULL除外)
    //   q3_1=0,q3_2=0,q3_3=0 → N/A=1
    expect(sliceCounts(result, "99")).toEqual([0, 0, 0, 1]);
  });

  it("SA×MA: q1 × q3 → 全3スライス", async () => {
    const result = await aggCrossTab(getConn(), q1, q3, "");

    // q3 codes: ["1","2","3"]
    expect(result.slices).toHaveLength(3);

    // slice "2" (q3_2=1): q1有効かつq3_2=1 → 行2,3,5,7,9
    //   q1=1: 行3,5,7 = 3件, q1=2: 行2,9 = 2件, q1=3: 0, q1=99: 0
    expect(sliceCounts(result, "2")).toEqual([3, 2, 0, 0]);

    // slice "3" (q3_3=1): q1有効かつq3_3=1 → 行1,2,5,6,8,10
    //   q1=1: 行1,5,10 = 3件, q1=2: 行2,6 = 2件, q1=3: 行8 = 1件, q1=99: 0
    expect(sliceCounts(result, "3")).toEqual([3, 2, 1, 0]);
  });

  it("MA×MA: q3 × q3 → 全3スライス", async () => {
    const result = await aggCrossTab(getConn(), q3, q3, "");

    expect(result.slices).toHaveLength(3);

    // slice "3" (q3_3=1): q3 shown かつ q3_3=1 → 行1,2,5,6,8,10,14
    //   q3_1=1: 行1,6,8,14 = 4件, q3_2=1: 行2,5 = 2件, q3_3=1: 7件
    expect(sliceCounts(result, "3")).toEqual([4, 2, 7]);
  });
});

// ============================================================
// エッジケース（動的CSV）
// ============================================================

describe("aggCrossTabEdge - エッジケース", () => {
  it("クロス軸が1値のみ → スライス1個", async () => {
    await loadCSV(
      buildCSV(["id", "main", "cross"], [
        [1, 1, 5],
        [2, 2, 5],
        [3, 1, 5],
      ]),
    );
    const mainInput: AggInput = { type: "SA", columns: ["main"], codes: ["1", "2"] };
    const crossInput: AggInput = { type: "SA", columns: ["cross"], codes: ["5"] };
    const result = await aggCrossTab(getConn(), mainInput, crossInput, "");

    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].code).toBe("5");
    expect(sliceCounts(result, "5")).toEqual([2, 1]);
  });

  it("メイン全NULL → 各スライスn=0", async () => {
    await loadCSV(
      buildCSV(["id", "main", "cross"], [
        [1, null, 1],
        [2, null, 2],
        [3, null, 1],
      ]),
    );
    const mainInput: AggInput = { type: "SA", columns: ["main"], codes: ["1"] };
    const crossInput: AggInput = { type: "SA", columns: ["cross"], codes: ["1", "2"] };
    const result = await aggCrossTab(getConn(), mainInput, crossInput, "");

    for (const slice of result.slices) {
      expect(slice.n).toBe(0);
    }
  });

  it("1行のみのクロス", async () => {
    await loadCSV(buildCSV(["id", "main", "cross"], [[1, 2, 3]]));
    const mainInput: AggInput = { type: "SA", columns: ["main"], codes: ["1", "2"] };
    const crossInput: AggInput = { type: "SA", columns: ["cross"], codes: ["3", "4"] };
    const result = await aggCrossTab(getConn(), mainInput, crossInput, "");

    expect(sliceCounts(result, "3")).toEqual([0, 1]);
    expect(sliceCounts(result, "4")).toEqual([0, 0]);
  });
});

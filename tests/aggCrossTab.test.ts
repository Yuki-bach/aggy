import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggCrossTab } from "../src/lib/agg/aggCrossTab";
import { setupDuckDB, teardownDuckDB, getConn } from "./helpers/duckdb";
import { getAggInput } from "./helpers/fixtures";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const q1 = getAggInput("q1");
const q2 = getAggInput("q2");
const q3 = getAggInput("q3");

/** スライスのcounts配列を取得 */
function sliceCounts(result: { codes: string[]; slices: { code: string | null; cells: { count: number }[] }[] }, sliceCode: string): number[] {
  const slice = result.slices.find((s) => s.code === sliceCode)!;
  return slice.cells.map((c) => c.count);
}

// ============================================================
// テストデータ (testdata/test_data.csv) 14行
// DuckDB型推論: SA/MA列=BIGINT, weight=DOUBLE
// SA WHERE: IS NOT NULL → 99=無回答(有効値), NULL=回答対象外
//
// CSV行(1-indexed, ヘッダー除く):
//  1: id=1,  w=1.2, q1=1,   q2=3,   q3_1=1, q3_2=0, q3_3=1
//  2: id=2,  w=0.9, q1=2,   q2=1,   q3_1=0, q3_2=1, q3_3=1
//  3: id=3,  w=1.5, q1=1,   q2=2,   q3_1=1, q3_2=1, q3_3=0
//  4: id=4,  w=0.8, q1=3,   q2=1,   q3_1=1, q3_2=0, q3_3=0
//  5: id=5,  w=1.1, q1=1,   q2=3,   q3_1=0, q3_2=1, q3_3=1
//  6: id=6,  w=1.0, q1=2,   q2=2,   q3_1=1, q3_2=0, q3_3=1
//  7: id=7,  w=1.3, q1=1,   q2=1,   q3_1=0, q3_2=1, q3_3=0
//  8: id=8,  w=0.7, q1=3,   q2=3,   q3_1=1, q3_2=0, q3_3=1
//  9: id=9,  w=1.4, q1=2,   q2=2,   q3_1=1, q3_2=1, q3_3=0
// 10: id=10, w=1.0, q1=1,   q2=1,   q3_1=0, q3_2=0, q3_3=1
// 11: id=11, w=1.0, q1=99,  q2=99,  q3_1=0, q3_2=0, q3_3=0
// 12: id=12, w=0.8, q1=1,   q2=NULL, q3_1=0, q3_2=0, q3_3=0
// 13: id=13, w=1.1, q1=99,  q2=2,   q3_1=NULL,q3_2=NULL,q3_3=NULL
// 14: id=14, w=1.0, q1=NULL,q2=1,   q3_1=1, q3_2=0, q3_3=1
// ============================================================

describe("aggCrossTab - 重みなし", () => {
  describe("SA × SA クロス集計", () => {
    it("q2 を q1 でクロスした結果が正しい", async () => {
      const result = await aggCrossTab(getConn(), q2, q1, "");

      // q2有効行(IS NOT NULL): 行1-11,13,14 = 13行 (行12=NULL除外)
      // slice "1" = q1=1 かつ q2有効: 行1,3,5,7,10 = 5行
      //   q2=1:2件(行7,10), q2=2:1件(行3), q2=3:2件(行1,5), q2=99:0件
      expect(sliceCounts(result, "1")).toEqual([2, 1, 2, 0]);
    });
  });

  describe("SA × MA クロス集計", () => {
    it("q1 を q3 でクロスした結果が正しい", async () => {
      const result = await aggCrossTab(getConn(), q1, q3, "");

      // slice "1" = q3_1='1' の行: 1,3,4,6,8,9,14
      //   q1有効(非NULL)かつq3_1='1': 行1,3,4,6,8,9 (行14はq1=NULL)
      //   q1=1:2件(行1,3), q1=2:2件(行6,9), q1=3:2件(行4,8), q1=99:0件
      expect(sliceCounts(result, "1")).toEqual([2, 2, 2, 0]);
    });
  });

  describe("MA × SA クロス集計", () => {
    it("q3 を q1 でクロスした結果が正しい", async () => {
      const result = await aggCrossTab(getConn(), q3, q1, "");

      expect(result.codes).toEqual(["1", "2", "3", "N/A"]);

      // slice "1" = q1=1 の行: 1,3,5,7,10,12
      //   q3 shown かつ q1=1: 行1,3,5,7,10,12
      //   q3_1='1':2件(行1,3), q3_2='1':3件(行3,5,7), q3_3='1':3件(行1,5,10), N/A:1件(行12)
      expect(sliceCounts(result, "1")).toEqual([2, 3, 3, 1]);
    });
  });

  describe("MA × MA クロス集計", () => {
    it("q3 を自身でクロスした結果が正しい", async () => {
      const result = await aggCrossTab(getConn(), q3, q3, "");

      // MA×MA自身クロスではN/Aなし（cross側カラム=1の行のみがスライス対象）
      // slice "1" = q3_1='1' の行: 1,3,4,6,8,9,14
      //   q3_1='1':7件, q3_2='1':2件(行3,9), q3_3='1':4件(行1,6,8,14)
      expect(sliceCounts(result, "1")).toEqual([7, 2, 4]);

      // slice "2" = q3_2='1' の行: 2,3,5,7,9
      //   q3_1='1':2件(行3,9), q3_2='1':5件, q3_3='1':2件(行2,5)
      expect(sliceCounts(result, "2")).toEqual([2, 5, 2]);
    });
  });
});

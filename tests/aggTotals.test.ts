import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggTotals } from "../src/lib/agg/aggTotals";
import { setupDuckDB, teardownDuckDB, getConn } from "./helpers/duckdb";
import { getAggInput } from "./helpers/fixtures";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const q1 = getAggInput("q1");
const q3 = getAggInput("q3");

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

describe("aggTotals - 重みなし", () => {
  describe("SA GT集計", () => {
    it("q1 の GT 集計で各値の count/n/pct が正しい", async () => {
      const result = await aggTotals(getConn(), q1, "");

      expect(result.slices).toHaveLength(1);

      // q1 有効行: IS NOT NULL → 行1-13 (行14=NULL除外) = 13行
      // q1=1: 行1,3,5,7,10,12 = 6件
      // q1=2: 行2,6,9 = 3件
      // q1=3: 行4,8 = 2件
      // q1=99(無回答): 行11,13 = 2件
      const n = 13;
      const slice = result.slices[0];
      expect(slice.code).toBeNull();
      expect(slice.n).toBe(n);

      const counts = slice.cells.map((c) => c.count);
      expect(counts).toEqual([6, 3, 2, 2]);

      const pcts = slice.cells.map((c) => c.pct);
      expect(pcts.map((p) => Math.round(p * 1e5) / 1e5)).toEqual(
        [6, 3, 2, 2].map((c) => Math.round((c / n) * 100 * 1e5) / 1e5),
      );
    });
  });

  describe("MA GT集計", () => {
    it("q3 の GT 集計で各サブカラムの count と無回答が正しい", async () => {
      const result = await aggTotals(getConn(), q3, "");

      // MA shown条件: q3_1~q3_3 のいずれかが非NULL
      // 行13: q3_1=NULL,q3_2=NULL,q3_3=NULL → 全部NULLなので除外
      // 行1-12,14 = 13行が shown
      // q3_1='1': 行1,3,4,6,8,9,14 = 7件
      // q3_2='1': 行2,3,5,7,9 = 5件
      // q3_3='1': 行1,2,5,6,8,10,14 = 7件
      // 無回答(shown but none='1'): 行11(0,0,0),12(0,0,0) = 2件
      const slice = result.slices[0];
      expect(slice.n).toBe(13);
      expect(result.codes).toEqual(["1", "2", "3", "N/A"]);

      const counts = slice.cells.map((c) => c.count);
      expect(counts).toEqual([7, 5, 7, 2]);
    });
  });
});

describe("aggTotals - 重み付き", () => {
  describe("SA GT集計（重み付き）", () => {
    it("q1 の重み付き GT 集計で weighted count が正しい", async () => {
      const result = await aggTotals(getConn(), q1, "weight");

      // q1有効行: 行1-13 (行14=空のみ除外)
      // q1=1: 行1(1.2)+3(1.5)+5(1.1)+7(1.3)+10(1.0)+12(0.8) = 6.9
      // q1=2: 行2(0.9)+6(1.0)+9(1.4) = 3.3
      // q1=3: 行4(0.8)+8(0.7) = 1.5
      // q1=99: 行11(1.0)+13(1.1) = 2.1
      // n = 6.9+3.3+1.5+2.1 = 13.8
      const slice = result.slices[0];
      expect(slice.n).toBeCloseTo(13.8, 1);

      const counts = slice.cells.map((c) => c.count);
      expect(counts[0]).toBeCloseTo(6.9, 1);
      expect(counts[1]).toBeCloseTo(3.3, 1);
      expect(counts[2]).toBeCloseTo(1.5, 1);
      expect(counts[3]).toBeCloseTo(2.1, 1);

      const pcts = slice.cells.map((c) => c.pct);
      expect(pcts[0]).toBeCloseTo((6.9 / 13.8) * 100, 1);
    });
  });

  describe("MA GT集計（重み付き）", () => {
    it("q3 の重み付き GT 集計で weighted count が正しい", async () => {
      const result = await aggTotals(getConn(), q3, "weight");

      // shown行: 行1-12,14 = 13行 (行13は全空で除外)
      // q3_1='1': 行1(1.2)+3(1.5)+4(0.8)+6(1.0)+8(0.7)+9(1.4)+14(1.0) = 7.6
      // q3_2='1': 行2(0.9)+3(1.5)+5(1.1)+7(1.3)+9(1.4) = 6.2
      // q3_3='1': 行1(1.2)+2(0.9)+5(1.1)+6(1.0)+8(0.7)+10(1.0)+14(1.0) = 6.9
      const counts = result.slices[0].cells.map((c) => c.count);
      expect(counts[0]).toBeCloseTo(7.6, 1);
      expect(counts[1]).toBeCloseTo(6.2, 1);
      expect(counts[2]).toBeCloseTo(6.9, 1);
    });
  });
});

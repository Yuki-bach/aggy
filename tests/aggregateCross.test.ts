import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggregateCross } from "../src/lib/agg/aggregateCross";
import type { AggResult } from "../src/lib/agg/types";
import { setupDuckDB, teardownDuckDB, getConn, getAggInput } from "./helpers/duckdb";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const q1 = getAggInput("q1");
const q2 = getAggInput("q2");
const q3 = getAggInput("q3");

function findCell(result: AggResult, sliceCode: string, code: string): Cell {
  const slice = result.slices.find((s) => s.code === sliceCode)!;
  return slice.cells[result.codes.indexOf(code)];
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

describe("aggregateCross - 重みなし", () => {
  describe("SA × SA クロス集計", () => {
    it("q2 を q1 でクロスした結果が正しい", async () => {
      const result = await aggregateCross(getConn(), q2, q1, "");

      expect(result.slices.length).toBeGreaterThan(0);

      // q2有効行(IS NOT NULL): 行1-11,13,14 = 13行 (行12=NULL除外)
      // q1=1 かつ q2有効: 行1,3,5,7,10 (行12はq2=NULL除外) = 5行
      // q1=1 でq2=1: 行7,10 = 2件
      const cell = findCell(result, "1", "1"); // slice.code=q1値"1", result.codes中のq2値"1"
      expect(cell.count).toBe(2);
    });
  });

  describe("SA × MA クロス集計", () => {
    it("q1 を q3 でクロスした結果が正しい", async () => {
      const result = await aggregateCross(getConn(), q1, q3, "");

      // SA×MA: q1有効行の中でq3_1='1'のカウント
      // q1=1 の行: 行1,3,5,7,10,12
      // q1=1 かつ q3_1='1': 行1,3 = 2件
      // Slice code "1" = q3のcodes[0], result.codes中の"1" = q1の値"1"
      const cell = findCell(result, "1", "1");
      expect(cell.count).toBe(2);
    });
  });

  describe("MA × SA クロス集計", () => {
    it("q3 を q1 でクロスした結果が正しい", async () => {
      const result = await aggregateCross(getConn(), q3, q1, "");

      // codes should be ["1", "2", "3", "N/A"] (MA codes + NA)
      expect(result.codes).toEqual(["1", "2", "3", "N/A"]);

      // q3_1='1' かつ q1=1: 行1,3 = 2件
      // code "1" in result.codes maps to q3_1 column
      const cell = findCell(result, "1", "1"); // slice "1" = q1 value, code "1" = q3 code
      expect(cell.count).toBe(2);

      // q3_2='1' かつ q1=1: 行3(q3_2=1,q1=1), 行5(q3_2=1,q1=1), 行7(q3_2=1,q1=1) = 3件
      const cell2 = findCell(result, "1", "2"); // slice "1" = q1 value, code "2" = q3 code
      expect(cell2.count).toBe(3);
    });
  });

  describe("MA × MA クロス集計", () => {
    it("q3 を自身でクロスした結果にセルが存在する", async () => {
      const result = await aggregateCross(getConn(), q3, q3, "");

      // q3_1='1' かつ q3_1='1': 行1,3,4,6,8,9,14 = 7件
      const cell = findCell(result, "1", "1"); // slice "1" = cross q3 code, code "1" = row q3 code
      expect(cell.count).toBe(7);

      // q3_1='1' かつ q3_2='1': 行3,9 = 2件
      const cell12 = findCell(result, "2", "1"); // slice "2" = cross q3 code, code "1" = row q3 code
      expect(cell12.count).toBe(2);
    });
  });
});

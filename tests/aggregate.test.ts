import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggregate } from "../src/lib/agg/aggregate";
import type { Question, AggResult, Cell } from "../src/lib/agg/types";
import { setupDuckDB, teardownDuckDB } from "./helpers/duckdb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;

beforeAll(async () => {
  conn = await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

// ── Helper questions ──

const q1: Question = {
  type: "SA",
  code: "q1",
  columns: ["q1"],
  codes: ["1", "2", "3", "99"],
  label: "q1",
  labels: {},
};

const q2: Question = {
  type: "SA",
  code: "q2",
  columns: ["q2"],
  codes: ["1", "2", "3", "99"],
  label: "q2",
  labels: {},
};

const q3: Question = {
  type: "MA",
  code: "q3",
  columns: ["q3_1", "q3_2", "q3_3"],
  codes: ["1", "2", "3"],
  label: "q3",
  labels: {},
};

/** Find a cell by code in a slice */
function findCellByCode(result: AggResult, sliceCode: string, code: string): Cell | undefined {
  const slice = result.slices.find((s) => s.code === sliceCode);
  if (!slice) return undefined;
  const idx = result.codes.indexOf(code);
  if (idx < 0) return undefined;
  return slice.cells[idx];
}

/** Get the GT slice's cell for a given code */
function gtCell(result: AggResult, code: string): Cell | undefined {
  const slice = result.slices.find((s) => s.code === null);
  if (!slice) return undefined;
  const idx = result.codes.indexOf(code);
  if (idx < 0) return undefined;
  return slice.cells[idx];
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

describe("aggregate - 重みなし", () => {
  describe("SA GT集計（クロスなし）", () => {
    it("q1 の GT 集計で各値の count/n/pct が正しい", async () => {
      const result = await aggregate(conn, q1, "GT", "");

      expect(result.by).toBeNull();
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

      const cell1 = gtCell(result, "1")!;
      expect(cell1).toBeDefined();
      expect(cell1.count).toBe(6);
      expect(cell1.pct).toBeCloseTo((6 / n) * 100, 5);

      const cell2 = gtCell(result, "2")!;
      expect(cell2.count).toBe(3);

      const cell3 = gtCell(result, "3")!;
      expect(cell3.count).toBe(2);

      const cell99 = gtCell(result, "99")!;
      expect(cell99.count).toBe(2);
    });
  });

  describe("MA GT集計（クロスなし）", () => {
    it("q3 の GT 集計で各サブカラムの count と無回答が正しい", async () => {
      const result = await aggregate(conn, q3, "GT", "");

      expect(result.by).toBeNull();

      // MA shown条件: q3_1~q3_3 のいずれかが非NULL
      // 行13: q3_1=NULL,q3_2=NULL,q3_3=NULL → 全部NULLなので除外
      // 行1-12,14 = 13行が shown
      // q3_1='1': 行1,3,4,6,8,9,14 = 7件
      // q3_2='1': 行2,3,5,7,9 = 5件
      // q3_3='1': 行1,2,5,6,8,10,14 = 7件
      // 無回答(shown but none='1'): 行11(0,0,0),12(0,0,0) = 2件
      const n = 13;
      const slice = result.slices[0];
      expect(slice.n).toBe(n);

      // codes should be ["1", "2", "3", "N/A"]
      expect(result.codes).toEqual(["1", "2", "3", "N/A"]);

      const cellQ3_1 = gtCell(result, "1")!;
      expect(cellQ3_1).toBeDefined();
      expect(cellQ3_1.count).toBe(7);

      const cellQ3_2 = gtCell(result, "2")!;
      expect(cellQ3_2.count).toBe(5);

      const cellQ3_3 = gtCell(result, "3")!;
      expect(cellQ3_3.count).toBe(7);

      const cellNA = gtCell(result, "N/A")!;
      expect(cellNA).toBeDefined();
      expect(cellNA.count).toBe(2);
    });
  });

  describe("SA × SA クロス集計", () => {
    it("q2 を q1 でクロスした結果が正しい", async () => {
      const result = await aggregate(conn, q2, q1, "");

      expect(result.by).toBe("q1");
      expect(result.slices.length).toBeGreaterThan(0);

      // q2有効行(IS NOT NULL): 行1-11,13,14 = 13行 (行12=NULL除外)
      // q1=1 かつ q2有効: 行1,3,5,7,10 (行12はq2=NULL除外) = 5行
      // q1=1 でq2=1: 行7,10 = 2件
      const cell = findCellByCode(result, "1", "1"); // slice.code=q1値"1", result.codes中のq2値"1"
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(2);
    });
  });

  describe("SA × MA クロス集計", () => {
    it("q1 を q3 でクロスした結果が正しい", async () => {
      const result = await aggregate(conn, q1, q3, "");

      expect(result.by).toBe("q3");

      // SA×MA: q1有効行の中でq3_1='1'のカウント
      // q1=1 の行: 行1,3,5,7,10,12
      // q1=1 かつ q3_1='1': 行1,3 = 2件
      // Slice code "1" = q3のcodes[0], result.codes中の"1" = q1の値"1"
      const cell = findCellByCode(result, "1", "1");
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(2);
    });
  });

  describe("MA × SA クロス集計", () => {
    it("q3 を q1 でクロスした結果が正しい", async () => {
      const result = await aggregate(conn, q3, q1, "");

      expect(result.by).toBe("q1");

      // codes should be ["1", "2", "3", "N/A"] (MA codes + NA)
      expect(result.codes).toEqual(["1", "2", "3", "N/A"]);

      // q3_1='1' かつ q1=1: 行1,3 = 2件
      // code "1" in result.codes maps to q3_1 column
      const cell = findCellByCode(result, "1", "1"); // slice "1" = q1 value, code "1" = q3 code
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(2);

      // q3_2='1' かつ q1=1: 行3(q3_2=1,q1=1), 行5(q3_2=1,q1=1), 行7(q3_2=1,q1=1) = 3件
      const cell2 = findCellByCode(result, "1", "2"); // slice "1" = q1 value, code "2" = q3 code
      expect(cell2).toBeDefined();
      expect(cell2!.count).toBe(3);
    });
  });

  describe("MA × MA クロス集計", () => {
    it("q3 を自身でクロスした結果にセルが存在する", async () => {
      const result = await aggregate(conn, q3, q3, "");

      expect(result.by).toBe("q3");

      // q3_1='1' かつ q3_1='1': 行1,3,4,6,8,9,14 = 7件
      const cell = findCellByCode(result, "1", "1"); // slice "1" = cross q3 code, code "1" = row q3 code
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(7);

      // q3_1='1' かつ q3_2='1': 行3,9 = 2件
      const cell12 = findCellByCode(result, "2", "1"); // slice "2" = cross q3 code, code "1" = row q3 code
      expect(cell12).toBeDefined();
      expect(cell12!.count).toBe(2);
    });
  });
});

describe("aggregate - 重み付き", () => {
  describe("SA GT集計（重み付き）", () => {
    it("q1 の重み付き GT 集計で weighted count が正しい", async () => {
      const result = await aggregate(conn, q1, "GT", "weight");

      // q1有効行: 行1-13 (行14=空のみ除外, N/Aは文字列として有効)
      // q1=1: 行1(1.2)+3(1.5)+5(1.1)+7(1.3)+10(1.0)+12(0.8) = 6.9
      // q1=2: 行2(0.9)+6(1.0)+9(1.4) = 3.3
      // q1=3: 行4(0.8)+8(0.7) = 1.5
      // q1=N/A: 行11(1.0)+13(1.1) = 2.1
      // n = 6.9+3.3+1.5+2.1 = 13.8
      const cell1 = gtCell(result, "1")!;
      expect(cell1).toBeDefined();
      expect(cell1.count).toBeCloseTo(6.9, 1);
      expect(result.slices[0].n).toBeCloseTo(13.8, 1);
      expect(cell1.pct).toBeCloseTo((6.9 / 13.8) * 100, 1);

      const cell2 = gtCell(result, "2")!;
      expect(cell2.count).toBeCloseTo(3.3, 1);

      const cell3 = gtCell(result, "3")!;
      expect(cell3.count).toBeCloseTo(1.5, 1);
    });
  });

  describe("MA GT集計（重み付き）", () => {
    it("q3 の重み付き GT 集計で weighted count が正しい", async () => {
      const result = await aggregate(conn, q3, "GT", "weight");

      // shown行: 行1-12,14 = 13行 (行13は全空で除外)
      // q3_1='1': 行1(1.2)+3(1.5)+4(0.8)+6(1.0)+8(0.7)+9(1.4)+14(1.0) = 7.6
      const cellQ3_1 = gtCell(result, "1")!;
      expect(cellQ3_1).toBeDefined();
      expect(cellQ3_1.count).toBeCloseTo(7.6, 1);
    });
  });
});

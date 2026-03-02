import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggregate, type Query, type Cell, crossSub } from "../src/lib/agg/aggregate";
import { pivot } from "../src/lib/agg/pivot";
import { setupDuckDB, teardownDuckDB } from "./helpers/duckdb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;

beforeAll(async () => {
  conn = await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

/** セルを (main, sub) で検索するヘルパー */
function findCell(cells: Cell[], main: string, sub: string): Cell | undefined {
  return cells.find((c) => c.main === main && c.sub === sub);
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
      const query: Query = {
        questions: [{ type: "SA", column: "q1" }],
        weight_col: "",
        cross_cols: [],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      expect(r.question).toBe("q1");
      expect(r.type).toBe("SA");

      // q1 有効行: IS NOT NULL → 行1-13 (行14=NULL除外) = 13行
      // q1=1: 行1,3,5,7,10,12 = 6件
      // q1=2: 行2,6,9 = 3件
      // q1=3: 行4,8 = 2件
      // q1=99(無回答): 行11,13 = 2件
      const n = 13;
      expect(r.nBySubLabel["GT"]).toBe(n);
      const cell1 = findCell(r.cells, "1", "GT")!;
      expect(cell1).toBeDefined();
      expect(cell1.count).toBe(6);
      const pv = pivot(r.cells, r.nBySubLabel);
      expect(pv.lookup.get("1\0GT")!.pct).toBeCloseTo((6 / n) * 100, 5);

      const cell2 = findCell(r.cells, "2", "GT")!;
      expect(cell2.count).toBe(3);

      const cell3 = findCell(r.cells, "3", "GT")!;
      expect(cell3.count).toBe(2);

      const cellNA = findCell(r.cells, "99", "GT")!;
      expect(cellNA.count).toBe(2);
    });
  });

  describe("MA GT集計（クロスなし）", () => {
    it("q3 の GT 集計で各サブカラムの count と無回答が正しい", async () => {
      const query: Query = {
        questions: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
        weight_col: "",
        cross_cols: [],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      expect(r.question).toBe("q3");
      expect(r.type).toBe("MA");

      // MA shown条件: q3_1~q3_3 のいずれかが非NULL
      // 行13: q3_1=NULL,q3_2=NULL,q3_3=NULL → 全部NULLなので除外
      // 行1-12,14 = 13行が shown
      // q3_1='1': 行1,3,4,6,8,9,14 = 7件
      // q3_2='1': 行2,3,5,7,9 = 5件
      // q3_3='1': 行1,2,5,6,8,10,14 = 7件
      // 無回答(shown but none='1'): 行11(0,0,0),12(0,0,0) = 2件
      const n = 13;

      expect(r.nBySubLabel["GT"]).toBe(n);
      const cellQ3_1 = findCell(r.cells, "q3_1", "GT")!;
      expect(cellQ3_1).toBeDefined();
      expect(cellQ3_1.count).toBe(7);

      const cellQ3_2 = findCell(r.cells, "q3_2", "GT")!;
      expect(cellQ3_2.count).toBe(5);

      const cellQ3_3 = findCell(r.cells, "q3_3", "GT")!;
      expect(cellQ3_3.count).toBe(7);

      const cellNA = findCell(r.cells, "N/A", "GT")!;
      expect(cellNA).toBeDefined();
      expect(cellNA.count).toBe(2);
    });
  });

  describe("SA × SA クロス集計", () => {
    it("q2 を q1 でクロスした結果が正しい", async () => {
      const query: Query = {
        questions: [{ type: "SA", column: "q2" }],
        weight_col: "",
        cross_cols: [{ type: "SA", column: "q1" }],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      // q2有効行(IS NOT NULL): 行1-11,13,14 = 13行 (行12=NULL除外)
      // q2=1: 行2,4,7,10,14 = 5件
      // q2=2: 行3,6,9,13 = 4件
      // q2=3: 行1,5,8 = 3件
      // q2=99(無回答): 行11 = 1件
      const gtN = 13;
      expect(r.nBySubLabel["GT"]).toBe(gtN);
      expect(findCell(r.cells, "1", "GT")!.count).toBe(5);
      expect(findCell(r.cells, "2", "GT")!.count).toBe(4);
      expect(findCell(r.cells, "3", "GT")!.count).toBe(3);
      expect(findCell(r.cells, "99", "GT")!.count).toBe(1);

      // クロス: q2有効行の中で q1 の値ごとに分岐
      // クロスヘッダーのn: q1=1かつq2有効 の行数
      // q1=1 かつ q2有効: 行1,3,5,7,10 (行12はq2=NULL除外) = 5行
      // q1=1 でq2=1: 行7,10 = 2件
      const crossCell = findCell(r.cells, "1", crossSub("q1", "1")); // q2=1, q1=1
      expect(crossCell).toBeDefined();
      expect(crossCell!.count).toBe(2);
    });
  });

  describe("SA × MA クロス集計", () => {
    it("q1 を q3 でクロスした結果が正しい", async () => {
      const query: Query = {
        questions: [{ type: "SA", column: "q1" }],
        weight_col: "",
        cross_cols: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      expect(findCell(r.cells, "1", "GT")).toBeDefined();

      // SA×MA: q1有効行の中でq3_1='1'のカウント
      // q1有効: 行1-13 (行14=空除外) = 13行
      // q1=1 の行: 行1,3,5,7,10,12
      // q1=1 かつ q3_1='1': 行1,3 = 2件
      const cell = findCell(r.cells, "1", crossSub("q3", "1"));
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(2);
    });
  });

  describe("MA × SA クロス集計", () => {
    it("q3 を q1 でクロスした結果が正しい", async () => {
      const query: Query = {
        questions: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
        weight_col: "",
        cross_cols: [{ type: "SA", column: "q1" }],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      // クロスヘッダー: q1の各値ごとのn（全survey行でq1有効な行のweight集計）
      // q1=1の行: 行1,3,5,7,10,12
      // q3_1='1' かつ q1=1: 行1,3 = 2件
      const cell = findCell(r.cells, "q3_1", crossSub("q1", "1"));
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(2);

      // q3_2='1' かつ q1=1: 行3(q3_2=1,q1=1), 行5(q3_2=1,q1=1), 行7(q3_2=1,q1=1) = 3件
      const cell2 = findCell(r.cells, "q3_2", crossSub("q1", "1"));
      expect(cell2).toBeDefined();
      expect(cell2!.count).toBe(3);
    });
  });

  describe("MA × MA クロス集計", () => {
    it("q3 を自身でクロスした結果にセルが存在する", async () => {
      const query: Query = {
        questions: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
        weight_col: "",
        cross_cols: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
      };

      const results = await aggregate(conn, query);
      expect(results).toHaveLength(1);

      const r = results[0];
      // q3_1='1' かつ q3_1='1': 行1,3,4,6,8,9,14 = 7件
      const cell = findCell(r.cells, "q3_1", crossSub("q3", "1"));
      expect(cell).toBeDefined();
      expect(cell!.count).toBe(7);

      // q3_1='1' かつ q3_2='1': 行3,9 = 2件
      const cell12 = findCell(r.cells, "q3_1", crossSub("q3", "2"));
      expect(cell12).toBeDefined();
      expect(cell12!.count).toBe(2);
    });
  });
});

describe("aggregate - 重み付き", () => {
  describe("SA GT集計（重み付き）", () => {
    it("q1 の重み付き GT 集計で weighted count が正しい", async () => {
      const query: Query = {
        questions: [{ type: "SA", column: "q1" }],
        weight_col: "weight",
        cross_cols: [],
      };

      const results = await aggregate(conn, query);
      const r = results[0];

      // q1有効行: 行1-13 (行14=空のみ除外, N/Aは文字列として有効)
      // q1=1: 行1(1.2)+3(1.5)+5(1.1)+7(1.3)+10(1.0)+12(0.8) = 6.9
      // q1=2: 行2(0.9)+6(1.0)+9(1.4) = 3.3
      // q1=3: 行4(0.8)+8(0.7) = 1.5
      // q1=N/A: 行11(1.0)+13(1.1) = 2.1
      // n = 6.9+3.3+1.5+2.1 = 13.8
      const cell1 = findCell(r.cells, "1", "GT")!;
      expect(cell1).toBeDefined();
      expect(cell1.count).toBeCloseTo(6.9, 1);
      expect(r.nBySubLabel["GT"]).toBeCloseTo(13.8, 1);
      const pv = pivot(r.cells, r.nBySubLabel);
      expect(pv.lookup.get("1\0GT")!.pct).toBeCloseTo((6.9 / 13.8) * 100, 1);

      const cell2 = findCell(r.cells, "2", "GT")!;
      expect(cell2.count).toBeCloseTo(3.3, 1);

      const cell3 = findCell(r.cells, "3", "GT")!;
      expect(cell3.count).toBeCloseTo(1.5, 1);
    });
  });

  describe("MA GT集計（重み付き）", () => {
    it("q3 の重み付き GT 集計で weighted count が正しい", async () => {
      const query: Query = {
        questions: [{ type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"], codes: ["1", "2", "3"] }],
        weight_col: "weight",
        cross_cols: [],
      };

      const results = await aggregate(conn, query);
      const r = results[0];

      // shown行: 行1-12,14 = 13行 (行13は全空で除外)
      // q3_1='1': 行1(1.2)+3(1.5)+4(0.8)+6(1.0)+8(0.7)+9(1.4)+14(1.0) = 7.6
      const cellQ3_1 = findCell(r.cells, "q3_1", "GT")!;
      expect(cellQ3_1).toBeDefined();
      expect(cellQ3_1.count).toBeCloseTo(7.6, 1);
    });
  });
});

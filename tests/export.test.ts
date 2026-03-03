import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTallies } from "../src/lib/agg/buildTallies";
import type { Question, Tally } from "../src/lib/agg/types";
import { setupDuckDB, teardownDuckDB } from "./helpers/duckdb";
import { buildExportGrids, type ExportGrid } from "../src/lib/export/exportGrid";
import { talliesToLongRows } from "../src/lib/export/longFormat";
import { formatCSV } from "../src/lib/export/formatters/csv";
import { formatTSV } from "../src/lib/export/formatters/tsv";
import { formatMarkdown } from "../src/lib/export/formatters/markdown";
import { formatJSON } from "../src/lib/export/formatters/json";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;
let gtTallies: Tally[];
let crossTallies: Tally[];

beforeAll(async () => {
  conn = await setupDuckDB();

  gtTallies = await buildTallies(conn, [q1, q3], [], "");
  crossTallies = await buildTallies(conn, [q2], [q1], "");
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

// ─── buildExportGrids ───────────────────────────────────────

describe("buildExportGrids", () => {
  it("GT結果から正しいグリッド構造を生成する", () => {
    const grids = buildExportGrids(gtTallies);
    expect(grids).toHaveLength(2);

    const grid = grids[0];
    expect(grid.question).toBe("q1");
    expect(grid.type).toBe("SA");
    expect(grid.headers).toHaveLength(1);
    expect(grid.headers[0]).toEqual(["変数名", "種別", "選択肢", "n", "%"]);
    // 4 options (1,2,3,99) + 1 n行
    expect(grid.rows).toHaveLength(5);
    // 最終行はn行
    expect(grid.rows[4][2]).toBe("n");
  });

  it("クロス結果からヘッダー2行のグリッドを生成する", () => {
    const grids = buildExportGrids(crossTallies);
    expect(grids).toHaveLength(1);

    const grid = grids[0];
    expect(grid.headers).toHaveLength(2);
    expect(grid.headers[0][0]).toBe("変数名");
    // クロス軸のサブヘッダーが存在
    expect(grid.headers[1].some((h: string) => h.length > 0)).toBe(true);
  });
});

// ─── talliesToLongRows ──────────────────────────────────────

describe("talliesToLongRows", () => {
  it("GT結果からロングフォーマット行を生成する", () => {
    const rows = talliesToLongRows(gtTallies);
    // ヘッダー行（i18n: ja）
    expect(rows[0]).toEqual(["変数名", "種別", "選択肢", "クロス軸", "クロス値", "n", "度数", "%"]);
    // GT行のcross_axis/cross_valueは(全体)
    expect(rows[1][3]).toBe("(全体)");
    expect(rows[1][4]).toBe("(全体)");
    // データ行数: ヘッダー1行 + 各tallyのcodes数の合計
    const expectedDataRows = gtTallies.reduce((sum, t) => sum + t.codes.length, 0);
    expect(rows).toHaveLength(1 + expectedDataRows);
  });

  it("クロス結果でcross_axis/cross_valueが設定される", () => {
    const rows = talliesToLongRows(crossTallies);
    // GT行(by===null)は(全体)
    const gtRows = rows.filter((r) => r[3] === "(全体)");
    expect(gtRows.length).toBeGreaterThan(0);
    // クロス行(by!==null)はcross_axisが軸ラベル
    const crossRows = rows.filter((r, i) => i > 0 && r[3] !== "(全体)");
    expect(crossRows.length).toBeGreaterThan(0);
  });

  it("ラベルが解決される", () => {
    const labeled: Tally = {
      question: "q_test",
      type: "SA",
      label: "Test Q",
      labels: { "1": "はい", "2": "いいえ" },
      codes: ["1", "2"],
      by: null,
      slices: [{ code: null, n: 10, cells: [{ count: 6, pct: 60 }, { count: 4, pct: 40 }] }],
    };
    const rows = talliesToLongRows([labeled]);
    expect(rows[1][2]).toBe("はい");
    expect(rows[2][2]).toBe("いいえ");
  });
});

// ─── CSV formatter ──────────────────────────────────────────

describe("formatCSV", () => {
  it("ロングフォーマットのCSVを出力する", () => {
    const csv = formatCSV(gtTallies);
    const lines = csv.split("\r\n");

    // ヘッダー行
    expect(lines[0]).toContain('"変数名"');
    expect(lines[0]).toContain('"クロス軸"');
    // データ行にq1が含まれる
    expect(lines.some((l) => l.includes('"q1"'))).toBe(true);
  });

  it("ダブルクォートがエスケープされる", () => {
    const tally: Tally = {
      question: "test",
      type: "SA",
      label: "test",
      labels: { "1": 'value with "quotes"' },
      codes: ["1"],
      by: null,
      slices: [{ code: null, n: 10, cells: [{ count: 10, pct: 100 }] }],
    };
    const csv = formatCSV([tally]);
    expect(csv).toContain('""quotes""');
  });
});

// ─── TSV formatter ──────────────────────────────────────────

describe("formatTSV", () => {
  it("タブ区切りのロングフォーマットで出力される", () => {
    const tsv = formatTSV(gtTallies);
    const lines = tsv.split("\n");

    expect(lines[0]).toContain("\t");
    expect(lines[0]).toContain("変数名");
    expect(lines[0]).toContain("クロス軸");
  });
});

// ─── Markdown formatter ─────────────────────────────────────

describe("formatMarkdown", () => {
  it("パイプ区切りのテーブルを生成する", () => {
    const grids = buildExportGrids(gtTallies);
    const md = formatMarkdown(grids);

    expect(md).toContain("### q1 (SA)");
    expect(md).toContain("| --- |");
    expect(md).toContain("| q1 |");
  });

  it("クロス結果でもMarkdownテーブルを生成する", () => {
    const grids = buildExportGrids(crossTallies);
    const md = formatMarkdown(grids);

    expect(md).toContain("### q2 (SA)");
    expect(md).toContain("| --- |");
  });
});

// ─── JSON formatter ─────────────────────────────────────────

describe("formatJSON", () => {
  it("パース可能なJSONを出力し、Tally[]がそのまま含まれる", () => {
    const json = formatJSON(gtTallies, "");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBeNull();
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results).toHaveLength(gtTallies.length);
    expect(parsed.results[0].question).toBe("q1");
    expect(parsed.results[0].type).toBe("SA");
    expect(Array.isArray(parsed.results[0].slices)).toBe(true);
    expect(Array.isArray(parsed.results[0].codes)).toBe(true);
  });

  it("weightCol指定時にweightColumnが含まれる", () => {
    const json = formatJSON(gtTallies, "weight");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBe("weight");
  });

  it("各sliceのcellsにcount/pctが数値で含まれる", () => {
    const json = formatJSON(gtTallies, "");
    const parsed = JSON.parse(json);
    const cell = parsed.results[0].slices[0].cells[0];

    expect(typeof cell.count).toBe("number");
    expect(typeof cell.pct).toBe("number");
  });

  it("クロス結果でbyフィールドが含まれる", () => {
    const json = formatJSON(crossTallies, "");
    const parsed = JSON.parse(json);
    const crossResult = parsed.results.find((r: Tally) => r.by !== null);

    expect(crossResult).toBeDefined();
    expect(crossResult.by.code).toBe("q1");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTabs } from "../src/lib/agg/buildTabs";
import type { Tab } from "../src/lib/agg/types";
import { setupDuckDB, teardownDuckDB, getConn } from "./helpers/duckdb";
import { getQuestion } from "./helpers/fixtures";
import { buildExportGrids } from "../src/lib/export/formatters/grid";
import { tabsToLongRows } from "../src/lib/export/formatters/longFormat";
import { formatCSV } from "../src/lib/export/formatters/csv";
import { formatTSV } from "../src/lib/export/formatters/tsv";
import { formatMarkdown } from "../src/lib/export/formatters/markdown";
import { formatJSON } from "../src/lib/export/formatters/json";

const q1 = getQuestion("q1");
const q2 = getQuestion("q2");
const q3 = getQuestion("q3");
let tabResults: Tab[];
let crossResults: Tab[];

beforeAll(async () => {
  await setupDuckDB();

  tabResults = await buildTabs(getConn(), [q1, q3], [], "");
  crossResults = await buildTabs(getConn(), [q2], [q1], "");
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

// ─── buildExportGrids ───────────────────────────────────────

describe("buildExportGrids", () => {
  it("GT結果から正しいグリッド構造を生成する", () => {
    const grids = buildExportGrids(tabResults);
    expect(grids).toHaveLength(2);

    const grid = grids[0];
    expect(grid.questionCode).toBe("q1");
    expect(grid.type).toBe("SA");
    expect(grid.headers).toHaveLength(1);
    expect(grid.headers[0]).toEqual(["変数名", "種別", "選択肢", "n", "%"]);
    // 4 options (1,2,3,99) + 1 n行
    expect(grid.rows).toHaveLength(5);
    // 最終行はn行
    expect(grid.rows[4][2]).toBe("n");
  });

  it("クロス結果からヘッダー2行のグリッドを生成する", () => {
    const grids = buildExportGrids(crossResults);
    expect(grids).toHaveLength(1);

    const grid = grids[0];
    expect(grid.headers).toHaveLength(2);
    expect(grid.headers[0][0]).toBe("変数名");
    // クロス軸のサブヘッダーが存在
    expect(grid.headers[1].some((h: string) => h.length > 0)).toBe(true);
  });
});

// ─── tabsToLongRows ──────────────────────────────────────

describe("tabsToLongRows", () => {
  it("GT結果からロングフォーマット行を生成する", () => {
    const rows = tabsToLongRows(tabResults);
    // ヘッダー行（i18n: ja）
    expect(rows[0]).toEqual(["変数名", "種別", "選択肢", "クロス軸", "クロス値", "n", "度数", "%"]);
    // GT行のcross_axis/cross_valueは(全体)
    expect(rows[1][3]).toBe("(全体)");
    expect(rows[1][4]).toBe("(全体)");
    // データ行数: ヘッダー1行 + 各tabのcodes数の合計
    const expectedDataRows = tabResults.reduce((sum, t) => sum + t.codes.length, 0);
    expect(rows).toHaveLength(1 + expectedDataRows);
  });

  it("クロス結果でcross_axis/cross_valueが設定される", () => {
    const rows = tabsToLongRows(crossResults);
    // Tab行(by===null)は(全体)
    const tabRows = rows.filter((r) => r[3] === "(全体)");
    expect(tabRows.length).toBeGreaterThan(0);
    // クロス行(by!==null)はcross_axisが軸ラベル
    const crossRows = rows.filter((r, i) => i > 0 && r[3] !== "(全体)");
    expect(crossRows.length).toBeGreaterThan(0);
  });

  it("ラベルが解決される", () => {
    const labeled: Tab = {
      questionCode: "q_test",
      type: "SA",
      label: "Test Q",
      labels: { "1": "はい", "2": "いいえ" },
      codes: ["1", "2"],
      by: null,
      slices: [{ code: null, n: 10, cells: [{ count: 6, pct: 60 }, { count: 4, pct: 40 }] }],
    };
    const rows = tabsToLongRows([labeled]);
    expect(rows[1][2]).toBe("はい");
    expect(rows[2][2]).toBe("いいえ");
  });
});

// ─── CSV formatter ──────────────────────────────────────────

describe("formatCSV", () => {
  it("ロングフォーマットのCSVを出力する", () => {
    const csv = formatCSV(tabResults);
    const lines = csv.split("\r\n");

    // ヘッダー行
    expect(lines[0]).toContain('"変数名"');
    expect(lines[0]).toContain('"クロス軸"');
    // データ行にq1が含まれる
    expect(lines.some((l) => l.includes('"q1"'))).toBe(true);
  });

  it("ダブルクォートがエスケープされる", () => {
    const tab: Tab = {
      questionCode: "test",
      type: "SA",
      label: "test",
      labels: { "1": 'value with "quotes"' },
      codes: ["1"],
      by: null,
      slices: [{ code: null, n: 10, cells: [{ count: 10, pct: 100 }] }],
    };
    const csv = formatCSV([tab]);
    expect(csv).toContain('""quotes""');
  });
});

// ─── TSV formatter ──────────────────────────────────────────

describe("formatTSV", () => {
  it("タブ区切りのロングフォーマットで出力される", () => {
    const tsv = formatTSV(tabResults);
    const lines = tsv.split("\n");

    expect(lines[0]).toContain("\t");
    expect(lines[0]).toContain("変数名");
    expect(lines[0]).toContain("クロス軸");
  });
});

// ─── Markdown formatter ─────────────────────────────────────

describe("formatMarkdown", () => {
  it("パイプ区切りのテーブルを生成する", () => {
    const md = formatMarkdown(tabResults);

    expect(md).toContain("### q1 (SA)");
    expect(md).toContain("| --- |");
    expect(md).toContain("| q1 |");
  });

  it("クロス結果でもMarkdownテーブルを生成する", () => {
    const md = formatMarkdown(crossResults);

    expect(md).toContain("### q2 (SA)");
    expect(md).toContain("| --- |");
  });
});

// ─── JSON formatter ─────────────────────────────────────────

describe("formatJSON", () => {
  it("パース可能なJSONを出力し、Tab[]がそのまま含まれる", () => {
    const json = formatJSON(tabResults, "");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBeNull();
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results).toHaveLength(tabResults.length);
    expect(parsed.results[0].questionCode).toBe("q1");
    expect(parsed.results[0].type).toBe("SA");
    expect(Array.isArray(parsed.results[0].slices)).toBe(true);
    expect(Array.isArray(parsed.results[0].codes)).toBe(true);
  });

  it("weightCol指定時にweightColumnが含まれる", () => {
    const json = formatJSON(tabResults, "weight");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBe("weight");
  });

  it("各sliceのcellsにcount/pctが数値で含まれる", () => {
    const json = formatJSON(tabResults, "");
    const parsed = JSON.parse(json);
    const cell = parsed.results[0].slices[0].cells[0];

    expect(typeof cell.count).toBe("number");
    expect(typeof cell.pct).toBe("number");
  });

  it("クロス結果でbyフィールドが含まれる", () => {
    const json = formatJSON(crossResults, "");
    const parsed = JSON.parse(json);
    const crossResult = parsed.results.find((r: Tab) => r.by !== null);

    expect(crossResult).toBeDefined();
    expect(crossResult.by.code).toBe("q1");
  });
});

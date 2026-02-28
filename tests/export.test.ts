import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggregate, type Query, type AggResult } from "../src/lib/agg/aggregate";
import { setupDuckDB, teardownDuckDB } from "./helpers/duckdb";
import { buildExportGrids, type ExportGrid } from "../src/lib/export/exportGrid";
import { formatCSV } from "../src/lib/export/formatters/csv";
import { formatTSV, formatHTML } from "../src/lib/export/formatters/tsv";
import { formatMarkdown } from "../src/lib/export/formatters/markdown";
import { formatJSON } from "../src/lib/export/formatters/json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;
let gtResults: AggResult[];
let crossResults: AggResult[];

beforeAll(async () => {
  conn = await setupDuckDB();

  const gtQuery: Query = {
    questions: [
      { type: "SA", column: "q1" },
      { type: "MA", prefix: "q3", columns: ["q3_1", "q3_2", "q3_3"] },
    ],
    weight_col: "",
    cross_cols: [],
  };
  gtResults = await aggregate(conn, gtQuery);

  const crossQuery: Query = {
    questions: [{ type: "SA", column: "q2" }],
    weight_col: "",
    cross_cols: [{ type: "SA", column: "q1" }],
  };
  crossResults = await aggregate(conn, crossQuery);
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

// ─── buildExportGrids ───────────────────────────────────────

describe("buildExportGrids", () => {
  it("GT結果から正しいグリッド構造を生成する", () => {
    const grids = buildExportGrids(gtResults);
    expect(grids).toHaveLength(2);

    const grid = grids[0];
    expect(grid.question).toBe("q1");
    expect(grid.type).toBe("SA");
    expect(grid.headers).toHaveLength(1);
    expect(grid.headers[0]).toEqual(["変数名", "種別", "選択肢", "n", "%"]);
    // 4 options (1,2,3,N/A) + 1 n行
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

// ─── CSV formatter ──────────────────────────────────────────

describe("formatCSV", () => {
  it("カンマ区切りで正しく出力される", () => {
    const grids = buildExportGrids(gtResults);
    const csv = formatCSV(grids);
    const lines = csv.split("\r\n");

    // ヘッダー行
    expect(lines[0]).toContain('"変数名"');
    expect(lines[0]).toContain('"n"');
    // データ行にq1が含まれる
    expect(lines.some((l) => l.includes('"q1"'))).toBe(true);
  });

  it("ダブルクォートがエスケープされる", () => {
    const grid: ExportGrid = {
      question: "test",
      type: "SA",
      headers: [["col"]],
      rows: [['value with "quotes"']],
    };
    const csv = formatCSV([grid]);
    expect(csv).toContain('""quotes""');
  });
});

// ─── TSV formatter ──────────────────────────────────────────

describe("formatTSV", () => {
  it("タブ区切りで出力される", () => {
    const grids = buildExportGrids(gtResults);
    const tsv = formatTSV(grids);
    const lines = tsv.split("\n");

    expect(lines[0]).toContain("\t");
    expect(lines[0]).toContain("変数名");
  });
});

// ─── HTML formatter ─────────────────────────────────────────

describe("formatHTML", () => {
  it("テーブルタグを含むHTMLを生成する", () => {
    const grids = buildExportGrids(gtResults);
    const html = formatHTML(grids);

    expect(html).toContain("<table>");
    expect(html).toContain("</table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
  });

  it("HTMLエスケープが適用される", () => {
    const grid: ExportGrid = {
      question: "test",
      type: "SA",
      headers: [["<script>"]],
      rows: [["a & b"]],
    };
    const html = formatHTML([grid]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
  });
});

// ─── Markdown formatter ─────────────────────────────────────

describe("formatMarkdown", () => {
  it("パイプ区切りのテーブルを生成する", () => {
    const grids = buildExportGrids(gtResults);
    const md = formatMarkdown(grids);

    expect(md).toContain("### q1 (SA)");
    expect(md).toContain("| --- |");
    expect(md).toContain("| q1 |");
  });

  it("クロス結果でもMarkdownテーブルを生成する", () => {
    const grids = buildExportGrids(crossResults);
    const md = formatMarkdown(grids);

    expect(md).toContain("### q2 (SA)");
    expect(md).toContain("| --- |");
  });
});

// ─── JSON formatter ─────────────────────────────────────────

describe("formatJSON", () => {
  it("パース可能なJSONを出力する", () => {
    const json = formatJSON(gtResults, "");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBeNull();
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].question).toBe("q1");
    expect(parsed.results[0].type).toBe("SA");
    expect(typeof parsed.results[0].n).toBe("number");
    expect(Array.isArray(parsed.results[0].options)).toBe(true);
  });

  it("weightCol指定時にweightColumnが含まれる", () => {
    const json = formatJSON(gtResults, "weight");
    const parsed = JSON.parse(json);

    expect(parsed.weightColumn).toBe("weight");
  });

  it("各optionにcount/pctが数値で含まれる", () => {
    const json = formatJSON(gtResults, "");
    const parsed = JSON.parse(json);
    const opt = parsed.results[0].options[0];

    expect(typeof opt.count).toBe("number");
    expect(typeof opt.pct).toBe("number");
    expect(typeof opt.label).toBe("string");
  });

  it("クロス結果でcrossフィールドが含まれる", () => {
    const json = formatJSON(crossResults, "");
    const parsed = JSON.parse(json);
    const opt = parsed.results[0].options[0];

    expect(opt.cross).toBeDefined();
    expect(typeof opt.cross).toBe("object");
  });
});

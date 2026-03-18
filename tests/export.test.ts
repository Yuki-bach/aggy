import { describe, it, expect } from "vitest";
import type { Tab } from "../src/lib/agg/types";
import { buildExportGrids } from "../src/lib/export/formatters/grid";
import { tabsToLongRows } from "../src/lib/export/formatters/longFormat";
import { formatCSV } from "../src/lib/export/formatters/csv";
import { formatTSV } from "../src/lib/export/formatters/tsv";
import { formatMarkdown } from "../src/lib/export/formatters/markdown";
import { formatJSON } from "../src/lib/export/formatters/json";
import { SA_GT, MA_GT, NA_GT, SA_CROSS, NA_CROSS, SA_MA_NA_GT } from "./helpers/tabFixtures";

// ─── buildExportGrids ─────────────────────────────────────────

describe("buildExportGrids", () => {
  it("SA GT: ヘッダー1行5列、rows = codes + n行", () => {
    const grid = buildExportGrids([SA_GT])[0];
    expect(grid.questionCode).toBe("q_sa");
    expect(grid.type).toBe("SA");
    expect(grid.headers).toHaveLength(1);
    expect(grid.headers[0]).toEqual(["変数名", "種別", "選択肢", "n", "%"]);
    expect(grid.rows).toHaveLength(SA_GT.codes.length + 1);
    expect(grid.rows[grid.rows.length - 1][2]).toBe("n");
  });

  it("NA GT: 6行 (n/mean/median/sd/min/max)、ヘッダー1行4列", () => {
    const grids = buildExportGrids([NA_GT]);
    expect(grids).toHaveLength(1);
    const grid = grids[0];
    expect(grid.type).toBe("NA");
    expect(grid.headers).toHaveLength(1);
    expect(grid.headers[0]).toHaveLength(4);
    expect(grid.rows).toHaveLength(6);
  });

  it("NA GT: n → toFixed(1)、他 → toFixed(2)", () => {
    const grid = buildExportGrids([NA_GT])[0];
    // n row (first row)
    expect(grid.rows[0][3]).toBe("8.0");
    // mean row
    expect(grid.rows[1][3]).toBe("3.50");
    // median row
    expect(grid.rows[2][3]).toBe("3.00");
    // sd row
    expect(grid.rows[3][3]).toBe("1.20");
    // min row
    expect(grid.rows[4][3]).toBe("1.00");
    // max row
    expect(grid.rows[5][3]).toBe("6.00");
  });

  it("MA GT: codes.length + 1 (n行) の rows", () => {
    const grid = buildExportGrids([MA_GT])[0];
    expect(grid.type).toBe("MA");
    expect(grid.rows).toHaveLength(MA_GT.codes.length + 1);
    expect(grid.rows[grid.rows.length - 1][2]).toBe("n");
  });

  it("SA+MA+NA 混在 GT: grids.length === 3、各 type が正しい", () => {
    const grids = buildExportGrids(SA_MA_NA_GT);
    expect(grids).toHaveLength(3);
    expect(grids[0].type).toBe("SA");
    expect(grids[1].type).toBe("MA");
    expect(grids[2].type).toBe("NA");
  });

  it("SA クロスグリッド: ヘッダー2行、データ行の列数 === ヘッダー列数", () => {
    const grids = buildExportGrids(SA_CROSS);
    expect(grids).toHaveLength(1);
    const grid = grids[0];
    expect(grid.headers).toHaveLength(2);
    const colCount = grid.headers[0].length;
    for (const row of grid.rows) {
      expect(row).toHaveLength(colCount);
    }
  });

  it("NA クロスグリッド: ヘッダー2行、stats 値がクロス軸ごとに出力", () => {
    const grids = buildExportGrids(NA_CROSS);
    const naGrid = grids.find((g) => g.type === "NA")!;
    expect(naGrid.headers).toHaveLength(2);
    expect(naGrid.rows).toHaveLength(6);
    // Total + 2 cross slices = 4列目以降にクロス値
    expect(naGrid.rows[0].length).toBeGreaterThan(4);
  });

  it("列数整合性 (GT): 全行がヘッダー列数と一致", () => {
    for (const tab of [SA_GT, MA_GT, NA_GT]) {
      const grid = buildExportGrids([tab])[0];
      const colCount = grid.headers[0].length;
      for (const row of grid.rows) {
        expect(row).toHaveLength(colCount);
      }
    }
  });

  it("列数整合性 (クロス): 全行がヘッダー列数と一致", () => {
    for (const tabs of [SA_CROSS, NA_CROSS]) {
      const grids = buildExportGrids(tabs);
      for (const grid of grids) {
        const colCount = grid.headers[0].length;
        for (const row of grid.rows) {
          expect(row).toHaveLength(colCount);
        }
      }
    }
  });
});

// ─── tabsToLongRows (fixture) ───────────────────────────────

describe("tabsToLongRows", () => {
  it("ヘッダー行の内容が正しい", () => {
    const rows = tabsToLongRows([SA_GT]);
    expect(rows[0]).toEqual(["変数名", "種別", "選択肢", "クロス軸", "クロス値", "n", "度数", "%"]);
  });

  it("GT行のcross_axis/cross_valueは(全体)", () => {
    const rows = tabsToLongRows([SA_GT]);
    expect(rows[1][3]).toBe("(全体)");
    expect(rows[1][4]).toBe("(全体)");
  });

  it("ラベルが解決される", () => {
    const rows = tabsToLongRows([SA_GT]);
    expect(rows[1][2]).toBe("はい");
    expect(rows[2][2]).toBe("いいえ");
  });

  it("MA タブのロング行: 行数 = 1 + codes.length", () => {
    const rows = tabsToLongRows([MA_GT]);
    expect(rows).toHaveLength(1 + MA_GT.codes.length);
  });

  it("クロス × 複数スライス: 行数 = 1 + Σ(codes.length × slices.length)", () => {
    const rows = tabsToLongRows(SA_CROSS);
    const expected = SA_CROSS.reduce((sum, tab) => sum + tab.codes.length * tab.slices.length, 0);
    expect(rows).toHaveLength(1 + expected);
  });

  it("by.labels の解決: crossValue 列にラベルが入る", () => {
    const rows = tabsToLongRows(SA_CROSS);
    // Cross tab rows (not GT) should have resolved labels
    const crossRows = rows.filter((r, i) => i > 0 && r[3] !== "(全体)");
    expect(crossRows.length).toBeGreaterThan(0);
    for (const row of crossRows) {
      expect(row[4]).toMatch(/男性|女性/);
    }
  });
});

// ─── formatCSV (fixture) ────────────────────────────────────

describe("formatCSV", () => {
  it("ヘッダーに変数名・クロス軸が含まれる", () => {
    const csv = formatCSV([SA_GT]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain('"変数名"');
    expect(lines[0]).toContain('"クロス軸"');
    expect(lines.some((l) => l.includes('"q_sa"'))).toBe(true);
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

  it("ラベルにカンマ: クォート内に収まる", () => {
    const tab: Tab = {
      questionCode: "q_comma",
      type: "SA",
      label: "test",
      labels: { "1": "A, B" },
      codes: ["1"],
      by: null,
      slices: [{ code: null, n: 5, cells: [{ count: 5, pct: 100 }] }],
    };
    const csv = formatCSV([tab]);
    expect(csv).toContain('"A, B"');
  });

  it("ラベルに改行: クォート内に収まる", () => {
    const tab: Tab = {
      questionCode: "q_nl",
      type: "SA",
      label: "test",
      labels: { "1": "line1\nline2" },
      codes: ["1"],
      by: null,
      slices: [{ code: null, n: 5, cells: [{ count: 5, pct: 100 }] }],
    };
    const csv = formatCSV([tab]);
    expect(csv).toContain('"line1\nline2"');
  });

  it("空 tabs: ヘッダー行のみ出力", () => {
    const csv = formatCSV([]);
    const lines = csv.split("\r\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
  });

  it("SA fixture の CSV: questionCode と type が出力される", () => {
    const csv = formatCSV([SA_GT]);
    expect(csv).toContain('"q_sa"');
    expect(csv).toContain('"SA"');
  });
});

// ─── formatTSV (fixture) ────────────────────────────────────

describe("formatTSV", () => {
  it("SA fixture の TSV: 出力構造が正しい", () => {
    const tsv = formatTSV([SA_GT]);
    const lines = tsv.split("\n");
    expect(lines[0]).toContain("\t");
    // header + codes.length rows
    expect(lines).toHaveLength(1 + SA_GT.codes.length);
  });

  it("空 tabs: ヘッダーのみ", () => {
    const tsv = formatTSV([]);
    const lines = tsv.split("\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
  });
});

// ─── formatMarkdown (fixture) ───────────────────────────────

describe("formatMarkdown", () => {
  it("パイプ文字エスケープ: \\| に変換される", () => {
    const tab: Tab = {
      questionCode: "q_pipe",
      type: "SA",
      label: "test",
      labels: { "1": "A|B" },
      codes: ["1"],
      by: null,
      slices: [{ code: null, n: 5, cells: [{ count: 5, pct: 100 }] }],
    };
    const md = formatMarkdown([tab]);
    expect(md).toContain("A\\|B");
  });

  it("NA GT の Markdown: ### q_na (NA) セクション、6データ行", () => {
    const md = formatMarkdown([NA_GT]);
    expect(md).toContain("### q_na (NA)");
    const lines = md.split("\n");
    // Count data rows (lines starting with | that are not header or separator)
    const pipeLines = lines.filter((l) => l.startsWith("|"));
    // 1 header + 1 separator + 6 data rows = 8
    expect(pipeLines).toHaveLength(8);
  });

  it("NA クロスの Markdown: 2行ヘッダーのマージ", () => {
    const md = formatMarkdown(NA_CROSS);
    expect(md).toContain("### q_na (NA)");
    // Merged header should contain cross axis labels
    expect(md).toMatch(/男性|女性/);
  });

  it("セパレータ行の列数: --- の数がヘッダー列数と一致", () => {
    for (const tabs of [[SA_GT], [MA_GT], [NA_GT], SA_CROSS, NA_CROSS]) {
      const md = formatMarkdown(tabs);
      const lines = md.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("| --- |")) {
          // Count columns by splitting on | and excluding first/last empty parts
          const sepParts = lines[i].split("|").slice(1, -1);
          const headerParts = lines[i - 1].split("|").slice(1, -1);
          expect(sepParts).toHaveLength(headerParts.length);
        }
      }
    }
  });
});

// ─── formatJSON (fixture) ───────────────────────────────────

describe("formatJSON", () => {
  it("パース可能なJSONを出力し、Tab[]がそのまま含まれる", () => {
    const json = formatJSON([SA_GT], "");
    const parsed = JSON.parse(json);
    expect(parsed.weightColumn).toBeNull();
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0].questionCode).toBe("q_sa");
    expect(parsed.results[0].type).toBe("SA");
    expect(Array.isArray(parsed.results[0].slices)).toBe(true);
    expect(Array.isArray(parsed.results[0].codes)).toBe(true);
  });

  it("weightCol指定時にweightColumnが含まれる", () => {
    const json = formatJSON([SA_GT], "weight");
    const parsed = JSON.parse(json);
    expect(parsed.weightColumn).toBe("weight");
  });

  it("各sliceのcellsにcount/pctが数値で含まれる", () => {
    const json = formatJSON([SA_GT], "");
    const parsed = JSON.parse(json);
    const cell = parsed.results[0].slices[0].cells[0];
    expect(typeof cell.count).toBe("number");
    expect(typeof cell.pct).toBe("number");
  });

  it("クロス結果でbyフィールドが含まれる", () => {
    const json = formatJSON(SA_CROSS, "");
    const parsed = JSON.parse(json);
    const crossResult = parsed.results.find((r: Tab) => r.by !== null);
    expect(crossResult).toBeDefined();
    expect(crossResult.by.code).toBe("gender");
  });

  it("NA タブで stats が含まれる", () => {
    const json = formatJSON([NA_GT], "");
    const parsed = JSON.parse(json);
    expect(parsed.results[0].slices[0].stats).toBeDefined();
    expect(parsed.results[0].slices[0].stats.n).toBe(8);
    expect(parsed.results[0].slices[0].stats.mean).toBe(3.5);
    expect(parsed.results[0].slices[0].stats.median).toBe(3);
    expect(parsed.results[0].slices[0].stats.sd).toBe(1.2);
    expect(parsed.results[0].slices[0].stats.min).toBe(1);
    expect(parsed.results[0].slices[0].stats.max).toBe(6);
  });

  it("stats の数値精度: mean/sd 等が元の値と一致", () => {
    const json = formatJSON([NA_GT], "");
    const parsed = JSON.parse(json);
    const stats = parsed.results[0].slices[0].stats;
    const original = NA_GT.slices[0].stats!;
    expect(stats.mean).toBe(original.mean);
    expect(stats.sd).toBe(original.sd);
    expect(stats.min).toBe(original.min);
    expect(stats.max).toBe(original.max);
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { validateRawData, type Diagnostic } from "../src/lib/validateRawData";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import type { Layout } from "../src/lib/layout";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("validateRawData", () => {
  it("全項目正常 → 空配列", async () => {
    const csv = "q1,q3_1,q3_2\n1,0,1\n2,1,0\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "SA", key: "q1", label: "Q1", items: [{ code: "1", label: "A" }, { code: "2", label: "B" }] },
      { type: "MA", key: "q3", label: "Q3", items: [{ code: "1", label: "X" }, { code: "2", label: "Y" }] },
    ];
    const result = await validateRawData(getConn(), ["q1", "q3_1", "q3_2"], layout);
    expect(result).toEqual([]);
  });

  it("SA 未定義コード → unknownCode error", async () => {
    const csv = "q1\n1\n2\n9\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "SA", key: "q1", label: "Q1", items: [{ code: "1", label: "A" }, { code: "2", label: "B" }] },
    ];
    const result = await validateRawData(getConn(), ["q1"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "unknownCode",
      severity: "error",
      key: "q1",
    });
    expect(result[0].params.codes).toBe("9");
  });

  it("SA カラム欠損 → dropped warn", async () => {
    const csv = "other\n1\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "SA", key: "q1", label: "Q1", items: [{ code: "1", label: "A" }] },
    ];
    const result = await validateRawData(getConn(), ["other"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "dropped", severity: "warn", key: "q1" });
  });

  it("NA カラム欠損 → dropped warn", async () => {
    const csv = "other\n1\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "NA", key: "age", label: "年齢" },
    ];
    const result = await validateRawData(getConn(), ["other"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "dropped", severity: "warn", key: "age" });
  });

  it("WEIGHT カラム欠損 → dropped warn", async () => {
    const csv = "other\n1\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "WEIGHT", key: "w", label: "ウェイト" },
    ];
    const result = await validateRawData(getConn(), ["other"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "dropped", severity: "warn", key: "w" });
  });

  it("DATE カラム欠損 → dropped warn", async () => {
    const csv = "other\n1\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "DATE", key: "date1", label: "回答日", granularity: "month" },
    ];
    const result = await validateRawData(getConn(), ["other"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "dropped", severity: "warn", key: "date1" });
  });

  it("MA カラム全欠損 → dropped warn", async () => {
    const csv = "other\n1\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "MA", key: "q3", label: "Q3", items: [{ code: "1", label: "X" }, { code: "2", label: "Y" }] },
    ];
    const result = await validateRawData(getConn(), ["other"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "dropped", severity: "warn", key: "q3" });
  });

  it("MA 不正値 (0/1以外) → invalidMAValue error", async () => {
    const csv = "q3_1,q3_2\n0,1\n1,2\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "MA", key: "q3", label: "Q3", items: [{ code: "1", label: "X" }, { code: "2", label: "Y" }] },
    ];
    const result = await validateRawData(getConn(), ["q3_1", "q3_2"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "invalidMAValue",
      severity: "error",
      key: "q3",
    });
    expect(result[0].params.values).toBe("2");
  });

  it("NA 非数値 → nonNumeric error", async () => {
    const csv = "age\n25\nabc\n30\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "NA", key: "age", label: "年齢" },
    ];
    const result = await validateRawData(getConn(), ["age"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "nonNumeric",
      severity: "error",
      key: "age",
    });
    expect(result[0].params.count).toBe("1");
  });

  it("WEIGHT 非数値 → nonNumeric error", async () => {
    const csv = "w\n1.0\nfoo\n0.8\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "WEIGHT", key: "w", label: "ウェイト" },
    ];
    const result = await validateRawData(getConn(), ["w"], layout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "nonNumeric",
      severity: "error",
      key: "w",
    });
    expect(result[0].params.count).toBe("1");
  });

  it("複数問題の混在 → 全件返却", async () => {
    const csv = "q1,q3_1\n1,0\n9,3\n";
    await loadCSV(csv);

    const layout: Layout = [
      { type: "SA", key: "q1", label: "Q1", items: [{ code: "1", label: "A" }] },
      { type: "MA", key: "q3", label: "Q3", items: [{ code: "1", label: "X" }, { code: "2", label: "Y" }] },
      { type: "NA", key: "missing", label: "欠損NA" },
    ];
    const result = await validateRawData(getConn(), ["q1", "q3_1"], layout);

    const types = result.map((d) => d.type);
    expect(types).toContain("unknownCode"); // q1 has code 9
    expect(types).toContain("invalidMAValue"); // q3_1 has value 3
    expect(types).toContain("dropped"); // missing NA column
    expect(result).toHaveLength(3);
  });
});

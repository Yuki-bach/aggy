import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vite-plus/test";
import { prepareDerivedColumns, checkBinCoverage } from "../src/lib/derivedPreparation";
import { setupDuckDB, teardownDuckDB, getConn, loadCSVAsTable } from "./helpers/duckdb";
import type { Layout } from "../src/lib/layout";
import type { DerivedRecipe } from "../src/lib/derivedRecipe";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const layout: Layout = [
  {
    type: "SA",
    key: "gender",
    label: "性別",
    items: [
      { code: "1", label: "男性" },
      { code: "2", label: "女性" },
    ],
  },
  {
    type: "SA",
    key: "age",
    label: "年代",
    items: [
      { code: "1", label: "20代" },
      { code: "2", label: "30代" },
    ],
  },
  { type: "NA", key: "score", label: "スコア" },
];

describe("prepareDerivedColumns", () => {
  describe("combineSA", () => {
    beforeEach(async () => {
      await loadCSVAsTable("gender,age,score\n1,1,75\n2,2,30\n1,2,90\n");
    });

    it("2設問の掛け合わせ列を作成", async () => {
      const recipes: DerivedRecipe[] = [
        {
          type: "combineSA",
          code: "gender_age",
          label: "性別×年代",
          sources: ["gender", "age"],
        },
      ];
      const { layout: newLayout, warnings } = await prepareDerivedColumns(
        getConn(),
        layout,
        recipes,
      );

      expect(warnings).toEqual([]);

      // Layout should have the new SA entry
      const derived = newLayout.find((q) => q.key === "gender_age");
      expect(derived).toBeDefined();
      expect(derived!.type).toBe("SA");
      expect(derived!.label).toBe("性別×年代");
      if (derived!.type === "SA") {
        expect(derived!.items).toEqual([
          { code: "1_1", label: "男性×20代" },
          { code: "1_2", label: "男性×30代" },
          { code: "2_1", label: "女性×20代" },
          { code: "2_2", label: "女性×30代" },
        ]);
      }

      // Verify actual data in DuckDB
      const result = await getConn().query(`SELECT "gender_age" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.gender_age);
      expect(values).toEqual(["1_1", "2_2", "1_2"]);
    });

    it("NULLソースがあれば派生列もNULL", async () => {
      await loadCSVAsTable("gender,age,score\n1,,75\n,2,30\n1,2,90\n");
      const recipes: DerivedRecipe[] = [
        { type: "combineSA", code: "ga", label: "性別×年代", sources: ["gender", "age"] },
      ];
      const { warnings } = await prepareDerivedColumns(getConn(), layout, recipes);
      expect(warnings).toEqual([]);

      const result = await getConn().query(`SELECT "ga" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.ga);
      expect(values).toEqual([null, null, "1_2"]);
    });

    it("カスタムseparator", async () => {
      const recipes: DerivedRecipe[] = [
        {
          type: "combineSA",
          code: "ga",
          label: "性別×年代",
          sources: ["gender", "age"],
          separator: "-",
        },
      ];
      const { layout: newLayout } = await prepareDerivedColumns(getConn(), layout, recipes);

      const result = await getConn().query(`SELECT "ga" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.ga);
      expect(values).toEqual(["1-1", "2-2", "1-2"]);

      const derived = newLayout.find((q) => q.key === "ga");
      if (derived?.type === "SA") {
        expect(derived.items[0].code).toBe("1-1");
      }
    });
  });

  describe("binNA", () => {
    beforeEach(async () => {
      await loadCSVAsTable("gender,age,score\n1,1,75\n2,2,30\n1,2,90\n2,1,10\n");
    });

    it("ビニングでSA列を作成", async () => {
      const recipes: DerivedRecipe[] = [
        {
          type: "binNA",
          code: "score_bin",
          label: "スコア",
          source: "score",
          bins: [
            { code: "low", label: "低", min: null, max: 50 },
            { code: "high", label: "高", min: 50, max: null },
          ],
        },
      ];
      const { layout: newLayout, warnings } = await prepareDerivedColumns(
        getConn(),
        layout,
        recipes,
      );

      expect(warnings).toEqual([]);

      const derived = newLayout.find((q) => q.key === "score_bin");
      expect(derived).toBeDefined();
      expect(derived!.type).toBe("SA");
      expect(derived!.label).toBe("スコア");
      if (derived!.type === "SA") {
        expect(derived!.items).toEqual([
          { code: "low", label: "低" },
          { code: "high", label: "高" },
        ]);
      }

      const result = await getConn().query(`SELECT "score_bin" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.score_bin);
      expect(values).toEqual(["high", "low", "high", "low"]);
    });

    it("値そのままSA化（1値1bin）", async () => {
      const recipes: DerivedRecipe[] = [
        {
          type: "binNA",
          code: "score_sa",
          label: "スコア",
          source: "score",
          bins: [
            { code: "10", label: "10", min: 10, max: 11 },
            { code: "30", label: "30", min: 30, max: 31 },
            { code: "75", label: "75", min: 75, max: 76 },
            { code: "90", label: "90", min: 90, max: 91 },
          ],
        },
      ];
      const { warnings } = await prepareDerivedColumns(getConn(), layout, recipes);
      expect(warnings).toEqual([]);

      const result = await getConn().query(`SELECT "score_sa" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.score_sa);
      expect(values).toEqual(["75", "30", "90", "10"]);
    });

    it("該当しない行がある場合はwarning", async () => {
      const recipes: DerivedRecipe[] = [
        {
          type: "binNA",
          code: "score_bin",
          label: "スコア",
          source: "score",
          bins: [{ code: "low", label: "低", min: 0, max: 50 }],
        },
      ];
      const { warnings } = await prepareDerivedColumns(getConn(), layout, recipes);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain("2件");
    });

    it("NULLソースは派生列もNULL", async () => {
      await loadCSVAsTable("gender,age,score\n1,1,\n2,2,30\n");
      const recipes: DerivedRecipe[] = [
        {
          type: "binNA",
          code: "sb",
          label: "スコア",
          source: "score",
          bins: [{ code: "all", label: "全て", min: null, max: null }],
        },
      ];
      const { warnings } = await prepareDerivedColumns(getConn(), layout, recipes);
      expect(warnings).toEqual([]);

      const result = await getConn().query(`SELECT "sb" FROM survey ORDER BY rowid`);
      const values = result.toArray().map((r: Record<string, unknown>) => r.sb);
      expect(values).toEqual([null, "all"]);
    });
  });

  describe("再実行（冪等性）", () => {
    beforeEach(async () => {
      await loadCSVAsTable("gender,age,score\n1,1,75\n2,2,30\n");
    });

    it("同じレシピを2回実行してもエラーなし", async () => {
      const recipes: DerivedRecipe[] = [
        { type: "combineSA", code: "ga", label: "性別×年代", sources: ["gender", "age"] },
      ];
      await prepareDerivedColumns(getConn(), layout, recipes);
      const { warnings } = await prepareDerivedColumns(getConn(), layout, recipes);
      expect(warnings).toEqual([]);
    });
  });
});

describe("checkBinCoverage", () => {
  beforeEach(async () => {
    await loadCSVAsTable("score\n10\n30\n75\n90\n");
  });

  it("全カバー → uncoveredCount = 0", async () => {
    const result = await checkBinCoverage(getConn(), "score", [
      { code: "low", label: "低", min: null, max: 50 },
      { code: "high", label: "高", min: 50, max: null },
    ]);
    expect(result.min).toBe(10);
    expect(result.max).toBe(90);
    expect(result.uncoveredCount).toBe(0);
  });

  it("部分カバー → uncoveredCount > 0", async () => {
    const result = await checkBinCoverage(getConn(), "score", [
      { code: "low", label: "低", min: 0, max: 50 },
    ]);
    expect(result.uncoveredCount).toBe(2);
  });
});

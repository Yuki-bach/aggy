import { describe, it, expect } from "vite-plus/test";
import { validateRecipes } from "../src/lib/derivedRecipe";
import type { DerivedRecipe } from "../src/lib/derivedRecipe";
import type { Layout } from "../src/lib/layout";

const baseLayout: Layout = [
  {
    type: "SA",
    key: "q1",
    label: "性別",
    items: [
      { code: "1", label: "男性" },
      { code: "2", label: "女性" },
    ],
  },
  {
    type: "SA",
    key: "q2",
    label: "年代",
    items: [
      { code: "1", label: "20代" },
      { code: "2", label: "30代" },
    ],
  },
  { type: "NA", key: "q4", label: "スコア" },
];

describe(validateRecipes, () => {
  it("正常なcombineSA → エラーなし", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "q1_q2", label: "性別×年代", sources: ["q1", "q2"] },
    ];
    expect(validateRecipes(recipes, baseLayout)).toEqual([]);
  });

  it("正常なbinNA → エラーなし", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "binNA",
        code: "score_bin",
        label: "スコア",
        source: "q4",
        bins: [
          { code: "low", label: "低", min: 0, max: 50 },
          { code: "high", label: "高", min: 50, max: null },
        ],
      },
    ];
    expect(validateRecipes(recipes, baseLayout)).toEqual([]);
  });

  it("空のcode → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "", label: "性別×年代", sources: ["q1", "q2"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("空");
  });

  it("空のlabel → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "x", label: "", sources: ["q1", "q2"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("label"))).toBe(true);
  });

  it("レイアウトキーとの重複 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "q1", label: "性別×年代", sources: ["q1", "q2"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("重複"))).toBe(true);
  });

  it("レシピ間のcode重複 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "derived", label: "X", sources: ["q1", "q2"] },
      {
        type: "binNA",
        code: "derived",
        label: "Y",
        source: "q4",
        bins: [{ code: "1", label: "1", min: 0, max: 10 }],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("重複"))).toBe(true);
  });

  it("combineSA: sources < 2 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "x", label: "X", sources: ["q1"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("2つ以上"))).toBe(true);
  });

  it("combineSA: ソースがレイアウトに存在しない → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "x", label: "X", sources: ["q1", "missing"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("存在しません"))).toBe(true);
  });

  it("combineSA: ソースがSA型でない → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "x", label: "X", sources: ["q1", "q4"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("SA型ではありません"))).toBe(true);
  });

  it("combineSA: sources内の重複 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "combineSA", code: "x", label: "X", sources: ["q1", "q1"] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("重複"))).toBe(true);
  });

  it("binNA: ソースがNA型でない → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "binNA",
        code: "x",
        label: "X",
        source: "q1",
        bins: [{ code: "1", label: "1", min: 0, max: 10 }],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("NA型ではありません"))).toBe(true);
  });

  it("binNA: bins空 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "binNA", code: "x", label: "X", source: "q4", bins: [] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("1つ以上"))).toBe(true);
  });

  it("binNA: binコード重複 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "binNA",
        code: "x",
        label: "X",
        source: "q4",
        bins: [
          { code: "a", label: "A", min: 0, max: 50 },
          { code: "a", label: "B", min: 50, max: 100 },
        ],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("重複した code"))).toBe(true);
  });

  it("binNA: min >= max → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "binNA",
        code: "x",
        label: "X",
        source: "q4",
        bins: [{ code: "a", label: "A", min: 50, max: 50 }],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("min"))).toBe(true);
  });

  it("binNA: min=null or max=null は許容", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "binNA",
        code: "x",
        label: "X",
        source: "q4",
        bins: [
          { code: "low", label: "低", min: null, max: 50 },
          { code: "high", label: "高", min: 50, max: null },
        ],
      },
    ];
    expect(validateRecipes(recipes, baseLayout)).toEqual([]);
  });

  it("正常なgroupSA → エラーなし", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "q1_grp",
        label: "性別（まとめ）",
        source: "q1",
        groups: [
          { code: "1", label: "男性", sources: ["1"] },
          { code: "2", label: "女性", sources: ["2"] },
        ],
      },
    ];
    expect(validateRecipes(recipes, baseLayout)).toEqual([]);
  });

  it("groupSA: ソースがSA型でない → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q4",
        groups: [{ code: "1", label: "A", sources: ["1"] }],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("SA型ではありません"))).toBe(true);
  });

  it("groupSA: groups空 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      { type: "groupSA", code: "x", label: "X", source: "q1", groups: [] },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("1つ以上"))).toBe(true);
  });

  it("groupSA: group code 重複 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q1",
        groups: [
          { code: "a", label: "A", sources: ["1"] },
          { code: "a", label: "B", sources: ["2"] },
        ],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("重複した code"))).toBe(true);
  });

  it("groupSA: 選択肢の重複割当 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q1",
        groups: [
          { code: "a", label: "A", sources: ["1"] },
          { code: "b", label: "B", sources: ["1"] },
        ],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("複数の group"))).toBe(true);
  });

  it("groupSA: 未割当の選択肢 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q1",
        groups: [{ code: "a", label: "A", sources: ["1"] }],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("未割当"))).toBe(true);
  });

  it("groupSA: 存在しない選択肢 code → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q1",
        groups: [
          { code: "a", label: "A", sources: ["1", "99"] },
          { code: "b", label: "B", sources: ["2"] },
        ],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("選択肢に存在しません"))).toBe(true);
  });

  it("groupSA: group sources 空 → エラー", () => {
    const recipes: DerivedRecipe[] = [
      {
        type: "groupSA",
        code: "x",
        label: "X",
        source: "q1",
        groups: [
          { code: "a", label: "A", sources: [] },
          { code: "b", label: "B", sources: ["1", "2"] },
        ],
      },
    ];
    const errors = validateRecipes(recipes, baseLayout);
    expect(errors.some((e) => e.includes("sources が空"))).toBe(true);
  });
});

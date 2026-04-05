import { describe, it, expect } from "vite-plus/test";
import { buildPromptPayload } from "../src/lib/aiComment";
import type { Tab } from "../src/lib/types";

// ─── helpers ─────────────────────────────────────────────────

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    questionCode: "q1",
    type: "SA",
    label: "性別",
    labels: { "1": "男性", "2": "女性", "3": "その他" },
    codes: ["1", "2", "3"],
    by: null,
    slices: [
      {
        code: null,
        n: 100,
        cells: [
          { count: 50, pct: 50.0 },
          { count: 30, pct: 30.0 },
          { count: 20, pct: 20.0 },
        ],
      },
    ],
    ...overrides,
  };
}

// ─── buildPromptPayload ──────────────────────────────────────

describe("buildPromptPayload", () => {
  it("Tab→プロンプト変換の全体像", () => {
    const tab = makeTab();
    const payload = buildPromptPayload([tab], "");

    // Tab { questionCode:"q1", type:"SA", label:"性別",
    //         codes:["1","2","3"], labels:{1:"男性",2:"女性",3:"その他"},
    //         slices:[{ n:100, cells:[{pct:50},{pct:30},{pct:20}] }] }
    //
    // ↓ 以下のテキストに変換される:
    expect(payload).toBe(
      [
        "q1: 性別 (SA, n=100)",
        "  男性: 50.0%, 女性: 30.0%, その他: 20.0%",
        "",
        "上記の集計結果の注目すべき傾向を2〜3文で短く述べてください。箇条書き・見出し・提案・注意点は不要です。",
      ].join("\n"),
    );
  });

  it("ウェイト付き+複数設問の変換全体像", () => {
    const q1 = makeTab();
    const q2 = makeTab({
      questionCode: "q2",
      type: "MA",
      label: "趣味",
      labels: { "1": "読書", "2": "映画", "3": "旅行", "4": "料理", "5": "運動", "6": "音楽" },
      codes: ["1", "2", "3", "4", "5", "6"],
      slices: [
        {
          code: null,
          n: 200,
          cells: [
            { count: 80, pct: 40.0 },
            { count: 60, pct: 30.0 },
            { count: 50, pct: 25.0 },
            { count: 40, pct: 20.0 },
            { count: 30, pct: 15.0 },
            { count: 20, pct: 10.0 },
          ],
        },
      ],
    });

    const payload = buildPromptPayload([q1, q2], "weight_col");

    expect(payload).toBe(
      [
        "※ウェイト列: weight_col",
        "q1: 性別 (SA, n=100)",
        "  男性: 50.0%, 女性: 30.0%, その他: 20.0%",
        "q2: 趣味 (MA, n=200)",
        "  読書: 40.0%, 映画: 30.0%, 旅行: 25.0%, 料理: 20.0%, 運動: 15.0%, ...他1件",
        "",
        "上記の集計結果の注目すべき傾向を2〜3文で短く述べてください。箇条書き・見出し・提案・注意点は不要です。",
      ].join("\n"),
    );
  });

  it("Tab集計のみがプロンプトに含まれ、クロス集計は除外される", () => {
    const tab = makeTab({ questionCode: "q1", label: "性別" });
    const cross = makeTab({
      questionCode: "q2",
      label: "年代",
      by: { code: "q1", label: "性別", labels: { "1": "男性" } },
    });

    const payload = buildPromptPayload([tab, cross], "");

    expect(payload).toContain("q1");
    expect(payload).not.toContain("q2");
  });

  it("設問ヘッダに question, label, type, n が含まれる", () => {
    const tab = makeTab({ questionCode: "q1", label: "性別", type: "SA" });
    const payload = buildPromptPayload([tab], "");

    expect(payload).toContain("q1: 性別 (SA, n=100)");
  });

  it("選択肢はpct降順でラベル付きで出力される", () => {
    const tab = makeTab();
    const payload = buildPromptPayload([tab], "");

    // 50% > 30% > 20% の順
    const dataLine = payload.split("\n").find((l) => l.startsWith("  "));
    expect(dataLine).toContain("男性: 50.0%");
    expect(dataLine).toContain("女性: 30.0%");
    expect(dataLine).toContain("その他: 20.0%");
  });

  it("ウェイト列が指定されると先頭に注記が含まれる", () => {
    const tab = makeTab();
    const payload = buildPromptPayload([tab], "weight_col");

    const firstLine = payload.split("\n")[0];
    expect(firstLine).toContain("weight_col");
  });

  it("ウェイト列が空文字の場合は注記が含まれない", () => {
    const tab = makeTab();
    const payload = buildPromptPayload([tab], "");

    const firstLine = payload.split("\n")[0];
    expect(firstLine).not.toContain("ウェイト");
  });

  it("選択肢が多い場合、topN件+残件数の省略表記になる", () => {
    const tab = makeTab({
      codes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      labels: {},
      slices: [
        {
          code: null,
          n: 100,
          cells: Array.from({ length: 10 }, (_, i) => ({
            count: 10 - i,
            pct: (10 - i) * 2,
          })),
        },
      ],
    });

    const payload = buildPromptPayload([tab], "");
    // topN=5 がデフォルト → 残り5件
    expect(payload).toContain("...他5件");
  });

  it("末尾にユーザープロンプト（分析指示）が含まれる", () => {
    const tab = makeTab();
    const payload = buildPromptPayload([tab], "");

    const lastNonEmpty = payload
      .split("\n")
      .filter((l) => l.length > 0)
      .at(-1);
    expect(lastNonEmpty).toContain("注目すべき傾向");
  });

  it("ペイロードが3500文字以下に収まる", () => {
    // 大量の設問を用意
    const tabs = Array.from({ length: 50 }, (_, i) =>
      makeTab({
        questionCode: `q${i + 1}`,
        label: `設問${i + 1}の長いラベルテキスト`,
        codes: Array.from({ length: 20 }, (__, j) => String(j + 1)),
        labels: Object.fromEntries(
          Array.from({ length: 20 }, (__, j) => [String(j + 1), `選択肢${j + 1}のラベル`]),
        ),
        slices: [
          {
            code: null,
            n: 1000,
            cells: Array.from({ length: 20 }, (__, j) => ({
              count: 50 - j,
              pct: (50 - j) / 10,
            })),
          },
        ],
      }),
    );

    const payload = buildPromptPayload(tabs, "");
    expect(payload.length).toBeLessThanOrEqual(3500);
  });
});

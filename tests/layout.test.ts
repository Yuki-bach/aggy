import { describe, it, expect } from "vite-plus/test";
import {
  parseLayoutJson,
  validateLayoutStructure,
  buildValidLayout,
  filterLayout,
  buildQuestions,
  countLayoutColumns,
} from "../src/lib/layout";
import type { Layout } from "../src/lib/layout";

const layout: Layout = [
  {
    key: "q1",
    label: "Gender",
    type: "SA",
    items: [
      { code: "1", label: "Male" },
      { code: "2", label: "Female" },
    ],
  },
  {
    key: "q2",
    label: "Hobbies",
    type: "MA",
    items: [
      { code: "1", label: "Sports" },
      { code: "2", label: "Music" },
      { code: "3", label: "Reading" },
    ],
  },
  { key: "weight", label: "ウェイト", type: "WEIGHT" },
  { key: "answer_date", label: "回答日", type: "DATE", granularity: "month" as const },
  { key: "score", label: "NPS", type: "NA" as const },
];

describe("filterLayout", () => {
  it("keeps entries whose columns exist in headers", () => {
    const headers = ["q1", "q2_1", "q2_2", "q2_3", "weight", "answer_date", "score"];
    const filtered = filterLayout(headers, layout);
    expect(filtered).toHaveLength(5);
    expect(filtered[0].key).toBe("q1");
    expect(filtered[1].key).toBe("q2");
    expect(filtered[2].key).toBe("weight");
    expect(filtered[3].key).toBe("answer_date");
    expect(filtered[4].key).toBe("score");
  });

  it("removes SA entry when column is missing", () => {
    const headers = ["q2_1", "q2_2", "q2_3", "weight"];
    const filtered = filterLayout(headers, layout);
    expect(filtered.map((e) => e.key)).toEqual(["q2", "weight"]);
  });

  it("removes WEIGHT entry when column is missing", () => {
    const headers = ["q1"];
    const filtered = filterLayout(headers, layout);
    expect(filtered.map((e) => e.key)).toEqual(["q1"]);
  });

  it("keeps only matched MA items", () => {
    const headers = ["q2_1", "q2_3"];
    const filtered = filterLayout(headers, layout);
    expect(filtered).toHaveLength(1);
    const ma = filtered[0];
    expect(ma.type).toBe("MA");
    if (ma.type === "MA") {
      expect(ma.items).toEqual([
        { code: "1", label: "Sports" },
        { code: "3", label: "Reading" },
      ]);
    }
  });

  it("removes MA entry when no items match", () => {
    const headers = ["q1"];
    const filtered = filterLayout(headers, layout);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].key).toBe("q1");
  });

  it("keeps DATE entry when column exists in headers", () => {
    const headers = ["q1", "answer_date"];
    const filtered = filterLayout(headers, layout);
    expect(filtered.map((e) => e.key)).toEqual(["q1", "answer_date"]);
    expect(filtered[1].type).toBe("DATE");
  });

  it("removes DATE entry when column is missing", () => {
    const headers = ["q1"];
    const filtered = filterLayout(headers, layout);
    expect(filtered.map((e) => e.key)).toEqual(["q1"]);
  });

  it("returns empty for completely unmatched headers", () => {
    const filtered = filterLayout(["other"], layout);
    expect(filtered).toEqual([]);
  });
});

describe("buildQuestions", () => {
  it("builds SA question from layout entry", () => {
    const questions = buildQuestions([layout[0]]);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toEqual({
      type: "SA",
      code: "q1",
      columns: ["q1"],
      codes: ["1", "2"],
      label: "Gender",
      labels: { "1": "Male", "2": "Female" },
      matrixKey: null,
    });
  });

  it("builds MA question from layout entry", () => {
    const questions = buildQuestions([layout[1]]);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toEqual({
      type: "MA",
      code: "q2",
      columns: ["q2_1", "q2_2", "q2_3"],
      codes: ["1", "2", "3"],
      label: "Hobbies",
      labels: { "1": "Sports", "2": "Music", "3": "Reading" },
      matrixKey: null,
    });
  });

  it("skips WEIGHT entries", () => {
    const questions = buildQuestions([layout[2]]);
    expect(questions).toHaveLength(0);
  });

  it("builds NA question from layout entry", () => {
    const questions = buildQuestions([layout[4]]);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toEqual({
      type: "NA",
      code: "score",
      columns: ["score"],
      codes: [],
      label: "NPS",
      labels: {},
      matrixKey: null,
    });
  });
});

describe("parseLayoutJson", () => {
  it("parses valid JSON array", () => {
    const result = parseLayoutJson('[{"key":"q1"}]');
    expect(result).toEqual([{ key: "q1" }]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLayoutJson("{invalid")).toThrow("JSONの解析に失敗しました");
  });

  it("throws on non-array JSON", () => {
    expect(() => parseLayoutJson('{"key":"q1"}')).toThrow("JSON配列である必要があります");
  });
});

describe("validateLayoutStructure", () => {
  it("returns empty diagnostics for valid layout", () => {
    const raw = [
      { key: "q1", label: "Q1", type: "SA", items: [{ code: "1", label: "A" }] },
      { key: "q2", label: "Q2", type: "NA" },
      { key: "w", label: "Weight", type: "WEIGHT" },
      { key: "d", label: "Date", type: "DATE", granularity: "month" },
    ];
    expect(validateLayoutStructure(raw)).toHaveLength(0);
  });

  it("detects entry without label", () => {
    const raw = [{ key: "q1", type: "SA", items: [{ code: "1", label: "A" }] }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].type).toBe("invalidLayout");
    expect(diags[0].key).toBe("q1");
    expect(diags[0].params.reason).toContain('"label"');
  });

  it("detects SA entry without items", () => {
    const raw = [{ key: "q1", label: "Q1", type: "SA" }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].key).toBe("q1");
    expect(diags[0].params.reason).toContain("items");
  });

  it("detects MA entry with empty items", () => {
    const raw = [{ key: "q1", label: "Q1", type: "MA", items: [] }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("items");
  });

  it("detects DATE entry without granularity", () => {
    const raw = [{ key: "d1", label: "Date", type: "DATE" }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("granularity");
  });

  it("detects invalid type", () => {
    const raw = [{ key: "q1", label: "Q1", type: "UNKNOWN" }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain('"type"');
  });

  it("detects non-object entry", () => {
    const raw = ["not an object"];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].key).toBe("[0]");
  });

  it("detects entry without key", () => {
    const raw = [{ type: "SA", label: "Q1" }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain('"key"');
  });

  it("detects empty key", () => {
    const raw = [{ key: "", label: "Q", type: "SA", items: [{ code: "1", label: "A" }] }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("空文字列");
  });

  it("detects non-object items element", () => {
    const raw = [{ key: "q1", label: "Q", type: "SA", items: ["not object"] }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("オブジェクト");
  });

  it("detects items element missing code/label", () => {
    const raw = [{ key: "q1", label: "Q", type: "SA", items: [{ code: 1 }] }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain('"code"');
    expect(diags[0].params.reason).toContain('"label"');
  });

  it("detects duplicate code in items", () => {
    const raw = [
      {
        key: "q1",
        label: "Q",
        type: "SA",
        items: [
          { code: "1", label: "A" },
          { code: "1", label: "B" },
        ],
      },
    ];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("重複");
  });

  it("detects duplicate keys", () => {
    const raw = [
      { key: "q1", label: "Q1", type: "SA", items: [{ code: "1", label: "A" }] },
      { key: "q1", label: "Q1b", type: "SA", items: [{ code: "2", label: "B" }] },
    ];
    const diags = validateLayoutStructure(raw);
    const dupDiag = diags.find((d) => d.params.reason.includes("重複しています"));
    expect(dupDiag).toBeDefined();
    expect(dupDiag!.key).toBe("q1");
    expect(dupDiag!.label).toBe("Q1");
  });

  it("ignores invalid entries for duplicate key check", () => {
    const raw = [
      { key: "q1", type: "UNKNOWN" },
      { key: "q1", label: "Q1", type: "NA" },
    ];
    const diags = validateLayoutStructure(raw);
    expect(diags.some((d) => d.params.reason.includes("重複しています"))).toBe(false);
  });
});

describe("buildValidLayout", () => {
  it("builds layout from valid entries only", () => {
    const raw = [
      { key: "q1", label: "Q1", type: "SA", items: [{ code: "1", label: "A" }] },
      { key: "bad", type: "UNKNOWN" },
      { key: "q2", label: "Q2", type: "NA" },
    ];
    const result = buildValidLayout(raw);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("q1");
    expect(result[1].key).toBe("q2");
  });

  it("skips non-object entries", () => {
    const raw = ["string", null, { key: "q1", label: "Q1", type: "NA" }];
    const result = buildValidLayout(raw);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("q1");
  });

  it("skips duplicate keys keeping first occurrence", () => {
    const raw = [
      { key: "q1", label: "Q1", type: "SA", items: [{ code: "1", label: "A" }] },
      { key: "q1", label: "Q1b", type: "SA", items: [{ code: "2", label: "B" }] },
      { key: "q2", label: "Q2", type: "NA" },
    ];
    const result = buildValidLayout(raw);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("q1");
    expect(result[0].label).toBe("Q1");
    expect(result[1].key).toBe("q2");
  });
});

// ─── MATRIX tests ───────────────────────────────────────────

const matrixLayout: Layout = [
  { key: "q3", label: "Satisfaction matrix", type: "MATRIX" },
  {
    key: "q3a",
    label: "Quality",
    type: "SA",
    matrixKey: "q3",
    items: [
      { code: "1", label: "Good" },
      { code: "2", label: "Bad" },
    ],
  },
  {
    key: "q3b",
    label: "Price",
    type: "SA",
    matrixKey: "q3",
    items: [
      { code: "1", label: "Good" },
      { code: "2", label: "Bad" },
    ],
  },
  {
    key: "q1",
    label: "Gender",
    type: "SA",
    items: [{ code: "1", label: "Male" }],
  },
];

describe("validateLayoutStructure — MATRIX", () => {
  it("accepts MATRIX parent + children with matching matrixKey", () => {
    const raw = [
      { key: "q3", label: "Matrix", type: "MATRIX" },
      {
        key: "q3a",
        label: "A",
        type: "SA",
        matrixKey: "q3",
        items: [{ code: "1", label: "x" }],
      },
    ];
    expect(validateLayoutStructure(raw)).toHaveLength(0);
  });

  it("detects matrixKey referencing a non-existent MATRIX parent", () => {
    const raw = [
      {
        key: "q3a",
        label: "A",
        type: "SA",
        matrixKey: "missing",
        items: [{ code: "1", label: "x" }],
      },
    ];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("matrixKey");
    expect(diags[0].params.reason).toContain("missing");
  });

  it("detects matrixKey on WEIGHT entry (not allowed)", () => {
    const raw = [{ key: "w", label: "W", type: "WEIGHT", matrixKey: "q3" }];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("matrixKey");
  });

  it("detects empty matrixKey string", () => {
    const raw = [
      {
        key: "q3a",
        label: "A",
        type: "SA",
        matrixKey: "",
        items: [{ code: "1", label: "x" }],
      },
    ];
    const diags = validateLayoutStructure(raw);
    expect(diags).toHaveLength(1);
    expect(diags[0].params.reason).toContain("matrixKey");
  });
});

describe("filterLayout — MATRIX", () => {
  it("keeps MATRIX parent when at least one child survives", () => {
    const headers = ["q3a", "q3b", "q1"];
    const filtered = filterLayout(headers, matrixLayout);
    expect(filtered.map((e) => e.key)).toEqual(["q3", "q3a", "q3b", "q1"]);
  });

  it("keeps MATRIX parent even when only one child survives", () => {
    const headers = ["q3a", "q1"];
    const filtered = filterLayout(headers, matrixLayout);
    expect(filtered.map((e) => e.key)).toEqual(["q3", "q3a", "q1"]);
  });

  it("removes orphan MATRIX parent when no children survive", () => {
    const headers = ["q1"];
    const filtered = filterLayout(headers, matrixLayout);
    expect(filtered.map((e) => e.key)).toEqual(["q1"]);
  });
});

describe("buildQuestions — MATRIX", () => {
  it("skips MATRIX parent and carries matrixKey on children as string", () => {
    const questions = buildQuestions(matrixLayout);
    expect(questions.map((q) => q.code)).toEqual(["q3a", "q3b", "q1"]);
    expect(questions[0].matrixKey).toBe("q3");
    expect(questions[1].matrixKey).toBe("q3");
    expect(questions[2].matrixKey).toBe(null);
  });
});

describe("countLayoutColumns — MATRIX", () => {
  it("counts MATRIX parent as 0 columns", () => {
    // q3: 0, q3a: 1, q3b: 1, q1: 1 = 3
    expect(countLayoutColumns(matrixLayout)).toBe(3);
  });
});

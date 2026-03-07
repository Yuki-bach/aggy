import { describe, it, expect } from "vitest";
import { filterLayout, buildQuestions } from "../src/lib/layout";
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
  { key: "weight", type: "WEIGHT" },
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
    expect(filtered[0].items).toEqual([
      { code: "1", label: "Sports" },
      { code: "3", label: "Reading" },
    ]);
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
    });
  });
});

import type { Tab } from "../../src/lib/agg/types";

// ─── SA Grand Total ─────────────────────────────────────────
export const SA_GT: Tab = {
  type: "SA",
  questionCode: "q_sa",
  label: "SA質問",
  by: null,
  codes: ["1", "2"],
  labels: { "1": "はい", "2": "いいえ" },
  slices: [
    {
      code: null,
      n: 10,
      cells: [
        { count: 6, pct: 60 },
        { count: 4, pct: 40 },
      ],
    },
  ],
};

// ─── MA Grand Total ─────────────────────────────────────────
export const MA_GT: Tab = {
  type: "MA",
  questionCode: "q_ma",
  label: "MA質問",
  by: null,
  codes: ["1", "2", "3"],
  labels: { "1": "サービスA", "2": "サービスB", "3": "サービスC" },
  slices: [
    {
      code: null,
      n: 20,
      cells: [
        { count: 12, pct: 60 },
        { count: 8, pct: 40 },
        { count: 15, pct: 75 },
      ],
    },
  ],
};

// ─── NA Grand Total ─────────────────────────────────────────
export const NA_GT: Tab = {
  type: "NA",
  questionCode: "q_na",
  label: "NA質問",
  by: null,
  codes: ["n", "mean", "median", "sd", "min", "max"],
  labels: {},
  slices: [
    {
      code: null,
      n: 8,
      cells: [],
      stats: { n: 8, mean: 3.5, median: 3, sd: 1.2, min: 1, max: 6 },
    },
  ],
};

// ─── SA Cross ───────────────────────────────────────────────
const SA_CROSS_AXIS = {
  code: "gender",
  label: "性別",
  labels: { "1": "男性", "2": "女性" } as Record<string, string>,
};

export const SA_CROSS: Tab[] = [
  SA_GT,
  {
    type: "SA",
    questionCode: "q_sa",
    label: "SA質問",
    by: SA_CROSS_AXIS,
    codes: ["1", "2"],
    labels: { "1": "はい", "2": "いいえ" },
    slices: [
      {
        code: "1",
        n: 5,
        cells: [
          { count: 3, pct: 60 },
          { count: 2, pct: 40 },
        ],
      },
      {
        code: "2",
        n: 5,
        cells: [
          { count: 3, pct: 60 },
          { count: 2, pct: 40 },
        ],
      },
    ],
  },
];

// ─── NA Cross ───────────────────────────────────────────────
const NA_CROSS_AXIS = {
  code: "gender",
  label: "性別",
  labels: { "1": "男性", "2": "女性" } as Record<string, string>,
};

export const NA_CROSS: Tab[] = [
  NA_GT,
  {
    type: "NA",
    questionCode: "q_na",
    label: "NA質問",
    by: NA_CROSS_AXIS,
    codes: ["n", "mean", "median", "sd", "min", "max"],
    labels: {},
    slices: [
      {
        code: "1",
        n: 4,
        cells: [],
        stats: { n: 4, mean: 4.0, median: 4, sd: 0.8, min: 2, max: 5 },
      },
      {
        code: "2",
        n: 4,
        cells: [],
        stats: { n: 4, mean: 3.0, median: 3, sd: 1.4, min: 1, max: 6 },
      },
    ],
  },
];

// ─── Mixed GT (SA + MA + NA) ────────────────────────────────
export const SA_MA_NA_GT: Tab[] = [SA_GT, MA_GT, NA_GT];

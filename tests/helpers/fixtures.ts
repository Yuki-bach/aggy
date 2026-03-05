import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseLayout, buildQuestions, findWeightColumn } from "../../src/lib/layout";
import type { AggInput, Question } from "../../src/lib/agg/types";

const layoutPath = resolve(import.meta.dirname!, "../../testdata/test_layout.json");
const layout = parseLayout(readFileSync(layoutPath, "utf-8"));
const questions = buildQuestions(layout);

export function getAggInput(code: string): AggInput {
  const q = questions.find((q) => q.code === code);
  if (!q) throw new Error(`Question "${code}" not found in test_layout.json`);
  const { type, columns, codes } = q;
  return { type, columns, codes };
}

export function getQuestion(code: string): Question {
  const q = questions.find((q) => q.code === code);
  if (!q) throw new Error(`Question "${code}" not found in test_layout.json`);
  return q;
}

export const weightColumn = findWeightColumn(layout);

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseLayoutJson,
  buildValidLayout,
  buildQuestions,
  findWeightColumn,
} from "../../src/lib/layout";
import type { Question } from "../../src/lib/types";
import type { Shape } from "../../src/lib/agg/types";

const layoutPath = resolve(import.meta.dirname, "../../testdata/test_layout.json");
const layout = buildValidLayout(parseLayoutJson(readFileSync(layoutPath, "utf-8")));
const questions = buildQuestions(layout);

export function getShape(code: string): Shape {
  const found = questions.find((q) => q.code === code);
  if (!found) throw new Error(`Question "${code}" not found in test_layout.json`);
  const { type, columns, codes } = found;
  return { type, columns, codes };
}

export function getQuestion(code: string): Question {
  const found = questions.find((q) => q.code === code);
  if (!found) throw new Error(`Question "${code}" not found in test_layout.json`);
  return found;
}

export const weightColumn = findWeightColumn(layout);

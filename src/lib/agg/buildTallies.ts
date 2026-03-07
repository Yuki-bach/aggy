import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult, Tally, Axis } from "./types";
import { aggregateGt } from "./aggregateGt";
import { aggregateCross } from "./aggregateCross";
import { NO_ANSWER_VALUE } from "./sqlHelpers";
import { t } from "../i18n";

export async function buildTallies(
  conn: duckdb.AsyncDuckDBConnection,
  questions: Question[],
  crossCols: Question[],
  weightCol: string,
): Promise<Tally[]> {
  const tallies: Tally[] = [];
  for (const q of questions) {
    const gtResult = await aggregateGt(conn, q, weightCol);
    tallies.push(toTally(q, gtResult));
    for (const cross of crossCols) {
      const crossResult = await aggregateCross(conn, q, cross, weightCol);
      tallies.push(toTally(q, crossResult, cross));
    }
  }
  return tallies;
}

function toTally(question: Question, aggResult: AggResult, byQuestion?: Question): Tally {
  // Build labels including NA if present in codes
  const labels: Record<string, string> = { ...question.labels };
  if (aggResult.codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }

  let by: Axis | null = null;
  if (byQuestion) {
    const axisLabels: Record<string, string> = { ...byQuestion.labels };
    // Check if any slice code is NO_ANSWER_VALUE to add no-answer label
    const hasNoAnswer = aggResult.slices.some((s) => s.code === NO_ANSWER_VALUE);
    if (hasNoAnswer) {
      axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
    }
    by = { code: byQuestion.code, label: byQuestion.label, labels: axisLabels };
  }

  return {
    question: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: aggResult.codes,
    by,
    slices: aggResult.slices,
  };
}

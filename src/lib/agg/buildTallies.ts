import type * as duckdb from "@duckdb/duckdb-wasm";
import type {
  Question,
  AggResult,
  Tally,
  CategoricalTally,
  NumericTally,
  Axis,
  NumericSlice,
} from "./types";
import { aggregateGt } from "./aggregateGt";
import { aggregateCross } from "./aggregateCross";
import { aggregateNaGt, aggregateNaCross } from "./aggregateNa";
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
    if (q.type === "NA") {
      const gtSlice = await aggregateNaGt(conn, q.columns[0], weightCol);
      tallies.push(toNaTally(q, [gtSlice]));
      for (const cross of crossCols) {
        const crossSlices = await aggregateNaCross(conn, q.columns[0], cross, weightCol);
        tallies.push(toNaTally(q, crossSlices, cross));
      }
    } else {
      const gtResult = await aggregateGt(conn, q, weightCol);
      tallies.push(toCategoricalTally(q, gtResult));
      for (const cross of crossCols) {
        const crossResult = await aggregateCross(conn, q, cross, weightCol);
        tallies.push(toCategoricalTally(q, crossResult, cross));
      }
    }
  }
  return tallies;
}

function toCategoricalTally(
  question: Question,
  aggResult: AggResult,
  byQuestion?: Question,
): CategoricalTally {
  const labels: Record<string, string> = { ...question.labels };
  if (aggResult.codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }

  return {
    questionCode: question.code,
    type: question.type as "SA" | "MA",
    label: question.label,
    labels,
    codes: aggResult.codes,
    by: buildAxis(aggResult, byQuestion),
    slices: aggResult.slices,
  };
}

function toNaTally(
  question: Question,
  slices: NumericSlice[],
  byQuestion?: Question,
): NumericTally {
  let by: Axis | null = null;
  if (byQuestion) {
    by = { code: byQuestion.code, label: byQuestion.label, labels: { ...byQuestion.labels } };
  }
  return {
    type: "NA",
    questionCode: question.code,
    label: question.label,
    by,
    slices,
  };
}

function buildAxis(aggResult: AggResult, byQuestion?: Question): Axis | null {
  if (!byQuestion) return null;
  const axisLabels: Record<string, string> = { ...byQuestion.labels };
  const hasNoAnswer = aggResult.slices.some((s) => s.code === NO_ANSWER_VALUE);
  if (hasNoAnswer) {
    axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return { code: byQuestion.code, label: byQuestion.label, labels: axisLabels };
}

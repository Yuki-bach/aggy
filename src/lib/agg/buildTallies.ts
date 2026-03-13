import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggOutput, Tally } from "./types";
import { aggTotals } from "./aggTotals";
import { aggCrossTab } from "./aggCrossTab";
import { aggNaTotals, aggNaCrossTab } from "./aggNa";
import { NO_ANSWER_VALUE } from "./sqlHelpers";
import { t } from "../i18n";

export async function buildTallies(
  conn: duckdb.AsyncDuckDBConnection,
  questions: Question[],
  crossQuestions: Question[],
  weightCol: string,
): Promise<Tally[]> {
  const tallies: Tally[] = [];
  for (const q of questions) {
    if (q.type === "NA") {
      const gtResult = await aggNaTotals(conn, q.columns[0], weightCol);
      tallies.push(toTally(q, gtResult));
      for (const cross of crossQuestions) {
        const crossResult = await aggNaCrossTab(conn, q.columns[0], cross, weightCol);
        tallies.push(toTally(q, crossResult, cross));
      }
    } else {
      const gtResult = await aggTotals(conn, q, weightCol);
      tallies.push(toTally(q, gtResult));
      for (const cross of crossQuestions) {
        const crossResult = await aggCrossTab(conn, q, cross, weightCol);
        tallies.push(toTally(q, crossResult, cross));
      }
    }
  }
  return tallies;
}

function toTally(question: Question, aggResult: AggOutput, byQuestion?: Question): Tally {
  const labels: Record<string, string> = { ...question.labels };

  if (question.type === "NA") {
    // NA: self-labeling (value string as label)
    for (const code of aggResult.codes) {
      labels[code] = code;
    }
  }

  if (aggResult.codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }

  return {
    questionCode: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: aggResult.codes,
    by: buildAxis(aggResult, byQuestion),
    slices: aggResult.slices,
  };
}

function buildAxis(aggResult: AggOutput, byQuestion?: Question): Tally["by"] {
  if (!byQuestion) return null;
  const axisLabels: Record<string, string> = { ...byQuestion.labels };
  const hasNoAnswer = aggResult.slices.some((s) => s.code === NO_ANSWER_VALUE);
  if (hasNoAnswer) {
    axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return { code: byQuestion.code, label: byQuestion.label, labels: axisLabels };
}

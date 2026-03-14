import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggOutput, Axis, Tally } from "./types";
import { aggGrandTotal } from "./aggGrandTotal";
import { aggCrossTab } from "./aggCrossTab";
import { aggNaGrandTotal, aggNaCrossTab } from "./aggNa";
import { NO_ANSWER_VALUE } from "./constants";
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
      const grandTotalOutput = await aggNaGrandTotal(conn, q.columns[0], weightCol);
      tallies.push(toTally(q, grandTotalOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggNaCrossTab(conn, q.columns[0], axisQuestion, weightCol);
        tallies.push(toTally(q, crossOutput, axisQuestion));
      }
    } else {
      const grandTotalOutput = await aggGrandTotal(conn, q, weightCol);
      tallies.push(toTally(q, grandTotalOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggCrossTab(conn, q, axisQuestion, weightCol);
        tallies.push(toTally(q, crossOutput, axisQuestion));
      }
    }
  }
  return tallies;
}

function toTally(question: Question, aggOutput: AggOutput, axisQuestion?: Question): Tally {
  const labels: Record<string, string> = { ...question.labels };

  if (question.type === "NA") {
    // NA: self-labeling (value string as label)
    for (const code of aggOutput.codes) {
      labels[code] = code;
    }
  }

  if (aggOutput.codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }

  return {
    questionCode: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: aggOutput.codes,
    by: axisQuestion ? buildAxis(aggOutput, axisQuestion) : null,
    slices: aggOutput.slices,
  };
}

function buildAxis(aggOutput: AggOutput, axisQuestion: Question): Axis {
  const axisLabels: Record<string, string> = { ...axisQuestion.labels };
  const hasNoAnswer = aggOutput.slices.some((s) => s.code === NO_ANSWER_VALUE);
  if (hasNoAnswer) {
    axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return { code: axisQuestion.code, label: axisQuestion.label, labels: axisLabels };
}

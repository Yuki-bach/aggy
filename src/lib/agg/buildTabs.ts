import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, TabCore, Axis, Tab } from "./types";
import { aggTab } from "./aggTab";
import { aggCrossTab } from "./aggCrossTab";
import { aggNaTab, aggNaCrossTab } from "./aggNa";
import { NO_ANSWER_VALUE } from "./constants";
import { t } from "../i18n";

export async function buildTabs(
  conn: duckdb.AsyncDuckDBConnection,
  questions: Question[],
  crossQuestions: Question[],
  weightCol: string,
): Promise<Tab[]> {
  const tabs: Tab[] = [];
  for (const q of questions) {
    if (q.type === "NA") {
      const tabOutput = await aggNaTab(conn, q.columns[0], weightCol);
      tabs.push(toTab(q, tabOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggNaCrossTab(conn, q.columns[0], axisQuestion, weightCol);
        tabs.push(toTab(q, crossOutput, axisQuestion));
      }
    } else {
      const tabOutput = await aggTab(conn, q, weightCol);
      tabs.push(toTab(q, tabOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggCrossTab(conn, q, axisQuestion, weightCol);
        tabs.push(toTab(q, crossOutput, axisQuestion));
      }
    }
  }
  return tabs;
}

function toTab(question: Question, tabCore: TabCore, axisQuestion?: Question): Tab {
  const labels: Record<string, string> = { ...question.labels };

  if (question.type === "NA") {
    // NA: self-labeling (value string as label)
    for (const code of tabCore.codes) {
      labels[code] = code;
    }
  }

  if (tabCore.codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }

  return {
    questionCode: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: tabCore.codes,
    by: axisQuestion ? buildAxis(tabCore, axisQuestion) : null,
    slices: tabCore.slices,
  };
}

function buildAxis(tabCore: TabCore, axisQuestion: Question): Axis {
  const axisLabels: Record<string, string> = { ...axisQuestion.labels };
  const hasNoAnswer = tabCore.slices.some((s) => s.code === NO_ANSWER_VALUE);
  if (hasNoAnswer) {
    axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return { code: axisQuestion.code, label: axisQuestion.label, labels: axisLabels };
}

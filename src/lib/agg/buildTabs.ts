import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { Question, TabData, Axis, Tab } from "./types";
import { aggTab } from "./aggTab";
import { aggCrossTab } from "./aggCrossTab";
import { aggNaTab, aggNaCrossTab } from "./aggNa";
import { NO_ANSWER_VALUE } from "./constants";
import { t } from "../i18n";

export async function buildTabs(
  conn: AsyncDuckDBConnection,
  questions: Question[],
  crossQuestions: Question[],
  weightCol: string,
): Promise<Tab[]> {
  const tabs: Tab[] = [];
  for (const q of questions) {
    if (q.type === "NA") {
      const tabOutput = await aggNaTab(conn, q.columns[0], weightCol);
      tabs.push(assembleTab(q, tabOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggNaCrossTab(conn, q.columns[0], axisQuestion, weightCol);
        tabs.push(assembleTab(q, crossOutput, axisQuestion));
      }
    } else {
      const tabOutput = await aggTab(conn, q, weightCol);
      tabs.push(assembleTab(q, tabOutput));
      for (const axisQuestion of crossQuestions) {
        const crossOutput = await aggCrossTab(conn, q, axisQuestion, weightCol);
        tabs.push(assembleTab(q, crossOutput, axisQuestion));
      }
    }
  }
  return tabs;
}

function assembleTab(question: Question, tabData: TabData, axisQuestion?: Question): Tab {
  return {
    questionCode: question.code,
    type: question.type,
    label: question.label,
    labels: buildLabels(question, tabData.codes),
    codes: tabData.codes,
    by: axisQuestion ? buildAxis(tabData, axisQuestion) : null,
    slices: tabData.slices,
  };
}

function buildLabels(question: Question, codes: string[]): Record<string, string> {
  const labels: Record<string, string> = { ...question.labels };
  if (question.type === "NA") {
    for (const code of codes) {
      labels[code] = code;
    }
  }
  if (codes.includes(NO_ANSWER_VALUE)) {
    labels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return labels;
}

function buildAxis(tabData: TabData, axisQuestion: Question): Axis {
  const axisLabels: Record<string, string> = { ...axisQuestion.labels };
  const hasNoAnswer = tabData.slices.some((s) => s.code === NO_ANSWER_VALUE);
  if (hasNoAnswer) {
    axisLabels[NO_ANSWER_VALUE] = t("label.noAnswer");
  }
  return { code: axisQuestion.code, label: axisQuestion.label, labels: axisLabels };
}

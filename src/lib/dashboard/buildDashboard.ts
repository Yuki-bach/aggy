import type { Question, Tab } from "../agg/types";
import type { DashboardData, RankedQuestion, SurveyOverview } from "./types";
import { rankCrossTabs, skewnessScore } from "./stats";

const TOP_N = 5;

function buildOverview(questions: Question[], rowCount: number): SurveyOverview {
  let saCount = 0;
  let maCount = 0;
  let naCount = 0;
  for (const q of questions) {
    if (q.type === "SA") saCount++;
    else if (q.type === "MA") maCount++;
    else if (q.type === "NA") naCount++;
  }
  return {
    responseCount: rowCount,
    questionCount: questions.length,
    saCount,
    maCount,
    naCount,
  };
}

function buildNotableQuestions(tabs: Tab[]): RankedQuestion[] {
  const gtTabs = tabs.filter((t) => t.by === null && t.type !== "NA");

  const scored: RankedQuestion[] = [];
  for (const tab of gtTabs) {
    const score = skewnessScore(tab);
    if (Number.isNaN(score)) continue;
    scored.push({
      questionCode: tab.questionCode,
      label: tab.label,
      type: tab.type,
      score,
      tab,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_N);
}

export function buildDashboard(
  tabs: Tab[],
  questions: Question[],
  rowCount: number,
): DashboardData {
  const crossTabs = tabs.filter((t) => t.by !== null && t.type !== "NA");
  return {
    overview: buildOverview(questions, rowCount),
    notableQuestions: buildNotableQuestions(tabs),
    topCrossTabs: rankCrossTabs(crossTabs),
  };
}

import type { QuestionType, Tab } from "../agg/types";

export interface SurveyOverview {
  responseCount: number;
  questionCount: number;
  saCount: number;
  maCount: number;
  naCount: number;
}

export interface RankedQuestion {
  questionCode: string;
  label: string;
  type: QuestionType;
  score: number;
  tab: Tab;
}

export interface DashboardData {
  overview: SurveyOverview;
  notableQuestions: RankedQuestion[];
  topCrossTabs: Tab[];
}

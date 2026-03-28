// ─── Types ──────────────────────────────────────────────────
export type {
  QuestionType,
  Question,
  Shape,
  Axis,
  Cell,
  Slice,
  TabData,
  NaStats,
  Tab,
} from "./agg/types";
export type { Layout, LayoutQuestion, LayoutItem, DateGranularity } from "./layout";
export type { Diagnostic } from "./validateRawData";
export type { DatePreparationResult } from "./datePreparation";
export type { RawData, LayoutData, SavedEntry } from "./types";
export type { ExportGrid } from "./export/formatters/grid";

// ─── Agg ────────────────────────────────────────────────────
export { calcPct } from "./agg/types";
export { NO_ANSWER_VALUE } from "./agg/constants";
export { aggTab } from "./agg/aggTab";
export { aggCrossTab } from "./agg/aggCrossTab";
export { aggNaTab } from "./agg/aggNaTab";
export { aggNaCrossTab } from "./agg/aggNaCrossTab";
export { buildTabs } from "./agg/buildTabs";
export { esc, weightExpr } from "./agg/sqlHelpers";

// ─── Layout ─────────────────────────────────────────────────
export {
  parseLayoutJson,
  validateLayoutStructure,
  buildValidLayout,
  filterLayout,
  buildQuestions,
  findWeightColumn,
  countLayoutColumns,
} from "./layout";
export { validateRawData } from "./validateRawData";
export { prepareDateColumns } from "./datePreparation";

// ─── Export formatters ──────────────────────────────────────
export { formatCSV } from "./export/formatters/csv";
export { formatTSV } from "./export/formatters/tsv";
export { formatJSON } from "./export/formatters/json";
export { formatMarkdown } from "./export/formatters/markdown";
export { buildExportGrids } from "./export/formatters/grid";
export { tabsToLongRows } from "./export/formatters/longFormat";

// ─── i18n ───────────────────────────────────────────────────
export { t, getLocale, setCurrentLocale, supportedLocales } from "./i18n";

// ─── Format ─────────────────────────────────────────────────
export { formatN, formatStat } from "./format";

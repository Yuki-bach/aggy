/** Label resolution utility (shared by table / chart components) */

import type { LayoutMeta } from "./layout";
import { NA_VALUE } from "./agg/sqlHelpers";

/** Resolve question label; falls back to column name */
export function resolveQuestionLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

/** Resolve option label: unified for both SA and MA via valueLabels[question][code] */
export function resolveValueLabel(question: string, code: string, meta?: LayoutMeta): string {
  if (code === NA_VALUE) return "無回答";
  if (!meta) return code;
  return meta.valueLabels[question]?.[code] ?? code;
}

/** Label resolution utility (shared by ResultTable / ChartRenderer) */

import type { QuestionDef } from "./aggregate";
import { parseCrossSub } from "./aggregate";
import type { LayoutMeta } from "./layout";
import { NA_VALUE } from "./gtAggregator";

/** Resolve question label; falls back to column name */
export function resolveQuestionLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

/** Resolve option label (SA: valueLabels[col][code], MA: valueLabels[colName]["1"]) */
export function resolveValueLabel(
  type: "SA" | "MA",
  col: string,
  rowLabel: string,
  meta?: LayoutMeta,
): string {
  if (rowLabel === NA_VALUE) return "無回答";
  if (!meta) return rowLabel;
  if (type === "SA") {
    return meta.valueLabels[col]?.[rowLabel] ?? rowLabel;
  } else {
    return meta.valueLabels[rowLabel]?.["1"] ?? rowLabel;
  }
}

/** Resolve cross-axis header label (sub values are prefixed as "axisKey\x01rawValue") */
export function resolveSubLabel(
  subLabel: string,
  meta?: LayoutMeta,
  _crossCols?: QuestionDef[],
): string {
  if (subLabel === NA_VALUE) return "無回答";

  const parsed = parseCrossSub(subLabel);
  if (parsed) {
    const { axisKey, rawValue } = parsed;
    if (rawValue === NA_VALUE) return "無回答";
    if (!meta) return rawValue;
    // MA axis: rawValue is column name → valueLabels[rawValue]["1"]
    const maLabel = meta.valueLabels[rawValue]?.["1"];
    if (maLabel) return maLabel;
    // SA axis: rawValue is value code → valueLabels[axisKey][rawValue]
    return meta.valueLabels[axisKey]?.[rawValue] ?? rawValue;
  }

  // No prefix (backwards compatibility)
  if (!meta) return subLabel;
  const maLabel = meta.valueLabels[subLabel]?.["1"];
  if (maLabel) return maLabel;
  return subLabel;
}

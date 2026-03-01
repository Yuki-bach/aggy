/** Label resolution utility (shared by table / chart components) */

import type { QuestionDef } from "./agg/aggregate";
import { parseCrossSub } from "./agg/aggregate";
import type { LabelMap } from "./layout";
import { NA_VALUE } from "./agg/sqlHelpers";

/** Resolve question label; falls back to column name */
export function resolveQuestionLabel(col: string, labelMap: LabelMap): string {
  return labelMap.questionLabels[col] ?? col;
}

/** Resolve option label (SA: valueLabels[col][code], MA: valueLabels[colName]["1"]) */
export function resolveValueLabel(
  type: "SA" | "MA",
  col: string,
  rowLabel: string,
  labelMap: LabelMap,
): string {
  if (rowLabel === NA_VALUE) return "無回答";
  if (type === "SA") {
    return labelMap.valueLabels[col]?.[rowLabel] ?? rowLabel;
  } else {
    return labelMap.valueLabels[rowLabel]?.["1"] ?? rowLabel;
  }
}

/** Resolve cross-axis header label (sub values are prefixed as "axisKey\x01rawValue") */
export function resolveSubLabel(
  subLabel: string,
  labelMap: LabelMap,
  _crossCols?: QuestionDef[],
): string {
  if (subLabel === NA_VALUE) return "無回答";

  const parsed = parseCrossSub(subLabel);
  if (parsed) {
    const { axisKey, rawValue } = parsed;
    if (rawValue === NA_VALUE) return "無回答";
    // MA axis: rawValue is column name → valueLabels[rawValue]["1"]
    const maLabel = labelMap.valueLabels[rawValue]?.["1"];
    if (maLabel) return maLabel;
    // SA axis: rawValue is value code → valueLabels[axisKey][rawValue]
    return labelMap.valueLabels[axisKey]?.[rawValue] ?? rawValue;
  }

  // No prefix (backwards compatibility)
  const maLabel = labelMap.valueLabels[subLabel]?.["1"];
  if (maLabel) return maLabel;
  return subLabel;
}

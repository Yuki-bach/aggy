/** Label resolution utility (shared by table / chart / export) */

import { parseCrossSub } from "./agg/aggregate";
import type { LabelMap } from "./layout";
import { NA_VALUE } from "./agg/sqlHelpers";

/** Resolve question label; falls back to column name */
export function resolveQuestionLabel(col: string, labelMap: LabelMap): string {
  return labelMap.questionLabels[col] ?? col;
}

/** Resolve option label: unified valueLabels[col][code] for both SA and MA */
export function resolveValueLabel(
  type: "SA" | "MA",
  col: string,
  rowLabel: string,
  labelMap: LabelMap,
): string {
  if (rowLabel === NA_VALUE) return "無回答";
  const code = type === "MA" ? (labelMap.colToCode[rowLabel] ?? rowLabel) : rowLabel;
  return labelMap.valueLabels[col]?.[code] ?? rowLabel;
}

/** Resolve cross-axis header label (sub values are prefixed as "axisKey\x01rawValue") */
export function resolveSubLabel(subLabel: string, labelMap: LabelMap, naLabel = "無回答"): string {
  if (subLabel === NA_VALUE) return naLabel;

  const parsed = parseCrossSub(subLabel);
  if (parsed) {
    const { axisKey, rawValue } = parsed;
    if (rawValue === NA_VALUE) return naLabel;
    return labelMap.valueLabels[axisKey]?.[rawValue] ?? rawValue;
  }

  return subLabel;
}

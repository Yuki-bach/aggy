/** ラベル解決ユーティリティ（ResultTable / ChartRenderer 共有） */

import type { QuestionDef } from "./aggregate";
import { parseCrossSub } from "./aggregate";
import type { LayoutMeta } from "./layout";
import { NA_VALUE } from "./aggregator";

/** 設問ラベルを解決する。なければ列名をそのまま返す */
export function resolveQuestionLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

/** 選択肢ラベルを解決する
 *  SA: valueLabels[col][code]
 *  MA: valueLabels[colName]["1"]（colName = row.label）
 */
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

/** クロス軸ヘッダーのラベルを解決する
 *  sub値は "axisKey\x01rawValue" 形式でプレフィックス付き
 */
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
    // MA軸: rawValue はカラム名 → valueLabels[rawValue]["1"]
    const maLabel = meta.valueLabels[rawValue]?.["1"];
    if (maLabel) return maLabel;
    // SA軸: rawValue は値コード → valueLabels[axisKey][rawValue]
    return meta.valueLabels[axisKey]?.[rawValue] ?? rawValue;
  }

  // プレフィックスなし（後方互換）
  if (!meta) return subLabel;
  const maLabel = meta.valueLabels[subLabel]?.["1"];
  if (maLabel) return maLabel;
  return subLabel;
}

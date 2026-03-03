/** Convert AggResult + Question metadata into a consumer-friendly Tally. */

import type { Question, AggResult, Tally, Axis } from "./types";
import { NA_VALUE } from "./sqlHelpers";
import { t } from "../i18n";

export function toTally(question: Question, aggResult: AggResult, byQuestion?: Question): Tally {
  // Build labels including NA if present in codes
  const labels: Record<string, string> = { ...question.labels };
  if (aggResult.codes.includes(NA_VALUE)) {
    labels[NA_VALUE] = t("label.na");
  }

  let by: Axis | null = null;
  if (byQuestion) {
    const axisLabels: Record<string, string> = { ...byQuestion.labels };
    // Check if any slice code is NA_VALUE to add NA label
    const hasNA = aggResult.slices.some((s) => s.code === NA_VALUE);
    if (hasNA) {
      axisLabels[NA_VALUE] = t("label.na");
    }
    by = { code: byQuestion.code, label: byQuestion.label, labels: axisLabels };
  }

  return {
    question: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: aggResult.codes,
    by,
    slices: aggResult.slices,
  };
}

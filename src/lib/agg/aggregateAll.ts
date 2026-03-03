/** Bulk aggregation: all questions × all cross axes → Tally[] */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult, Tally, Axis } from "./types";
import { aggregate } from "./aggregate";
import { NA_VALUE } from "./sqlHelpers";
import { t } from "../i18n";

export async function aggregateAll(
  conn: duckdb.AsyncDuckDBConnection,
  questions: Question[],
  crossCols: Question[],
  weightCol: string,
): Promise<Tally[]> {
  const tallies: Tally[] = [];
  for (const q of questions) {
    const gtResult = await aggregate(conn, q, "GT", weightCol);
    tallies.push(toTally(q, gtResult));
    for (const cross of crossCols) {
      const crossResult = await aggregate(conn, q, cross, weightCol);
      tallies.push(toTally(q, crossResult, cross));
    }
  }
  return tallies;
}

/** Convert AggResult + Question metadata into a consumer-friendly Tally. */
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

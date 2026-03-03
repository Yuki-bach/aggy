/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult } from "./types";
import { GtAggregator } from "./gtAggregator";
import { CrossAggregator, fetchCrossHeaders } from "./crossAggregator";
import { NA_VALUE } from "./sqlHelpers";

/** Aggregate one question by one axis. Returns a single AggResult. */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  question: Question,
  by: Question | "GT",
  weightCol: string,
): Promise<AggResult> {
  if (by === "GT") {
    return aggregateGT(conn, question, weightCol);
  }
  return aggregateCross(conn, question, by, weightCol);
}

async function aggregateGT(
  conn: duckdb.AsyncDuckDBConnection,
  question: Question,
  weightCol: string,
): Promise<AggResult> {
  const gt = new GtAggregator(conn, weightCol);

  if (question.type === "SA") {
    const { slice, codes } = await gt.aggregateSA(question);
    return { codes, by: null, slices: [slice] };
  }

  const slice = await gt.aggregateMA(question);
  return {
    codes: [...question.codes, NA_VALUE],
    by: null,
    slices: [slice],
  };
}

async function aggregateCross(
  conn: duckdb.AsyncDuckDBConnection,
  question: Question,
  by: Question,
  weightCol: string,
): Promise<AggResult> {
  const crossHeaderCache = await fetchCrossHeaders(conn, [by], weightCol);
  const header = crossHeaderCache.get(by.code)!;
  const ca = new CrossAggregator(conn, weightCol, by, header);

  if (question.type === "SA") {
    // For SA cross, we first discover all codes via GT, then use them for cross
    const gt = new GtAggregator(conn, weightCol);
    const { codes } = await gt.aggregateSA(question);
    const slices = await ca.aggregateSA(question, codes);
    return { codes, by: by.code, slices };
  }

  const codes = [...question.codes, NA_VALUE];
  const slices = await ca.aggregateMA(question);
  return { codes, by: by.code, slices };
}

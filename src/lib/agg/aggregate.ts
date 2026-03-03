/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult } from "./types";
import { GtAggregator } from "./gtAggregator";
import { CrossAggregator, fetchCrossHeaders } from "./crossAggregator";

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
  return question.type === "SA"
    ? gt.aggregateSA(question.columns[0], question.codes)
    : gt.aggregateMA(question.columns, question.codes);
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

  // Discover codes via GT first (includes conditional NA), then use for cross
  const gt = new GtAggregator(conn, weightCol);
  const { codes } =
    question.type === "SA"
      ? await gt.aggregateSA(question.columns[0], question.codes)
      : await gt.aggregateMA(question.columns, question.codes);
  const slices =
    question.type === "SA"
      ? await ca.aggregateSA(question.columns[0], codes)
      : await ca.aggregateMA(question.columns, codes);
  return { codes, by: by.code, slices };
}

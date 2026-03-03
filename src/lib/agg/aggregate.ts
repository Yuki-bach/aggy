/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult } from "./types";
import { GtAggregator } from "./gtAggregator";
import { CrossAggregator } from "./crossAggregator";

/** Aggregate one question by one axis. Returns a single AggResult. */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  question: Question,
  by: Question | null,
  weightCol: string,
): Promise<AggResult> {
  if (by === null) {
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
  const ca = new CrossAggregator(conn, weightCol, by);

  return question.type === "SA"
    ? ca.aggregateSA(question.columns[0], question.codes)
    : ca.aggregateMA(question.columns, question.codes);
}

/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult } from "./types";
import { aggregateGt } from "./aggregateGt";
import { aggregateCross } from "./aggregateCross";

/** Aggregate one question by one axis. Returns a single AggResult. */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  question: Question,
  by: Question | null,
  weightCol: string,
): Promise<AggResult> {
  if (by === null) {
    return aggregateGt(conn, question, weightCol);
  }
  return aggregateCross(conn, question, by, weightCol);
}

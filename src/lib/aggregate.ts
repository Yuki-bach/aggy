/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { Aggregator, fetchCrossHeaders } from "./aggregator";

export interface Cell {
  main: string; // Option label (aggregation target value)
  sub: string; // "GT" or cross-tab axis value or MA column name
  n: number; // Denominator for this sub
  count: number;
  pct: number;
}

export interface AggResult {
  question: string;
  type: "SA" | "MA";
  cells: Cell[];
}

export type QuestionDef = SAQuestion | MAQuestion;

interface SAQuestion {
  type: "SA";
  column: string;
}

interface MAQuestion {
  type: "MA";
  prefix: string;
  columns: string[];
}

export function questionKey(q: QuestionDef): string {
  return q.type === "SA" ? q.column : q.prefix;
}

/** Cross sub value separator (separates axis key from raw value) */
export const CROSS_SEP = "\x01";

/** Build prefixed cross sub value (e.g. "q1\x011") */
export function crossSub(axisKey: string, rawValue: string): string {
  return `${axisKey}${CROSS_SEP}${rawValue}`;
}

/** Parse cross sub value into { axisKey, rawValue }. Returns null for unprefixed values like GT. */
export function parseCrossSub(sub: string): { axisKey: string; rawValue: string } | null {
  const idx = sub.indexOf(CROSS_SEP);
  if (idx < 0) return null;
  return { axisKey: sub.slice(0, idx), rawValue: sub.slice(idx + 1) };
}

export interface Query {
  questions: QuestionDef[];
  weight_col: string;
  cross_cols: QuestionDef[];
}

/** Aggregation entry point. Aggregates all questions against the survey view. */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query,
): Promise<AggResult[]> {
  const weightCol = payload.weight_col;
  const crossCols = payload.cross_cols ?? [];

  const crossHeaderCache =
    crossCols.length > 0
      ? await fetchCrossHeaders(conn, crossCols, weightCol)
      : (new Map() as Awaited<ReturnType<typeof fetchCrossHeaders>>);

  const ctx = new Aggregator(conn, weightCol, crossCols, crossHeaderCache);

  const results: AggResult[] = [];
  for (const q of payload.questions) {
    if (q.type === "SA") {
      results.push(await ctx.aggregateSA(q.column));
    } else {
      results.push(await ctx.aggregateMA(q.prefix, q.columns));
    }
  }

  return results;
}

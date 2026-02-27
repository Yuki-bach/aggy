/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { GtAggregator } from "./gtAggregator";
import { CrossAggregator, fetchCrossHeaders } from "./crossAggregator";

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

export interface SAQuestion {
  type: "SA";
  column: string;
}

export interface MAQuestion {
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

  // Prefetch cross-header info
  const crossHeaderCache =
    crossCols.length > 0 ? await fetchCrossHeaders(conn, crossCols, weightCol) : new Map();

  // Build aggregators
  const gt = new GtAggregator(conn, weightCol);
  const crossAggregators = crossCols.map((crossQ) => {
    const header = crossHeaderCache.get(questionKey(crossQ))!;
    return new CrossAggregator(conn, weightCol, crossQ, header);
  });

  const results: AggResult[] = [];
  for (const q of payload.questions) {
    if (q.type === "SA") {
      const { cells: gtCells, mainValues } = await gt.aggregateSA(q.column);
      const crossCells = await Promise.all(
        crossAggregators.map((ca) => ca.aggregateSA(q.column, mainValues)),
      );
      results.push({ question: q.column, type: "SA", cells: [...gtCells, ...crossCells.flat()] });
    } else {
      const gtCells = await gt.aggregateMA(q.columns);
      const crossCells = await Promise.all(crossAggregators.map((ca) => ca.aggregateMA(q.columns)));
      results.push({ question: q.prefix, type: "MA", cells: [...gtCells, ...crossCells.flat()] });
    }
  }

  return results;
}

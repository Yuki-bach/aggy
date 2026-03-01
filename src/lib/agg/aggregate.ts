/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { GtAggregator } from "./gtAggregator";
import { CrossAggregator, fetchCrossHeaders } from "./crossAggregator";

export interface Cell {
  /** Filter conditions identifying this cell (e.g. { q1: "1" } for GT, { q1: "1", q2: "2" } for cross) */
  key: Record<string, string>;
  n: number;
  count: number;
  pct: number;
}

/** Check if a cell is a GT (grand total) cell — has exactly one key entry */
export function isGT(cell: Cell): boolean {
  return Object.keys(cell.key).length === 1;
}

export interface AggResult {
  question: string;
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
  codes: string[];
}

export function questionKey(q: QuestionDef): string {
  return q.type === "SA" ? q.column : q.prefix;
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
      const gtCells = await gt.aggregateSA(q.column);
      const crossCells = await Promise.all(crossAggregators.map((ca) => ca.aggregateSA(q.column)));
      results.push({ question: q.column, type: "SA", cells: [...gtCells, ...crossCells.flat()] });
    } else {
      const gtCells = await gt.aggregateMA(q.columns);
      const crossCells = await Promise.all(crossAggregators.map((ca) => ca.aggregateMA(q.columns)));
      results.push({ question: q.prefix, type: "MA", cells: [...gtCells, ...crossCells.flat()] });
    }
  }

  return results;
}

/** DuckDB SQL aggregation logic */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { Aggregator, fetchCrossHeaders } from "./aggregator";
import { aggregateFA } from "./fa/faAggregator";

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

// --- FA result types ---

export interface WordFreq {
  word: string;
  count: number;
}

export interface FAResult {
  question: string;
  type: "FA";
  totalResponses: number;
  words: WordFreq[];
}

/** Union type for all result types (SA/MA/FA) */
export type ResultItem = AggResult | FAResult;

// --- Question definitions ---

export type QuestionDef = SAQuestion | MAQuestion | FAQuestion;

interface SAQuestion {
  type: "SA";
  column: string;
}

interface MAQuestion {
  type: "MA";
  prefix: string;
  columns: string[];
}

export interface FAQuestion {
  type: "FA";
  column: string;
}

export function questionKey(q: QuestionDef): string {
  switch (q.type) {
    case "SA":
      return q.column;
    case "MA":
      return q.prefix;
    case "FA":
      return q.column;
  }
}

/** Question types eligible for cross-tabulation (FA excluded) */
export type CrossableQuestion = SAQuestion | MAQuestion;

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
  cross_cols: CrossableQuestion[];
}

/** Aggregation entry point. Aggregates all questions against the survey view. */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query,
): Promise<ResultItem[]> {
  const weightCol = payload.weight_col;
  const crossCols: CrossableQuestion[] = payload.cross_cols ?? [];

  // Separate FA questions (not eligible for cross-tabulation)
  const samaQuestions = payload.questions.filter((q) => q.type !== "FA");
  const faQuestions = payload.questions.filter((q): q is FAQuestion => q.type === "FA");

  const crossHeaderCache =
    crossCols.length > 0
      ? await fetchCrossHeaders(conn, crossCols, weightCol)
      : (new Map() as Awaited<ReturnType<typeof fetchCrossHeaders>>);

  const ctx = new Aggregator(conn, weightCol, crossCols, crossHeaderCache);

  const results: ResultItem[] = [];
  for (const q of samaQuestions) {
    if (q.type === "SA") {
      results.push(await ctx.aggregateSA(q.column));
    } else if (q.type === "MA") {
      results.push(await ctx.aggregateMA(q.prefix, q.columns));
    }
  }

  for (const q of faQuestions) {
    results.push(await aggregateFA(conn, q.column));
  }

  return results;
}

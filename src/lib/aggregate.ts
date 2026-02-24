/** DuckDB SQL集計ロジック */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { Aggregator, fetchCrossHeaders } from "./aggregator";
import { aggregateFA } from "./fa/faAggregator";

// --- 集計結果の型定義 ---

export interface Cell {
  main: string; // 選択肢ラベル（集計対象の設問値）
  sub: string; // "GT" or クロス集計軸の値 ("男", "女", ...) or MAカラム名
  n: number; // その sub の母数
  count: number;
  pct: number;
}

export interface AggResult {
  question: string;
  type: "SA" | "MA";
  cells: Cell[];
}

// --- FA集計結果の型定義 ---

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

/** SA/MA/FA すべての集計結果を含む union 型 */
export type ResultItem = AggResult | FAResult;

// --- 集計 payload ---

export type QuestionDef = SAQuestion | MAQuestion | FAQuestion;

interface SAQuestion {
  type: "SA";
  column: string; // カラム名 "q1"
}

interface MAQuestion {
  type: "MA";
  prefix: string; // グループプレフィックス "Q3"
  columns: string[]; // ["Q3_1","Q3_2","Q3_3"]
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

/** クロス集計に使用可能な設問型（FAは除外） */
export type CrossableQuestion = SAQuestion | MAQuestion;

export interface Query {
  questions: QuestionDef[];
  weight_col: string;
  cross_cols: CrossableQuestion[];
}

/** 集計のエントリポイント。conn上のsurveyビューに対して全設問を集計する */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query,
): Promise<ResultItem[]> {
  const weightCol = payload.weight_col;
  const crossCols: CrossableQuestion[] = payload.cross_cols ?? [];

  // FA設問はクロス集計対象外なので分離
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

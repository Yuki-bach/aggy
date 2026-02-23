/** DuckDB SQL集計ロジック */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { AggregationContext } from "./AggregationContext";

// --- 集計結果の型定義 ---

export interface Cell {
  main: string;   // 選択肢ラベル（集計対象の設問値）
  sub: string;    // "GT" or クロス集計軸の値 ("男", "女", ...) or MAカラム名
  n: number;      // その sub の母数
  count: number;
  pct: number;
}

export interface AggResult {
  question: string;
  type: "SA" | "MA";
  cells: Cell[];
}

// --- 集計 payload ---

export type QuestionDef = SAQuestion | MAQuestion;

interface SAQuestion {
  type: "SA";
  column: string;       // カラム名 "q1"
}

interface MAQuestion {
  type: "MA";
  prefix: string;       // グループプレフィックス "Q3"
  columns: string[];    // ["Q3_1","Q3_2","Q3_3"]
}

export function questionKey(q: QuestionDef): string {
  return q.type === "SA" ? q.column : q.prefix;
}

export interface Query {
  questions: QuestionDef[];
  weight_col: string;
  cross_cols: QuestionDef[];
}

/** 集計のエントリポイント。conn上のsurveyビューに対して全設問を集計する */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query
): Promise<AggResult[]> {
  const ctx = await AggregationContext.create(conn, payload);

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

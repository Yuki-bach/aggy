/** DuckDB SQL集計ロジック */

import type * as duckdb from "@duckdb/duckdb-wasm";
import { Aggregator, fetchCrossHeaders } from "./aggregator";

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

/** 集計のエントリポイント。db上のsurveyビューに対して全設問を並列集計する */
export async function aggregate(
  db: duckdb.AsyncDuckDB,
  payload: Query
): Promise<AggResult[]> {
  const weightCol = payload.weight_col;
  const crossCols = payload.cross_cols ?? [];

  // クロスヘッダーキャッシュを先に構築（1コネクション）
  let crossHeaderCache: Awaited<ReturnType<typeof fetchCrossHeaders>>;
  if (crossCols.length > 0) {
    const conn = await db.connect();
    try {
      crossHeaderCache = await fetchCrossHeaders(conn, crossCols, weightCol);
    } finally {
      await conn.close();
    }
  } else {
    crossHeaderCache = new Map();
  }

  // 設問ごとに並列実行（各自コネクション作成・破棄）
  return Promise.all(
    payload.questions.map(async (q) => {
      const conn = await db.connect();
      try {
        const ctx = new Aggregator(conn, weightCol, crossCols, crossHeaderCache);
        if (q.type === "SA") {
          return ctx.aggregateSA(q.column);
        } else {
          return ctx.aggregateMA(q.prefix, q.columns);
        }
      } finally {
        await conn.close();
      }
    })
  );
}

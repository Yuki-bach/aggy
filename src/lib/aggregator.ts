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

// --- SQL ユーティリティ（AggregationContext からも利用） ---

export function esc(name: string): string {
  return name.replace(/"/g, '""');
}

export function weightExpr(weightCol: string): string {
  return weightCol
    ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))`
    : `COUNT(*)::DOUBLE`;
}

/** MA列の重み付きカウント式 */
export function maWeightedCountExpr(maCol: string, weightCol: string): string {
  return weightCol
    ? `SUM(CASE WHEN "${esc(maCol)}" IN ('1','true') THEN TRY_CAST("${esc(weightCol)}" AS DOUBLE) ELSE 0 END)`
    : `COUNT(CASE WHEN "${esc(maCol)}" IN ('1','true') THEN 1 END)::DOUBLE`;
}

// --- クロスヘッダーキャッシュ ---

export type CrossHeaderCache = Map<
  string,
  { headers: Array<{ label: string; n: number }>; crossValues: string[] }
>;

/** 集計のエントリポイント。conn上のsurveyビューに対して全設問を集計する */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query
): Promise<AggResult[]> {
  const totalN = await computeTotalN(conn, payload.weight_col);
  const crossCols = payload.cross_cols ?? [];
  const crossHeaderCache =
    crossCols.length > 0
      ? await fetchCrossHeaders(conn, crossCols, payload.weight_col)
      : (new Map() as CrossHeaderCache);

  const ctx = new AggregationContext(conn, payload.weight_col, totalN, crossCols, crossHeaderCache);

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

// --- 内部ユーティリティ ---

async function computeTotalN(
  conn: duckdb.AsyncDuckDBConnection,
  weightCol: string
): Promise<number> {
  const sql = weightCol
    ? `SELECT COALESCE(SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE)), 0) AS n FROM survey`
    : `SELECT COUNT(*) AS n FROM survey`;
  const result = await conn.query(sql);
  return Number(result.toArray()[0].n);
}

async function fetchCrossHeaders(
  conn: duckdb.AsyncDuckDBConnection,
  crossCols: QuestionDef[],
  weightCol: string
): Promise<CrossHeaderCache> {
  const cache: CrossHeaderCache = new Map();

  for (const crossQ of crossCols) {
    if (crossQ.type === "SA") {
      const col = crossQ.column;
      const sql = `
        SELECT
          "${esc(col)}" AS cv,
          ${weightExpr(weightCol)} AS n
        FROM survey
        WHERE "${esc(col)}" IS NOT NULL
          AND "${esc(col)}" != ''
        GROUP BY "${esc(col)}"
        ORDER BY
          TRY_CAST("${esc(col)}" AS DOUBLE) NULLS LAST,
          "${esc(col)}" ASC
      `;
      const result = await conn.query(sql);
      const headers = result
        .toArray()
        .map((r) => ({ label: String(r.cv), n: Number(r.n) }));
      cache.set(crossQ.column, { headers, crossValues: headers.map((h) => h.label) });
    } else {
      // MA軸: 各itemカラムごとに該当者数を算出
      const selectClauses = crossQ.columns.map((col, i) =>
        `${maWeightedCountExpr(col, weightCol)} AS c${i}`
      );
      const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
      const result = await conn.query(sql);
      const row = result.toArray()[0];
      const headers = crossQ.columns.map((col, i) => ({
        label: col,
        n: Number(row[`c${i}`] ?? 0),
      }));
      cache.set(crossQ.prefix, { headers, crossValues: headers.map((h) => h.label) });
    }
  }
  return cache;
}

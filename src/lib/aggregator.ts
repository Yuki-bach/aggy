/** DuckDB SQL集計ロジック */

import type * as duckdb from "@duckdb/duckdb-wasm";

// --- 集計結果の型定義 ---

export interface Cell {
  main: string;   // 選択肢ラベル（集計対象の設問値）
  sub: string;    // "GT" or クロス集計軸の値 ("男", "女", ...)
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

export interface QuestionDef {
  key: string;          // SA: カラム名 "q1", MA: グループプレフィックス "Q3"
  columns: string[];    // SA: ["q1"],  MA: ["Q3_1","Q3_2","Q3_3"]
  type: "SA" | "MA";
}

export interface Query {
  questions: QuestionDef[];
  weight_col: string;
  cross_cols: string[];
}

/** 集計のエントリポイント。conn上のsurveyビューに対して全設問を集計する */
export async function aggregate(
  conn: duckdb.AsyncDuckDBConnection,
  payload: Query
): Promise<AggResult[]> {
  const totalN = await computeTotalN(conn, payload.weight_col);
  const crossCols = payload.cross_cols ?? [];
  const results: AggResult[] = [];

  // クロス軸ヘッダーを事前に1回だけ取得してキャッシュ
  const crossHeaderCache =
    crossCols.length > 0
      ? await fetchCrossHeaders(conn, crossCols, payload.weight_col)
      : (new Map() as CrossHeaderCache);

  for (const q of payload.questions) {
    if (q.type === "SA") {
      results.push(
        await aggregateSA(conn, q.columns[0], totalN, payload.weight_col, crossCols, crossHeaderCache)
      );
    } else {
      results.push(
        await aggregateMA(conn, q.key, q.columns, totalN, payload.weight_col)
      );
    }
  }

  return results;
}

// --- 内部ユーティリティ ---

function esc(name: string): string {
  return name.replace(/"/g, '""');
}

function weightExpr(weightCol: string): string {
  return weightCol
    ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))`
    : `COUNT(*)::DOUBLE`;
}

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

type CrossHeaderCache = Map<
  string,
  { headers: Array<{ label: string; n: number }>; crossValues: string[] }
>;

async function fetchCrossHeaders(
  conn: duckdb.AsyncDuckDBConnection,
  crossCols: string[],
  weightCol: string
): Promise<CrossHeaderCache> {
  const cache: CrossHeaderCache = new Map();

  for (const crossCol of crossCols) {
    const sql = `
      SELECT
        "${esc(crossCol)}" AS cv,
        ${weightExpr(weightCol)} AS n
      FROM survey
      WHERE "${esc(crossCol)}" IS NOT NULL
        AND "${esc(crossCol)}" != ''
      GROUP BY "${esc(crossCol)}"
      ORDER BY
        TRY_CAST("${esc(crossCol)}" AS DOUBLE) NULLS LAST,
        "${esc(crossCol)}" ASC
    `;
    const result = await conn.query(sql);
    const headers = result
      .toArray()
      .map((r) => ({ label: String(r.cv), n: Number(r.n) }));
    cache.set(crossCol, { headers, crossValues: headers.map((h) => h.label) });
  }
  return cache;
}

async function aggregateSA(
  conn: duckdb.AsyncDuckDBConnection,
  col: string,
  totalN: number,
  weightCol: string,
  crossCols: string[],
  crossHeaderCache: CrossHeaderCache
): Promise<AggResult> {
  const sql = `
    SELECT
      "${esc(col)}" AS label,
      ${weightExpr(weightCol)} AS cnt
    FROM survey
    WHERE "${esc(col)}" IS NOT NULL
      AND "${esc(col)}" != ''
    GROUP BY "${esc(col)}"
    ORDER BY
      TRY_CAST("${esc(col)}" AS DOUBLE) NULLS LAST,
      "${esc(col)}" ASC
  `;

  const arrowResult = await conn.query(sql);
  const rowArr = arrowResult.toArray();

  // GT セル
  const cells: Cell[] = rowArr.map((r) => {
    const count = Number(r.cnt);
    return {
      main: String(r.label),
      sub: "GT",
      n: totalN,
      count,
      pct: totalN > 0 ? (count / totalN) * 100 : 0,
    };
  });

  // クロスセル
  if (crossCols.length > 0) {
    const mainValues = rowArr.map((r) => String(r.label));
    for (const crossCol of crossCols) {
      const cached = crossHeaderCache.get(crossCol)!;
      const crossCells = await buildCrossCells(
        conn, col, mainValues, crossCol, weightCol, cached
      );
      cells.push(...crossCells);
    }
  }

  return { question: col, type: "SA", cells };
}

async function buildCrossCells(
  conn: duckdb.AsyncDuckDBConnection,
  mainCol: string,
  mainValues: string[],
  crossCol: string,
  weightCol: string,
  cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
): Promise<Cell[]> {
  const { headers, crossValues } = cached;

  const cellSQL = `
    SELECT
      "${esc(mainCol)}" AS mv,
      "${esc(crossCol)}" AS sv,
      ${weightExpr(weightCol)} AS cnt
    FROM survey
    WHERE "${esc(mainCol)}" IS NOT NULL
      AND "${esc(mainCol)}" != ''
      AND "${esc(crossCol)}" IS NOT NULL
      AND "${esc(crossCol)}" != ''
    GROUP BY "${esc(mainCol)}", "${esc(crossCol)}"
  `;

  const cellResult = await conn.query(cellSQL);
  const cellMap = new Map<string, number>();
  for (const r of cellResult.toArray()) {
    cellMap.set(`${r.mv}\0${r.sv}`, Number(r.cnt));
  }

  const cells: Cell[] = [];
  for (const mv of mainValues) {
    for (let i = 0; i < crossValues.length; i++) {
      const sv = crossValues[i];
      const count = cellMap.get(`${mv}\0${sv}`) ?? 0;
      const crossN = headers[i].n;
      cells.push({
        main: mv,
        sub: sv,
        n: crossN,
        count,
        pct: crossN > 0 ? (count / crossN) * 100 : 0,
      });
    }
  }

  return cells;
}

async function aggregateMA(
  conn: duckdb.AsyncDuckDBConnection,
  prefix: string,
  cols: string[],
  totalN: number,
  weightCol: string
): Promise<AggResult> {
  const selectClauses = cols.map((col, i) => {
    const expr = weightCol
      ? `SUM(CASE WHEN "${esc(col)}" IN ('1','true') THEN TRY_CAST("${esc(weightCol)}" AS DOUBLE) ELSE 0 END)`
      : `COUNT(CASE WHEN "${esc(col)}" IN ('1','true') THEN 1 END)::DOUBLE`;
    return `${expr} AS c${i}`;
  });

  const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
  const result = await conn.query(sql);
  const row = result.toArray()[0];

  const cells: Cell[] = cols.map((col, i) => {
    const count = Number(row[`c${i}`] ?? 0);
    return {
      main: col,
      sub: "GT",
      n: totalN,
      count,
      pct: totalN > 0 ? (count / totalN) * 100 : 0,
    };
  });

  return { question: prefix, type: "MA", cells };
}

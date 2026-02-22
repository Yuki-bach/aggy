/** DuckDB SQL集計ロジック */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { AggResult, AggRow, CrossSection } from "./aggregate";

export interface AggPayload {
  columns: Array<{ name: string; type: "sa" | "ma"; ma_group?: string }>;
  weight_col: string;
  mode: "gt" | "cross";
  cross_cols: string[];
}

/** 集計のエントリポイント。conn上のsurveyビューに対して全設問を集計する */
export async function runAggregation(
  conn: duckdb.AsyncDuckDBConnection,
  payload: AggPayload
): Promise<AggResult[]> {
  const totalN = await computeTotalN(conn, payload.weight_col);
  const crossCols = payload.mode === "cross" ? payload.cross_cols : [];
  const results: AggResult[] = [];

  // クロス軸ヘッダーを事前に1回だけ取得してキャッシュ
  const crossHeaderCache =
    crossCols.length > 0
      ? await fetchCrossHeaders(conn, crossCols, payload.weight_col)
      : (new Map() as CrossHeaderCache);

  const saCols = payload.columns.filter((c) => c.type === "sa");
  for (const col of saCols) {
    results.push(
      await aggregateSA(conn, col.name, totalN, payload.weight_col, crossCols, crossHeaderCache)
    );
  }

  const maGroups = groupMAColumns(payload.columns);
  for (const [prefix, cols] of Object.entries(maGroups)) {
    results.push(
      await aggregateMA(conn, prefix, cols, totalN, payload.weight_col)
    );
  }

  return results;
}

// SQL識別子内のダブルクォートをエスケープ
function esc(name: string): string {
  return name.replace(/"/g, '""');
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

// クロス軸ヘッダー（ユニーク値＋N）のキャッシュ型
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
  const weightExpr = weightCol
    ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))`
    : `COUNT(*)::DOUBLE`;

  for (const crossCol of crossCols) {
    const sql = `
      SELECT
        "${esc(crossCol)}" AS cv,
        ${weightExpr} AS n
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
  const weightExpr = weightCol
    ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))`
    : `COUNT(*)::DOUBLE`;

  const sql = `
    SELECT
      "${esc(col)}" AS label,
      ${weightExpr} AS cnt
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
  const n = totalN;

  const rows: AggRow[] = rowArr.map((r) => {
    const count = Number(r.cnt);
    return { label: String(r.label), count, pct: n > 0 ? (count / n) * 100 : 0 };
  });

  const result: AggResult = { col, type: "SA", n, rows };

  if (crossCols.length > 0) {
    result.cross = [];
    for (const crossCol of crossCols) {
      const section = await computeCrossSection(
        conn,
        col,
        rows.map((r) => r.label),
        crossCol,
        weightCol,
        crossHeaderCache.get(crossCol)!
      );
      result.cross.push(section);
    }
  }

  return result;
}

async function computeCrossSection(
  conn: duckdb.AsyncDuckDBConnection,
  rowCol: string,
  rowValues: string[],
  crossCol: string,
  weightCol: string,
  cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
): Promise<CrossSection> {
  const weightExpr = weightCol
    ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))`
    : `COUNT(*)::DOUBLE`;

  const { headers, crossValues } = cached;

  // (rowVal, crossVal) の全組み合わせカウント
  const cellSQL = `
    SELECT
      "${esc(rowCol)}" AS rv,
      "${esc(crossCol)}" AS cv,
      ${weightExpr} AS cnt
    FROM survey
    WHERE "${esc(rowCol)}" IS NOT NULL
      AND "${esc(rowCol)}" != ''
      AND "${esc(crossCol)}" IS NOT NULL
      AND "${esc(crossCol)}" != ''
    GROUP BY "${esc(rowCol)}", "${esc(crossCol)}"
  `;

  const cellResult = await conn.query(cellSQL);
  const cellMap = new Map<string, number>();
  for (const r of cellResult.toArray()) {
    cellMap.set(`${r.rv}\0${r.cv}`, Number(r.cnt));
  }

  const crossRows = rowValues.map((rv) => {
    const cells = crossValues.map((cv, i) => {
      const count = cellMap.get(`${rv}\0${cv}`) ?? 0;
      const crossN = headers[i].n;
      return { count, pct: crossN > 0 ? (count / crossN) * 100 : 0 };
    });
    return { label: rv, cells };
  });

  return { cross_col: crossCol, headers, rows: crossRows };
}

async function aggregateMA(
  conn: duckdb.AsyncDuckDBConnection,
  prefix: string,
  cols: string[],
  totalN: number,
  weightCol: string
): Promise<AggResult> {
  // 全MA列を1クエリで集計
  const selectClauses = cols.map((col, i) => {
    const expr = weightCol
      ? `SUM(CASE WHEN "${esc(col)}" IN ('1','true') THEN TRY_CAST("${esc(weightCol)}" AS DOUBLE) ELSE 0 END)`
      : `COUNT(CASE WHEN "${esc(col)}" IN ('1','true') THEN 1 END)::DOUBLE`;
    return `${expr} AS c${i}`;
  });

  const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
  const result = await conn.query(sql);
  const row = result.toArray()[0];

  const rows: AggRow[] = cols.map((col, i) => {
    const count = Number(row[`c${i}`] ?? 0);
    return { label: col, count, pct: totalN > 0 ? (count / totalN) * 100 : 0 };
  });

  return { col: prefix, type: "MA", n: totalN, rows };
}

function groupMAColumns(
  columns: Array<{ name: string; type: "sa" | "ma"; ma_group?: string }>
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const col of columns) {
    if (col.type === "ma" && col.ma_group) {
      if (!groups[col.ma_group]) groups[col.ma_group] = [];
      groups[col.ma_group].push(col.name);
    }
  }
  return groups;
}

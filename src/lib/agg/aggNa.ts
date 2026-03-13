/** NA (Numerical Answer) aggregation — GT and Cross */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Shape, AggOutput, NaStats, Slice } from "./types";
import { esc, maShownCondition } from "./sqlHelpers";

interface ValueCount {
  value: number;
  count: number;
}

// ── GT ──

export async function aggNaTotals(
  conn: duckdb.AsyncDuckDBConnection,
  column: string,
  weightCol: string,
): Promise<AggOutput> {
  const valExpr = `CAST("${esc(column)}" AS DOUBLE)`;
  const whereCond = `"${esc(column)}" IS NOT NULL AND TRY_CAST("${esc(column)}" AS DOUBLE) IS NOT NULL`;

  const stats = await queryStats(conn, valExpr, whereCond, weightCol);
  const freq = await queryFreq(conn, valExpr, whereCond, weightCol);

  const { codes, cells } = freqToCells(freq, stats.n);
  return { codes, slices: [{ code: null, n: stats.n, cells, stats }] };
}

// ── Cross (NA × SA or NA × MA) ──

export async function aggNaCrossTab(
  conn: duckdb.AsyncDuckDBConnection,
  naColumn: string,
  axisShape: Shape,
  weightCol: string,
): Promise<AggOutput> {
  if (axisShape.type === "SA") {
    return naCrossSA(conn, naColumn, axisShape.columns[0], axisShape.codes, weightCol);
  }
  return naCrossMA(conn, naColumn, axisShape.columns, axisShape.codes, weightCol);
}

// ── Helpers ──

function freqToCells(
  freq: ValueCount[],
  n: number,
): { codes: string[]; cells: import("./types").Cell[] } {
  const codes = freq.map((f) => String(f.value));
  const cells = freq.map((f) => ({
    count: f.count,
    pct: n > 0 ? (f.count / n) * 100 : 0,
  }));
  return { codes, cells };
}

/** Union all value keys across slices, returning sorted codes and aligned cells per slice */
function alignSlices(sliceData: { code: string; freq: ValueCount[]; stats: NaStats }[]): {
  codes: string[];
  slices: Slice[];
} {
  const allValues = new Set<number>();
  for (const s of sliceData) {
    for (const f of s.freq) allValues.add(f.value);
  }
  const sortedValues = [...allValues].sort((a, b) => a - b);
  const codes = sortedValues.map(String);

  const slices: Slice[] = sliceData.map((s) => {
    const freqMap = new Map(s.freq.map((f) => [f.value, f.count]));
    const cells = sortedValues.map((v) => {
      const count = freqMap.get(v) ?? 0;
      return { count, pct: s.stats.n > 0 ? (count / s.stats.n) * 100 : 0 };
    });
    return { code: s.code, n: s.stats.n, cells, stats: s.stats };
  });

  return { codes, slices };
}

// ── Internal ──

async function queryStats(
  conn: duckdb.AsyncDuckDBConnection,
  valExpr: string,
  whereCond: string,
  weightCol: string,
  groupByCol?: string,
): Promise<NaStats> {
  let sql: string;
  // NOTE: MEDIAN is unweighted even in weighted mode.
  // DuckDB has no built-in weighted median; a custom implementation may be added in the future.
  if (weightCol) {
    const w = `"${esc(weightCol)}"`;
    sql = `
      SELECT
        ${groupByCol ? `"${esc(groupByCol)}" AS grp,` : ""}
        COALESCE(SUM(${w}), 0) AS n,
        SUM(val * ${w}) / NULLIF(SUM(${w}), 0) AS mean,
        MEDIAN(val) AS median,
        STDDEV_SAMP(val) AS sd,
        MIN(val) AS min_val,
        MAX(val) AS max_val
      FROM (SELECT ${valExpr} AS val, ${w} FROM survey WHERE ${whereCond}) sub
      ${groupByCol ? `WHERE "${esc(groupByCol)}" IS NOT NULL GROUP BY "${esc(groupByCol)}"` : ""}
    `;
  } else {
    sql = `
      SELECT
        ${groupByCol ? `"${esc(groupByCol)}" AS grp,` : ""}
        COUNT(*)::DOUBLE AS n,
        AVG(val) AS mean,
        MEDIAN(val) AS median,
        STDDEV_SAMP(val) AS sd,
        MIN(val) AS min_val,
        MAX(val) AS max_val
      FROM (SELECT ${valExpr} AS val FROM survey WHERE ${whereCond}) sub
      ${groupByCol ? `WHERE "${esc(groupByCol)}" IS NOT NULL GROUP BY "${esc(groupByCol)}"` : ""}
    `;
  }

  const result = await conn.query(sql);
  const row = result.toArray()[0];
  if (!row) return { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };
  return toStats(row);
}

async function queryStatsGrouped(
  conn: duckdb.AsyncDuckDBConnection,
  valExpr: string,
  whereCond: string,
  weightCol: string,
  groupByCol: string,
): Promise<Map<string, NaStats>> {
  const w = weightCol ? `"${esc(weightCol)}"` : "";
  let sql: string;
  // NOTE: MEDIAN is unweighted even in weighted mode (same as queryStats)
  if (weightCol) {
    sql = `
      SELECT
        "${esc(groupByCol)}" AS grp,
        COALESCE(SUM(${w}), 0) AS n,
        SUM(val * ${w}) / NULLIF(SUM(${w}), 0) AS mean,
        MEDIAN(val) AS median,
        STDDEV_SAMP(val) AS sd,
        MIN(val) AS min_val,
        MAX(val) AS max_val
      FROM (SELECT ${valExpr} AS val, ${w}, "${esc(groupByCol)}" FROM survey WHERE ${whereCond} AND "${esc(groupByCol)}" IS NOT NULL) sub
      GROUP BY "${esc(groupByCol)}"
    `;
  } else {
    sql = `
      SELECT
        "${esc(groupByCol)}" AS grp,
        COUNT(*)::DOUBLE AS n,
        AVG(val) AS mean,
        MEDIAN(val) AS median,
        STDDEV_SAMP(val) AS sd,
        MIN(val) AS min_val,
        MAX(val) AS max_val
      FROM (SELECT ${valExpr} AS val, "${esc(groupByCol)}" FROM survey WHERE ${whereCond} AND "${esc(groupByCol)}" IS NOT NULL) sub
      GROUP BY "${esc(groupByCol)}"
    `;
  }

  const result = await conn.query(sql);
  const map = new Map<string, NaStats>();
  for (const row of result.toArray()) {
    map.set(String(row.grp), toStats(row));
  }
  return map;
}

async function queryFreq(
  conn: duckdb.AsyncDuckDBConnection,
  valExpr: string,
  whereCond: string,
  weightCol: string,
  groupByCol?: string,
): Promise<ValueCount[]> {
  const countExpr = weightCol ? `SUM("${esc(weightCol)}")` : `COUNT(*)::DOUBLE`;
  const sql = `
    SELECT ${valExpr} AS val, ${countExpr} AS cnt
      ${groupByCol ? `, "${esc(groupByCol)}" AS grp` : ""}
    FROM survey
    WHERE ${whereCond}
      ${groupByCol ? `AND "${esc(groupByCol)}" IS NOT NULL` : ""}
    GROUP BY ${valExpr}${groupByCol ? `, "${esc(groupByCol)}"` : ""}
    ORDER BY val
  `;
  const result = await conn.query(sql);
  return result.toArray().map((r) => ({ value: Number(r.val), count: Number(r.cnt) }));
}

async function queryFreqGrouped(
  conn: duckdb.AsyncDuckDBConnection,
  valExpr: string,
  whereCond: string,
  weightCol: string,
  groupByCol: string,
): Promise<Map<string, ValueCount[]>> {
  const countExpr = weightCol ? `SUM("${esc(weightCol)}")` : `COUNT(*)::DOUBLE`;
  const sql = `
    SELECT ${valExpr} AS val, ${countExpr} AS cnt, "${esc(groupByCol)}" AS grp
    FROM survey
    WHERE ${whereCond} AND "${esc(groupByCol)}" IS NOT NULL
    GROUP BY ${valExpr}, "${esc(groupByCol)}"
    ORDER BY val
  `;
  const result = await conn.query(sql);
  const map = new Map<string, ValueCount[]>();
  for (const row of result.toArray()) {
    const grp = String(row.grp);
    let arr = map.get(grp);
    if (!arr) {
      arr = [];
      map.set(grp, arr);
    }
    arr.push({ value: Number(row.val), count: Number(row.cnt) });
  }
  return map;
}

function toStats(row: Record<string, unknown>): NaStats {
  return {
    n: Number(row.n ?? 0),
    mean: Number(row.mean ?? 0),
    median: Number(row.median ?? 0),
    sd: Number(row.sd ?? 0),
    min: Number(row.min_val ?? 0),
    max: Number(row.max_val ?? 0),
  };
}

// ── NA × SA cross ──

async function naCrossSA(
  conn: duckdb.AsyncDuckDBConnection,
  naColumn: string,
  crossCol: string,
  crossCodes: string[],
  weightCol: string,
): Promise<AggOutput> {
  const valExpr = `CAST("${esc(naColumn)}" AS DOUBLE)`;
  const whereCond = `"${esc(naColumn)}" IS NOT NULL AND TRY_CAST("${esc(naColumn)}" AS DOUBLE) IS NOT NULL`;

  const statsMap = await queryStatsGrouped(conn, valExpr, whereCond, weightCol, crossCol);
  const freqMap = await queryFreqGrouped(conn, valExpr, whereCond, weightCol, crossCol);

  const emptyStats: NaStats = { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };
  const sliceData = crossCodes.map((code) => ({
    code,
    stats: statsMap.get(code) ?? emptyStats,
    freq: freqMap.get(code) ?? [],
  }));

  return alignSlices(sliceData);
}

// ── NA × MA cross ──

async function naCrossMA(
  conn: duckdb.AsyncDuckDBConnection,
  naColumn: string,
  maCols: string[],
  maCodes: string[],
  weightCol: string,
): Promise<AggOutput> {
  const valExpr = `CAST("${esc(naColumn)}" AS DOUBLE)`;
  const baseWhere = `"${esc(naColumn)}" IS NOT NULL AND TRY_CAST("${esc(naColumn)}" AS DOUBLE) IS NOT NULL AND (${maShownCondition(maCols)})`;

  const sliceData: { code: string; freq: ValueCount[]; stats: NaStats }[] = [];
  for (let i = 0; i < maCols.length; i++) {
    const maCol = maCols[i];
    const whereCond = `${baseWhere} AND "${esc(maCol)}" = 1`;
    const stats = await queryStats(conn, valExpr, whereCond, weightCol);
    const freq = await queryFreq(conn, valExpr, whereCond, weightCol);
    sliceData.push({ code: maCodes[i], stats, freq });
  }

  return alignSlices(sliceData);
}

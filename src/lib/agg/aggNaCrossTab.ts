/** NA (Numerical Answer) cross-tabulation */

import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { Shape, TabData, Slice, NaStats } from "./types";
import { calcPct } from "./types";
import { esc, maShownCondition } from "./sqlHelpers";
import {
  type ValueCount,
  EMPTY_NA_STATS,
  naValExpr,
  naWhereCond,
  assembleStats,
} from "./naHelpers";

export async function aggNaCrossTab(
  conn: AsyncDuckDBConnection,
  naColumn: string,
  axisShape: Shape,
  weightCol: string,
): Promise<TabData> {
  return new NaCrossTabAggregator(conn, naColumn, weightCol).crossTab(axisShape);
}

class NaCrossTabAggregator {
  constructor(
    private conn: AsyncDuckDBConnection,
    private column: string,
    private weightCol: string,
  ) {}

  async crossTab(axisShape: Shape): Promise<TabData> {
    if (axisShape.type === "SA") {
      return this.naCrossSA(axisShape.columns[0], axisShape.codes);
    }
    return this.naCrossMA(axisShape.columns, axisShape.codes);
  }

  // ── NA × SA cross ──

  private async naCrossSA(crossCol: string, crossCodes: string[]): Promise<TabData> {
    const statsMap = await this.queryStatsGrouped(crossCol, crossCodes);
    const freqMap = await this.queryFreqGrouped(crossCol, crossCodes);

    const sliceData = crossCodes.map((code) => ({
      code,
      stats: statsMap.get(code)!,
      freq: freqMap.get(code)!,
    }));

    return this.alignSlices(sliceData);
  }

  // ── NA × MA cross ──

  private async naCrossMA(maCols: string[], maCodes: string[]): Promise<TabData> {
    const baseWhere = `${naWhereCond(this.column)} AND (${maShownCondition(maCols)})`;

    const sliceData: { code: string; freq: ValueCount[]; stats: NaStats }[] = [];
    for (let i = 0; i < maCols.length; i++) {
      const maCol = maCols[i];
      const maWhere = `${baseWhere} AND "${esc(maCol)}" = 1`;
      const stats = await this.queryStats(maWhere);
      const freq = await this.queryFreq(maWhere);
      sliceData.push({ code: maCodes[i], stats, freq });
    }

    return this.alignSlices(sliceData);
  }

  // ── Query helpers ──

  private async queryStats(whereOverride?: string): Promise<NaStats> {
    const where = whereOverride ?? naWhereCond(this.column);
    let sql: string;
    // NOTE: MEDIAN is unweighted even in weighted mode.
    if (this.weightCol) {
      const w = `"${esc(this.weightCol)}"`;
      sql = `
        SELECT
          COALESCE(SUM(${w}), 0) AS n,
          SUM(val * ${w}) / NULLIF(SUM(${w}), 0) AS mean,
          MEDIAN(val) AS median,
          STDDEV_SAMP(val) AS sd,
          MIN(val) AS min_val,
          MAX(val) AS max_val
        FROM (SELECT ${naValExpr(this.column)} AS val, ${w} FROM survey WHERE ${where}) sub
      `;
    } else {
      sql = `
        SELECT
          COUNT(*)::DOUBLE AS n,
          AVG(val) AS mean,
          MEDIAN(val) AS median,
          STDDEV_SAMP(val) AS sd,
          MIN(val) AS min_val,
          MAX(val) AS max_val
        FROM (SELECT ${naValExpr(this.column)} AS val FROM survey WHERE ${where}) sub
      `;
    }

    const result = await this.conn.query(sql);
    const row = result.toArray()[0];
    if (!row) return EMPTY_NA_STATS;
    return assembleStats(row);
  }

  private async queryStatsGrouped(
    groupByCol: string,
    codes: string[],
  ): Promise<Map<string, NaStats>> {
    const w = this.weightCol ? `"${esc(this.weightCol)}"` : "";
    let sql: string;
    // NOTE: MEDIAN is unweighted even in weighted mode
    if (this.weightCol) {
      sql = `
        SELECT
          "${esc(groupByCol)}" AS grp,
          COALESCE(SUM(${w}), 0) AS n,
          SUM(val * ${w}) / NULLIF(SUM(${w}), 0) AS mean,
          MEDIAN(val) AS median,
          STDDEV_SAMP(val) AS sd,
          MIN(val) AS min_val,
          MAX(val) AS max_val
        FROM (SELECT ${naValExpr(this.column)} AS val, ${w}, "${esc(groupByCol)}" FROM survey WHERE ${naWhereCond(this.column)} AND "${esc(groupByCol)}" IS NOT NULL) sub
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
        FROM (SELECT ${naValExpr(this.column)} AS val, "${esc(groupByCol)}" FROM survey WHERE ${naWhereCond(this.column)} AND "${esc(groupByCol)}" IS NOT NULL) sub
        GROUP BY "${esc(groupByCol)}"
      `;
    }

    const result = await this.conn.query(sql);
    const map = new Map<string, NaStats>();
    for (const code of codes) map.set(code, EMPTY_NA_STATS);
    for (const row of result.toArray()) {
      map.set(String(row.grp), assembleStats(row));
    }
    return map;
  }

  private async queryFreq(whereOverride?: string): Promise<ValueCount[]> {
    const where = whereOverride ?? naWhereCond(this.column);
    const countExpr = this.weightCol ? `SUM("${esc(this.weightCol)}")` : `COUNT(*)::DOUBLE`;
    const sql = `
      SELECT ${naValExpr(this.column)} AS val, ${countExpr} AS cnt
      FROM survey
      WHERE ${where}
      GROUP BY ${naValExpr(this.column)}
      ORDER BY val
    `;
    const result = await this.conn.query(sql);
    return result.toArray().map((r) => ({ value: Number(r.val), count: Number(r.cnt) }));
  }

  private async queryFreqGrouped(
    groupByCol: string,
    codes: string[],
  ): Promise<Map<string, ValueCount[]>> {
    const countExpr = this.weightCol ? `SUM("${esc(this.weightCol)}")` : `COUNT(*)::DOUBLE`;
    const sql = `
      SELECT ${naValExpr(this.column)} AS val, ${countExpr} AS cnt, "${esc(groupByCol)}" AS grp
      FROM survey
      WHERE ${naWhereCond(this.column)} AND "${esc(groupByCol)}" IS NOT NULL
      GROUP BY ${naValExpr(this.column)}, "${esc(groupByCol)}"
      ORDER BY val
    `;
    const result = await this.conn.query(sql);
    const map = new Map<string, ValueCount[]>();
    for (const code of codes) map.set(code, []);
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

  /** Union all value keys across slices, returning sorted codes and aligned cells per slice */
  private alignSlices(sliceData: { code: string; freq: ValueCount[]; stats: NaStats }[]): {
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
        return { count, pct: calcPct(count, s.stats.n) };
      });
      return { code: s.code, n: s.stats.n, cells, stats: s.stats };
    });

    return { codes, slices };
  }
}

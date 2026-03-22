/** NA (Numerical Answer) single tabulation */

import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { TabData, NaStats } from "./types";
import { calcPct } from "./types";
import { esc } from "./sqlHelpers";
import { type ValueCount, naValExpr, naWhereCond, assembleStats } from "./naHelpers";

export async function aggNaTab(
  conn: AsyncDuckDBConnection,
  column: string,
  weightCol: string,
): Promise<TabData> {
  return new NaTabAggregator(conn, column, weightCol).tab();
}

class NaTabAggregator {
  constructor(
    private conn: AsyncDuckDBConnection,
    private column: string,
    private weightCol: string,
  ) {}

  async tab(): Promise<TabData> {
    const stats = await this.queryStats();
    const freq = await this.queryFreq();
    const { codes, cells } = this.freqToCells(freq, stats.n);
    return { codes, slices: [{ code: null, n: stats.n, cells, stats }] };
  }

  private freqToCells(
    freq: ValueCount[],
    n: number,
  ): { codes: string[]; cells: import("./types").Cell[] } {
    const codes = freq.map((f) => String(f.value));
    const cells = freq.map((f) => ({
      count: f.count,
      pct: calcPct(f.count, n),
    }));
    return { codes, cells };
  }

  private async queryStats(): Promise<NaStats> {
    let sql: string;
    // NOTE: MEDIAN is unweighted even in weighted mode.
    // DuckDB has no built-in weighted median; a custom implementation may be added in the future.
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
        FROM (SELECT ${naValExpr(this.column)} AS val, ${w} FROM survey WHERE ${naWhereCond(this.column)}) sub
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
        FROM (SELECT ${naValExpr(this.column)} AS val FROM survey WHERE ${naWhereCond(this.column)}) sub
      `;
    }

    const result = await this.conn.query(sql);
    const row = result.toArray()[0];
    if (!row) return { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };
    return assembleStats(row);
  }

  private async queryFreq(): Promise<ValueCount[]> {
    const countExpr = this.weightCol ? `SUM("${esc(this.weightCol)}")` : `COUNT(*)::DOUBLE`;
    const sql = `
      SELECT ${naValExpr(this.column)} AS val, ${countExpr} AS cnt
      FROM survey
      WHERE ${naWhereCond(this.column)}
      GROUP BY ${naValExpr(this.column)}
      ORDER BY val
    `;
    const result = await this.conn.query(sql);
    return result.toArray().map((r) => ({ value: Number(r.val), count: Number(r.cnt) }));
  }
}

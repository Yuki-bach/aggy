/** Cross-tabulation aggregation — one cross axis at a time */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, Slice } from "./types";
import {
  esc,
  weightExpr,
  weightedCountExpr,
  maWeightedCountExpr,
  maShownCondition,
  maNoneSelectedCondition,
} from "./sqlHelpers";

export interface CrossHeader {
  headers: Array<{ code: string; n: number }>;
  crossValues: string[];
}

// ── Cross-header prefetching ──

export async function fetchCrossHeaders(
  conn: duckdb.AsyncDuckDBConnection,
  crossCols: Question[],
  weightCol: string,
): Promise<Map<string, CrossHeader>> {
  const cache = new Map<string, CrossHeader>();

  for (const crossQ of crossCols) {
    if (crossQ.type === "SA") {
      const col = crossQ.columns[0];
      const sql = `
        SELECT
          "${esc(col)}" AS cv,
          ${weightExpr(weightCol)} AS n
        FROM survey
        WHERE "${esc(col)}" IS NOT NULL
        GROUP BY "${esc(col)}"
      `;
      const result = await conn.query(sql);
      const headers = result.toArray().map((r) => ({ code: String(r.cv), n: Number(r.n) }));
      cache.set(crossQ.code, { headers, crossValues: headers.map((h) => h.code) });
    } else {
      const selectClauses = crossQ.columns.map(
        (col, i) => `${maWeightedCountExpr(col, weightCol)} AS c${i}`,
      );
      const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
      const result = await conn.query(sql);
      const row = result.toArray()[0];
      const headers = crossQ.codes.map((code, i) => ({
        code,
        n: Number(row[`c${i}`] ?? 0),
      }));
      cache.set(crossQ.code, { headers, crossValues: crossQ.codes });
    }
  }
  return cache;
}

// ── CrossAggregator ──

export class CrossAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private crossQ: Question,
    private crossHeader: CrossHeader,
  ) {}

  /** Cross-tabulate an SA main question against this cross axis.
   *  `codes` should match the Tally's codes (from GT discovery). */
  async aggregateSA(column: string, codes: string[]): Promise<Slice[]> {
    if (this.crossQ.type === "SA") {
      return this.saSA(column, codes);
    }
    return this.saMA(column, codes);
  }

  /** Cross-tabulate an MA main question against this cross axis */
  async aggregateMA(columns: string[], codes: string[]): Promise<Slice[]> {
    if (this.crossQ.type === "SA") {
      return this.maSA(columns, codes);
    }
    return this.maMA(columns, codes);
  }

  // ── SA main × SA cross ──

  private async saSA(column: string, codes: string[]): Promise<Slice[]> {
    const crossCol = this.crossQ.columns[0];
    const { crossValues, headers } = this.crossHeader;
    const wExpr = weightExpr(this.weightCol);

    const sql = `
      SELECT
        "${esc(column)}" AS mv,
        "${esc(crossCol)}" AS sv,
        ${wExpr} AS cnt,
        SUM(${wExpr}) OVER (PARTITION BY "${esc(crossCol)}") AS n,
        ${wExpr} * 100.0 / NULLIF(SUM(${wExpr}) OVER (PARTITION BY "${esc(crossCol)}"), 0) AS pct
      FROM survey
      WHERE "${esc(column)}" IS NOT NULL
        AND "${esc(crossCol)}" IS NOT NULL
      GROUP BY "${esc(column)}", "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const dataMap = new Map<string, Map<string, { count: number; pct: number }>>();
    for (const r of result.toArray()) {
      const sv = String(r.sv);
      if (!crossValues.includes(sv)) continue;
      let inner = dataMap.get(sv);
      if (!inner) {
        inner = new Map();
        dataMap.set(sv, inner);
      }
      inner.set(String(r.mv), { count: Number(r.cnt), pct: Number(r.pct ?? 0) });
    }

    return crossValues.map((cv, ci) => {
      const inner = dataMap.get(cv);
      const cells = codes.map((code) => {
        const entry = inner?.get(code);
        return entry ?? { count: 0, pct: 0 };
      });
      return { code: cv, n: headers[ci].n, cells };
    });
  }

  // ── SA main × MA cross ──

  private async saMA(column: string, codes: string[]): Promise<Slice[]> {
    const { headers } = this.crossHeader;

    const selectClauses = this.crossQ.columns.map(
      (maCol, i) => `${maWeightedCountExpr(maCol, this.weightCol)} AS c${i}`,
    );

    const sql = `
      SELECT
        "${esc(column)}" AS mv,
        ${selectClauses.join(", ")}
      FROM survey
      WHERE "${esc(column)}" IS NOT NULL
      GROUP BY "${esc(column)}"
    `;

    const result = await this.conn.query(sql);
    const rowData = new Map<string, number[]>();
    for (const r of result.toArray()) {
      const counts = this.crossQ.columns.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowData.set(String(r.mv), counts);
    }

    return this.crossQ.codes.map((crossCode, ci) => {
      const n = headers[ci].n;
      const cells = codes.map((code) => {
        const counts = rowData.get(code);
        const count = counts?.[ci] ?? 0;
        const pct = n > 0 ? (count / n) * 100 : 0;
        return { count, pct };
      });
      return { code: crossCode, n, cells };
    });
  }

  // ── MA main × SA cross ──

  private async maSA(columns: string[], _codes: string[]): Promise<Slice[]> {
    const crossCol = this.crossQ.columns[0];
    const { headers, crossValues } = this.crossHeader;

    const selectClauses = columns.map(
      (col, i) => `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`,
    );

    // No-answer count: shown but nothing selected
    const naCondition = `${maNoneSelectedCondition(columns)} AND (${maShownCondition(columns)})`;
    const naExpr = weightedCountExpr(naCondition, this.weightCol);

    const sql = `
      SELECT
        "${esc(crossCol)}" AS cv,
        ${selectClauses.join(", ")},
        ${naExpr} AS na_cnt
      FROM survey
      WHERE "${esc(crossCol)}" IS NOT NULL
      GROUP BY "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const rowMap = new Map<string, number[]>();
    const naMap = new Map<string, number>();
    for (const r of result.toArray()) {
      const counts = columns.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowMap.set(String(r.cv), counts);
      naMap.set(String(r.cv), Number(r.na_cnt ?? 0));
    }

    const hasNA = [...naMap.values()].some((v) => v > 0);
    return crossValues.map((cv, ci) => {
      const counts = rowMap.get(cv);
      const n = headers[ci].n;
      const cells = columns.map((_col, maIdx) => {
        const count = counts?.[maIdx] ?? 0;
        const pct = n > 0 ? (count / n) * 100 : 0;
        return { count, pct };
      });
      if (hasNA) {
        const naCount = naMap.get(cv) ?? 0;
        const naPct = n > 0 ? (naCount / n) * 100 : 0;
        cells.push({ count: naCount, pct: naPct });
      }
      return { code: cv, n, cells };
    });
  }

  // ── MA main × MA cross ──

  private async maMA(columns: string[], _codes: string[]): Promise<Slice[]> {
    const { headers } = this.crossHeader;

    const selectClauses: string[] = [];
    for (let r = 0; r < columns.length; r++) {
      for (let c = 0; c < this.crossQ.columns.length; c++) {
        const expr = this.weightCol
          ? `SUM("${esc(columns[r])}" * "${esc(this.crossQ.columns[c])}" * "${esc(this.weightCol)}")`
          : `SUM("${esc(columns[r])}" * "${esc(this.crossQ.columns[c])}")::DOUBLE`;
        selectClauses.push(`${expr} AS r${r}c${c}`);
      }
    }

    // No-answer × each cross MA column
    const naBase = `${maNoneSelectedCondition(columns)} AND (${maShownCondition(columns)})`;
    for (let c = 0; c < this.crossQ.columns.length; c++) {
      const naCondition = `${naBase} AND "${esc(this.crossQ.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(naCondition, this.weightCol)} AS na_c${c}`);
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const hasNA = this.crossQ.codes.some((_, c) => Number(row[`na_c${c}`] ?? 0) > 0);
    return this.crossQ.codes.map((crossCode, c) => {
      const n = headers[c].n;
      const cells = columns.map((_col, r) => {
        const count = Number(row[`r${r}c${c}`] ?? 0);
        const pct = n > 0 ? (count / n) * 100 : 0;
        return { count, pct };
      });
      if (hasNA) {
        const naCount = Number(row[`na_c${c}`] ?? 0);
        const naPct = n > 0 ? (naCount / n) * 100 : 0;
        cells.push({ count: naCount, pct: naPct });
      }
      return { code: crossCode, n, cells };
    });
  }
}

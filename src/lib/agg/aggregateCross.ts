/** Cross-tabulation aggregation — one cross axis at a time */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { AggResult, Question } from "./types";
import {
  esc,
  weightExpr,
  weightedCountExpr,
  maWeightedCountExpr,
  maShownCondition,
  maNoneSelectedCondition,
  NA_VALUE,
} from "./sqlHelpers";

export async function aggregateCross(
  conn: duckdb.AsyncDuckDBConnection,
  question: { type: string; columns: string[]; codes: string[] },
  by: Question,
  weightCol: string,
): Promise<AggResult> {
  const ca = new CrossAggregator(conn, weightCol, by);

  return question.type === "SA"
    ? ca.aggregateSA(question.columns[0], question.codes)
    : ca.aggregateMA(question.columns, question.codes);
}

class CrossAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private crossQ: Question,
  ) {}

  /** Cross-tabulate an SA main question against this cross axis.
   *  `codes` should match the Tally's codes (from GT discovery). */
  async aggregateSA(column: string, codes: string[]): Promise<AggResult> {
    if (this.crossQ.type === "SA") {
      return this.saSA(column, codes);
    }
    return this.saMA(column, codes);
  }

  /** Cross-tabulate an MA main question against this cross axis */
  async aggregateMA(columns: string[], codes: string[]): Promise<AggResult> {
    if (this.crossQ.type === "SA") {
      return this.maSA(columns, codes);
    }
    return this.maMA(columns, codes);
  }

  // ── SA main × SA cross ──

  private async saSA(column: string, codes: string[]): Promise<AggResult> {
    const crossCol = this.crossQ.columns[0];
    const crossValues = this.crossQ.codes;
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
    const nMap = new Map<string, number>();
    const dataMap = new Map<string, Map<string, { count: number; pct: number }>>();
    for (const r of result.toArray()) {
      const sv = String(r.sv);
      if (!crossValues.includes(sv)) continue;
      nMap.set(sv, Number(r.n));
      let inner = dataMap.get(sv);
      if (!inner) {
        inner = new Map();
        dataMap.set(sv, inner);
      }
      inner.set(String(r.mv), { count: Number(r.cnt), pct: Number(r.pct ?? 0) });
    }

    const slices = crossValues.map((cv) => {
      const inner = dataMap.get(cv);
      const cells = codes.map((code) => {
        const entry = inner?.get(code);
        return entry ?? { count: 0, pct: 0 };
      });
      return { code: cv, n: nMap.get(cv) ?? 0, cells };
    });
    return { codes, slices };
  }

  // ── SA main × MA cross ──

  private async saMA(column: string, codes: string[]): Promise<AggResult> {
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

    // n for each cross MA column = sum of that column across all main codes
    const nArr = this.crossQ.columns.map((_, ci) => {
      let total = 0;
      for (const counts of rowData.values()) total += counts[ci];
      return total;
    });

    const slices = this.crossQ.codes.map((crossCode, ci) => {
      const n = nArr[ci];
      const cells = codes.map((code) => {
        const counts = rowData.get(code);
        const count = counts?.[ci] ?? 0;
        const pct = n > 0 ? (count / n) * 100 : 0;
        return { count, pct };
      });
      return { code: crossCode, n, cells };
    });
    return { codes, slices };
  }

  // ── MA main × SA cross ──

  private async maSA(columns: string[], codes: string[]): Promise<AggResult> {
    const crossCol = this.crossQ.columns[0];
    const crossValues = this.crossQ.codes;
    const wExpr = weightExpr(this.weightCol);

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
        ${naExpr} AS na_cnt,
        ${wExpr} AS n
      FROM survey
      WHERE "${esc(crossCol)}" IS NOT NULL
        AND (${maShownCondition(columns)})
      GROUP BY "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const rowMap = new Map<string, number[]>();
    const naMap = new Map<string, number>();
    const nMap = new Map<string, number>();
    for (const r of result.toArray()) {
      const cv = String(r.cv);
      const counts = columns.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowMap.set(cv, counts);
      naMap.set(cv, Number(r.na_cnt ?? 0));
      nMap.set(cv, Number(r.n ?? 0));
    }

    const hasNA = [...naMap.values()].some((v) => v > 0);
    const resultCodes = hasNA ? [...codes, NA_VALUE] : codes;
    const slices = crossValues.map((cv) => {
      const counts = rowMap.get(cv);
      const n = nMap.get(cv) ?? 0;
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
    return { slices, codes: resultCodes };
  }

  // ── MA main × MA cross ──

  private async maMA(columns: string[], codes: string[]): Promise<AggResult> {
    const shownCond = maShownCondition(columns);

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
    const naBase = `${maNoneSelectedCondition(columns)} AND (${shownCond})`;
    for (let c = 0; c < this.crossQ.columns.length; c++) {
      const naCondition = `${naBase} AND "${esc(this.crossQ.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(naCondition, this.weightCol)} AS na_c${c}`);
    }

    // n for each cross MA column: cross col = 1 AND main shown
    for (let c = 0; c < this.crossQ.columns.length; c++) {
      const nCondition = `(${shownCond}) AND "${esc(this.crossQ.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(nCondition, this.weightCol)} AS n_c${c}`);
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const hasNA = this.crossQ.codes.some((_, c) => Number(row[`na_c${c}`] ?? 0) > 0);
    const resultCodes = hasNA ? [...codes, NA_VALUE] : codes;
    const slices = this.crossQ.codes.map((crossCode, c) => {
      const n = Number(row[`n_c${c}`] ?? 0);
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
    return { slices, codes: resultCodes };
  }
}

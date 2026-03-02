/** GT (Grand Total) aggregation — SA and MA */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { AggCells } from "./aggregate";
import {
  esc,
  weightExpr,
  weightedCountExpr,
  maWeightedCountExpr,
  maShownCondition,
  maNoneSelectedCondition,
  mkCell,
  NA_VALUE,
} from "./sqlHelpers";

export class GtAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
  ) {}

  async aggregateSA(col: string): Promise<AggCells> {
    const wExpr = weightExpr(this.weightCol);
    const sql = `
      SELECT
        "${esc(col)}" AS mv,
        ${wExpr} AS cnt,
        SUM(${wExpr}) OVER () AS n,
        ${wExpr} * 100.0 / NULLIF(SUM(${wExpr}) OVER (), 0) AS pct
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL
      GROUP BY "${esc(col)}"
    `;

    const result = await this.conn.query(sql);
    const cells = result
      .toArray()
      .map((r) => mkCell(String(r.mv), "GT", Number(r.cnt), Number(r.n), Number(r.pct ?? 0)));
    return { cells };
  }

  async aggregateMA(cols: string[]): Promise<AggCells> {
    const selectClauses = cols.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    // No-answer: shown but nothing selected
    const naExpr = weightedCountExpr(maNoneSelectedCondition(cols), this.weightCol);

    // questionN: number of respondents shown
    const nExpr = this.weightCol
      ? `COALESCE(SUM("${esc(this.weightCol)}"), 0)`
      : `COUNT(*)::DOUBLE`;

    const sql = `
      SELECT ${selectClauses.join(", ")}, ${naExpr} AS na_cnt, ${nExpr} AS question_n
      FROM survey
      WHERE ${maShownCondition(cols)}
    `;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const questionN = Number(row.question_n ?? 0);
    const cells = cols.map((col, i) => {
      const count = Number(row[`c${i}`] ?? 0);
      const pct = questionN > 0 ? (count / questionN) * 100 : 0;
      return mkCell(col, "GT", count, questionN, pct);
    });

    // No-answer row
    const naCount = Number(row.na_cnt ?? 0);
    const naPct = questionN > 0 ? (naCount / questionN) * 100 : 0;
    cells.push(mkCell(NA_VALUE, "GT", naCount, questionN, naPct));

    return { cells };
  }
}

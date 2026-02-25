/** GT (Grand Total) aggregation — SA and MA */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Cell } from "./aggregate";
import {
  esc,
  weightExpr,
  maWeightedCountExpr,
  maShownCondition,
  mkCell,
  NA_VALUE,
} from "./sqlHelpers";

export class GtAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
  ) {}

  async aggregateSA(col: string): Promise<{ cells: Cell[]; mainValues: string[] }> {
    const sql = `
      SELECT "${esc(col)}" AS mv, ${weightExpr(this.weightCol)} AS cnt
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL AND "${esc(col)}" != ''
      GROUP BY "${esc(col)}"
      ORDER BY TRY_CAST("${esc(col)}" AS DOUBLE) NULLS LAST, "${esc(col)}" ASC
    `;

    const result = await this.conn.query(sql);
    const rows = result.toArray();

    const questionN = rows.reduce((sum, r) => sum + Number(r.cnt), 0);
    const mainValues = rows.map((r) => String(r.mv));
    const cells: Cell[] = rows.map((r) => mkCell(String(r.mv), "GT", questionN, Number(r.cnt)));

    return { cells, mainValues };
  }

  async aggregateMA(cols: string[]): Promise<Cell[]> {
    const selectClauses = cols.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    // No-answer: shown but nothing selected
    const noneSelected = cols.map((c) => `"${esc(c)}" != '1'`).join(" AND ");
    const naExpr = this.weightCol
      ? `SUM(CASE WHEN ${noneSelected} THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
      : `COUNT(CASE WHEN ${noneSelected} THEN 1 END)::DOUBLE`;

    // questionN: number of respondents shown
    const nExpr = this.weightCol
      ? `COALESCE(SUM(TRY_CAST("${esc(this.weightCol)}" AS DOUBLE)), 0)`
      : `COUNT(*)::DOUBLE`;

    const sql = `
      SELECT ${selectClauses.join(", ")}, ${naExpr} AS na_cnt, ${nExpr} AS question_n
      FROM survey
      WHERE ${maShownCondition(cols)}
    `;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const questionN = Number(row.question_n ?? 0);
    const cells: Cell[] = cols.map((col, i) =>
      mkCell(col, "GT", questionN, Number(row[`c${i}`] ?? 0)),
    );

    // No-answer row
    cells.push(mkCell(NA_VALUE, "GT", questionN, Number(row.na_cnt ?? 0)));

    return cells;
  }
}

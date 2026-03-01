/** GT (Grand Total) aggregation — SA and MA */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Cell } from "./aggregate";
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

  async aggregateSA(col: string): Promise<Cell[]> {
    const sql = `
      SELECT "${esc(col)}" AS mv, ${weightExpr(this.weightCol)} AS cnt
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL
      GROUP BY "${esc(col)}"
    `;

    const result = await this.conn.query(sql);
    const rows = result.toArray();

    const questionN = rows.reduce((sum, r) => sum + Number(r.cnt), 0);
    return rows.map((r) => mkCell(String(r.mv), "GT", questionN, Number(r.cnt)));
  }

  async aggregateMA(cols: string[]): Promise<Cell[]> {
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
    const cells: Cell[] = cols.map((col, i) =>
      mkCell(col, "GT", questionN, Number(row[`c${i}`] ?? 0)),
    );

    // No-answer row
    cells.push(mkCell(NA_VALUE, "GT", questionN, Number(row.na_cnt ?? 0)));

    return cells;
  }
}

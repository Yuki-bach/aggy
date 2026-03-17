/** Tab (single tabulation) aggregation — SA and MA */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Shape, TabData } from "./types";
import {
  esc,
  weightExpr,
  weightedCountExpr,
  maWeightedCountExpr,
  maShownCondition,
  maNoneSelectedCondition,
} from "./sqlHelpers";
import { NO_ANSWER_VALUE } from "./constants";

export async function aggTab(
  conn: duckdb.AsyncDuckDBConnection,
  shape: Shape,
  weightCol: string,
): Promise<TabData> {
  const agg = new TabAggregator(conn, weightCol);
  return shape.type === "SA"
    ? agg.aggregateSA(shape.columns[0], shape.codes)
    : agg.aggregateMA(shape.columns, shape.codes);
}

class TabAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
  ) {}

  async aggregateSA(column: string, codes: string[]): Promise<TabData> {
    const wExpr = weightExpr(this.weightCol);
    const sql = `
      SELECT
        "${esc(column)}" AS mv,
        ${wExpr} AS cnt,
        SUM(${wExpr}) OVER () AS n,
        ${wExpr} * 100.0 / NULLIF(SUM(${wExpr}) OVER (), 0) AS pct
      FROM survey
      WHERE "${esc(column)}" IS NOT NULL
      GROUP BY "${esc(column)}"
    `;

    const result = await this.conn.query(sql);
    const cellByCode = new Map<string, { count: number; pct: number }>();
    let n = 0;
    for (const r of result.toArray()) {
      cellByCode.set(String(r.mv), { count: Number(r.cnt), pct: Number(r.pct ?? 0) });
      n = Number(r.n);
    }

    const cells = codes.map((code) => cellByCode.get(code) ?? { count: 0, pct: 0 });

    return { codes, slices: [{ code: null, n, cells }] };
  }

  async aggregateMA(columns: string[], codes: string[]): Promise<TabData> {
    const selectClauses = columns.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    const naExpr = weightedCountExpr(maNoneSelectedCondition(columns), this.weightCol);
    const nExpr = this.weightCol
      ? `COALESCE(SUM("${esc(this.weightCol)}"), 0)`
      : `COUNT(*)::DOUBLE`;

    const sql = `
      SELECT ${selectClauses.join(", ")}, ${naExpr} AS na_cnt, ${nExpr} AS question_n
      FROM survey
      WHERE ${maShownCondition(columns)}
    `;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const questionN = Number(row.question_n ?? 0);
    const cells = columns.map((_col, i) => {
      const count = Number(row[`c${i}`] ?? 0);
      const pct = questionN > 0 ? (count / questionN) * 100 : 0;
      return { count, pct };
    });

    // No-answer cell (only if any respondent selected none)
    const naCount = Number(row.na_cnt ?? 0);
    const resultCodes = [...codes];
    if (naCount > 0) {
      const naPct = questionN > 0 ? (naCount / questionN) * 100 : 0;
      cells.push({ count: naCount, pct: naPct });
      resultCodes.push(NO_ANSWER_VALUE);
    }

    return { codes: resultCodes, slices: [{ code: null, n: questionN, cells }] };
  }
}

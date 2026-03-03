/** GT (Grand Total) aggregation — SA and MA */

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

/** SA result includes discovered codes (DB values ordered by question.codes) */
export interface SASliceResult {
  slice: Slice;
  codes: string[];
}

export class GtAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
  ) {}

  async aggregateSA(question: Question): Promise<SASliceResult> {
    const col = question.columns[0];
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
    const rowMap = new Map<string, { count: number; pct: number }>();
    let n = 0;
    for (const r of result.toArray()) {
      rowMap.set(String(r.mv), { count: Number(r.cnt), pct: Number(r.pct ?? 0) });
      n = Number(r.n);
    }

    // Build codes: question.codes first (preserving order), then extra DB values
    const codes: string[] = [];
    const used = new Set<string>();
    for (const code of question.codes) {
      codes.push(code);
      used.add(code);
    }
    for (const mv of rowMap.keys()) {
      if (!used.has(mv)) {
        codes.push(mv);
      }
    }

    const cells = codes.map((code) => {
      const entry = rowMap.get(code);
      return entry ?? { count: 0, pct: 0 };
    });

    return { slice: { code: "GT", n, cells }, codes };
  }

  async aggregateMA(question: Question): Promise<Slice> {
    const cols = question.columns;
    const selectClauses = cols.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    const naExpr = weightedCountExpr(maNoneSelectedCondition(cols), this.weightCol);
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
    const cells = cols.map((_col, i) => {
      const count = Number(row[`c${i}`] ?? 0);
      const pct = questionN > 0 ? (count / questionN) * 100 : 0;
      return { count, pct };
    });

    // No-answer cell
    const naCount = Number(row.na_cnt ?? 0);
    const naPct = questionN > 0 ? (naCount / questionN) * 100 : 0;
    cells.push({ count: naCount, pct: naPct });

    return { code: "GT", n: questionN, cells };
  }
}

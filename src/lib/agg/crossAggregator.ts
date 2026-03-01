/** Cross-tabulation aggregation — one cross axis at a time */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Cell, QuestionDef, SAQuestion, MAQuestion } from "./aggregate";
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

export interface CrossHeader {
  headers: Array<{ label: string; n: number }>;
  crossValues: string[];
}

// ── Cross-header prefetching ──

export async function fetchCrossHeaders(
  conn: duckdb.AsyncDuckDBConnection,
  crossCols: QuestionDef[],
  weightCol: string,
): Promise<Map<string, CrossHeader>> {
  const cache = new Map<string, CrossHeader>();

  for (const crossQ of crossCols) {
    if (crossQ.type === "SA") {
      const col = crossQ.column;
      const sql = `
        SELECT
          "${esc(col)}" AS cv,
          ${weightExpr(weightCol)} AS n
        FROM survey
        WHERE "${esc(col)}" IS NOT NULL
        GROUP BY "${esc(col)}"
      `;
      const result = await conn.query(sql);
      const headers = result.toArray().map((r) => ({ label: String(r.cv), n: Number(r.n) }));
      cache.set(crossQ.column, { headers, crossValues: headers.map((h) => h.label) });
    } else {
      const selectClauses = crossQ.columns.map(
        (col, i) => `${maWeightedCountExpr(col, weightCol)} AS c${i}`,
      );
      const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
      const result = await conn.query(sql);
      const row = result.toArray()[0];
      const headers = crossQ.codes.map((code, i) => ({
        label: code,
        n: Number(row[`c${i}`] ?? 0),
      }));
      cache.set(crossQ.prefix, { headers, crossValues: headers.map((h) => h.label) });
    }
  }
  return cache;
}

// ── CrossAggregator ──

export class CrossAggregator {
  private crossKey: string;
  private crossCodes: string[] | undefined;

  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private crossQ: QuestionDef,
    private crossHeader: CrossHeader,
  ) {
    this.crossKey = crossQ.type === "SA" ? crossQ.column : crossQ.prefix;
    this.crossCodes = crossQ.type === "MA" ? crossQ.codes : undefined;
  }

  /** Cross-tabulate an SA main question against this cross axis */
  async aggregateSA(col: string, mainQ: string): Promise<Cell[]> {
    if (this.crossQ.type === "SA") {
      return this.saSA(col, mainQ, this.crossQ);
    }
    return this.saMA(col, mainQ, this.crossQ);
  }

  /** Cross-tabulate an MA main question against this cross axis */
  async aggregateMA(cols: string[], codes: string[], mainQ: string): Promise<Cell[]> {
    if (this.crossQ.type === "SA") {
      return this.maSA(cols, codes, mainQ, this.crossQ);
    }
    return this.maMA(cols, codes, mainQ, this.crossQ);
  }

  // ── SA main × SA cross ──

  private async saSA(col: string, mainQ: string, crossQ: SAQuestion): Promise<Cell[]> {
    const crossCol = crossQ.column;
    const { headers, crossValues } = this.crossHeader;

    const sql = `
      SELECT "${esc(col)}" AS mv, "${esc(crossCol)}" AS sv, ${weightExpr(this.weightCol)} AS cnt
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL
        AND "${esc(crossCol)}" IS NOT NULL
      GROUP BY "${esc(col)}", "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const cells: Cell[] = [];
    for (const r of result.toArray()) {
      const mv = String(r.mv);
      const sv = String(r.sv);
      const idx = crossValues.indexOf(sv);
      if (idx >= 0) {
        cells.push(mkCell({ [mainQ]: mv, [this.crossKey]: sv }, headers[idx].n, Number(r.cnt)));
      }
    }
    return cells;
  }

  // ── SA main × MA cross ──

  private async saMA(col: string, mainQ: string, crossQ: MAQuestion): Promise<Cell[]> {
    const { headers } = this.crossHeader;

    const selectClauses = crossQ.columns.map(
      (maCol, i) => `${maWeightedCountExpr(maCol, this.weightCol)} AS c${i}`,
    );

    const sql = `
      SELECT
        "${esc(col)}" AS mv,
        ${selectClauses.join(", ")}
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL
      GROUP BY "${esc(col)}"
    `;

    const result = await this.conn.query(sql);
    const cells: Cell[] = [];
    for (const r of result.toArray()) {
      const mv = String(r.mv);
      for (let i = 0; i < crossQ.codes.length; i++) {
        cells.push(
          mkCell(
            { [mainQ]: mv, [this.crossKey]: crossQ.codes[i] },
            headers[i].n,
            Number(r[`c${i}`] ?? 0),
          ),
        );
      }
    }
    return cells;
  }

  // ── MA main × SA cross ──

  private async maSA(
    maCols: string[],
    maCodes: string[],
    mainQ: string,
    crossQ: SAQuestion,
  ): Promise<Cell[]> {
    const crossCol = crossQ.column;
    const { headers, crossValues } = this.crossHeader;

    const selectClauses = maCols.map(
      (col, i) => `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`,
    );

    // No-answer count: shown but nothing selected
    const naCondition = `${maNoneSelectedCondition(maCols)} AND (${maShownCondition(maCols)})`;
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
      const counts = maCols.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowMap.set(String(r.cv), counts);
      naMap.set(String(r.cv), Number(r.na_cnt ?? 0));
    }

    const cells: Cell[] = [];
    for (let maIdx = 0; maIdx < maCodes.length; maIdx++) {
      for (let i = 0; i < crossValues.length; i++) {
        const counts = rowMap.get(crossValues[i]);
        cells.push(
          mkCell(
            { [mainQ]: maCodes[maIdx], [this.crossKey]: crossValues[i] },
            headers[i].n,
            counts?.[maIdx] ?? 0,
          ),
        );
      }
    }

    // No-answer cross cells
    for (let i = 0; i < crossValues.length; i++) {
      cells.push(
        mkCell(
          { [mainQ]: NA_VALUE, [this.crossKey]: crossValues[i] },
          headers[i].n,
          naMap.get(crossValues[i]) ?? 0,
        ),
      );
    }

    return cells;
  }

  // ── MA main × MA cross ──

  private async maMA(
    rowMaCols: string[],
    rowCodes: string[],
    mainQ: string,
    crossQ: MAQuestion,
  ): Promise<Cell[]> {
    const { headers } = this.crossHeader;

    const selectClauses: string[] = [];
    for (let r = 0; r < rowMaCols.length; r++) {
      for (let c = 0; c < crossQ.columns.length; c++) {
        const expr = this.weightCol
          ? `SUM("${esc(rowMaCols[r])}" * "${esc(crossQ.columns[c])}" * "${esc(this.weightCol)}")`
          : `SUM("${esc(rowMaCols[r])}" * "${esc(crossQ.columns[c])}")::DOUBLE`;
        selectClauses.push(`${expr} AS r${r}c${c}`);
      }
    }

    // No-answer × each cross MA column
    const naBase = `${maNoneSelectedCondition(rowMaCols)} AND (${maShownCondition(rowMaCols)})`;
    for (let c = 0; c < crossQ.columns.length; c++) {
      const naCondition = `${naBase} AND "${esc(crossQ.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(naCondition, this.weightCol)} AS na_c${c}`);
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const cells: Cell[] = [];
    for (let r = 0; r < rowCodes.length; r++) {
      for (let c = 0; c < crossQ.codes.length; c++) {
        cells.push(
          mkCell(
            { [mainQ]: rowCodes[r], [this.crossKey]: crossQ.codes[c] },
            headers[c].n,
            Number(row[`r${r}c${c}`] ?? 0),
          ),
        );
      }
    }

    // No-answer cross cells
    for (let c = 0; c < crossQ.codes.length; c++) {
      cells.push(
        mkCell(
          { [mainQ]: NA_VALUE, [this.crossKey]: crossQ.codes[c] },
          headers[c].n,
          Number(row[`na_c${c}`] ?? 0),
        ),
      );
    }

    return cells;
  }
}

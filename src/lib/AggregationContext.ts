/** 集計コンテキストクラス - 1回の集計実行に必要な共有状態を束ねる */

import type * as duckdb from "@duckdb/duckdb-wasm";
import {
  type Cell,
  type AggResult,
  type QuestionDef,
  type CrossHeaderCache,
  questionKey,
  esc,
  weightExpr,
  maWeightedCountExpr,
} from "./aggregator";

function mkCell(main: string, sub: string, n: number, count: number): Cell {
  return { main, sub, n, count, pct: n > 0 ? (count / n) * 100 : 0 };
}

export class AggregationContext {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private totalN: number,
    private crossCols: QuestionDef[],
    private crossHeaderCache: CrossHeaderCache,
  ) {}

  async aggregateSA(col: string): Promise<AggResult> {
    const sql = `
      SELECT
        "${esc(col)}" AS label,
        ${weightExpr(this.weightCol)} AS cnt
      FROM survey
      WHERE "${esc(col)}" IS NOT NULL
        AND "${esc(col)}" != ''
      GROUP BY "${esc(col)}"
      ORDER BY
        TRY_CAST("${esc(col)}" AS DOUBLE) NULLS LAST,
        "${esc(col)}" ASC
    `;

    const arrowResult = await this.conn.query(sql);
    const rowArr = arrowResult.toArray();

    // GT セル
    const cells: Cell[] = rowArr.map((r) =>
      mkCell(String(r.label), "GT", this.totalN, Number(r.cnt))
    );

    // クロスセル
    if (this.crossCols.length > 0) {
      const mainValues = rowArr.map((r) => String(r.label));
      for (const crossQ of this.crossCols) {
        const cached = this.crossHeaderCache.get(questionKey(crossQ))!;
        if (crossQ.type === "SA") {
          cells.push(...await this.buildCrossCellsSA(col, mainValues, crossQ.column, cached));
        } else {
          cells.push(...await this.buildCrossCellsMA(col, mainValues, crossQ.columns, cached));
        }
      }
    }

    return { question: col, type: "SA", cells };
  }

  async aggregateMA(prefix: string, cols: string[]): Promise<AggResult> {
    const selectClauses = cols.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const cells: Cell[] = cols.map((col, i) =>
      mkCell(col, "GT", this.totalN, Number(row[`c${i}`] ?? 0))
    );

    // クロスセル
    if (this.crossCols.length > 0) {
      for (const crossQ of this.crossCols) {
        const cached = this.crossHeaderCache.get(questionKey(crossQ))!;
        if (crossQ.type === "SA") {
          cells.push(...await this.buildMACrossCellsSA(cols, crossQ.column, cached));
        } else {
          cells.push(...await this.buildMACrossCellsMA(cols, crossQ.columns, cached));
        }
      }
    }

    return { question: prefix, type: "MA", cells };
  }

  /** SA主軸 × SA軸クロスセル生成 */
  private async buildCrossCellsSA(
    mainCol: string,
    mainValues: string[],
    crossCol: string,
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
  ): Promise<Cell[]> {
    const { headers, crossValues } = cached;

    const cellSQL = `
      SELECT
        "${esc(mainCol)}" AS mv,
        "${esc(crossCol)}" AS sv,
        ${weightExpr(this.weightCol)} AS cnt
      FROM survey
      WHERE "${esc(mainCol)}" IS NOT NULL
        AND "${esc(mainCol)}" != ''
        AND "${esc(crossCol)}" IS NOT NULL
        AND "${esc(crossCol)}" != ''
      GROUP BY "${esc(mainCol)}", "${esc(crossCol)}"
    `;

    const cellResult = await this.conn.query(cellSQL);
    const cellMap = new Map<string, number>();
    for (const r of cellResult.toArray()) {
      cellMap.set(`${r.mv}\0${r.sv}`, Number(r.cnt));
    }

    const cells: Cell[] = [];
    for (const mv of mainValues) {
      for (let i = 0; i < crossValues.length; i++) {
        const sv = crossValues[i];
        cells.push(mkCell(mv, sv, headers[i].n, cellMap.get(`${mv}\0${sv}`) ?? 0));
      }
    }

    return cells;
  }

  /** SA主軸 × MA軸クロスセル生成 */
  private async buildCrossCellsMA(
    mainCol: string,
    mainValues: string[],
    maCols: string[],
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
  ): Promise<Cell[]> {
    const { headers } = cached;

    const selectClauses = maCols.map((maCol, i) =>
      `${maWeightedCountExpr(maCol, this.weightCol)} AS c${i}`
    );

    const sql = `
      SELECT
        "${esc(mainCol)}" AS mv,
        ${selectClauses.join(", ")}
      FROM survey
      WHERE "${esc(mainCol)}" IS NOT NULL
        AND "${esc(mainCol)}" != ''
      GROUP BY "${esc(mainCol)}"
    `;

    const result = await this.conn.query(sql);
    const rowMap = new Map<string, Record<string, number>>();
    for (const r of result.toArray()) {
      const counts: Record<string, number> = {};
      maCols.forEach((_, i) => { counts[`c${i}`] = Number(r[`c${i}`] ?? 0); });
      rowMap.set(String(r.mv), counts);
    }

    const cells: Cell[] = [];
    for (const mv of mainValues) {
      const counts = rowMap.get(mv);
      for (let i = 0; i < maCols.length; i++) {
        cells.push(mkCell(mv, maCols[i], headers[i].n, counts?.[`c${i}`] ?? 0));
      }
    }

    return cells;
  }

  /** MA主軸 × SA軸クロスセル生成 */
  private async buildMACrossCellsSA(
    maCols: string[],
    crossCol: string,
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
  ): Promise<Cell[]> {
    const { headers, crossValues } = cached;

    const selectClauses = maCols.map((col, i) =>
      `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`
    );

    const sql = `
      SELECT
        "${esc(crossCol)}" AS cv,
        ${selectClauses.join(", ")}
      FROM survey
      WHERE "${esc(crossCol)}" IS NOT NULL
        AND "${esc(crossCol)}" != ''
      GROUP BY "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const rowMap = new Map<string, number[]>();
    for (const r of result.toArray()) {
      const counts = maCols.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowMap.set(String(r.cv), counts);
    }

    const cells: Cell[] = [];
    for (let maIdx = 0; maIdx < maCols.length; maIdx++) {
      for (let i = 0; i < crossValues.length; i++) {
        const counts = rowMap.get(crossValues[i]);
        cells.push(mkCell(maCols[maIdx], crossValues[i], headers[i].n, counts?.[maIdx] ?? 0));
      }
    }

    return cells;
  }

  /** MA主軸 × MA軸クロスセル生成 */
  private async buildMACrossCellsMA(
    rowMaCols: string[],
    crossMaCols: string[],
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] }
  ): Promise<Cell[]> {
    const { headers } = cached;

    const selectClauses: string[] = [];
    for (let r = 0; r < rowMaCols.length; r++) {
      for (let c = 0; c < crossMaCols.length; c++) {
        const expr = this.weightCol
          ? `SUM(CASE WHEN "${esc(rowMaCols[r])}" IN ('1','true') AND "${esc(crossMaCols[c])}" IN ('1','true') THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
          : `COUNT(CASE WHEN "${esc(rowMaCols[r])}" IN ('1','true') AND "${esc(crossMaCols[c])}" IN ('1','true') THEN 1 END)::DOUBLE`;
        selectClauses.push(`${expr} AS r${r}c${c}`);
      }
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const cells: Cell[] = [];
    for (let r = 0; r < rowMaCols.length; r++) {
      for (let c = 0; c < crossMaCols.length; c++) {
        cells.push(mkCell(rowMaCols[r], crossMaCols[c], headers[c].n, Number(row[`r${r}c${c}`] ?? 0)));
      }
    }

    return cells;
  }
}

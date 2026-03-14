/** Cross-tabulation aggregation — one cross axis at a time */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Shape, AggOutput } from "./types";
import {
  esc,
  weightExpr,
  weightedCountExpr,
  maWeightedCountExpr,
  maShownCondition,
  maNoneSelectedCondition,
} from "./sqlHelpers";
import { NO_ANSWER_VALUE } from "./constants";

type CrossSliceData = {
  code: string;
  n: number;
  counts: number[];
};

export async function aggCrossTab(
  conn: duckdb.AsyncDuckDBConnection,
  shape: Shape,
  axisShape: Shape,
  weightCol: string,
): Promise<AggOutput> {
  const ca = new CrossTabAggregator(conn, weightCol, axisShape);
  const isMainSa = shape.type === "SA";
  const isCrossSa = axisShape.type === "SA";

  if (isMainSa && isCrossSa) return ca.saSA(shape.columns[0], shape.codes);
  if (isMainSa && !isCrossSa) return ca.saMA(shape.columns[0], shape.codes);
  if (!isMainSa && isCrossSa) return ca.maSA(shape.columns, shape.codes);
  return ca.maMA(shape.columns, shape.codes);
}

class CrossTabAggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private axisShape: Shape,
  ) {}

  // ── SA main × SA cross ──

  async saSA(column: string, codes: string[]): Promise<AggOutput> {
    const crossCol = this.axisShape.columns[0];
    const crossValues = this.axisShape.codes;
    const wExpr = weightExpr(this.weightCol);

    const sql = `
      SELECT
        "${esc(column)}" AS mv,
        "${esc(crossCol)}" AS sv,
        ${wExpr} AS cnt,
        SUM(${wExpr}) OVER (PARTITION BY "${esc(crossCol)}") AS n
      FROM survey
      WHERE "${esc(column)}" IS NOT NULL
        AND "${esc(crossCol)}" IS NOT NULL
      GROUP BY "${esc(column)}", "${esc(crossCol)}"
    `;

    const result = await this.conn.query(sql);
    const nMap = new Map<string, number>();
    const countMap = new Map<string, Map<string, number>>();
    for (const r of result.toArray()) {
      const sv = String(r.sv);
      if (!crossValues.includes(sv)) continue;
      nMap.set(sv, Number(r.n));
      let inner = countMap.get(sv);
      if (!inner) {
        inner = new Map();
        countMap.set(sv, inner);
      }
      inner.set(String(r.mv), Number(r.cnt));
    }

    const data: CrossSliceData[] = crossValues.map((cv) => {
      const inner = countMap.get(cv);
      return {
        code: cv,
        n: nMap.get(cv) ?? 0,
        counts: codes.map((code) => inner?.get(code) ?? 0),
      };
    });
    return this.buildSlices(data, codes);
  }

  // ── SA main × MA cross ──

  async saMA(column: string, codes: string[]): Promise<AggOutput> {
    const selectClauses = this.axisShape.columns.map(
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
      const counts = this.axisShape.columns.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowData.set(String(r.mv), counts);
    }

    // n for each cross MA column = sum of that column across all main codes
    const nArr = this.axisShape.columns.map((_, ci) => {
      let total = 0;
      for (const counts of rowData.values()) total += counts[ci];
      return total;
    });

    const data: CrossSliceData[] = this.axisShape.codes.map((crossCode, ci) => ({
      code: crossCode,
      n: nArr[ci],
      counts: codes.map((code) => rowData.get(code)?.[ci] ?? 0),
    }));
    return this.buildSlices(data, codes);
  }

  // ── MA main × SA cross ──

  async maSA(columns: string[], codes: string[]): Promise<AggOutput> {
    const crossCol = this.axisShape.columns[0];
    const crossValues = this.axisShape.codes;
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
    const noAnswerMap = new Map<string, number>();
    const nMap = new Map<string, number>();
    for (const r of result.toArray()) {
      const cv = String(r.cv);
      const counts = columns.map((_, i) => Number(r[`c${i}`] ?? 0));
      rowMap.set(cv, counts);
      noAnswerMap.set(cv, Number(r.na_cnt ?? 0));
      nMap.set(cv, Number(r.n ?? 0));
    }

    const hasNoAnswer = [...noAnswerMap.values()].some((v) => v > 0);
    const resultCodes = hasNoAnswer ? [...codes, NO_ANSWER_VALUE] : codes;
    const data: CrossSliceData[] = crossValues.map((cv) => {
      const rowCounts = rowMap.get(cv);
      const counts = columns.map((_col, maIdx) => rowCounts?.[maIdx] ?? 0);
      if (hasNoAnswer) counts.push(noAnswerMap.get(cv) ?? 0);
      return { code: cv, n: nMap.get(cv) ?? 0, counts };
    });
    return this.buildSlices(data, resultCodes);
  }

  // ── shared slice builder ──

  private buildSlices(data: CrossSliceData[], codes: string[]): AggOutput {
    const slices = data.map(({ code, n, counts }) => ({
      code,
      n,
      cells: counts.map((count) => ({
        count,
        pct: n > 0 ? (count / n) * 100 : 0,
      })),
    }));
    return { codes, slices };
  }

  // ── MA main × MA cross ──

  async maMA(columns: string[], codes: string[]): Promise<AggOutput> {
    const shownCond = maShownCondition(columns);

    const selectClauses: string[] = [];
    for (let r = 0; r < columns.length; r++) {
      for (let c = 0; c < this.axisShape.columns.length; c++) {
        const expr = this.weightCol
          ? `SUM("${esc(columns[r])}" * "${esc(this.axisShape.columns[c])}" * "${esc(this.weightCol)}")`
          : `SUM("${esc(columns[r])}" * "${esc(this.axisShape.columns[c])}")::DOUBLE`;
        selectClauses.push(`${expr} AS r${r}c${c}`);
      }
    }

    // No-answer × each cross MA column
    const naBase = `${maNoneSelectedCondition(columns)} AND (${shownCond})`;
    for (let c = 0; c < this.axisShape.columns.length; c++) {
      const naCondition = `${naBase} AND "${esc(this.axisShape.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(naCondition, this.weightCol)} AS na_c${c}`);
    }

    // n for each cross MA column: cross col = 1 AND main shown
    for (let c = 0; c < this.axisShape.columns.length; c++) {
      const nCondition = `(${shownCond}) AND "${esc(this.axisShape.columns[c])}" = 1`;
      selectClauses.push(`${weightedCountExpr(nCondition, this.weightCol)} AS n_c${c}`);
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const hasNoAnswer = this.axisShape.codes.some((_, c) => Number(row[`na_c${c}`] ?? 0) > 0);
    const resultCodes = hasNoAnswer ? [...codes, NO_ANSWER_VALUE] : codes;
    const data: CrossSliceData[] = this.axisShape.codes.map((crossCode, c) => {
      const counts = columns.map((_col, r) => Number(row[`r${r}c${c}`] ?? 0));
      if (hasNoAnswer) counts.push(Number(row[`na_c${c}`] ?? 0));
      return { code: crossCode, n: Number(row[`n_c${c}`] ?? 0), counts };
    });
    return this.buildSlices(data, resultCodes);
  }
}

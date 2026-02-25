/** 集計エンジン - SQL生成・実行の全責務を担う */

import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Cell, AggResult, QuestionDef } from "./aggregate";
import { questionKey, crossSub } from "./aggregate";

// --- SQL ヘルパー ---

function esc(name: string): string {
  return name.replace(/"/g, '""');
}

function weightExpr(weightCol: string): string {
  return weightCol ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))` : `COUNT(*)::DOUBLE`;
}

function maWeightedCountExpr(maCol: string, weightCol: string): string {
  return weightCol
    ? `SUM(CASE WHEN "${esc(maCol)}" = '1' THEN TRY_CAST("${esc(weightCol)}" AS DOUBLE) ELSE 0 END)`
    : `COUNT(CASE WHEN "${esc(maCol)}" = '1' THEN 1 END)::DOUBLE`;
}

/** MA設問の「表示された」条件: いずれかのサブカラムが空でない */
function maShownCondition(cols: string[]): string {
  return cols.map((c) => `("${esc(c)}" IS NOT NULL AND "${esc(c)}" != '')`).join(" OR ");
}

/** 無回答マーカー */
export const NA_VALUE = "N/A";

function mkCell(main: string, sub: string, n: number, count: number): Cell {
  return { main, sub, n, count, pct: n > 0 ? (count / n) * 100 : 0 };
}

// --- クロスヘッダーキャッシュ ---

type CrossHeaderCache = Map<
  string,
  { headers: Array<{ label: string; n: number }>; crossValues: string[] }
>;

// --- 集計コンテキスト ---

export class Aggregator {
  constructor(
    private conn: duckdb.AsyncDuckDBConnection,
    private weightCol: string,
    private crossCols: QuestionDef[],
    private crossHeaderCache: CrossHeaderCache,
  ) {}

  async aggregateSA(col: string): Promise<AggResult> {
    // クロス軸を SA / MA に分離（CTE統合は SA×SA のみ）
    const saCross = this.crossCols.filter((q) => q.type === "SA") as Array<{
      type: "SA";
      column: string;
    }>;
    const maCross = this.crossCols.filter((q) => q.type === "MA") as Array<{
      type: "MA";
      prefix: string;
      columns: string[];
    }>;

    // CTE: GT + 全SA×SAクロスを1クエリで取得
    const GT_SENTINEL = "__GT__";
    let inner = `
    SELECT "${esc(col)}" AS mv, '${GT_SENTINEL}' AS sv, ${weightExpr(this.weightCol)} AS cnt
    FROM base GROUP BY "${esc(col)}"`;

    for (const crossQ of saCross) {
      inner += `
    UNION ALL
    SELECT "${esc(col)}" AS mv, "${esc(crossQ.column)}" AS sv, ${weightExpr(this.weightCol)} AS cnt
    FROM base
    WHERE "${esc(crossQ.column)}" IS NOT NULL AND "${esc(crossQ.column)}" != ''
    GROUP BY "${esc(col)}", "${esc(crossQ.column)}"`;
    }

    const sql = `WITH base AS (
      SELECT * FROM survey
      WHERE "${esc(col)}" IS NOT NULL AND "${esc(col)}" != ''
    )
    SELECT * FROM (${inner}
    ) AS combined
    ORDER BY sv, TRY_CAST(mv AS DOUBLE) NULLS LAST, mv ASC`;

    const arrowResult = await this.conn.query(sql);
    const allRows = arrowResult.toArray();

    // sv ごとに行を仕分け
    const gtRows: Array<{ mv: string; cnt: number }> = [];
    const crossBuckets = new Map<string, Map<string, number>>();

    for (const r of allRows) {
      const sv = String(r.sv);
      const mv = String(r.mv);
      const cnt = Number(r.cnt);
      if (sv === GT_SENTINEL) {
        gtRows.push({ mv, cnt });
      } else {
        let bucket = crossBuckets.get(sv);
        if (!bucket) {
          bucket = new Map();
          crossBuckets.set(sv, bucket);
        }
        bucket.set(mv, cnt);
      }
    }

    // GT セル
    const questionN = gtRows.reduce((sum, r) => sum + r.cnt, 0);
    const mainValues = gtRows.map((r) => r.mv);
    const cells: Cell[] = gtRows.map((r) => mkCell(r.mv, "GT", questionN, r.cnt));

    // SA×SA クロスセル
    for (const crossQ of saCross) {
      const cached = this.crossHeaderCache.get(crossQ.column)!;
      const { headers, crossValues } = cached;
      const bucket = crossBuckets;
      for (const mv of mainValues) {
        for (let i = 0; i < crossValues.length; i++) {
          const sv = crossValues[i];
          const cnt = bucket.get(sv)?.get(mv) ?? 0;
          cells.push(mkCell(mv, crossSub(crossQ.column, sv), headers[i].n, cnt));
        }
      }
    }

    // SA×MA クロスセル（構造が異なるため個別クエリ維持）
    for (const crossQ of maCross) {
      const cached = this.crossHeaderCache.get(crossQ.prefix)!;
      cells.push(
        ...(await this.buildCrossCellsMA(col, mainValues, crossQ.prefix, crossQ.columns, cached)),
      );
    }

    return { question: col, type: "SA", cells };
  }

  async aggregateMA(prefix: string, cols: string[]): Promise<AggResult> {
    const selectClauses = cols.map((col, i) => {
      return `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`;
    });

    // 無回答式: 表示されたが何も選択していない
    const noneSelected = cols.map((c) => `"${esc(c)}" != '1'`).join(" AND ");
    const naExpr = this.weightCol
      ? `SUM(CASE WHEN ${noneSelected} THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
      : `COUNT(CASE WHEN ${noneSelected} THEN 1 END)::DOUBLE`;

    // questionN 式: 表示された人数
    const nExpr = this.weightCol
      ? `COALESCE(SUM(TRY_CAST("${esc(this.weightCol)}" AS DOUBLE)), 0)`
      : `COUNT(*)::DOUBLE`;

    // 回答対象外を除外し、naCount・questionN もまとめて取得
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

    // 無回答行
    cells.push(mkCell(NA_VALUE, "GT", questionN, Number(row.na_cnt ?? 0)));

    // クロスセル
    if (this.crossCols.length > 0) {
      for (const crossQ of this.crossCols) {
        const cached = this.crossHeaderCache.get(questionKey(crossQ))!;
        if (crossQ.type === "SA") {
          cells.push(...(await this.buildMACrossCellsSA(cols, crossQ.column, cached)));
        } else {
          cells.push(
            ...(await this.buildMACrossCellsMA(cols, crossQ.prefix, crossQ.columns, cached)),
          );
        }
      }
    }

    return { question: prefix, type: "MA", cells };
  }

  /** SA主軸 × MA軸クロスセル生成 */
  private async buildCrossCellsMA(
    mainCol: string,
    mainValues: string[],
    maPrefix: string,
    maCols: string[],
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] },
  ): Promise<Cell[]> {
    const { headers } = cached;

    const selectClauses = maCols.map(
      (maCol, i) => `${maWeightedCountExpr(maCol, this.weightCol)} AS c${i}`,
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
      maCols.forEach((_, i) => {
        counts[`c${i}`] = Number(r[`c${i}`] ?? 0);
      });
      rowMap.set(String(r.mv), counts);
    }

    const cells: Cell[] = [];
    for (const mv of mainValues) {
      const counts = rowMap.get(mv);
      for (let i = 0; i < maCols.length; i++) {
        cells.push(mkCell(mv, crossSub(maPrefix, maCols[i]), headers[i].n, counts?.[`c${i}`] ?? 0));
      }
    }

    return cells;
  }

  /** MA主軸 × SA軸クロスセル生成 */
  private async buildMACrossCellsSA(
    maCols: string[],
    crossCol: string,
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] },
  ): Promise<Cell[]> {
    const { headers, crossValues } = cached;

    const selectClauses = maCols.map(
      (col, i) => `${maWeightedCountExpr(col, this.weightCol)} AS c${i}`,
    );

    // 無回答カウント: 表示されたが何も選択していない
    const naCondition = `${maCols.map((c) => `"${esc(c)}" != '1'`).join(" AND ")} AND (${maShownCondition(maCols)})`;
    const naExpr = this.weightCol
      ? `SUM(CASE WHEN ${naCondition} THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
      : `COUNT(CASE WHEN ${naCondition} THEN 1 END)::DOUBLE`;

    const sql = `
      SELECT
        "${esc(crossCol)}" AS cv,
        ${selectClauses.join(", ")},
        ${naExpr} AS na_cnt
      FROM survey
      WHERE "${esc(crossCol)}" IS NOT NULL
        AND "${esc(crossCol)}" != ''
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
    for (let maIdx = 0; maIdx < maCols.length; maIdx++) {
      for (let i = 0; i < crossValues.length; i++) {
        const counts = rowMap.get(crossValues[i]);
        cells.push(
          mkCell(
            maCols[maIdx],
            crossSub(crossCol, crossValues[i]),
            headers[i].n,
            counts?.[maIdx] ?? 0,
          ),
        );
      }
    }

    // 無回答クロスセル
    for (let i = 0; i < crossValues.length; i++) {
      cells.push(
        mkCell(
          NA_VALUE,
          crossSub(crossCol, crossValues[i]),
          headers[i].n,
          naMap.get(crossValues[i]) ?? 0,
        ),
      );
    }

    return cells;
  }

  /** MA主軸 × MA軸クロスセル生成 */
  private async buildMACrossCellsMA(
    rowMaCols: string[],
    crossMaPrefix: string,
    crossMaCols: string[],
    cached: { headers: Array<{ label: string; n: number }>; crossValues: string[] },
  ): Promise<Cell[]> {
    const { headers } = cached;

    const selectClauses: string[] = [];
    for (let r = 0; r < rowMaCols.length; r++) {
      for (let c = 0; c < crossMaCols.length; c++) {
        const cond = `"${esc(rowMaCols[r])}" = '1' AND "${esc(crossMaCols[c])}" = '1'`;
        const expr = this.weightCol
          ? `SUM(CASE WHEN ${cond} THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
          : `COUNT(CASE WHEN ${cond} THEN 1 END)::DOUBLE`;
        selectClauses.push(`${expr} AS r${r}c${c}`);
      }
    }

    // 無回答 × 各クロスMAカラム
    const naBase = `${rowMaCols.map((col) => `"${esc(col)}" != '1'`).join(" AND ")} AND (${maShownCondition(rowMaCols)})`;
    for (let c = 0; c < crossMaCols.length; c++) {
      const naCondition = `${naBase} AND "${esc(crossMaCols[c])}" = '1'`;
      const expr = this.weightCol
        ? `SUM(CASE WHEN ${naCondition} THEN TRY_CAST("${esc(this.weightCol)}" AS DOUBLE) ELSE 0 END)`
        : `COUNT(CASE WHEN ${naCondition} THEN 1 END)::DOUBLE`;
      selectClauses.push(`${expr} AS na_c${c}`);
    }

    const sql = `SELECT ${selectClauses.join(", ")} FROM survey`;
    const result = await this.conn.query(sql);
    const row = result.toArray()[0];

    const cells: Cell[] = [];
    for (let r = 0; r < rowMaCols.length; r++) {
      for (let c = 0; c < crossMaCols.length; c++) {
        cells.push(
          mkCell(
            rowMaCols[r],
            crossSub(crossMaPrefix, crossMaCols[c]),
            headers[c].n,
            Number(row[`r${r}c${c}`] ?? 0),
          ),
        );
      }
    }

    // 無回答クロスセル
    for (let c = 0; c < crossMaCols.length; c++) {
      cells.push(
        mkCell(
          NA_VALUE,
          crossSub(crossMaPrefix, crossMaCols[c]),
          headers[c].n,
          Number(row[`na_c${c}`] ?? 0),
        ),
      );
    }

    return cells;
  }
}

// --- 前処理（static create から利用） ---

export async function fetchCrossHeaders(
  conn: duckdb.AsyncDuckDBConnection,
  crossCols: QuestionDef[],
  weightCol: string,
): Promise<CrossHeaderCache> {
  const cache: CrossHeaderCache = new Map();

  for (const crossQ of crossCols) {
    if (crossQ.type === "SA") {
      const col = crossQ.column;
      const sql = `
        SELECT
          "${esc(col)}" AS cv,
          ${weightExpr(weightCol)} AS n
        FROM survey
        WHERE "${esc(col)}" IS NOT NULL
          AND "${esc(col)}" != ''
        GROUP BY "${esc(col)}"
        ORDER BY
          TRY_CAST("${esc(col)}" AS DOUBLE) NULLS LAST,
          "${esc(col)}" ASC
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
      const headers = crossQ.columns.map((col, i) => ({
        label: col,
        n: Number(row[`c${i}`] ?? 0),
      }));
      cache.set(crossQ.prefix, { headers, crossValues: headers.map((h) => h.label) });
    }
  }
  return cache;
}

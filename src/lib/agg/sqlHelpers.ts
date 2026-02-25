/** Shared SQL helpers and constants for aggregation */

import type { Cell } from "./aggregate";

export function esc(name: string): string {
  return name.replace(/"/g, '""');
}

export function weightExpr(weightCol: string): string {
  return weightCol ? `SUM(TRY_CAST("${esc(weightCol)}" AS DOUBLE))` : `COUNT(*)::DOUBLE`;
}

export function maWeightedCountExpr(maCol: string, weightCol: string): string {
  return weightCol
    ? `SUM(CASE WHEN "${esc(maCol)}" = '1' THEN TRY_CAST("${esc(weightCol)}" AS DOUBLE) ELSE 0 END)`
    : `COUNT(CASE WHEN "${esc(maCol)}" = '1' THEN 1 END)::DOUBLE`;
}

/** MA "shown" condition: at least one sub-column is non-empty */
export function maShownCondition(cols: string[]): string {
  return cols.map((c) => `("${esc(c)}" IS NOT NULL AND "${esc(c)}" != '')`).join(" OR ");
}

export function mkCell(main: string, sub: string, n: number, count: number): Cell {
  return { main, sub, n, count, pct: n > 0 ? (count / n) * 100 : 0 };
}

/** No-answer marker */
export const NA_VALUE = "N/A";

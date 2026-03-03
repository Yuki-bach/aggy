/** Shared SQL helpers and constants for aggregation */

export function esc(name: string): string {
  return name.replace(/"/g, '""');
}

export function weightExpr(weightCol: string): string {
  return weightCol ? `SUM("${esc(weightCol)}")` : `COUNT(*)::DOUBLE`;
}

export function maWeightedCountExpr(maCol: string, weightCol: string): string {
  return weightCol ? `SUM("${esc(maCol)}" * "${esc(weightCol)}")` : `SUM("${esc(maCol)}")::DOUBLE`;
}

/** MA "shown" condition: at least one sub-column is non-NULL */
export function maShownCondition(cols: string[]): string {
  return cols.map((c) => `"${esc(c)}" IS NOT NULL`).join(" OR ");
}

/** Weighted count expression with a CASE WHEN condition */
export function weightedCountExpr(condition: string, weightCol: string): string {
  return weightCol
    ? `SUM(CASE WHEN ${condition} THEN "${esc(weightCol)}" ELSE 0 END)`
    : `COUNT(CASE WHEN ${condition} THEN 1 END)::DOUBLE`;
}

/** MA "none selected" condition: all sub-columns != 1 */
export function maNoneSelectedCondition(cols: string[]): string {
  return cols.map((c) => `"${esc(c)}" != 1`).join(" AND ");
}
/** No-answer marker */
export const NA_VALUE = "N/A";

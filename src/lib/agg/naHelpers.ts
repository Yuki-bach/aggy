/** Shared helpers for NA (Numerical Answer) aggregation */

import type { NaStats } from "./types";
import { esc } from "./sqlHelpers";

export interface ValueCount {
  value: number;
  count: number;
}

export function naValExpr(column: string): string {
  return `CAST("${esc(column)}" AS DOUBLE)`;
}

export function naWhereCond(column: string): string {
  return `"${esc(column)}" IS NOT NULL AND TRY_CAST("${esc(column)}" AS DOUBLE) IS NOT NULL`;
}

export function toStats(row: Record<string, unknown>): NaStats {
  return {
    n: Number(row.n ?? 0),
    mean: Number(row.mean ?? 0),
    median: Number(row.median ?? 0),
    sd: Number(row.sd ?? 0),
    min: Number(row.min_val ?? 0),
    max: Number(row.max_val ?? 0),
  };
}

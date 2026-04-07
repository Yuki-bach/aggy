/** Shared helpers for NA (Numerical Answer) aggregation */

import type { NaStats } from "../types";
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

export const EMPTY_NA_STATS: NaStats = {
  n: 0,
  mean: null,
  median: null,
  sd: null,
  min: null,
  max: null,
};

function toNullableNum(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

export function assembleStats(row: Record<string, unknown>): NaStats {
  return {
    n: Number(row.n ?? 0),
    mean: toNullableNum(row.mean),
    median: toNullableNum(row.median),
    sd: toNullableNum(row.sd),
    min: toNullableNum(row.min_val),
    max: toNullableNum(row.max_val),
  };
}

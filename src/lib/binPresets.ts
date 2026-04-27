import type { BinDef } from "./derivedRecipe";

export interface NaStatsLite {
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
}

/**
 * Generate bins of fixed width covering [min, max].
 *
 * Boundaries snap to multiples of `step`: the first bin starts at floor(min/step)*step.
 * The last bin uses an open upper bound (max=null) so the largest source value is captured
 * regardless of how it lines up with the step grid.
 */
export function fillByStep(stats: NaStatsLite, step: number): BinDef[] {
  if (step <= 0) return [];
  const start = Math.floor(stats.min / step) * step;
  const end = Math.floor(stats.max / step) * step;
  const bins: BinDef[] = [];
  for (let lo = start; lo < end; lo += step) {
    const hi = lo + step;
    bins.push({
      code: `${lo}_${hi - 1}`,
      label: `${lo}-${hi - 1}`,
      min: lo,
      max: hi,
    });
  }
  bins.push({ code: `${end}_plus`, label: `${end}+`, min: end, max: null });
  return bins;
}

/**
 * Generate four quartile bins.
 *
 * Q1 spans (-∞, q1), Q2 [q1, median), Q3 [median, q3), Q4 [q3, +∞).
 * The first and last bins use open bounds so values at the data extremes are always covered.
 */
export function fillByQuartile(stats: NaStatsLite): BinDef[] {
  return [
    { code: "Q1", label: "Q1", min: null, max: stats.q1 },
    { code: "Q2", label: "Q2", min: stats.q1, max: stats.median },
    { code: "Q3", label: "Q3", min: stats.median, max: stats.q3 },
    { code: "Q4", label: "Q4", min: stats.q3, max: null },
  ];
}

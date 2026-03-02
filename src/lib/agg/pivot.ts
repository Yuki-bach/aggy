import type { Cell } from "./aggregate";

export interface PivotCell {
  count: number;
  pct: number;
}

/** Convert flat cells array into a grid structure with pct computed from nBySubLabel */
export function pivot(
  cells: Cell[],
  nBySubLabel: Record<string, number>,
): {
  mains: string[];
  subs: { label: string; n: number }[];
  lookup: Map<string, PivotCell>;
} {
  const mains = [...new Set(cells.map((c) => c.main))];
  const subOrder = [...new Set(cells.map((c) => c.sub))];
  const subs = subOrder.map((label) => ({ label, n: nBySubLabel[label] ?? 0 }));
  const lookup = new Map<string, PivotCell>();
  for (const c of cells) {
    const n = nBySubLabel[c.sub] ?? 0;
    lookup.set(`${c.main}\0${c.sub}`, { count: c.count, pct: n > 0 ? (c.count / n) * 100 : 0 });
  }
  return { mains, subs, lookup };
}

import type { Cell } from "./aggregate";

/** Convert flat cells array into a grid structure */
export function pivot(cells: Cell[]): {
  mains: string[];
  subs: { label: string; n: number }[];
  lookup: Map<string, Cell>;
} {
  const mains = [...new Set(cells.map((c) => c.main))];
  const subMap = new Map<string, number>();
  for (const c of cells) subMap.set(c.sub, c.n);
  const subs = [...subMap.entries()].map(([label, n]) => ({ label, n }));
  const lookup = new Map(cells.map((c) => [`${c.main}\0${c.sub}`, c]));
  return { mains, subs, lookup };
}

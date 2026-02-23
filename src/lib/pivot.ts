import type { Cell } from "./aggregator";

/** cells をグリッド構造に変換する */
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

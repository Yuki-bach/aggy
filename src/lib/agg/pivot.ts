import type { Cell } from "./aggregate";

/** Convert flat cells array into a grid structure */
export function pivot(cells: Cell[]): {
  mains: string[];
  subs: { label: string; n: number }[];
  lookup: Map<string, Cell>;
} {
  const mains = [...new Set(cells.map((c) => c.main))];
  const subOrder = [...new Set(cells.map((c) => c.sub))];
  const subs = subOrder.map((label) => {
    const cell = cells.find((c) => c.sub === label);
    return { label, n: cell?.n ?? 0 };
  });
  const lookup = new Map<string, Cell>();
  for (const c of cells) {
    lookup.set(`${c.main}\0${c.sub}`, c);
  }
  return { mains, subs, lookup };
}

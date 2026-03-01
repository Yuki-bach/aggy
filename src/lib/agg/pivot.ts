import type { Cell } from "./aggregate";

export interface CrossAxisInfo {
  question: string;
  values: { value: string; n: number }[];
}

export interface PivotResult {
  mainQ: string;
  mains: string[];
  crossAxes: CrossAxisInfo[];
  cell(mainVal: string, cross?: { question: string; value: string }): Cell | undefined;
}

/** Convert flat cells array into a structured pivot result */
export function pivot(cells: Cell[], mainQ: string): PivotResult {
  const mains = [...new Set(cells.map((c) => c.key[mainQ]))];

  // Discover cross axes: keys other than mainQ
  const axisMap = new Map<string, Map<string, number>>();
  for (const c of cells) {
    for (const [q, v] of Object.entries(c.key)) {
      if (q === mainQ) continue;
      let valMap = axisMap.get(q);
      if (!valMap) {
        valMap = new Map();
        axisMap.set(q, valMap);
      }
      valMap.set(v, c.n);
    }
  }
  const crossAxes: CrossAxisInfo[] = [...axisMap.entries()].map(([question, valMap]) => ({
    question,
    values: [...valMap.entries()].map(([value, n]) => ({ value, n })),
  }));

  // Internal lookup map (serialized key → Cell)
  const index = new Map<string, Cell>();
  for (const c of cells) {
    index.set(cellLookupKey(c.key), c);
  }

  return {
    mainQ,
    mains,
    crossAxes,
    cell(mainVal: string, cross?: { question: string; value: string }): Cell | undefined {
      const k: Record<string, string> = { [mainQ]: mainVal };
      if (cross) k[cross.question] = cross.value;
      return index.get(cellLookupKey(k));
    },
  };
}

function cellLookupKey(key: Record<string, string>): string {
  return Object.keys(key)
    .sort()
    .map((k) => `${k}\0${key[k]}`)
    .join("\x01");
}

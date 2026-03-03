/** New aggregation type system */

export interface Question {
  type: "SA" | "MA";
  code: string;
  columns: string[];
  codes: string[];
  label: string;
  labels: Record<string, string>;
}

export interface Cell {
  count: number;
  pct: number;
}

export interface Slice {
  code: string;
  n: number;
  cells: Cell[];
}

export interface Tally {
  question: string;
  type: "SA" | "MA";
  codes: string[];
  by: string;
  slices: Slice[];
}

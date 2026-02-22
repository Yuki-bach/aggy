/** 集計結果の型定義 */

export interface AggRow {
  label: string;
  count: number;
  pct: number;
}

export interface CrossHeader {
  label: string;
  n: number;
}

export interface CrossSection {
  cross_col: string;
  headers: CrossHeader[];
  rows: {
    label: string;
    cells: { count: number; pct: number }[];
  }[];
}

export interface AggResult {
  col: string;
  type: "SA" | "MA";
  n: number;
  rows: AggRow[];
  cross?: CrossSection[];
}

import type { Shape } from "../../src/lib/agg/types";
import { buildCSV } from "./csv";

export const SEEDS = 50;
const ROW_RANGE = { min: 50, max: 200 };

export function rowCount(seed: number): number {
  return ROW_RANGE.min + ((seed * 17) % (ROW_RANGE.max - ROW_RANGE.min + 1));
}

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    // mulberry32
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

interface DatasetOpts {
  seed: number;
  rowCount: number;
  codes?: string[];
  nullRate?: number;
  weighted?: boolean;
}

interface SADataset {
  csv: string;
  shape: Shape;
  weightCol: string;
}

interface MADataset {
  csv: string;
  shape: Shape;
  weightCol: string;
}

interface CrossDataset {
  csv: string;
  saInput: Shape;
  sa2Input: Shape;
  maInput: Shape;
  weightCol: string;
}

export function generateSADataset(opts: DatasetOpts): SADataset {
  const rng = new Rng(opts.seed);
  const codeCount = opts.codes?.length ?? rng.int(1, 8);
  const codes = opts.codes ?? Array.from({ length: codeCount }, (_, i) => String(i + 1));
  const nullRate = opts.nullRate ?? rng.next();
  const weighted = opts.weighted ?? false;

  const headers = ["id", ...(weighted ? ["weight"] : []), "q_sa"];
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= opts.rowCount; i++) {
    const row: (string | number | null)[] = [i];
    if (weighted) {
      row.push(Math.round((0.5 + rng.next() * 1.5) * 10) / 10);
    }
    row.push(rng.next() < nullRate ? null : rng.pick(codes));
    rows.push(row);
  }

  return {
    csv: buildCSV(headers, rows),
    shape: { type: "SA", columns: ["q_sa"], codes },
    weightCol: weighted ? "weight" : "",
  };
}

export function generateMADataset(opts: DatasetOpts): MADataset {
  const rng = new Rng(opts.seed);
  const codeCount = opts.codes?.length ?? rng.int(1, 8);
  const codes = opts.codes ?? Array.from({ length: codeCount }, (_, i) => String(i + 1));
  const nullRate = opts.nullRate ?? rng.next();
  const weighted = opts.weighted ?? false;

  const columns = codes.map((_, i) => `q_ma_${i + 1}`);
  const headers = ["id", ...(weighted ? ["weight"] : []), ...columns];
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= opts.rowCount; i++) {
    const row: (string | number | null)[] = [i];
    if (weighted) {
      row.push(Math.round((0.5 + rng.next() * 1.5) * 10) / 10);
    }
    // 先頭行は必ず shown（DuckDB が列型を推論できるよう保証）
    if (i > 1 && rng.next() < nullRate) {
      // not shown — all NULL
      for (let j = 0; j < codes.length; j++) row.push(null);
    } else {
      for (let j = 0; j < codes.length; j++) {
        row.push(rng.next() < 0.4 ? 1 : 0);
      }
    }
    rows.push(row);
  }

  return {
    csv: buildCSV(headers, rows),
    shape: { type: "MA", columns, codes },
    weightCol: weighted ? "weight" : "",
  };
}

interface NADataset {
  csv: string;
  column: string;
  weightCol: string;
}

export function generateNADataset(opts: DatasetOpts): NADataset {
  const rng = new Rng(opts.seed);
  const nullRate = opts.nullRate ?? rng.next();
  const weighted = opts.weighted ?? false;

  const headers = ["id", ...(weighted ? ["weight"] : []), "q_na"];
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= opts.rowCount; i++) {
    const row: (string | number | null)[] = [i];
    if (weighted) {
      row.push(Math.round((0.5 + rng.next() * 1.5) * 10) / 10);
    }
    row.push(rng.next() < nullRate ? null : rng.int(0, 10));
    rows.push(row);
  }

  return {
    csv: buildCSV(headers, rows),
    column: "q_na",
    weightCol: weighted ? "weight" : "",
  };
}

export function generateCrossDataset(opts: DatasetOpts): CrossDataset {
  const rng = new Rng(opts.seed);
  const saCount = rng.int(1, 6);
  const saCodes = Array.from({ length: saCount }, (_, i) => String(i + 1));
  const sa2Count = rng.int(1, 6);
  const sa2Codes = Array.from({ length: sa2Count }, (_, i) => String(i + 1));
  const maCount = rng.int(1, 6);
  const maCodes = Array.from({ length: maCount }, (_, i) => String(i + 1));
  const nullRate = opts.nullRate ?? rng.next();
  const weighted = opts.weighted ?? false;

  const maColumns = maCodes.map((_, i) => `q_ma_${i + 1}`);
  const headers = [
    "id",
    ...(weighted ? ["weight"] : []),
    "q_sa",
    "q_sa2",
    ...maColumns,
  ];
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= opts.rowCount; i++) {
    const row: (string | number | null)[] = [i];
    if (weighted) {
      row.push(Math.round((0.5 + rng.next() * 1.5) * 10) / 10);
    }
    // SA columns (independently generated)
    row.push(rng.next() < nullRate ? null : rng.pick(saCodes));
    row.push(rng.next() < nullRate ? null : rng.pick(sa2Codes));
    // MA columns（先頭行は必ず shown — DuckDB 型推論保証）
    if (i > 1 && rng.next() < nullRate) {
      for (let j = 0; j < maCodes.length; j++) row.push(null);
    } else {
      for (let j = 0; j < maCodes.length; j++) {
        row.push(rng.next() < 0.4 ? 1 : 0);
      }
    }
    rows.push(row);
  }

  return {
    csv: buildCSV(headers, rows),
    saInput: { type: "SA", columns: ["q_sa"], codes: saCodes },
    sa2Input: { type: "SA", columns: ["q_sa2"], codes: sa2Codes },
    maInput: { type: "MA", columns: maColumns, codes: maCodes },
    weightCol: weighted ? "weight" : "",
  };
}

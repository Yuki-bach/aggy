import type { Shape } from "../../src/lib/agg/types";
import { buildCSV } from "./csv";

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
  const codes = opts.codes ?? ["1", "2", "3"];
  const nullRate = opts.nullRate ?? 0.1;
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
  const codeCount = opts.codes?.length ?? 3;
  const codes = opts.codes ?? Array.from({ length: codeCount }, (_, i) => String(i + 1));
  const nullRate = opts.nullRate ?? 0.1;
  const weighted = opts.weighted ?? false;

  const columns = codes.map((_, i) => `q_ma_${i + 1}`);
  const headers = ["id", ...(weighted ? ["weight"] : []), ...columns];
  const rows: (string | number | null)[][] = [];

  for (let i = 1; i <= opts.rowCount; i++) {
    const row: (string | number | null)[] = [i];
    if (weighted) {
      row.push(Math.round((0.5 + rng.next() * 1.5) * 10) / 10);
    }
    if (rng.next() < nullRate) {
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

export function generateCrossDataset(opts: DatasetOpts): CrossDataset {
  const rng = new Rng(opts.seed);
  const saCodes = ["1", "2", "3"];
  const sa2Codes = ["1", "2", "3", "4"];
  const maCodes = ["1", "2", "3"];
  const nullRate = opts.nullRate ?? 0.1;
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
    // MA columns
    if (rng.next() < nullRate) {
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

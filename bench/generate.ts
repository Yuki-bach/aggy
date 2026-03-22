/**
 * Benchmark data generator — produces CSV + layout JSON for each pattern.
 *
 * Usage:
 *   tsx bench/generate.ts            # generate all patterns
 *   tsx bench/generate.ts rows       # generate a specific pattern
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LayoutQuestion, LayoutItem } from "../src/lib/layout";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic across runs
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

export interface PatternDef {
  name: string;
  rows: number;
  saCount: number;
  maCount: number;
  maSubCount: number;
}

export const PATTERNS: PatternDef[] = [
  { name: "rows", rows: 10_000, saCount: 10, maCount: 10, maSubCount: 5 },
  { name: "cols", rows: 1_000, saCount: 100, maCount: 100, maSubCount: 5 },
  { name: "both", rows: 10_000, saCount: 100, maCount: 100, maSubCount: 5 },
  { name: "sa-only", rows: 10_000, saCount: 100, maCount: 0, maSubCount: 5 },
  { name: "ma-only", rows: 10_000, saCount: 0, maCount: 100, maSubCount: 5 },
];

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

function generateCSV(pattern: PatternDef, rand: () => number): string {
  const { rows, saCount, maCount, maSubCount } = pattern;

  // Build header
  const headers: string[] = ["id", "weight"];
  for (let i = 1; i <= saCount; i++) headers.push(`sa${i}`);
  for (let i = 1; i <= maCount; i++) {
    for (let j = 1; j <= maSubCount; j++) headers.push(`ma${i}_${j}`);
  }

  const lines: string[] = [headers.join(",")];

  for (let r = 1; r <= rows; r++) {
    const cells: string[] = [];
    // id
    cells.push(String(r));
    // weight: 0.5 ~ 1.5
    cells.push((0.5 + rand()).toFixed(2));
    // SA columns
    for (let i = 0; i < saCount; i++) {
      if (rand() < 0.05) {
        cells.push(""); // 5% missing
      } else {
        cells.push(String(Math.floor(rand() * 5) + 1));
      }
    }
    // MA columns
    for (let i = 0; i < maCount * maSubCount; i++) {
      cells.push(rand() < 0.5 ? "1" : "0");
    }
    lines.push(cells.join(","));
  }

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Layout JSON generation
// ---------------------------------------------------------------------------

function generateItems(count: number, prefix: string): LayoutItem[] {
  return Array.from({ length: count }, (_, j) => ({
    code: String(j + 1),
    label: `${prefix}${j + 1}`,
  }));
}

function generateLayout(pattern: PatternDef): LayoutQuestion[] {
  const { saCount, maCount, maSubCount } = pattern;
  const layout: LayoutQuestion[] = [{ key: "weight", label: "ウェイト", type: "WEIGHT" }];

  for (let i = 1; i <= saCount; i++) {
    layout.push({
      key: `sa${i}`,
      label: `SA設問${i}`,
      type: "SA",
      items: generateItems(5, "選択肢"),
    });
  }

  for (let i = 1; i <= maCount; i++) {
    layout.push({
      key: `ma${i}`,
      label: `MA設問${i}`,
      type: "MA",
      items: generateItems(maSubCount, "項目"),
    });
  }

  return layout;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function generate(patternNames?: string[]): void {
  const dataDir = resolve(import.meta.dirname, "data");
  mkdirSync(dataDir, { recursive: true });

  const targets = patternNames ? PATTERNS.filter((p) => patternNames.includes(p.name)) : PATTERNS;

  if (targets.length === 0) {
    console.error(`Unknown pattern(s): ${patternNames?.join(", ")}`);
    console.error(`Available: ${PATTERNS.map((p) => p.name).join(", ")}`);
    process.exit(1);
  }

  for (const pattern of targets) {
    const seed = 42;
    const rand = mulberry32(seed);

    console.log(
      `Generating ${pattern.name}: ${pattern.rows.toLocaleString()} rows × ${pattern.saCount + pattern.maCount * pattern.maSubCount + 2} cols`,
    );

    const csv = generateCSV(pattern, rand);
    writeFileSync(resolve(dataDir, `${pattern.name}.csv`), csv);

    const layout = generateLayout(pattern);
    writeFileSync(resolve(dataDir, `${pattern.name}_layout.json`), JSON.stringify(layout, null, 2));
  }

  console.log("Done.");
}

// CLI entry point
if (process.argv[1]?.endsWith("generate.ts") || process.argv[1]?.endsWith("generate")) {
  const args = process.argv.slice(2);
  generate(args.length > 0 ? args : undefined);
}

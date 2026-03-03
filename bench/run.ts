/**
 * Benchmark runner — measures aggregate() execution time for each data pattern.
 *
 * Usage:
 *   tsx bench/run.ts              # run all patterns
 *   tsx bench/run.ts rows         # run a specific pattern
 */

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { aggregate } from "../src/lib/agg/aggregate";
import type { Question } from "../src/lib/agg/types";
import { parseLayout, buildQuestions } from "../src/lib/layout";
import { generate, PATTERNS, type PatternDef } from "./generate";

// ---------------------------------------------------------------------------
// DuckDB setup (same approach as tests/helpers/duckdb.ts)
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);
const DUCKDB_DIST = resolve(require.resolve("@duckdb/duckdb-wasm"), "..");

const { createDuckDB, NODE_RUNTIME, ConsoleLogger } = require(
  resolve(DUCKDB_DIST, "duckdb-node-blocking.cjs"),
);

let db: any;
let conn: any;

async function initDuckDB(): Promise<void> {
  const logger = new ConsoleLogger();
  const bundles = {
    mvp: { mainModule: resolve(DUCKDB_DIST, "duckdb-mvp.wasm") },
    eh: { mainModule: resolve(DUCKDB_DIST, "duckdb-eh.wasm") },
  };
  db = await createDuckDB(bundles, logger, NODE_RUNTIME);
  await db.instantiate();
  conn = await db.connect();
}

async function loadCSVIntoDuckDB(csvText: string): Promise<void> {
  await db.registerFileText("survey.csv", csvText);
  await conn.query(`CREATE OR REPLACE TABLE survey AS SELECT * FROM read_csv('survey.csv')`);
}

async function closeDuckDB(): Promise<void> {
  if (conn) await conn.close();
}

// ---------------------------------------------------------------------------
// Benchmark logic
// ---------------------------------------------------------------------------

const RUNS = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

interface BenchResult {
  pattern: string;
  rows: number;
  cols: number;
  cross: string;
  medianMs: number;
  allMs: number[];
}

async function benchPattern(
  pattern: PatternDef,
  questions: Question[],
  crossCols: Question[],
  crossLabel: string,
): Promise<BenchResult> {
  const weightCol = "weight";
  const totalCols = pattern.saCount + pattern.maCount * pattern.maSubCount + 2;
  const times: number[] = [];

  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    for (const q of questions) {
      await aggregate(conn, q, "GT", weightCol);
      for (const cross of crossCols) {
        await aggregate(conn, q, cross, weightCol);
      }
    }
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  return {
    pattern: pattern.name,
    rows: pattern.rows,
    cols: totalCols,
    cross: crossLabel,
    medianMs: median(times),
    allMs: times,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? PATTERNS.filter((p) => args.includes(p.name)) : PATTERNS;

  if (targets.length === 0) {
    console.error(`Unknown pattern(s): ${args.join(", ")}`);
    console.error(`Available: ${PATTERNS.map((p) => p.name).join(", ")}`);
    process.exit(1);
  }

  // Ensure data exists
  const dataDir = resolve(import.meta.dirname!, "data");
  const missing = targets.filter((p) => !existsSync(resolve(dataDir, `${p.name}.csv`)));
  if (missing.length > 0) {
    console.log(`Generating missing data: ${missing.map((p) => p.name).join(", ")}`);
    generate(missing.map((p) => p.name));
  }

  // Init DuckDB
  console.log("Initializing DuckDB...");
  await initDuckDB();

  const results: BenchResult[] = [];

  for (const pattern of targets) {
    console.log(`\nBenchmarking: ${pattern.name}`);

    // Load CSV
    const csvText = readFileSync(resolve(dataDir, `${pattern.name}.csv`), "utf-8");
    await loadCSVIntoDuckDB(csvText);

    // Parse layout → build questions
    const layoutText = readFileSync(resolve(dataDir, `${pattern.name}_layout.json`), "utf-8");
    const layout = parseLayout(layoutText);

    // Extract headers from CSV first line
    const headers = csvText.slice(0, csvText.indexOf("\n")).split(",");
    const questions = buildQuestions(headers, layout);

    // Pick 2 questions for cross-tab (prefer SA; fall back to MA for MA-only patterns)
    const saQuestions = questions.filter((q) => q.type === "SA");
    const maQuestions = questions.filter((q) => q.type === "MA");
    const crossCols = saQuestions.length >= 2 ? saQuestions.slice(0, 2) : maQuestions.slice(0, 2);
    const crossLabel = saQuestions.length >= 2 ? "SA×2" : "MA×2";

    // Run: no cross
    results.push(await benchPattern(pattern, questions, [], "none"));

    // Run: cross
    results.push(await benchPattern(pattern, questions, crossCols, crossLabel));
  }

  await closeDuckDB();

  // Print results
  console.log("\n" + "=".repeat(80));
  console.log("BENCHMARK RESULTS (aggregate() execution time)");
  console.log("=".repeat(80));
  console.log(
    padEnd("Pattern", 10) +
      padEnd("Rows", 10) +
      padEnd("Cols", 8) +
      padEnd("Cross", 8) +
      padEnd("Runs", 6) +
      padEnd("Median", 14) +
      "All (ms)",
  );
  console.log("-".repeat(80));

  for (const r of results) {
    console.log(
      padEnd(r.pattern, 10) +
        padEnd(r.rows.toLocaleString(), 10) +
        padEnd(String(r.cols), 8) +
        padEnd(r.cross, 8) +
        padEnd(String(RUNS), 6) +
        padEnd(r.medianMs.toFixed(1) + " ms", 14) +
        r.allMs.map((t) => t.toFixed(1)).join(", "),
    );
  }

  console.log("=".repeat(80));
}

function padEnd(s: string, len: number): string {
  return s.padEnd(len);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

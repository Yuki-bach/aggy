import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseLayout, buildQuestions, findWeightColumn } from "../../src/lib/layout";
import type { AggInput, Question } from "../../src/lib/agg/types";

const require = createRequire(import.meta.url);
const DUCKDB_DIST = resolve(require.resolve("@duckdb/duckdb-wasm"), "..");

// Node.js ブロッキングモードを使用（Worker不要）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  createDuckDB,
  NODE_RUNTIME,
  ConsoleLogger,
} = require(resolve(DUCKDB_DIST, "duckdb-node-blocking.cjs"));

let db: ReturnType<typeof createDuckDB> extends Promise<infer T> ? T : never;
let conn: Awaited<ReturnType<typeof db.connect>> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getConn(): any {
  if (!conn) throw new Error("setupDuckDB() has not been called yet");
  return conn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  if (!db) throw new Error("setupDuckDB() has not been called yet");
  return db;
}

export async function setupDuckDB() {
  if (conn) return;

  const logger = new ConsoleLogger();
  const bundles = {
    mvp: { mainModule: resolve(DUCKDB_DIST, "duckdb-mvp.wasm") },
    eh: { mainModule: resolve(DUCKDB_DIST, "duckdb-eh.wasm") },
  };
  db = await createDuckDB(bundles, logger, NODE_RUNTIME);
  await db.instantiate();

  conn = await db.connect();

  // testdata/test_data.csv を survey ビューとして登録
  const csvPath = resolve(import.meta.dirname!, "../../testdata/test_data.csv");
  const csvText = readFileSync(csvPath, "utf-8");
  await db.registerFileText("survey.csv", csvText);
  await conn.query(
    `CREATE OR REPLACE VIEW survey AS SELECT * FROM read_csv('survey.csv')`,
  );
}

export async function teardownDuckDB(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
}

// ── Layout-derived test helpers ──

const layoutPath = resolve(import.meta.dirname!, "../../testdata/test_layout.json");
const layout = parseLayout(readFileSync(layoutPath, "utf-8"));
const questions = buildQuestions(layout);

export function getAggInput(code: string): AggInput {
  const q = questions.find((q) => q.code === code);
  if (!q) throw new Error(`Question "${code}" not found in test_layout.json`);
  const { type, columns, codes } = q;
  return { type, columns, codes };
}

export function getQuestion(code: string): Question {
  const q = questions.find((q) => q.code === code);
  if (!q) throw new Error(`Question "${code}" not found in test_layout.json`);
  return q;
}

export const weightColumn = findWeightColumn(layout);

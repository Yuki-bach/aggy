// @ts-nocheck — require() 経由の DuckDB Node blocking API は型定義がexportされていない
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DuckDBNodeBindings } from "@duckdb/duckdb-wasm/dist/types/src/bindings/bindings_node_base";
import type { DuckDBConnection } from "@duckdb/duckdb-wasm/dist/types/src/bindings/connection";

const require = createRequire(import.meta.url);
const DUCKDB_DIST = resolve(require.resolve("@duckdb/duckdb-wasm"), "..");

// Node.js ブロッキングモードを使用（Worker不要）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createDuckDB, NODE_RUNTIME, ConsoleLogger } = require(
  resolve(DUCKDB_DIST, "duckdb-node-blocking.cjs"),
);

let db: DuckDBNodeBindings;
// eslint-disable-next-line typescript-eslint/no-redundant-type-constituents
let conn: DuckDBConnection | null = null;

export function getConn(): DuckDBConnection {
  if (!conn) throw new Error("setupDuckDB() has not been called yet");
  return conn;
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
  await loadCSV(csvText);
}

export async function teardownDuckDB(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
}

export async function loadCSV(csvText: string): Promise<void> {
  await db.registerFileText("survey.csv", csvText);
  await conn!.query(`CREATE OR REPLACE VIEW survey AS SELECT * FROM read_csv('survey.csv')`);
}

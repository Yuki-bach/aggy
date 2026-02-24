import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

export async function setupDuckDB() {
  if (conn) return conn;

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
    `CREATE OR REPLACE VIEW survey AS SELECT * FROM read_csv('survey.csv', all_varchar=true)`,
  );

  return conn;
}

export async function teardownDuckDB(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
}

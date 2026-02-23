import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { aggregate, type Query, type AggResult } from "./aggregate";

type DuckStatus = "loading" | "ready" | "error";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let status: DuckStatus = "loading";
let initPromise: Promise<void> | null = null;

function updateStatusUI(s: DuckStatus, label?: string): void {
  const dot = document.getElementById("wasm-dot");
  const lbl = document.getElementById("wasm-label");
  if (dot) dot.className = `status-dot ${s}`;
  if (lbl) lbl.textContent = label ?? s;
}

export async function initDuckDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      updateStatusUI("loading", "DuckDB 読み込み中...");

      const BUNDLES: duckdb.DuckDBBundles = {
        mvp: { mainModule: duckdb_wasm, mainWorker: mvp_worker },
        eh: { mainModule: duckdb_wasm_eh, mainWorker: eh_worker },
      };

      const bundle = await duckdb.selectBundle(BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      status = "ready";
      updateStatusUI("ready", "DuckDB Ready");
    } catch (err) {
      status = "error";
      updateStatusUI("error", `DuckDB エラー: ${(err as Error).message}`);
      console.error("DuckDB init error:", err);
      throw err;
    }
  })();

  return initPromise;
}

async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!db || status !== "ready") throw new Error("DuckDB is not ready");
  if (!conn) conn = await db.connect();
  return conn;
}

/** CSVテキストをDuckDBに登録し、ヘッダーと行数を返す */
export async function loadCSV(csvText: string): Promise<{ headers: string[]; rowCount: number }> {
  await initDuckDB();
  if (!db) throw new Error("DuckDB is not ready");

  await db.registerFileText("survey.csv", csvText);

  const c = await getConnection();
  await c.query(
    `CREATE OR REPLACE VIEW survey AS
     SELECT * FROM read_csv('survey.csv', all_varchar=true)`,
  );

  const descResult = await c.query(`DESCRIBE survey`);
  const headers = descResult.toArray().map((r) => String(r.column_name));

  const countResult = await c.query(`SELECT COUNT(*) AS n FROM survey`);
  const rowCount = Number(countResult.toArray()[0].n);

  return { headers, rowCount };
}

/** survey ビューに対して集計を実行する */
export async function runDuckDBAggregation(query: Query): Promise<AggResult[]> {
  const c = await getConnection();
  return aggregate(c, query);
}

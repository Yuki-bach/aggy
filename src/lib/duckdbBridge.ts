import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { runAggregation, type AggPayload, type AggResult } from "./aggregator";

type DuckStatus = "loading" | "ready" | "error";

let db: duckdb.AsyncDuckDB | null = null;
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

// CSV値をRFC 4180形式にクォート
function quoteCSVField(v: string): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function serializeToCSV(data: Record<string, string>[], cols: string[]): string {
  const header = cols.map(quoteCSVField).join(",");
  const rows = data.map((row) =>
    cols.map((c) => quoteCSVField(row[c] ?? "")).join(",")
  );
  return [header, ...rows].join("\n");
}

export async function runDuckDBAggregation(payload: {
  data: Record<string, string>[];
} & AggPayload): Promise<AggResult[]> {
  if (!db || status !== "ready") throw new Error("DuckDB is not ready");

  const allColNames = [
    ...new Set([
      ...payload.columns.map((c) => c.name),
      ...payload.cross_cols,
      ...(payload.weight_col ? [payload.weight_col] : []),
    ]),
  ];

  const csvText = serializeToCSV(payload.data, allColNames);
  await db.registerFileText("survey.csv", csvText);

  const conn = await db.connect();
  try {
    await conn.query(
      `CREATE OR REPLACE VIEW survey AS
       SELECT * FROM read_csv('survey.csv', all_varchar=true)`
    );

    return await runAggregation(conn, payload);
  } finally {
    await conn.close();
    await db.dropFile("survey.csv");
  }
}

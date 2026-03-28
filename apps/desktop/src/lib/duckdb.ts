import * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, Tab, Layout, DatePreparationResult, Diagnostic } from "@aggy/lib";
import {
  validateLayoutStructure,
  buildValidLayout,
  buildTabs,
  prepareDateColumns,
  validateRawData,
} from "@aggy/lib";

export type DuckStatus = "loading" | "ready" | "error";
export type StatusListener = (s: DuckStatus, label: string) => void;

let statusListener: StatusListener | null = null;

export function setStatusListener(listener: StatusListener): void {
  statusListener = listener;
}

export async function initDuckDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      statusListener?.("loading", "DuckDB 読み込み中...");

      const BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
          mainModule: `${DUCKDB_CDN}/duckdb-mvp.wasm`,
          mainWorker: `${DUCKDB_CDN}/duckdb-browser-mvp.worker.js`,
        },
        eh: {
          mainModule: `${DUCKDB_CDN}/duckdb-eh.wasm`,
          mainWorker: `${DUCKDB_CDN}/duckdb-browser-eh.worker.js`,
        },
      };

      const bundle = await duckdb.selectBundle(BUNDLES);
      const workerBlob = new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: "application/javascript",
      });
      const worker = new Worker(URL.createObjectURL(workerBlob));
      const logger = new duckdb.ConsoleLogger();
      db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      status = "ready";
      statusListener?.("ready", "DuckDB Ready");
    } catch (err) {
      status = "error";
      statusListener?.("error", `DuckDB エラー: ${(err as Error).message}`);
      throw err;
    }
  })();

  return initPromise;
}

/** Register CSV text in DuckDB and return headers and row count */
export async function loadCSV(csvText: string): Promise<{ headers: string[]; rowCount: number }> {
  await initDuckDB();
  if (!db) throw new Error("DuckDB is not ready");

  await db.registerFileText("survey.csv", csvText);

  const c = await getConnection();
  await c.query(
    `CREATE OR REPLACE TABLE survey AS
     SELECT * FROM read_csv('survey.csv')`,
  );

  const descResult = await c.query(`DESCRIBE survey`);
  const headers = descResult.toArray().map((r) => String(r.column_name));

  const countResult = await c.query(`SELECT COUNT(*) AS n FROM survey`);
  const rowCount = Number(countResult.toArray()[0].n);

  return { headers, rowCount };
}

/** Validate layout structure + CSV data against layout definition */
export async function runValidation(rawJson: unknown[], headers: string[]): Promise<Diagnostic[]> {
  const layoutDiags = validateLayoutStructure(rawJson);
  if (layoutDiags.length > 0) return layoutDiags;

  const layout = buildValidLayout(rawJson);
  const c = await getConnection();
  return validateRawData(c, headers, layout);
}

/** Execute aggregation for all question × axis combinations */
export async function runAggregation(
  questions: Question[],
  crossQuestions: Question[],
  weightCol: string,
): Promise<Tab[]> {
  const c = await getConnection();
  return buildTabs(c, questions, crossQuestions, weightCol);
}

/** Prepare DATE columns in layout (convert to SA with auto-generated items) */
export async function prepareDateLayout(layout: Layout): Promise<DatePreparationResult> {
  const c = await getConnection();
  return prepareDateColumns(c, layout);
}

// ─── Internal ───────────────────────────────────────────────

const DUCKDB_CDN = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev18.0/dist";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let status: DuckStatus = "loading";
let initPromise: Promise<void> | null = null;

async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!db || status !== "ready") throw new Error("DuckDB is not ready");
  if (!conn) conn = await db.connect();
  return conn;
}

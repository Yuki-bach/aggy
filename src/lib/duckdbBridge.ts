import * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, AggResult, Tally, Axis } from "./agg/types";
import { aggregate } from "./agg/aggregate";
import { NA_VALUE } from "./agg/sqlHelpers";
import { t } from "./i18n";
import { setWasmStatus } from "../components/header/WasmStatus";

/** Convert AggResult + Question metadata into a consumer-friendly Tally. */
export function toTally(question: Question, aggResult: AggResult, byQuestion?: Question): Tally {
  // Build labels including NA if present in codes
  const labels: Record<string, string> = { ...question.labels };
  if (aggResult.codes.includes(NA_VALUE)) {
    labels[NA_VALUE] = t("label.na");
  }

  let by: Axis | null = null;
  if (byQuestion) {
    const axisLabels: Record<string, string> = { ...byQuestion.labels };
    // Check if any slice code is NA_VALUE to add NA label
    const hasNA = aggResult.slices.some((s) => s.code === NA_VALUE);
    if (hasNA) {
      axisLabels[NA_VALUE] = t("label.na");
    }
    by = { code: byQuestion.code, label: byQuestion.label, labels: axisLabels };
  }

  return {
    question: question.code,
    type: question.type,
    label: question.label,
    labels,
    codes: aggResult.codes,
    by,
    slices: aggResult.slices,
  };
}

export async function initDuckDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      updateStatusUI("loading", "DuckDB 読み込み中...");

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

/** Execute aggregation for all question × axis combinations */
export async function runDuckDBAggregation(
  questions: Question[],
  crossCols: Question[],
  weightCol: string,
): Promise<Tally[]> {
  const c = await getConnection();
  const tallies: Tally[] = [];
  for (const q of questions) {
    const gtResult = await aggregate(c, q, "GT", weightCol);
    tallies.push(toTally(q, gtResult));
    for (const cross of crossCols) {
      const crossResult = await aggregate(c, q, cross, weightCol);
      tallies.push(toTally(q, crossResult, cross));
    }
  }
  return tallies;
}

// ─── Internal ───────────────────────────────────────────────

const DUCKDB_CDN = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev18.0/dist";

type DuckStatus = "loading" | "ready" | "error";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let status: DuckStatus = "loading";
let initPromise: Promise<void> | null = null;

function updateStatusUI(s: DuckStatus, label?: string): void {
  setWasmStatus(s, label);
}

async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!db || status !== "ready") throw new Error("DuckDB is not ready");
  if (!conn) conn = await db.connect();
  return conn;
}

import * as duckdb from "@duckdb/duckdb-wasm";
import type { Question, Tab } from "./types";
import type { Layout } from "./layout";
import { validateLayoutStructure, buildValidLayout } from "./layout";
import { buildTabs } from "./agg/buildTabs";
import { prepareDateColumns, type DatePreparationResult } from "./datePreparation";
import { prepareDerivedColumns, checkBinCoverage } from "./derivedPreparation";
import type { DerivedPreparationResult } from "./derivedPreparation";
import type { DerivedRecipe, BinDef } from "./derivedRecipe";
import { esc } from "./agg/sqlHelpers";
import { validateRawData, type Diagnostic } from "./validateRawData";

export type DuckStatus = "idle" | "loading" | "ready" | "error";

class DbStatus {
  value = $state<DuckStatus>("idle");
  errorMessage = $state<string | null>(null);
}

export const dbStatus = new DbStatus();

interface DuckInstance {
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}

const DUCKDB_CDN = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev18.0/dist";

let instance: DuckInstance | null = null;
let initPromise: Promise<DuckInstance> | null = null;

async function doInit(): Promise<DuckInstance> {
  dbStatus.value = "loading";
  dbStatus.errorMessage = null;

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
  const logger = import.meta.env.DEV ? new duckdb.ConsoleLogger() : new duckdb.VoidLogger();

  // Build the instance fully before publishing it: a second caller must
  // never observe a half-instantiated AsyncDuckDB through `instance`.
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();

  dbStatus.value = "ready";
  return { db, conn };
}

/**
 * Lazily boot DuckDB and return the live `{ db, conn }` pair.
 *
 * Subsequent calls reuse the cached instance. Concurrent first-callers
 * share the same in-flight init promise. On failure the promise is
 * cleared so a later call can retry.
 */
export async function requireDuckDB(): Promise<DuckInstance> {
  if (instance) return instance;
  initPromise ??= doInit()
    .then((i) => {
      instance = i;
      return i;
    })
    .catch((err: unknown) => {
      dbStatus.value = "error";
      dbStatus.errorMessage = err instanceof Error ? err.message : String(err);
      initPromise = null;
      throw err;
    });
  return initPromise;
}

/**
 * Register CSV in DuckDB and return headers and row count.
 *
 * Pass a `File` whenever possible — DuckDB reads it lazily through
 * BROWSER_FILEREADER without copying the whole CSV into a JS string
 * (which would otherwise be held in UTF-16, ~2x the source bytes).
 * The string overload is kept for tests, benchmarks, and the OPFS
 * restore path where the source genuinely is already a string.
 */
export async function loadCSV(
  source: File | string,
): Promise<{ headers: string[]; rowCount: number }> {
  const { db, conn } = await requireDuckDB();

  await db.dropFile("survey.csv").catch(() => {});
  if (typeof source === "string") {
    await db.registerFileText("survey.csv", source);
  } else {
    await db.registerFileHandle(
      "survey.csv",
      source,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    );
  }

  await conn.query(
    `CREATE OR REPLACE TABLE survey AS
     SELECT * FROM read_csv('survey.csv')`,
  );

  const descResult = await conn.query(`DESCRIBE survey`);
  const headers = descResult.toArray().map((r) => String(r.column_name));

  const countResult = await conn.query(`SELECT COUNT(*) AS n FROM survey`);
  const rowCount = Number(countResult.toArray()[0].n);

  return { headers, rowCount };
}

/** Validate layout structure + CSV data against layout definition */
export async function runValidation(rawJson: unknown[], headers: string[]): Promise<Diagnostic[]> {
  const layoutDiags = validateLayoutStructure(rawJson);
  if (layoutDiags.length > 0) return layoutDiags;

  const layout = buildValidLayout(rawJson);
  const { conn } = await requireDuckDB();
  return validateRawData(conn, headers, layout);
}

/** Execute aggregation for all question × axis combinations */
export async function runAggregation(
  questions: Question[],
  crossQuestions: Question[],
  weightCol: string,
  matrixLabels: Record<string, string> = {},
): Promise<Tab[]> {
  const { conn } = await requireDuckDB();
  return buildTabs(conn, questions, crossQuestions, weightCol, matrixLabels);
}

/** Prepare DATE columns in layout (convert to SA with auto-generated items) */
export async function prepareDateLayout(layout: Layout): Promise<DatePreparationResult> {
  const { conn } = await requireDuckDB();
  return prepareDateColumns(conn, layout);
}

/** Prepare derived columns from recipes (combineSA, binNA) */
export async function prepareDerivedLayout(
  layout: Layout,
  recipes: DerivedRecipe[],
): Promise<DerivedPreparationResult> {
  const { conn } = await requireDuckDB();
  return prepareDerivedColumns(conn, layout, recipes);
}

/** NA column summary stats used by binNA form (range + quartiles + total) */
export interface NaStats {
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  total: number;
}

export async function getNaStats(source: string): Promise<NaStats> {
  const { conn } = await requireDuckDB();
  const col = esc(source);
  const result = await conn.query(
    `SELECT
       MIN(CAST("${col}" AS DOUBLE)) AS lo,
       MAX(CAST("${col}" AS DOUBLE)) AS hi,
       QUANTILE_CONT(CAST("${col}" AS DOUBLE), 0.25) AS q1,
       QUANTILE_CONT(CAST("${col}" AS DOUBLE), 0.5) AS q2,
       QUANTILE_CONT(CAST("${col}" AS DOUBLE), 0.75) AS q3,
       COUNT(*) AS total
     FROM survey
     WHERE "${col}" IS NOT NULL`,
  );
  const row = result.toArray()[0];
  return {
    min: Number(row.lo),
    max: Number(row.hi),
    q1: Number(row.q1),
    median: Number(row.q2),
    q3: Number(row.q3),
    total: Number(row.total),
  };
}

export async function getBinCoverage(
  source: string,
  bins: BinDef[],
): Promise<{ min: number; max: number; uncoveredCount: number }> {
  const { conn } = await requireDuckDB();
  return checkBinCoverage(conn, source, bins);
}

export async function dropDerivedColumn(code: string): Promise<void> {
  const { conn } = await requireDuckDB();
  await conn.query(`ALTER TABLE survey DROP COLUMN IF EXISTS "${esc(code)}"`);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void instance?.db.terminate();
    instance = null;
    initPromise = null;
    dbStatus.value = "idle";
    dbStatus.errorMessage = null;
  });
}

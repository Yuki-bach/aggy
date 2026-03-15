import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Layout, LayoutQuestion } from "./layout";
import { esc } from "./agg/sqlHelpers";

export interface Diagnostic {
  key: string;
  label: string;
  severity: "error" | "warn";
  type: "dropped" | "unknownCode" | "invalidMAValue" | "nonNumeric" | "allNull";
  params: Record<string, string>;
}

/** Validate raw data against layout definition */
export async function validateRawData(
  conn: duckdb.AsyncDuckDBConnection,
  headers: string[],
  layout: Layout,
): Promise<Diagnostic[]> {
  const headerSet = new Set(headers);
  const diagnostics: Diagnostic[] = [];

  for (const q of layout) {
    const dropped = checkDropped(q, headerSet);
    if (dropped) {
      diagnostics.push(dropped);
      continue;
    }

    if (q.type === "SA") {
      const d = await checkSAUnknownCodes(conn, q, headerSet);
      if (d) diagnostics.push(d);
    } else if (q.type === "MA") {
      const d = await checkMAValues(conn, q, headerSet);
      if (d) diagnostics.push(d);
      const allNull = await checkMAAllNull(conn, q, headerSet);
      if (allNull) diagnostics.push(allNull);
    } else if (q.type === "NA" || q.type === "WEIGHT") {
      const d = await checkNumeric(conn, q);
      if (d) diagnostics.push(d);
    }
  }

  return diagnostics;
}

// ─── Internal per-question validators ────────────────────────

function checkDropped(q: LayoutQuestion, headerSet: Set<string>): Diagnostic | null {
  if (q.type === "MA") {
    const hasAny = q.items.some((item) => headerSet.has(`${q.key}_${item.code}`));
    if (!hasAny) {
      return {
        key: q.key,
        label: q.label,
        severity: "warn",
        type: "dropped",
        params: { type: q.type },
      };
    }
  } else {
    if (!headerSet.has(q.key)) {
      return {
        key: q.key,
        label: q.label,
        severity: "warn",
        type: "dropped",
        params: { type: q.type },
      };
    }
  }
  return null;
}

async function checkSAUnknownCodes(
  conn: duckdb.AsyncDuckDBConnection,
  q: Extract<LayoutQuestion, { type: "SA" }>,
  headerSet: Set<string>,
): Promise<Diagnostic | null> {
  if (!headerSet.has(q.key)) return null;

  const definedCodes = new Set(q.items.map((i) => i.code));
  const result = await conn.query(
    `SELECT DISTINCT "${esc(q.key)}" AS v FROM survey WHERE "${esc(q.key)}" IS NOT NULL`,
  );

  const unknownCodes: string[] = [];
  for (const row of result.toArray()) {
    const code = String(row.v);
    if (!definedCodes.has(code)) {
      unknownCodes.push(code);
    }
  }

  if (unknownCodes.length > 0) {
    return {
      key: q.key,
      label: q.label,
      severity: "error",
      type: "unknownCode",
      params: { codes: unknownCodes.sort().join(", ") },
    };
  }
  return null;
}

async function checkMAValues(
  conn: duckdb.AsyncDuckDBConnection,
  q: Extract<LayoutQuestion, { type: "MA" }>,
  headerSet: Set<string>,
): Promise<Diagnostic | null> {
  const presentCols = q.items
    .map((item) => `${q.key}_${item.code}`)
    .filter((col) => headerSet.has(col));

  if (presentCols.length === 0) return null;

  const unions = presentCols.map(
    (col) =>
      `SELECT '${col}' AS col, CAST("${esc(col)}" AS VARCHAR) AS v FROM survey WHERE CAST("${esc(col)}" AS VARCHAR) NOT IN ('0','1') AND "${esc(col)}" IS NOT NULL`,
  );
  const result = await conn.query(unions.join(" UNION ALL "));
  const rows = result.toArray();

  if (rows.length > 0) {
    const values = [...new Set(rows.map((r) => String(r.v)))].sort().join(", ");
    return {
      key: q.key,
      label: q.label,
      severity: "error",
      type: "invalidMAValue",
      params: { values },
    };
  }
  return null;
}

async function checkMAAllNull(
  conn: duckdb.AsyncDuckDBConnection,
  q: Extract<LayoutQuestion, { type: "MA" }>,
  headerSet: Set<string>,
): Promise<Diagnostic | null> {
  const presentCols = q.items
    .map((item) => `${q.key}_${item.code}`)
    .filter((col) => headerSet.has(col));

  if (presentCols.length === 0) return null;

  const shownCondition = presentCols.map((c) => `"${esc(c)}" IS NOT NULL`).join(" OR ");
  const result = await conn.query(`SELECT COUNT(*) AS n FROM survey WHERE ${shownCondition}`);
  const count = Number(result.toArray()[0].n);

  if (count === 0) {
    return {
      key: q.key,
      label: q.label,
      severity: "warn",
      type: "allNull",
      params: {},
    };
  }
  return null;
}

async function checkNumeric(
  conn: duckdb.AsyncDuckDBConnection,
  q: Extract<LayoutQuestion, { type: "NA" }> | Extract<LayoutQuestion, { type: "WEIGHT" }>,
): Promise<Diagnostic | null> {
  const result = await conn.query(
    `SELECT COUNT(*) AS n FROM survey WHERE TRY_CAST("${esc(q.key)}" AS DOUBLE) IS NULL AND "${esc(q.key)}" IS NOT NULL`,
  );
  const count = Number(result.toArray()[0].n);

  if (count > 0) {
    return {
      key: q.key,
      label: q.label,
      severity: "error",
      type: "nonNumeric",
      params: { count: String(count) },
    };
  }
  return null;
}

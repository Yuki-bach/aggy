import type * as duckdb from "@duckdb/duckdb-wasm";
import type { Layout } from "./layout";
import { esc } from "./agg/sqlHelpers";

export interface UnknownCodeError {
  key: string;
  label: string;
  unknownCodes: string[];
}

export interface ValidationResult {
  /** SA columns with codes not defined in layout items */
  unknownCodeErrors: UnknownCodeError[];
  /** Layout entries removed because their columns are missing from CSV */
  droppedEntries: { key: string; label: string; type: string }[];
}

/** Validate CSV data against layout definition */
export async function validateData(
  conn: duckdb.AsyncDuckDBConnection,
  headers: string[],
  layout: Layout,
): Promise<ValidationResult> {
  const headerSet = new Set(headers);

  // Detect layout entries whose columns are missing from CSV
  const droppedEntries: ValidationResult["droppedEntries"] = [];
  for (const q of layout) {
    if (q.type === "SA" || q.type === "NA" || q.type === "WEIGHT") {
      if (!headerSet.has(q.key)) {
        droppedEntries.push({ key: q.key, label: q.label, type: q.type });
      }
    } else if (q.type === "MA") {
      const hasAny = q.items.some((item) => headerSet.has(`${q.key}_${item.code}`));
      if (!hasAny) {
        droppedEntries.push({ key: q.key, label: q.label, type: q.type });
      }
    }
  }

  // Check SA columns for undefined codes
  const unknownCodeErrors: UnknownCodeError[] = [];
  for (const q of layout) {
    if (q.type !== "SA") continue;
    if (!headerSet.has(q.key)) continue; // column not in CSV, already reported as dropped

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
      unknownCodeErrors.push({
        key: q.key,
        label: q.label,
        unknownCodes: unknownCodes.sort(),
      });
    }
  }

  return { unknownCodeErrors, droppedEntries };
}

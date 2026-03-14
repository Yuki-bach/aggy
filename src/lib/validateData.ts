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
  for (const entry of layout) {
    if (entry.type === "SA" || entry.type === "NA" || entry.type === "WEIGHT") {
      if (!headerSet.has(entry.key)) {
        droppedEntries.push({ key: entry.key, label: entry.label, type: entry.type });
      }
    } else if (entry.type === "MA") {
      const hasAny = entry.items.some((item) => headerSet.has(`${entry.key}_${item.code}`));
      if (!hasAny) {
        droppedEntries.push({ key: entry.key, label: entry.label, type: entry.type });
      }
    }
  }

  // Check SA columns for undefined codes
  const unknownCodeErrors: UnknownCodeError[] = [];
  for (const entry of layout) {
    if (entry.type !== "SA") continue;
    if (!headerSet.has(entry.key)) continue; // column not in CSV, already reported as dropped

    const definedCodes = new Set(entry.items.map((i) => i.code));

    const result = await conn.query(
      `SELECT DISTINCT "${esc(entry.key)}" AS v FROM survey WHERE "${esc(entry.key)}" IS NOT NULL`,
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
        key: entry.key,
        label: entry.label,
        unknownCodes: unknownCodes.sort(),
      });
    }
  }

  return { unknownCodeErrors, droppedEntries };
}

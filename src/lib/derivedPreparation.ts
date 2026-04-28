import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { Layout, LayoutItem } from "./layout";
import type { DerivedRecipe, CombineSARecipe, BinNARecipe, BinDef } from "./derivedRecipe";
import { esc } from "./agg/sqlHelpers";

export interface DerivedPreparationResult {
  layout: Layout;
  warnings: string[];
}

export async function prepareDerivedColumns(
  conn: AsyncDuckDBConnection,
  layout: Layout,
  recipes: DerivedRecipe[],
): Promise<DerivedPreparationResult> {
  const warnings: string[] = [];
  const newLayout = [...layout];

  for (const recipe of recipes) {
    // Idempotent: drop column if re-running
    await conn.query(`ALTER TABLE survey DROP COLUMN IF EXISTS "${esc(recipe.code)}"`);

    if (recipe.type === "combineSA") {
      const entry = await prepareCombineSA(conn, recipe, layout, warnings);
      if (entry) newLayout.push(entry);
    } else {
      const entry = await prepareBinNA(conn, recipe, layout, warnings);
      if (entry) newLayout.push(entry);
    }
  }

  return { layout: newLayout, warnings };
}

/** Check if bins cover all actual values in the NA column */
export async function checkBinCoverage(
  conn: AsyncDuckDBConnection,
  source: string,
  bins: BinDef[],
): Promise<{ min: number; max: number; uncoveredCount: number }> {
  const col = esc(source);
  const rangeResult = await conn.query(
    `SELECT MIN(CAST("${col}" AS DOUBLE)) AS lo, MAX(CAST("${col}" AS DOUBLE)) AS hi FROM survey WHERE "${col}" IS NOT NULL`,
  );
  const row = rangeResult.toArray()[0];
  const min = Number(row.lo);
  const max = Number(row.hi);

  const conditions = bins.map((b) => buildBinCondition(col, b));
  const matchExpr = conditions.length > 0 ? conditions.join(" OR ") : "FALSE";

  const uncoveredResult = await conn.query(
    `SELECT COUNT(*) AS n FROM survey WHERE "${col}" IS NOT NULL AND NOT (${matchExpr})`,
  );
  const uncoveredCount = Number(uncoveredResult.toArray()[0].n);

  return { min, max, uncoveredCount };
}

// ─── Internal ───────────────────────────────────────────────

async function prepareCombineSA(
  conn: AsyncDuckDBConnection,
  recipe: CombineSARecipe,
  layout: Layout,
  warnings: string[],
): Promise<Layout[number] | null> {
  const sep = recipe.separator ?? "_";
  const sepLit = sep.replaceAll("'", "''");
  const col = esc(recipe.code);

  // Verify all sources exist
  const sourceQuestions = recipe.sources.map((src) => layout.find((q) => q.key === src));
  if (sourceQuestions.some((q) => !q)) {
    warnings.push(`${recipe.code}: ソース設問が見つかりません`);
    return null;
  }

  // Build CONCAT expression
  const parts = recipe.sources.map((src) => `"${esc(src)}"`);
  const concatExpr =
    parts.length === 1
      ? parts[0]
      : `CONCAT(${parts.map((p, i) => (i > 0 ? `'${sepLit}', ${p}` : p)).join(", ")})`;

  // WHERE all sources are NOT NULL
  const nullChecks = recipe.sources.map((src) => `"${esc(src)}" IS NOT NULL`).join(" AND ");

  await conn.query(`ALTER TABLE survey ADD COLUMN "${col}" VARCHAR`);
  await conn.query(`UPDATE survey SET "${col}" = ${concatExpr} WHERE ${nullChecks}`);

  // Generate items from cartesian product of source items
  const sourceItems = sourceQuestions.map((q) => {
    if (q!.type === "SA") return q!.items;
    return [];
  });

  const items = cartesianProduct(sourceItems, sep);

  return { type: "SA", key: recipe.code, label: recipe.label, items };
}

async function prepareBinNA(
  conn: AsyncDuckDBConnection,
  recipe: BinNARecipe,
  layout: Layout,
  warnings: string[],
): Promise<Layout[number] | null> {
  const sourceQ = layout.find((q) => q.key === recipe.source);
  if (!sourceQ) {
    warnings.push(`${recipe.code}: ソース "${recipe.source}" が見つかりません`);
    return null;
  }

  const col = esc(recipe.code);
  const srcCol = esc(recipe.source);

  // Build CASE WHEN expression
  const whenClauses = recipe.bins.map((bin) => {
    const cond = buildBinCondition(srcCol, bin);
    return `WHEN ${cond} THEN '${bin.code.replaceAll("'", "''")}'`;
  });

  await conn.query(`ALTER TABLE survey ADD COLUMN "${col}" VARCHAR`);
  await conn.query(
    `UPDATE survey SET "${col}" = CASE ${whenClauses.join(" ")} ELSE NULL END WHERE "${srcCol}" IS NOT NULL`,
  );

  // Check for rows that didn't match any bin
  const unmatchedResult = await conn.query(
    `SELECT COUNT(*) AS n FROM survey WHERE "${srcCol}" IS NOT NULL AND "${col}" IS NULL`,
  );
  const unmatchedCount = Number(unmatchedResult.toArray()[0].n);
  if (unmatchedCount > 0) {
    warnings.push(`${recipe.code}: ${unmatchedCount}件がどのビンにも該当しませんでした`);
  }

  const items: LayoutItem[] = recipe.bins.map((b) => ({ code: b.code, label: b.label }));

  return { type: "SA", key: recipe.code, label: recipe.label, items };
}

function buildBinCondition(srcCol: string, bin: BinDef): string {
  const val = `CAST("${srcCol}" AS DOUBLE)`;
  if (bin.min !== null && bin.max !== null) {
    return `(${val} >= ${bin.min} AND ${val} < ${bin.max})`;
  }
  if (bin.min !== null) {
    return `(${val} >= ${bin.min})`;
  }
  if (bin.max !== null) {
    return `(${val} < ${bin.max})`;
  }
  return "TRUE";
}

function cartesianProduct(arrays: LayoutItem[][], sep: string): LayoutItem[] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0];

  let result: LayoutItem[] = arrays[0].map((item) => ({ ...item }));

  for (let i = 1; i < arrays.length; i++) {
    const next: LayoutItem[] = [];
    for (const existing of result) {
      for (const item of arrays[i]) {
        next.push({
          code: `${existing.code}${sep}${item.code}`,
          label: `${existing.label}×${item.label}`,
        });
      }
    }
    result = next;
  }

  return result;
}

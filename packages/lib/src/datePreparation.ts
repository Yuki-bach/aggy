import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { Layout, DateGranularity } from "./layout";
import { esc } from "./agg/sqlHelpers";

export interface DatePreparationResult {
  layout: Layout;
  warnings: string[];
}

const FORMAT_MAP: Record<DateGranularity, string> = {
  year: "%Y",
  month: "%Y-%m",
  week: "%G-W%V",
  day: "%Y-%m-%d",
};

export async function prepareDateColumns(
  conn: AsyncDuckDBConnection,
  layout: Layout,
): Promise<DatePreparationResult> {
  const result: Layout = [];
  const warnings: string[] = [];

  for (const q of layout) {
    if (q.type !== "DATE") {
      result.push(q);
      continue;
    }

    const { granularity } = q;
    const fmt = FORMAT_MAP[granularity];
    const col = esc(q.key);
    const fmtCol = esc(`${q.key}__${granularity}`);

    await conn.query(`ALTER TABLE survey ADD COLUMN "${fmtCol}" VARCHAR`);
    await conn.query(
      `UPDATE survey SET "${fmtCol}" = STRFTIME('${fmt}', TRY_CAST("${col}" AS DATE)) WHERE "${col}" IS NOT NULL`,
    );

    const failResult = await conn.query(
      `SELECT COUNT(*) AS n FROM survey WHERE "${col}" IS NOT NULL AND "${fmtCol}" IS NULL`,
    );
    const failCount = Number(failResult.toArray()[0].n);
    if (failCount > 0) {
      warnings.push(`${q.label}:${failCount}`);
    }

    const distinct = await conn.query(
      `SELECT DISTINCT "${fmtCol}" AS v FROM survey WHERE "${fmtCol}" IS NOT NULL ORDER BY v`,
    );
    const values = distinct.toArray().map((r) => String(r.v));

    result.push({
      key: `${q.key}__${granularity}`,
      label: q.label,
      type: "SA",
      items: values.map((v) => ({ code: v, label: v })),
    });
  }

  return { layout: result, warnings };
}

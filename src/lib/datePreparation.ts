import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { Layout, DateGranularity } from "./layout";
import { esc } from "./agg/sqlHelpers";

const FORMAT_MAP: Record<DateGranularity, string> = {
  year: "%Y",
  month: "%Y-%m",
  week: "%G-W%V",
  day: "%Y-%m-%d",
};

export async function prepareDateColumns(
  conn: AsyncDuckDBConnection,
  layout: Layout,
): Promise<Layout> {
  const result: Layout = [];

  for (const entry of layout) {
    if (entry.type !== "DATE") {
      result.push(entry);
      continue;
    }

    const granularity = entry.granularity ?? "month";
    const fmt = FORMAT_MAP[granularity];
    const col = esc(entry.key);

    await conn.query(
      `UPDATE survey SET "${col}" = STRFTIME('${fmt}', CAST("${col}" AS DATE)) WHERE "${col}" IS NOT NULL`,
    );

    const distinct = await conn.query(
      `SELECT DISTINCT "${col}" AS v FROM survey WHERE "${col}" IS NOT NULL ORDER BY v`,
    );
    const values = distinct.toArray().map((r) => String(r.v));

    result.push({
      key: entry.key,
      label: entry.label ?? entry.key,
      type: "SA",
      items: values.map((v) => ({ code: v, label: v })),
    });
  }

  return result;
}

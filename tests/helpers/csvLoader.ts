import { getDb, getConn } from "./duckdb";

export function buildCSV(
  headers: string[],
  rows: (string | number | null)[][],
): string {
  const escape = (v: string | number | null): string => {
    if (v === null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n") + "\n";
}

export async function loadCSV(csvText: string): Promise<void> {
  const db = getDb();
  const conn = getConn();
  await db.registerFileText("survey.csv", csvText);
  await conn.query(
    `CREATE OR REPLACE VIEW survey AS SELECT * FROM read_csv('survey.csv')`,
  );
}

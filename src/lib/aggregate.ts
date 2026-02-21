/** JS版集計ロジック（Ruby Wasmのフォールバック用） */

export interface AggRow {
  label: string;
  count: number;
  pct: number;
}

export interface AggResult {
  col: string;
  type: "SA" | "MA";
  n: number;
  rows: AggRow[];
}

function totalN(
  data: Record<string, string>[],
  weightCol: string
): number {
  if (!weightCol) return data.length;
  return data.reduce((s, r) => s + (parseFloat(r[weightCol]) || 0), 0);
}

export function aggregate(
  data: Record<string, string>[],
  headers: string[],
  colTypes: Record<string, string>,
  weightCol: string
): AggResult[] {
  const results: AggResult[] = [];

  // SA集計
  const saColumns = headers.filter((col) => colTypes[col] === "sa");
  saColumns.forEach((col) => {
    const n = totalN(data, weightCol);
    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const val = row[col];
      if (val === "" || val === null || val === undefined) return;
      const w = weightCol ? parseFloat(row[weightCol]) || 0 : 1;
      counts[val] = (counts[val] || 0) + w;
    });

    const sortedKeys = Object.keys(counts).sort((a, b) => {
      const na = parseFloat(a),
        nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    results.push({
      col,
      type: "SA",
      n,
      rows: sortedKeys.map((k) => ({
        label: k,
        count: counts[k],
        pct: n > 0 ? (counts[k] / n) * 100 : 0,
      })),
    });
  });

  // MAグループ集計
  const maGroups: Record<string, string[]> = {};
  headers.forEach((col) => {
    const t = colTypes[col];
    if (t && t.startsWith("ma:")) {
      const prefix = t.slice(3);
      if (!maGroups[prefix]) maGroups[prefix] = [];
      maGroups[prefix].push(col);
    }
  });

  Object.entries(maGroups).forEach(([prefix, cols]) => {
    const n = totalN(data, weightCol);
    const rows = cols.map((col) => {
      let count = 0;
      data.forEach((row) => {
        const val = row[col];
        if (val === "1" || val === "true") {
          const w = weightCol ? parseFloat(row[weightCol]) || 0 : 1;
          count += w;
        }
      });
      return {
        label: col,
        count,
        pct: n > 0 ? (count / n) * 100 : 0,
      };
    });

    results.push({ col: prefix, type: "MA", n, rows });
  });

  return results;
}

/** JS版集計ロジック（Ruby Wasmのフォールバック用） */

export interface AggRow {
  label: string;
  count: number;
  pct: number;
}

export interface CrossHeader {
  label: string;
  n: number;
}

export interface CrossSection {
  cross_col: string;
  headers: CrossHeader[];
  rows: {
    label: string;
    cells: { count: number; pct: number }[];
  }[];
}

export interface AggResult {
  col: string;
  type: "SA" | "MA";
  n: number;
  rows: AggRow[];
  cross?: CrossSection[];
}

function totalN(
  data: Record<string, string>[],
  weightCol: string
): number {
  if (!weightCol) return data.length;
  return data.reduce((s, r) => s + (parseFloat(r[weightCol]) || 0), 0);
}

function computeCrossSection(
  data: Record<string, string>[],
  rowCol: string,
  rowValues: string[],
  crossCol: string,
  weightCol: string
): CrossSection {
  const crossValSet = new Set<string>();
  data.forEach((r) => {
    const v = r[crossCol];
    if (v !== "" && v !== null && v !== undefined) crossValSet.add(v);
  });
  const crossValues = Array.from(crossValSet).sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const headers: CrossHeader[] = crossValues.map((cv) => {
    const subset = data.filter((r) => r[crossCol] === cv);
    const n = weightCol
      ? subset.reduce((s, r) => s + (parseFloat(r[weightCol]) || 0), 0)
      : subset.length;
    return { label: cv, n };
  });

  const rows = rowValues.map((rv) => {
    const cells = crossValues.map((cv, i) => {
      const subset = data.filter((r) => r[rowCol] === rv && r[crossCol] === cv);
      const count = weightCol
        ? subset.reduce((s, r) => s + (parseFloat(r[weightCol]) || 0), 0)
        : subset.length;
      const crossN = headers[i].n;
      return { count, pct: crossN > 0 ? (count / crossN) * 100 : 0 };
    });
    return { label: rv, cells };
  });

  return { cross_col: crossCol, headers, rows };
}

export function aggregate(
  data: Record<string, string>[],
  headers: string[],
  colTypes: Record<string, string>,
  weightCol: string,
  crossCols: string[] = []
): AggResult[] {
  const results: AggResult[] = [];

  // SA集計（クロス軸列は除外）
  const saColumns = headers.filter(
    (col) => colTypes[col] === "sa" && !crossCols.includes(col)
  );
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

    const rows: AggRow[] = sortedKeys.map((k) => ({
      label: k,
      count: counts[k],
      pct: n > 0 ? (counts[k] / n) * 100 : 0,
    }));

    const result: AggResult = { col, type: "SA", n, rows };

    if (crossCols.length > 0) {
      result.cross = crossCols.map((cc) =>
        computeCrossSection(data, col, sortedKeys, cc, weightCol)
      );
    }

    results.push(result);
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

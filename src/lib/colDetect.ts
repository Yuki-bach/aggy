/** MA自動検出: "prefix_数字" の連続列をMAグループとして検出 */
export function detectMAGroups(cols: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const prefixCount: Record<string, number> = {};

  cols.forEach((col) => {
    const m = col.match(/^(.+?)_(\d+)$/);
    if (m) {
      const prefix = m[1];
      prefixCount[prefix] = (prefixCount[prefix] || 0) + 1;
    }
  });

  cols.forEach((col) => {
    const m = col.match(/^(.+?)_(\d+)$/);
    if (m && prefixCount[m[1]] >= 2) {
      result[col] = m[1];
    }
  });

  return result;
}

/** 列のデフォルト種別を推定 */
export function guessColType(
  col: string,
  maGroups: Record<string, string>
): string {
  const maPrefix = maGroups[col];
  if (maPrefix) return `ma:${maPrefix}`;
  if (col.toLowerCase() === "id" || col.toLowerCase() === "respondent_id")
    return "id";
  if (col.toLowerCase() === "weight" || col.toLowerCase() === "wt")
    return "weight";
  return "sa";
}

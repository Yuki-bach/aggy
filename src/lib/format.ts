/** n値をフォーマット: 整数→カンマ区切り、小数→小数点1桁 */
export function formatN(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** NA統計値をフォーマット: null→"-", n→カンマ区切り, 他→小数2桁 */
export function formatStat(key: string, value: number | null): string {
  if (value === null) return "-";
  if (key === "n") return value.toLocaleString();
  return value.toFixed(2);
}

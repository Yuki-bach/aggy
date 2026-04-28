/** n値をフォーマット: 整数→そのまま、小数→小数点1桁 */
export function formatN(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

/** NA統計値をフォーマット: null→"-", n→整数, 他→小数2桁 */
export function formatStat(key: string, value: number | null): string {
  if (value === null) return "-";
  if (key === "n") return formatN(value);
  return value.toFixed(2);
}

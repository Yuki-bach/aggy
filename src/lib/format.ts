/** n値をフォーマット: 整数→カンマ区切り、小数→小数点1桁 */
export function formatN(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** NA統計値のフォーマット: n はロケール整数、それ以外は小数2桁 */
export function formatStat(key: string, value: number): string {
  if (key === "n") return value.toLocaleString();
  return value.toFixed(2);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test("formatStat: n はロケール整数表示", () => {
    expect(formatStat("n", 1234)).toBe("1,234");
  });
  test("formatStat: mean は小数2桁", () => {
    expect(formatStat("mean", 3.5)).toBe("3.50");
  });
}

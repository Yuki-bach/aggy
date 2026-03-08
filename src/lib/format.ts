/** n値をフォーマット: 整数→カンマ区切り、小数→小数点1桁 */
export function formatN(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

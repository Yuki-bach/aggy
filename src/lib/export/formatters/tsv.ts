import type { Tally } from "../../agg/types";
import { talliesToLongRows } from "./longFormat";

export function formatTSV(tallies: Tally[]): string {
  const rows = talliesToLongRows(tallies);
  return rows.map((r) => r.join("\t")).join("\n");
}

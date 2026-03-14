import type { Tally } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import { Th, Td } from "./TableCells";

interface NaGrandTotalTableProps {
  tally: Tally;
}

const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function NaGrandTotalTable({ tally }: NaGrandTotalTableProps) {
  const stats = tally.slices[0].stats!;

  return (
    <table class="w-full border-collapse text-sm tabular-nums">
      <caption class="sr-only">{t("table.caption.grandTotal", { question: tally.label })}</caption>
      <thead>
        <tr>
          <Th>{t("table.option")}</Th>
          <Th right></Th>
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {STAT_KEYS.map((key) => (
          <tr key={key}>
            <Td>{t(`na.stat.${key}`)}</Td>
            <Td right mono>
              {formatStat(key, stats[key])}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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

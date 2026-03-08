import type { Tally } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import { Th, Td } from "./TableCells";

interface NaGtTableProps {
  tally: Tally;
}

const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function NaGtTable({ tally }: NaGtTableProps) {
  const stats = tally.slices[0].stats!;

  return (
    <table class="w-full border-collapse text-sm tabular-nums">
      <caption class="sr-only">{t("table.caption.gt", { question: tally.label })}</caption>
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

function formatStat(key: string, value: number): string {
  if (key === "n") return value.toLocaleString();
  return value.toFixed(2);
}

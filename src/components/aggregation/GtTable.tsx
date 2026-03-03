import type { Tally } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import { Th, Td } from "./TableCells";
import { useAggregation } from "./AggregationContext";

interface GtTableProps {
  tally: Tally;
  maxPct: number;
}

export function GtTable({ tally, maxPct }: GtTableProps) {
  const { weightCol } = useAggregation();
  const slice = tally.slices[0];

  return (
    <table class="w-full border-collapse text-sm tabular-nums">
      <caption class="sr-only">{t("table.caption.gt", { question: tally.label })}</caption>
      <thead>
        <tr>
          <Th>{t("table.option")}</Th>
          <Th right>n</Th>
          <Th right>%</Th>
          <Th aria-hidden="true">
            <span class="sr-only">{t("table.graph")}</span>
          </Th>
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {tally.codes.map((code, i) => {
          const cell = slice.cells[i];
          const label = tally.labels[code] ?? code;
          const countStr =
            tally.type === "SA" && !weightCol ? cell.count.toLocaleString() : cell.count.toFixed(1);
          const barWidth = ((cell.pct / Math.max(maxPct, 1)) * 72).toFixed(1);

          return (
            <tr key={code}>
              <Td>{label}</Td>
              <Td right mono>
                {countStr}
              </Td>
              <Td right mono class="text-muted">
                {cell.pct.toFixed(1)}%
              </Td>
              <td class="py-3 pr-4 pl-0 border-b border-row-border w-20" aria-hidden="true">
                <div
                  class="h-1.5 bg-accent rounded transition-[width] duration-[400ms] opacity-80"
                  style={{ width: `${barWidth}px` }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

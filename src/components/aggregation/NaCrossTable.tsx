import type { NumericTally } from "../../lib/agg/types";
import { formatN } from "../../lib/format";
import { t } from "../../lib/i18n";

interface NaCrossTableProps {
  gtTally: NumericTally;
  crossTallies: NumericTally[];
}

const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

export function NaCrossTable({ gtTally, crossTallies }: NaCrossTableProps) {
  const gtStats = gtTally.slices[0].stats;

  const crossGroups = crossTallies.map((ct) => ({
    axis: ct.by!,
    tally: ct,
  }));

  const hasMultipleAxes = crossGroups.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: gtTally.label })}</caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th class={`${TH_BASE} text-center bg-gt-bg text-accent`}>{t("table.total")}</th>
          {crossGroups.map((group) => (
            <th
              key={group.axis.code}
              colSpan={group.tally.slices.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {group.axis.label}
            </th>
          ))}
        </tr>
        <tr>
          <th class={`${TH_BASE} text-right text-xs bg-surface2`} />
          {crossGroups.map((group, gi) =>
            group.tally.slices.map((slice, si) => (
              <th
                key={`${group.axis.code}-${slice.code}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {group.axis.labels[slice.code!]}
                <br />
                <span class="text-muted text-xs font-normal">n={formatN(slice.stats.n)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {STAT_KEYS.map((key) => (
          <tr key={key}>
            <td class={`${TD_BASE} text-left text-sm`}>{t(`na.stat.${key}`)}</td>
            <td class={`${TD_BASE} ${MONO} text-accent`}>{formatStat(key, gtStats[key])}</td>
            {crossGroups.map((group, gi) =>
              group.tally.slices.map((slice, si) => (
                <td
                  key={`${group.axis.code}-${slice.code}`}
                  class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
                >
                  {formatStat(key, slice.stats[key])}
                </td>
              )),
            )}
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

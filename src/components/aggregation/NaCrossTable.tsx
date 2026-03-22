import type { Tab } from "../../lib/agg/types";
import { formatN, formatStat } from "../../lib/format";
import { t } from "../../lib/i18n";
import { TH_BASE, TD_BASE, MONO } from "./TableCells";

interface NaCrossTableProps {
  tab: Tab;
  crossTabs: Tab[];
}

const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function NaCrossTable({ tab, crossTabs }: NaCrossTableProps) {
  const tabStats = tab.slices[0].stats!;

  const crossGroups = crossTabs.map((ct) => ({
    axis: ct.by!,
    tab: ct,
  }));

  const hasMultipleAxes = crossGroups.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: tab.label })}</caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th class={`${TH_BASE} text-center bg-tab-bg text-accent`}>{t("table.total")}</th>
          {crossGroups.map((group) => (
            <th
              key={group.axis.code}
              colSpan={group.tab.slices.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {group.axis.label}
            </th>
          ))}
        </tr>
        <tr>
          <th class={`${TH_BASE} text-right text-xs bg-surface2`} />
          {crossGroups.map((group, gi) =>
            group.tab.slices.map((slice, si) => (
              <th
                key={`${group.axis.code}-${slice.code}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {group.axis.labels[slice.code!]}
                <br />
                <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {STAT_KEYS.map((key) => (
          <tr key={key}>
            <td class={`${TD_BASE} text-left text-sm`}>{t(`na.stat.${key}`)}</td>
            <td class={`${TD_BASE} ${MONO} text-accent`}>{formatStat(key, tabStats[key])}</td>
            {crossGroups.map((group, gi) =>
              group.tab.slices.map((slice, si) => (
                <td
                  key={`${group.axis.code}-${slice.code}`}
                  class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
                >
                  {formatStat(key, slice.stats![key])}
                </td>
              )),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

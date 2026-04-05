<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { formatN, formatStat } from "../../lib/format";
  import { t } from "../../lib/i18n.svelte";
  import { TH_BASE, TD_BASE, MONO } from "./tableCellStyles";

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
  }

  let { tab, crossTabs }: Props = $props();

  const STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

  let tabStats = $derived(tab.slices[0].stats!);
  let crossGroups = $derived(
    crossTabs.map((ct) => ({
      axis: ct.by!,
      tab: ct,
    })),
  );
  let hasMultipleAxes = $derived(crossGroups.length > 1);
</script>

<table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
  <caption class="sr-only">{t("table.caption.cross", { question: tab.label })}</caption>
  <thead>
    <tr>
      <th rowspan="2" class="py-3 px-4"></th>
      <th class="{TH_BASE} text-center bg-tab-bg text-accent">{t("table.total")}</th>
      {#each crossGroups as group (group.axis.code)}
        <th
          colspan={group.tab.slices.length}
          class="{TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 {hasMultipleAxes
            ? 'border-l-2 border-l-border-strong'
            : ''}"
        >
          {group.axis.label}
        </th>
      {/each}
    </tr>
    <tr>
      <th class="{TH_BASE} text-right text-xs bg-surface2"></th>
      {#each crossGroups as group, gi (group.axis.code)}
        {#each group.tab.slices as slice, si (`${group.axis.code}-${slice.code}`)}
          <th
            class="{TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 {hasMultipleAxes &&
            si === 0 &&
            gi > 0
              ? 'border-l-2 border-l-border-strong'
              : ''}"
          >
            {group.axis.labels[slice.code!]}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
          </th>
        {/each}
      {/each}
    </tr>
  </thead>
  <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
    {#each STAT_KEYS as key (key)}
      <tr>
        <td class="{TD_BASE} text-left text-sm">{t(`na.stat.${key}`)}</td>
        <td class="{TD_BASE} {MONO} text-accent">{formatStat(key, tabStats[key])}</td>
        {#each crossGroups as group, gi (group.axis.code)}
          {#each group.tab.slices as slice, si (`${group.axis.code}-${slice.code}`)}
            <td
              class="{TD_BASE} {MONO} text-accent2 border-l border-l-row-border {hasMultipleAxes &&
              si === 0 &&
              gi > 0
                ? 'border-l-2 border-l-border-strong'
                : ''}"
            >
              {formatStat(key, slice.stats![key])}
            </td>
          {/each}
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

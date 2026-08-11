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
      <th scope="col" rowspan="2" class="py-3 px-4">
        <span class="sr-only">{t("table.option")}</span>
      </th>
      <th scope="col" class="{TH_BASE} text-center bg-tab-bg text-accent">{t("table.total")}</th>
      {#each crossGroups as group (group.axis.code)}
        <th
          scope="colgroup"
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
      <th scope="col" class="{TH_BASE} text-right text-xs bg-surface2">
        <span class="sr-only">{t("table.value")}</span>
      </th>
      {#each crossGroups as group, gi (group.axis.code)}
        {#each group.tab.slices as slice, si (`${group.axis.code}-${slice.code}`)}
          <th
            scope="col"
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
        <th scope="row" class="{TD_BASE} text-left text-sm font-normal">
          {t(`na.stat.${key}`)}
        </th>
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

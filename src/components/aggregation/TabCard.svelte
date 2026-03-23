<script lang="ts">
  import type { Tab } from "../../lib/agg/types";
  import ChartCardBody from "./ChartCardBody.svelte";
  import CrossTable from "./CrossTable.svelte";
  import TabTable from "./TabTable.svelte";
  import NaChartCardBody from "./NaChartCardBody.svelte";
  import NaCrossTable from "./NaCrossTable.svelte";
  import NaTabTable from "./NaTabTable.svelte";
  import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";
  import { formatN } from "../../lib/format";

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
    viewMode: ViewMode;
    tableOpts: TableOpts;
    chartOpts: ChartOpts;
  }

  let { tab, crossTabs, viewMode, tableOpts, chartOpts }: Props = $props();

  let hasCross = $derived(crossTabs.length > 0);
  let tabN = $derived(tab.slices[0]?.n ?? 0);
  let isNA = $derived(tab.type === "NA");
</script>

<div
  class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm{hasCross
    ? ' overflow-x-auto'
    : ''}"
>
  <div class="flex items-baseline gap-3 border-b border-border p-4">
    <div class="flex min-w-0 flex-col gap-0.5">
      <span class="text-sm font-bold text-accent">{tab.label}</span>
      <span class="text-xs tracking-wide text-muted">{tab.questionCode}</span>
    </div>
    <span class="text-xs tracking-wide text-muted">{tab.type}</span>
    <span class="ml-auto text-xs text-muted">n={formatN(tabN)}</span>
  </div>

  {#if viewMode === "chart"}
    {#if isNA}
      <NaChartCardBody {tab} {crossTabs} paletteId={chartOpts.paletteId} />
    {:else}
      <ChartCardBody
        {tab}
        {crossTabs}
        tabChartType={tab.type === "SA" ? chartOpts.saChartType : chartOpts.maChartType}
        paletteId={chartOpts.paletteId}
      />
    {/if}
  {:else if isNA}
    {#if hasCross}
      <NaCrossTable {tab} {crossTabs} />
    {:else}
      <NaTabTable {tab} />
    {/if}
  {:else if hasCross}
    <CrossTable {tab} {crossTabs} basis={tableOpts.basis} />
  {:else}
    <TabTable {tab} maxPct={tableOpts.maxPct} />
  {/if}
</div>

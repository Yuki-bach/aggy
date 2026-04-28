<script lang="ts">
  import type { Tab } from "../../lib/types";
  import MatrixGtTable from "./MatrixGtTable.svelte";
  import MatrixNaGtTable from "./MatrixNaGtTable.svelte";
  import MatrixGtChart from "./MatrixGtChart.svelte";
  import MatrixNaGtChart from "./MatrixNaGtChart.svelte";
  import CrossTable from "./CrossTable.svelte";
  import NaCrossTable from "./NaCrossTable.svelte";
  import ChartCardBody from "./ChartCardBody.svelte";
  import NaChartCardBody from "./NaChartCardBody.svelte";
  import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";

  interface MatrixItem {
    gtTab: Tab;
    crossTabs: Tab[];
  }

  interface Props {
    matrix: { key: string; label: string };
    items: MatrixItem[];
    viewMode: ViewMode;
    tableOpts: TableOpts;
    chartOpts: ChartOpts;
  }

  let { matrix, items, viewMode, tableOpts, chartOpts }: Props = $props();

  let hasCross = $derived(items.some((it) => it.crossTabs.length > 0));
  let firstType = $derived(items[0]?.gtTab.type ?? "SA");
  let gtTabs = $derived(items.map((it) => it.gtTab));
  let chartType = $derived(firstType === "MA" ? chartOpts.maChartType : chartOpts.saChartType);
</script>

<div
  class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm{hasCross
    ? ' overflow-x-auto'
    : ''}"
>
  <div class="flex items-baseline gap-3 border-b border-border p-4">
    <div class="flex min-w-0 flex-col gap-0.5">
      <span class="text-sm font-bold text-accent">{matrix.label}</span>
      <span class="text-xs tracking-wide text-muted">{matrix.key}</span>
    </div>
    <span class="text-xs tracking-wide text-muted">{firstType} MATRIX</span>
  </div>

  {#if viewMode === "chart"}
    {#if hasCross}
      <div class="divide-y divide-border">
        {#each items as it (it.gtTab.questionCode)}
          <div>
            <div class="bg-surface2 px-4 py-2 text-xs font-bold text-muted">
              {it.gtTab.label}
              <span class="ml-2 text-muted">({it.gtTab.questionCode})</span>
            </div>
            {#if it.gtTab.type === "NA"}
              <NaChartCardBody
                tab={it.gtTab}
                crossTabs={it.crossTabs}
                paletteId={chartOpts.paletteId}
              />
            {:else}
              <ChartCardBody
                tab={it.gtTab}
                crossTabs={it.crossTabs}
                tabChartType={it.gtTab.type === "SA"
                  ? chartOpts.saChartType
                  : chartOpts.maChartType}
                paletteId={chartOpts.paletteId}
              />
            {/if}
          </div>
        {/each}
      </div>
    {:else if firstType === "NA"}
      <MatrixNaGtChart tabs={gtTabs} paletteId={chartOpts.paletteId} />
    {:else}
      <MatrixGtChart tabs={gtTabs} {chartType} paletteId={chartOpts.paletteId} />
    {/if}
  {:else if hasCross}
    <div class="divide-y divide-border">
      {#each items as it (it.gtTab.questionCode)}
        <div>
          <div class="bg-surface2 px-4 py-2 text-xs font-bold text-muted">
            {it.gtTab.label}
            <span class="ml-2 text-muted">({it.gtTab.questionCode})</span>
          </div>
          {#if it.gtTab.type === "NA"}
            <NaCrossTable tab={it.gtTab} crossTabs={it.crossTabs} />
          {:else}
            <CrossTable tab={it.gtTab} crossTabs={it.crossTabs} basis={tableOpts.basis} />
          {/if}
        </div>
      {/each}
    </div>
  {:else if firstType === "NA"}
    <MatrixNaGtTable tabs={gtTabs} />
  {:else}
    <MatrixGtTable tabs={gtTabs} />
  {/if}
</div>

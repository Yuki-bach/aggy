<script lang="ts">
  import { onMount } from "svelte";
  import type { Tab } from "@aggy/lib";
  import Toolbar from "./Toolbar.svelte";
  import ViewOpts from "./ViewOpts.svelte";
  import TabCard from "./TabCard.svelte";
  import AIBubble from "./AIBubble.svelte";
  import { t } from "../../lib/i18n.svelte";
  import type { Basis, ChartType, ViewMode } from "./viewTypes";
  import type { PaletteId } from "../../lib/chartConfig";

  interface Props {
    tabs: Tab[] | null;
    weightCol: string;
  }

  let { tabs, weightCol }: Props = $props();

  let viewMode = $state<ViewMode>("table");
  let saChartType = $state<ChartType>("bar-h");
  let maChartType = $state<ChartType>("bar-h");
  let basis = $state<Basis>("column");
  let paletteId = $state<PaletteId>("default");
  let themeTick = $state(0);

  // Re-render on theme change (needed for canvas-based charts)
  $effect(() => {
    const observer = new MutationObserver(() => {
      themeTick++;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  });

  let callbacks = $derived({
    onViewModeChange: (m: ViewMode) => (viewMode = m),
    onSaChartTypeChange: (ct: ChartType) => (saChartType = ct),
    onMaChartTypeChange: (ct: ChartType) => (maChartType = ct),
    onBasisChange: (b: Basis) => (basis = b),
    onPaletteChange: (id: PaletteId) => (paletteId = id),
  });

  let questionCodes = $derived(tabs ? [...new Set(tabs.map((tab) => tab.questionCode))] : []);
  let hasCross = $derived(tabs?.some((tab) => tab.by !== null) ?? false);

  let maxPct = $derived(
    Math.max(
      ...(tabs
        ?.filter((tab) => tab.by === null && tab.type !== "NA")
        .flatMap((tab) => tab.slices[0]?.cells.map((c) => c.pct ?? 0) ?? []) ?? []),
      0,
    ),
  );
  let tableOpts = $derived({ basis, maxPct });
  let chartOpts = $derived({ saChartType, maChartType, paletteId });

  let minWidth = $derived(viewMode === "chart" ? "400px" : "360px");
  let gridClass = $derived(
    hasCross
      ? "grid grid-cols-1 gap-6"
      : `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))] gap-6`,
  );
</script>

<div class="overflow-y-auto bg-bg p-6" role="region" aria-label={t("section.results")}>
  {#if tabs}
    <div aria-live="polite">
      <Toolbar {tabs} {weightCol} currentViewMode={viewMode} {callbacks} />
      <ViewOpts
        currentViewMode={viewMode}
        currentBasis={basis}
        {hasCross}
        {chartOpts}
        {callbacks}
      />
      <div class={gridClass}>
        {#each questionCodes as q (q)}
          <TabCard
            tab={tabs.find((tab) => tab.questionCode === q && tab.by === null)!}
            crossTabs={tabs.filter((tab) => tab.questionCode === q && tab.by !== null)}
            {viewMode}
            {tableOpts}
            {chartOpts}
          />
        {/each}
      </div>
      <AIBubble {tabs} {weightCol} />
    </div>
  {:else}
    <div class="flex h-full flex-col items-center justify-center gap-3 text-muted">
      <span class="text-4xl" aria-hidden="true">&#x2B1B;</span>
      <p class="text-base">{t("empty.text")}</p>
    </div>
  {/if}
</div>

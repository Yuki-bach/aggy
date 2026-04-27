<script lang="ts">
  import type { Question, Tab } from "../../lib/types";
  import Toolbar from "./Toolbar.svelte";
  import TabCard from "./TabCard.svelte";
  import MatrixTabCard from "./MatrixTabCard.svelte";
  import AIBubble from "./AIBubble.svelte";
  import Alert from "../shared/Alert.svelte";
  import { t } from "../../lib/i18n.svelte";
  import type { Basis, ChartType, ViewMode } from "./viewTypes";
  import type { PaletteId } from "../../lib/chartConfig";

  interface Props {
    tabs: Tab[] | null;
    weightCol: string;
    questions: Question[];
    crossSelected: Record<string, boolean>;
    onCrossToggle: (key: string, checked: boolean) => void;
    weightColumnName: string;
    weightEnabled: boolean;
    onWeightToggle: (on: boolean) => void;
    errorMsg: string;
  }

  let {
    tabs,
    weightCol,
    questions,
    crossSelected,
    onCrossToggle,
    weightColumnName,
    weightEnabled,
    onWeightToggle,
    errorMsg,
  }: Props = $props();

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

  type RenderItem =
    | { kind: "single"; questionCode: string }
    | {
        kind: "matrix";
        matrix: { key: string; label: string };
        questionCodes: string[];
      };

  let renderItems = $derived.by<RenderItem[]>(() => {
    if (!tabs) return [];
    const gtByCode = new Map<string, Tab>();
    for (const tab of tabs) {
      if (tab.by === null) gtByCode.set(tab.questionCode, tab);
    }
    const emittedMatrix = new Set<string>();
    const items: RenderItem[] = [];
    for (const code of questionCodes) {
      const gt = gtByCode.get(code);
      const mx = gt?.matrix;
      if (mx) {
        if (emittedMatrix.has(mx.key)) continue;
        emittedMatrix.add(mx.key);
        const children = questionCodes.filter((c) => gtByCode.get(c)?.matrix?.key === mx.key);
        items.push({ kind: "matrix", matrix: mx, questionCodes: children });
      } else {
        items.push({ kind: "single", questionCode: code });
      }
    }
    return items;
  });

  let tableOpts = $derived({ basis });
  let chartOpts = $derived({ saChartType, maChartType, paletteId });

  let minWidth = $derived(viewMode === "chart" ? "400px" : "360px");
  let gridClass = $derived(
    hasCross
      ? "grid grid-cols-1 gap-6"
      : `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))] gap-6`,
  );
</script>

<div class="flex min-h-0 flex-col bg-bg" role="region" aria-label={t("section.results")}>
  {#if errorMsg}
    <Alert variant="error" class="mx-6 mt-4 shrink-0">
      {errorMsg}
    </Alert>
  {/if}

  <div class="min-h-0 flex-1 overflow-y-auto p-6">
    {#if tabs}
      <div aria-live="polite">
        <Toolbar
          {tabs}
          {weightCol}
          currentViewMode={viewMode}
          currentBasis={basis}
          {hasCross}
          {chartOpts}
          {callbacks}
          {questions}
          {crossSelected}
          {onCrossToggle}
          {weightColumnName}
          {weightEnabled}
          {onWeightToggle}
        />
        <div class={gridClass}>
          {#each renderItems as item (item.kind === "matrix" ? `m:${item.matrix.key}` : `s:${item.questionCode}`)}
            {#if item.kind === "matrix"}
              <MatrixTabCard
                matrix={item.matrix}
                items={item.questionCodes.map((c) => ({
                  gtTab: tabs.find((tab) => tab.questionCode === c && tab.by === null)!,
                  crossTabs: tabs.filter((tab) => tab.questionCode === c && tab.by !== null),
                }))}
                {viewMode}
                {tableOpts}
                {chartOpts}
              />
            {:else}
              <TabCard
                tab={tabs.find((tab) => tab.questionCode === item.questionCode && tab.by === null)!}
                crossTabs={tabs.filter((tab) => tab.questionCode === item.questionCode && tab.by !== null)}
                {viewMode}
                {tableOpts}
                {chartOpts}
              />
            {/if}
          {/each}
        </div>
        <AIBubble {tabs} {weightCol} />
      </div>
    {/if}
  </div>
</div>

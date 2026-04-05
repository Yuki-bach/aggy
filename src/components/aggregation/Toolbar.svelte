<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import ExportMenu from "./ExportMenu.svelte";
  import { executeExport, type ExportAction } from "../../lib/export/export";
  import type { Basis, ChartOpts, ChartType, ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";
  import { getPaletteBase, getPaletteIds } from "../../lib/chartConfig";
  import { clickOutside } from "../../lib/dismiss";

  interface Props {
    tabs: Tab[];
    weightCol: string;
    currentViewMode: ViewMode;
    currentBasis: Basis;
    hasCross: boolean;
    chartOpts: ChartOpts;
    callbacks: ToolbarCallbacks;
  }

  let { tabs, weightCol, currentViewMode, currentBasis, hasCross, chartOpts, callbacks }: Props =
    $props();

  let weightText = $derived(
    weightCol
      ? t("result.weight.applied", { col: weightCol })
      : t("result.weight.none"),
  );
  let questionCount = $derived(new Set(tabs.map((tab) => tab.questionCode)).size);

  let detailOpen = $state(false);
  let hasDetailSettings = $derived(hasCross || currentViewMode === "chart");
</script>

<div class="mb-6 flex items-center gap-4">
  <h2 class="text-xl font-bold">{t("result.title.tab")}</h2>
  <span class="text-xs text-muted">
    {t("result.meta", { count: questionCount, weight: weightText })}
  </span>

  <ToggleGroup class="ml-auto">
    <ToggleButton
      active={currentViewMode === "table"}
      onclick={() => currentViewMode !== "table" && callbacks.onViewModeChange("table")}
    >
      {t("result.view.table")}
    </ToggleButton>
    <ToggleButton
      active={currentViewMode === "chart"}
      onclick={() => currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
    >
      {t("result.view.chart")}
    </ToggleButton>
  </ToggleGroup>

  {#if hasDetailSettings}
    <div
      class="relative"
      {@attach clickOutside({ onClose: () => (detailOpen = false) })}
    >
      <button
        class="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
        onclick={() => (detailOpen = !detailOpen)}
        aria-label={t("display.settings")}
        title={t("display.settings")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {#if detailOpen}
        <div
          class="absolute right-0 z-10 mt-1 w-60 rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <!-- テーブル設定 -->
          {#if hasCross}
            <div class="mb-3">
              <div class="mb-1 text-xs font-medium tracking-wide text-muted uppercase">
                {t("display.tableSettings")}
              </div>
              <div class="flex items-center justify-between text-xs text-text-secondary">
                <span>{t("display.pctBasis")}</span>
                <ToggleGroup>
                  <ToggleButton
                    active={currentBasis === "column"}
                    onclick={() => currentBasis !== "column" && callbacks.onBasisChange("column")}
                  >
                    {t("result.pct.column")}
                  </ToggleButton>
                  <ToggleButton
                    active={currentBasis === "row"}
                    onclick={() => currentBasis !== "row" && callbacks.onBasisChange("row")}
                  >
                    {t("result.pct.row")}
                  </ToggleButton>
                </ToggleGroup>
              </div>
            </div>
          {/if}

          <!-- チャート設定 -->
          {#if currentViewMode === "chart"}
            <div class={["", hasCross && "border-t border-border pt-3"]}>
              <div class="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                {t("display.chartSettings")}
              </div>
              <div class="flex flex-col gap-2 text-xs text-text-secondary">
                <div class="flex items-center justify-between">
                  <span>{t("display.saType")}</span>
                  <select
                    class="cursor-pointer rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text"
                    value={chartOpts.saChartType}
                    onchange={(e) =>
                      callbacks.onSaChartTypeChange(
                        (e.target as HTMLSelectElement).value as ChartType,
                      )}
                  >
                    <option value="bar-h">{t("chart.barH")}</option>
                    <option value="bar-v">{t("chart.barV")}</option>
                    <option value="obi">{t("chart.obi")}</option>
                  </select>
                </div>
                <div class="flex items-center justify-between">
                  <span>{t("display.maType")}</span>
                  <select
                    class="cursor-pointer rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text"
                    value={chartOpts.maChartType}
                    onchange={(e) =>
                      callbacks.onMaChartTypeChange(
                        (e.target as HTMLSelectElement).value as ChartType,
                      )}
                  >
                    <option value="bar-h">{t("chart.barH")}</option>
                    <option value="bar-v">{t("chart.barV")}</option>
                    <option value="obi">{t("chart.obi")}</option>
                  </select>
                </div>
                <div class="flex items-center justify-between">
                  <span>{t("chart.palette")}</span>
                  <div
                    class="flex items-center gap-1.5"
                    role="radiogroup"
                    aria-label={t("chart.palette")}
                  >
                    {#each getPaletteIds() as id (id)}
                      {@const isActive = id === chartOpts.paletteId}
                      {@const base = getPaletteBase(id)}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={id}
                        class="size-5 cursor-pointer rounded-full border-2 transition-shadow {isActive
                          ? 'border-accent shadow-[0_0_0_1px_var(--accent)]'
                          : 'border-border hover:border-muted'}"
                        style={base
                          ? `background-color: ${base}`
                          : "background: conic-gradient(#0064d4, #0097a7, #1b7d3a, #e06500, #c62828, #6a1b9a, #0064d4)"}
                        onclick={() => callbacks.onPaletteChange(id)}
                      ></button>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <ExportMenu onExport={(action: ExportAction) => executeExport(action, tabs, weightCol)} />
</div>

<script lang="ts">
  import { t } from "../../lib/i18n.svelte";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import { clickOutside } from "../../lib/dismiss";
  import type { Basis, ChartOpts, ChartType, ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";
  import { getPaletteBase, getPaletteIds } from "../../lib/chartConfig";

  interface Props {
    currentViewMode: ViewMode;
    currentBasis: Basis;
    hasCross: boolean;
    chartOpts: ChartOpts;
    callbacks: ToolbarCallbacks;
  }

  let { currentViewMode, currentBasis, hasCross, chartOpts, callbacks }: Props = $props();

  let open = $state(false);
  let isDisabled = $derived(!hasCross && currentViewMode !== "chart");

  // Auto-close popover when transitioning to disabled (e.g. last cross axis unchecked)
  $effect(() => {
    if (isDisabled) open = false;
  });
</script>

<div class="relative" {@attach clickOutside({ onClose: () => (open = false) })}>
  <button
    type="button"
    disabled={isDisabled}
    class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors {isDisabled
      ? 'cursor-not-allowed border-border text-muted opacity-50'
      : open
        ? 'border-accent text-accent'
        : 'border-border text-text-secondary hover:border-accent hover:text-accent'}"
    onclick={() => (open = !open)}
    aria-label={t("display.settings")}
    aria-expanded={open}
    aria-haspopup="dialog"
    title={isDisabled ? t("display.disabled.tooltip") : undefined}
  >
    <span>{t("display.settings")}</span>
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="transition-transform {!isDisabled && open ? 'rotate-180' : ''}"
      aria-hidden="true"
    >
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-border bg-surface p-3 shadow-lg"
      role="dialog"
      aria-label={t("display.settings")}
    >
      <!-- View mode (only when cross-tab present; otherwise table-only) -->
      {#if hasCross}
        <div class="mb-3 flex items-center justify-between text-xs text-text-secondary">
          <span class="font-medium uppercase tracking-wide text-muted">
            {t("display.viewMode")}
          </span>
          <ToggleGroup>
            <ToggleButton
              active={currentViewMode === "table"}
              onclick={() =>
                currentViewMode !== "table" && callbacks.onViewModeChange("table")}
            >
              {t("result.view.table")}
            </ToggleButton>
            <ToggleButton
              active={currentViewMode === "chart"}
              onclick={() =>
                currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
            >
              {t("result.view.chart")}
            </ToggleButton>
          </ToggleGroup>
        </div>
      {/if}

      <!-- Table settings (basis applies to both table and chart views when hasCross) -->
      {#if hasCross}
        <div class="border-t border-border pt-3">
          <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            {t("display.tableSettings")}
          </div>
          <div class="flex items-center justify-between text-xs text-text-secondary">
            <span>{t("display.pctBasis")}</span>
            <ToggleGroup>
              <ToggleButton
                active={currentBasis === "column"}
                onclick={() =>
                  currentBasis !== "column" && callbacks.onBasisChange("column")}
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

      <!-- Chart settings -->
      {#if currentViewMode === "chart"}
        <div class={hasCross ? "border-t border-border pt-3" : ""}>
          <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
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

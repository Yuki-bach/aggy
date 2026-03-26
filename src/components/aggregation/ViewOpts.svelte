<script lang="ts">
  import { t } from "../../lib/i18n.svelte";
  import { getPaletteBase, getPaletteIds, type PaletteId } from "../../lib/chartConfig";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import type { Basis, ChartOpts, ChartType, ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";

  interface Props {
    currentViewMode: ViewMode;
    currentBasis: Basis;
    hasCross: boolean;
    chartOpts: ChartOpts;
    callbacks: Pick<
      ToolbarCallbacks,
      "onSaChartTypeChange" | "onMaChartTypeChange" | "onBasisChange" | "onPaletteChange"
    >;
  }

  let { currentViewMode, currentBasis, hasCross, chartOpts, callbacks }: Props = $props();

  let showChart = $derived(currentViewMode === "chart");
  let showPctToggle = $derived(currentViewMode === "table" && hasCross);
</script>

{#if showChart || showPctToggle}
  <div class="mb-4 flex items-center justify-end gap-4 text-xs text-text-secondary">
    {#if showChart}
      <label>
        SA:
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
      </label>
      <label>
        MA:
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
      </label>
      <div class="flex items-center gap-1.5" role="radiogroup" aria-label={t("chart.palette")}>
        <span class="mr-0.5 text-muted">{t("chart.palette")}:</span>
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
    {/if}
    {#if showPctToggle}
      <ToggleGroup class="ml-auto">
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
    {/if}
  </div>
{/if}

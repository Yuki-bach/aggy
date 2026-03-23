<script lang="ts">
  import type { Tab } from "../../lib/agg/types";
  import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
  import { t } from "../../lib/i18n.svelte";
  import type { ChartConfiguration } from "chart.js";

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
    paletteId: PaletteId;
  }

  let { tab, crossTabs, paletteId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  let isCross = $derived(crossTabs.length > 0);

  $effect(() => {
    const _tab = tab;
    const _crossTabs = crossTabs;
    const _paletteId = paletteId;
    const _isCross = isCross;

    if (!canvas) return;
    chart?.destroy();

    const theme = getThemeColors();
    if (_isCross) {
      chart = buildMeanComparisonChart(canvas, _tab, _crossTabs, theme, _paletteId);
    } else {
      chart = buildFreqChart(canvas, _tab, theme, _paletteId);
    }

    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  function buildFreqChart(
    cvs: HTMLCanvasElement,
    tb: Tab,
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    const slice = tb.slices[0];
    const stats = slice.stats!;
    const labels = tb.codes;
    const data = slice.cells.map((c) => c.count);

    return new Chart(cvs, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: getSeriesColor(0, pid),
            borderRadius: 3,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `n=${stats.n}  ${t("na.stat.mean")}=${stats.mean?.toFixed(2) ?? "-"}  SD=${stats.sd?.toFixed(2) ?? "-"}`,
            color: theme.muted,
            font: { size: 12, weight: "normal" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${t("na.stat.n")}: ${(ctx.parsed.y as number).toFixed(1)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.text },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.muted },
            grid: { color: theme.gridLine },
          },
        },
      },
    } as ChartConfiguration);
  }

  function buildMeanComparisonChart(
    cvs: HTMLCanvasElement,
    _tab: Tab,
    cts: Tab[],
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    const allSlices = cts.flatMap((ct) => {
      const axis = ct.by!;
      return ct.slices.map((s) => ({
        label: axis.labels[s.code!],
        stats: s.stats!,
      }));
    });

    const labels = allSlices.map((s) => s.label);
    const means = allSlices.map((s) => s.stats.mean ?? 0);

    return new Chart(cvs, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: t("na.stat.mean"),
            data: means,
            backgroundColor: labels.map((_, i) => getSeriesColor(i, pid)),
            borderRadius: 3,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${t("na.stat.mean")}: ${(ctx.parsed.y as number).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.text },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.muted },
            grid: { color: theme.gridLine },
          },
        },
      },
    } as ChartConfiguration);
  }
</script>

<div class="p-4 {isCross ? 'h-[400px]' : 'h-80'}">
  <canvas bind:this={canvas}></canvas>
</div>

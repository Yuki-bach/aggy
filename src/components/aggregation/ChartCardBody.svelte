<script lang="ts">
  import { onMount } from "svelte";
  import type { Tab } from "../../lib/types";
  import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
  import type { ChartType } from "./viewTypes";
  import type { ChartConfiguration } from "chart.js";

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
    tabChartType: ChartType;
    paletteId: PaletteId;
  }

  let { tab, crossTabs, tabChartType, paletteId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  let isCross = $derived(crossTabs.length > 0);

  $effect(() => {
    const _tab = tab;
    const _crossTabs = crossTabs;
    const _chartType = tabChartType;
    const _paletteId = paletteId;
    const _isCross = isCross;

    if (!canvas) return;
    chart?.destroy();

    const theme = getThemeColors();
    if (_isCross) {
      chart = buildCrossChart(canvas, _tab, _crossTabs, _chartType, theme, _paletteId);
    } else {
      chart = buildTabChart(canvas, _tab, _chartType, theme, _paletteId);
    }

    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  function buildTabChart(
    cvs: HTMLCanvasElement,
    t: Tab,
    chartType: ChartType,
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    const slice = t.slices[0];
    const labels = t.codes.map((code) => t.labels[code]);
    const data = slice.cells.map((c) => c.pct ?? 0);
    const colors = t.codes.map((_, i) => getSeriesColor(i, pid));

    if (chartType === "obi") {
      const datasets = t.codes.map((code, i) => ({
        label: t.labels[code],
        data: [slice.cells[i].pct ?? 0],
        backgroundColor: getSeriesColor(i, pid),
        maxBarThickness: 48,
      }));

      return new Chart(cvs, {
        type: "bar",
        data: { labels: [""], datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.x as number).toFixed(1)}%`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              max: 100,
              ticks: { color: theme.muted, callback: (v) => `${v}%` },
              grid: { color: theme.gridLine },
            },
            y: { stacked: true, display: false },
          },
        },
      } as ChartConfiguration);
    }

    const isHorizontal = chartType === "bar-h";

    return new Chart(cvs, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderRadius: 3,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${(ctx.parsed[isHorizontal ? "x" : "y"] as number).toFixed(1)}%`,
            },
          },
        },
        scales: {
          [isHorizontal ? "x" : "y"]: {
            beginAtZero: true,
            ticks: { color: theme.muted, callback: (v) => `${v}%` },
            grid: { color: theme.gridLine },
          },
          [isHorizontal ? "y" : "x"]: {
            ticks: { color: theme.text },
            grid: { display: false },
          },
        },
      },
    } as ChartConfiguration);
  }

  function buildCrossChart(
    cvs: HTMLCanvasElement,
    t: Tab,
    cts: Tab[],
    chartType: ChartType,
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    const allSlices = cts.flatMap((ct) => {
      const axis = ct.by!;
      return ct.slices.map((s) => ({
        slice: s,
        label: axis.labels[s.code!],
      }));
    });

    if (chartType === "obi") {
      const subLabels = allSlices.map((s) => s.label);
      const datasets = t.codes.map((code, i) => ({
        label: t.labels[code],
        data: allSlices.map((s) => s.slice.cells[i]?.pct ?? 0),
        backgroundColor: getSeriesColor(i, pid),
        maxBarThickness: 48,
      }));

      return new Chart(cvs, {
        type: "bar",
        data: { labels: subLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label}: ${(ctx.parsed.x as number).toFixed(1)}%`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              max: 100,
              ticks: { color: theme.muted, callback: (v) => `${v}%` },
              grid: { color: theme.gridLine },
            },
            y: { stacked: true, ticks: { color: theme.text }, grid: { display: false } },
          },
        },
      } as ChartConfiguration);
    }

    const isHorizontal = chartType === "bar-h";
    const labels = t.codes.map((code) => t.labels[code]);

    const datasets = allSlices.map((s, i) => ({
      label: s.label,
      data: t.codes.map((_, ci) => s.slice.cells[ci]?.pct ?? 0),
      backgroundColor: getSeriesColor(i, pid),
      borderRadius: 3,
      maxBarThickness: 40,
    }));

    return new Chart(cvs, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: {
            position: "top",
            labels: { color: theme.text, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed[isHorizontal ? "x" : "y"] as number;
                return `${ctx.dataset.label}: ${val.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          [isHorizontal ? "x" : "y"]: {
            beginAtZero: true,
            ticks: { color: theme.muted, callback: (v) => `${v}%` },
            grid: { color: theme.gridLine },
          },
          [isHorizontal ? "y" : "x"]: {
            ticks: { color: theme.text },
            grid: { display: false },
          },
        },
      },
    } as ChartConfiguration);
  }
</script>

<div class="p-4 {isCross ? 'h-[400px]' : 'h-80'}">
  <canvas bind:this={canvas}></canvas>
</div>

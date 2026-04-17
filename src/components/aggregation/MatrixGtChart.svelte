<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
  import type { ChartType } from "./viewTypes";
  import type { ChartConfiguration } from "chart.js";

  interface Props {
    tabs: Tab[];
    chartType: ChartType;
    paletteId: PaletteId;
  }

  let { tabs, chartType, paletteId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  $effect(() => {
    const _tabs = tabs;
    const _chartType = chartType;
    const _paletteId = paletteId;

    if (!canvas) return;
    chart?.destroy();
    const theme = getThemeColors();
    chart = build(canvas, _tabs, _chartType, theme, _paletteId);

    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  function build(
    cvs: HTMLCanvasElement,
    ts: Tab[],
    ct: ChartType,
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    // All children share the same codes; use the first child's codes/labels
    const codes = ts[0].codes;
    const codeLabels = codes.map((c) => ts[0].labels[c]);

    if (ct === "obi") {
      // Per-child stacked bar: rows = children, stacks = option codes
      const datasets = codes.map((code, i) => ({
        label: ts[0].labels[code],
        data: ts.map((t) => t.slices[0].cells[i]?.pct ?? 0),
        backgroundColor: getSeriesColor(i, pid),
        maxBarThickness: 48,
      }));

      return new Chart(cvs, {
        type: "bar",
        data: {
          labels: ts.map((t) => t.label),
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (c) => `${c.dataset.label}: ${(c.parsed.x as number).toFixed(1)}%`,
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

    // Grouped bar: groups = option codes, bars within = children
    const isHorizontal = ct === "bar-h";
    const datasets = ts.map((t, i) => ({
      label: t.label,
      data: codes.map((_, ci) => t.slices[0].cells[ci]?.pct ?? 0),
      backgroundColor: getSeriesColor(i, pid),
      borderRadius: 3,
      maxBarThickness: 40,
    }));

    return new Chart(cvs, {
      type: "bar",
      data: { labels: codeLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: { position: "top", labels: { color: theme.text, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (c) => {
                const val = c.parsed[isHorizontal ? "x" : "y"] as number;
                return `${c.dataset.label}: ${val.toFixed(1)}%`;
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

<div class="h-[400px] p-4">
  <canvas bind:this={canvas}></canvas>
</div>

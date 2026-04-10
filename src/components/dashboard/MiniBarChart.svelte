<script lang="ts">
  import { onMount } from "svelte";
  import type { Tab } from "../../lib/types";
  import { Chart, getSeriesColor, getThemeColors } from "../../lib/chartConfig";
  import type { ChartConfiguration } from "chart.js";

  interface Props {
    tab: Tab;
  }

  let { tab }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  $effect(() => {
    const _tab = tab;
    if (!canvas) return;
    chart?.destroy();

    const theme = getThemeColors();
    const slice = _tab.slices[0];
    if (!slice) return;

    const labels = _tab.codes.map((code) => _tab.labels[code]);
    const data = slice.cells.map((c) => c.pct ?? 0);
    const colors = _tab.codes.map((_, i) => getSeriesColor(i));

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderRadius: 2,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${(ctx.parsed.x as number).toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: theme.muted, font: { size: 10 }, callback: (v) => `${v}%` },
            grid: { color: theme.gridLine },
          },
          y: {
            ticks: { color: theme.text, font: { size: 10 } },
            grid: { display: false },
          },
        },
      },
    } as ChartConfiguration);

    return () => {
      chart?.destroy();
      chart = null;
    };
  });
</script>

<div class="h-40">
  <canvas bind:this={canvas}></canvas>
</div>

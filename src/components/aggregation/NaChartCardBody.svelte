<script lang="ts">
  import type { Tab, Cell } from "../../lib/types";
  import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
  import { t } from "../../lib/i18n.svelte";
  import type { ChartConfiguration } from "chart.js";

  interface BinResult {
    labels: string[];
    cells: Cell[];
  }

  /** Group numeric values into equal-width bins and compute frequency/pct */
  function binFrequencies(values: number[], binWidth: number): BinResult {
    if (binWidth <= 0 || values.length === 0) return { labels: [], cells: [] };

    const n = values.length;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binStart = Math.floor(minVal / binWidth) * binWidth;
    const binEnd = Math.floor(maxVal / binWidth) * binWidth + binWidth;

    const bins = new Map<number, number>();
    for (let b = binStart; b < binEnd; b += binWidth) {
      bins.set(b, 0);
    }

    for (const v of values) {
      const b = Math.floor(v / binWidth) * binWidth;
      bins.set(b, (bins.get(b) ?? 0) + 1);
    }

    const sortedKeys = [...bins.keys()].sort((a, b) => a - b);
    const labels = sortedKeys.map((b) => `${b}–${b + binWidth - 1}`);
    const cells: Cell[] = sortedKeys.map((b) => {
      const count = bins.get(b)!;
      return { count, pct: n > 0 ? (count / n) * 100 : null };
    });

    return { labels, cells };
  }

  interface Props {
    tab: Tab;
    crossTabs: Tab[];
    paletteId: PaletteId;
  }

  let { tab, crossTabs, paletteId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  let binWidth = $state(0);

  let isCross = $derived(crossTabs.length > 0);

  let stats = $derived(tab.slices[0]?.stats);
  let range = $derived(
    stats?.max !== null &&
      stats?.max !== undefined &&
      stats?.min !== null &&
      stats?.min !== undefined
      ? stats.max - stats.min
      : 0,
  );
  let sliderMax = $derived(Math.max(Math.ceil(range / 2), 1));

  /** Expand codes/cells into a flat number array (each code repeated by its count) */
  function expandValues(codes: string[], cells: { count: number }[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < codes.length; i++) {
      const v = Number(codes[i]);
      for (let j = 0; j < cells[i].count; j++) result.push(v);
    }
    return result;
  }

  $effect(() => {
    const _tab = tab;
    const _crossTabs = crossTabs;
    const _paletteId = paletteId;
    const _isCross = isCross;
    const _binWidth = binWidth;

    if (!canvas) return;
    chart?.destroy();

    const theme = getThemeColors();
    if (_isCross) {
      chart = buildMeanComparisonChart(canvas, _tab, _crossTabs, theme, _paletteId);
    } else {
      chart = buildFreqChart(canvas, _tab, theme, _paletteId, _binWidth);
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
    bw = 0,
  ): Chart {
    const slice = tb.slices[0];
    const sliceStats = slice.stats!;

    let labels: string[] = tb.codes;
    let data: number[] = slice.cells.map((c) => c.count);

    if (bw > 0) {
      const values = expandValues(tb.codes, slice.cells);
      const binned = binFrequencies(values, bw);
      labels = binned.labels;
      data = binned.cells.map((c) => c.count);
    }

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
            text: `n=${sliceStats.n}  ${t("na.stat.mean")}=${sliceStats.mean?.toFixed(2) ?? "-"}  SD=${sliceStats.sd?.toFixed(2) ?? "-"}`,
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
  {#if !isCross && range > 0}
    <div class="flex items-center justify-end gap-2 mb-2 text-xs text-muted-foreground">
      <label>
        {t("na.binWidth")}
        <input
        type="range"
        min={0}
        max={sliderMax}
        step={1}
        bind:value={binWidth}
          class="w-32"
        />
      </label>
      <span class="w-6 text-center tabular-nums">{binWidth || "–"}</span>
    </div>
  {/if}
  <canvas bind:this={canvas}></canvas>
</div>

<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
  import { t } from "../../lib/i18n.svelte";
  import type { ChartConfiguration } from "chart.js";

  interface Props {
    tabs: Tab[];
    paletteId: PaletteId;
  }

  let { tabs, paletteId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  let binWidth = $state(0);

  let globalMin = $derived(
    Math.min(
      ...tabs
        .map((tb) => tb.slices[0]?.stats?.min ?? Number.POSITIVE_INFINITY)
        .filter(Number.isFinite),
    ),
  );
  let globalMax = $derived(
    Math.max(
      ...tabs
        .map((tb) => tb.slices[0]?.stats?.max ?? Number.NEGATIVE_INFINITY)
        .filter(Number.isFinite),
    ),
  );
  let range = $derived(Number.isFinite(globalMax - globalMin) ? globalMax - globalMin : 0);
  let sliderMax = $derived(Math.max(Math.ceil(range / 2), 1));

  /** Expand a single tab's codes/cells into a flat number array */
  function expandValues(tab: Tab): number[] {
    const result: number[] = [];
    const cells = tab.slices[0].cells;
    for (let i = 0; i < tab.codes.length; i++) {
      const v = Number(tab.codes[i]);
      for (let j = 0; j < cells[i].count; j++) result.push(v);
    }
    return result;
  }

  $effect(() => {
    const _tabs = tabs;
    const _paletteId = paletteId;
    const _binWidth = binWidth;
    const _min = globalMin;
    const _max = globalMax;

    if (!canvas) return;
    chart?.destroy();
    const theme = getThemeColors();
    chart = build(canvas, _tabs, _binWidth, _min, _max, theme, _paletteId);

    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  function build(
    cvs: HTMLCanvasElement,
    ts: Tab[],
    bw: number,
    minVal: number,
    maxVal: number,
    theme: ReturnType<typeof getThemeColors>,
    pid: PaletteId,
  ): Chart {
    let labels: string[];
    let perChildData: number[][];

    if (bw > 0 && Number.isFinite(minVal) && Number.isFinite(maxVal)) {
      const binStart = Math.floor(minVal / bw) * bw;
      const binEnd = Math.floor(maxVal / bw) * bw + bw;
      const bins: number[] = [];
      for (let b = binStart; b < binEnd; b += bw) bins.push(b);
      labels = bins.map((b) => `${b}–${b + bw - 1}`);

      perChildData = ts.map((tb) => {
        const counts = Array.from({ length: bins.length }, () => 0);
        const values = expandValues(tb);
        for (const v of values) {
          const idx = Math.floor((v - binStart) / bw);
          if (idx >= 0 && idx < counts.length) counts[idx]++;
        }
        return counts;
      });
    } else {
      // Raw: union of all distinct numeric values across children
      const codeSet = new Set<string>();
      for (const tb of ts) for (const c of tb.codes) codeSet.add(c);
      const sortedCodes = [...codeSet].sort((a, b) => Number(a) - Number(b));
      labels = sortedCodes;

      perChildData = ts.map((tb) => {
        const map = new Map<string, number>();
        for (let i = 0; i < tb.codes.length; i++) {
          map.set(tb.codes[i], tb.slices[0].cells[i]?.count ?? 0);
        }
        return sortedCodes.map((c) => map.get(c) ?? 0);
      });
    }

    const datasets = ts.map((tb, i) => ({
      label: tb.label,
      data: perChildData[i],
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
        plugins: {
          legend: { position: "top", labels: { color: theme.text, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${(c.parsed.y as number).toFixed(1)}`,
            },
          },
        },
        scales: {
          x: { ticks: { color: theme.text }, grid: { display: false } },
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

<div class="h-[400px] p-4">
  {#if range > 0}
    <div class="mb-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <label>
        {t("na.binWidth")}
        <input type="range" min={0} max={sliderMax} step={1} bind:value={binWidth} class="w-32" />
      </label>
      <span class="w-6 text-center tabular-nums">{binWidth || "–"}</span>
    </div>
  {/if}
  <canvas bind:this={canvas}></canvas>
</div>

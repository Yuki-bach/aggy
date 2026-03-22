import { useRef, useEffect, useState } from "preact/hooks";
import type { Tab } from "../../lib/agg/types";
import { binFrequencies } from "../../lib/agg/naHelpers";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import { t } from "../../lib/i18n";
import type { ChartConfiguration } from "chart.js";

interface NaChartCardBodyProps {
  tab: Tab;
  crossTabs: Tab[];
  paletteId: PaletteId;
}

/** Expand codes/cells into a flat number array (each code repeated by its count) */
function expandValues(codes: string[], cells: { count: number }[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < codes.length; i++) {
    const v = Number(codes[i]);
    for (let j = 0; j < cells[i].count; j++) result.push(v);
  }
  return result;
}

export function NaChartCardBody({ tab, crossTabs, paletteId }: NaChartCardBodyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const isCross = crossTabs.length > 0;
  const [binWidth, setBinWidth] = useState(0);

  const stats = tab.slices[0]?.stats;
  const range =
    stats?.max !== null &&
    stats?.max !== undefined &&
    stats?.min !== null &&
    stats?.min !== undefined
      ? stats.max - stats.min
      : 0;
  const sliderMax = Math.max(Math.ceil(range / 2), 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();
    const theme = getThemeColors();

    if (isCross) {
      chartRef.current = buildMeanComparisonChart(canvas, tab, crossTabs, theme, paletteId);
    } else {
      chartRef.current = buildFreqChart(canvas, tab, theme, paletteId, binWidth);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [tab, crossTabs, isCross, paletteId, binWidth]);

  return (
    <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
      {!isCross && range > 0 && (
        <div class="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <label>{t("na.binWidth")}</label>
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={1}
            value={binWidth}
            onInput={(e) => setBinWidth(Number((e.target as HTMLInputElement).value))}
            class="w-32"
          />
          <span class="w-6 text-center tabular-nums">{binWidth || "–"}</span>
        </div>
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}

function buildFreqChart(
  canvas: HTMLCanvasElement,
  tab: Tab,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
  binWidth = 0,
): Chart {
  const slice = tab.slices[0];
  const stats = slice.stats!;

  let labels: string[] = tab.codes;
  let data: number[] = slice.cells.map((c) => c.count);

  if (binWidth > 0) {
    const values = expandValues(tab.codes, slice.cells);
    const binned = binFrequencies(values, binWidth);
    labels = binned.labels;
    data = binned.cells.map((c) => c.count);
  }

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: getSeriesColor(0, paletteId),
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
  canvas: HTMLCanvasElement,
  _tab: Tab,
  crossTabs: Tab[],
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const allSlices = crossTabs.flatMap((ct) => {
    const axis = ct.by!;
    return ct.slices.map((s) => ({
      label: axis.labels[s.code!],
      stats: s.stats!,
    }));
  });

  const labels = allSlices.map((s) => s.label);
  const means = allSlices.map((s) => s.stats.mean ?? 0);

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: t("na.stat.mean"),
          data: means,
          backgroundColor: labels.map((_, i) => getSeriesColor(i, paletteId)),
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

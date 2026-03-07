import { useRef, useEffect } from "preact/hooks";
import type { NumericTally } from "../../lib/agg/types";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import { t } from "../../lib/i18n";
import type { ChartConfiguration } from "chart.js";

interface NaChartCardBodyProps {
  gtTally: NumericTally;
  crossTallies: NumericTally[];
  paletteId: PaletteId;
}

export function NaChartCardBody({ gtTally, crossTallies, paletteId }: NaChartCardBodyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const isCross = crossTallies.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();
    const theme = getThemeColors();

    if (isCross) {
      chartRef.current = buildMeanComparisonChart(canvas, gtTally, crossTallies, theme, paletteId);
    } else {
      chartRef.current = buildFreqChart(canvas, gtTally, theme, paletteId);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [gtTally, crossTallies, paletteId]);

  return (
    <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function buildFreqChart(
  canvas: HTMLCanvasElement,
  tally: NumericTally,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const { freq, stats } = tally.slices[0];
  const labels = freq.map((f) => String(f.value));
  const data = freq.map((f) => f.count);

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
          text: `n=${stats.n.toLocaleString()}  ${t("na.stat.mean")}=${stats.mean.toFixed(2)}  SD=${stats.sd.toFixed(2)}`,
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
  _gtTally: NumericTally,
  crossTallies: NumericTally[],
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const allSlices = crossTallies.flatMap((ct) => {
    const axis = ct.by!;
    return ct.slices.map((s) => ({
      label: axis.labels[s.code!],
      stats: s.stats,
    }));
  });

  const labels = allSlices.map((s) => s.label);
  const means = allSlices.map((s) => s.stats.mean);

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

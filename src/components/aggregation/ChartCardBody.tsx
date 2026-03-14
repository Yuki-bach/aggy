import { useRef, useEffect } from "preact/hooks";
import type { Tally } from "../../lib/agg/types";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import type { ChartType } from "./viewTypes";

import type { ChartConfiguration } from "chart.js";

interface ChartCardBodyProps {
  grandTotalTally: Tally;
  crossTallies: Tally[];
  grandTotalChartType: ChartType;
  paletteId: PaletteId;
}

export function ChartCardBody({
  grandTotalTally,
  crossTallies,
  grandTotalChartType,
  paletteId,
}: ChartCardBodyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const isCross = crossTallies.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();

    const theme = getThemeColors();
    if (isCross) {
      chartRef.current = buildCrossChart(
        canvas,
        grandTotalTally,
        crossTallies,
        grandTotalChartType,
        theme,
        paletteId,
      );
    } else {
      chartRef.current = buildGrandTotalChart(
        canvas,
        grandTotalTally,
        grandTotalChartType,
        theme,
        paletteId,
      );
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [grandTotalTally, crossTallies, grandTotalChartType, paletteId]);

  return (
    <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function resolveLabel(code: string, tally: Tally): string {
  return tally.labels[code];
}

function buildGrandTotalChart(
  canvas: HTMLCanvasElement,
  tally: Tally,
  chartType: ChartType,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const slice = tally.slices[0];
  const labels = tally.codes.map((code) => resolveLabel(code, tally));
  const data = slice.cells.map((c) => c.pct);
  const colors = tally.codes.map((_, i) => getSeriesColor(i, paletteId));

  if (chartType === "obi") {
    const datasets = tally.codes.map((code, i) => ({
      label: resolveLabel(code, tally),
      data: [slice.cells[i].pct],
      backgroundColor: getSeriesColor(i, paletteId),
      maxBarThickness: 48,
    }));

    return new Chart(canvas, {
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

  return new Chart(canvas, {
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
            label: (ctx) => `${(ctx.parsed[isHorizontal ? "x" : "y"] as number).toFixed(1)}%`,
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
  canvas: HTMLCanvasElement,
  grandTotalTally: Tally,
  crossTallies: Tally[],
  grandTotalChartType: ChartType,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  // Flatten all cross slices
  const allSlices = crossTallies.flatMap((ct) => {
    const axis = ct.by!;
    return ct.slices.map((s) => ({
      slice: s,
      label: axis.labels[s.code!],
    }));
  });

  if (grandTotalChartType === "obi") {
    const subLabels = allSlices.map((s) => s.label);
    const datasets = grandTotalTally.codes.map((code, i) => ({
      label: resolveLabel(code, grandTotalTally),
      data: allSlices.map((s) => s.slice.cells[i]?.pct ?? 0),
      backgroundColor: getSeriesColor(i, paletteId),
      maxBarThickness: 48,
    }));

    return new Chart(canvas, {
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
          y: { stacked: true, ticks: { color: theme.text }, grid: { display: false } },
        },
      },
    } as ChartConfiguration);
  }

  const isHorizontal = grandTotalChartType === "bar-h";
  const labels = grandTotalTally.codes.map((code) => resolveLabel(code, grandTotalTally));

  const datasets = allSlices.map((s, i) => ({
    label: s.label,
    data: grandTotalTally.codes.map((_, ci) => s.slice.cells[ci]?.pct ?? 0),
    backgroundColor: getSeriesColor(i, paletteId),
    borderRadius: 3,
    maxBarThickness: 40,
  }));

  return new Chart(canvas, {
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

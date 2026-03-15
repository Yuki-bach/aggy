import { useRef, useEffect } from "preact/hooks";
import type { Tab } from "../../lib/agg/types";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import type { ChartType } from "./viewTypes";

import type { ChartConfiguration } from "chart.js";

interface ChartCardBodyProps {
  tab: Tab;
  crossTabs: Tab[];
  tabChartType: ChartType;
  paletteId: PaletteId;
}

export function ChartCardBody({ tab, crossTabs, tabChartType, paletteId }: ChartCardBodyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const isCross = crossTabs.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();

    const theme = getThemeColors();
    if (isCross) {
      chartRef.current = buildCrossChart(canvas, tab, crossTabs, tabChartType, theme, paletteId);
    } else {
      chartRef.current = buildTabChart(canvas, tab, tabChartType, theme, paletteId);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [tab, crossTabs, tabChartType, paletteId]);

  return (
    <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function buildTabChart(
  canvas: HTMLCanvasElement,
  tab: Tab,
  chartType: ChartType,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const slice = tab.slices[0];
  const labels = tab.codes.map((code) => tab.labels[code]);
  const data = slice.cells.map((c) => c.pct);
  const colors = tab.codes.map((_, i) => getSeriesColor(i, paletteId));

  if (chartType === "obi") {
    const datasets = tab.codes.map((code, i) => ({
      label: tab.labels[code],
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
  tab: Tab,
  crossTabs: Tab[],
  tabChartType: ChartType,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  // Flatten all cross slices
  const allSlices = crossTabs.flatMap((ct) => {
    const axis = ct.by!;
    return ct.slices.map((s) => ({
      slice: s,
      label: axis.labels[s.code!],
    }));
  });

  if (tabChartType === "obi") {
    const subLabels = allSlices.map((s) => s.label);
    const datasets = tab.codes.map((code, i) => ({
      label: tab.labels[code],
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

  const isHorizontal = tabChartType === "bar-h";
  const labels = tab.codes.map((code) => tab.labels[code]);

  const datasets = allSlices.map((s, i) => ({
    label: s.label,
    data: tab.codes.map((_, ci) => s.slice.cells[ci]?.pct ?? 0),
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

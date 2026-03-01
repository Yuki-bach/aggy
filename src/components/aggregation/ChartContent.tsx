/** Chart content: grid layout + individual chart cards */

import { useRef, useEffect } from "preact/hooks";
import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import type { LabelMap } from "../../lib/layout";
import { pivot } from "../../lib/agg/pivot";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import { resolveValueLabel, resolveSubLabel } from "../../lib/labels";
import { useAggregation } from "./AggregationContext";
import { ResultCard } from "./ResultCard";

import type { ChartConfiguration } from "chart.js";

export type ChartType = "bar-h" | "bar-v" | "obi";

interface ChartContentProps {
  saChartType: ChartType;
  maChartType: ChartType;
  paletteId: PaletteId;
}

export function ChartContent({ saChartType, maChartType, paletteId }: ChartContentProps) {
  const { results, hasCross } = useAggregation();
  return (
    <div
      class={
        hasCross
          ? "grid grid-cols-[1fr] gap-6"
          : "grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6"
      }
    >
      {results.map((res) => (
        <ChartCard
          key={res.question}
          res={res}
          gtChartType={res.type === "SA" ? saChartType : maChartType}
          paletteId={paletteId}
        />
      ))}
    </div>
  );
}

interface ChartCardProps {
  res: AggResult;
  gtChartType: ChartType;
  paletteId: PaletteId;
}

function ChartCard({ res, gtChartType, paletteId }: ChartCardProps) {
  const { labelMap, crossCols } = useAggregation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const pv = pivot(res.cells);
  const isCross = pv.subs.length > 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy previous chart if any
    chartRef.current?.destroy();

    const theme = getThemeColors();
    if (isCross) {
      chartRef.current = buildCrossChart(
        canvas,
        pv,
        gtChartType,
        res,
        theme,
        labelMap,
        crossCols,
        paletteId,
      );
    } else {
      chartRef.current = buildGtChart(canvas, pv, gtChartType, res, theme, labelMap, paletteId);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [res, gtChartType, labelMap, crossCols, paletteId]);

  return (
    <ResultCard res={res}>
      <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
        <canvas ref={canvasRef} />
      </div>
    </ResultCard>
  );
}

function buildGtChart(
  canvas: HTMLCanvasElement,
  pv: ReturnType<typeof pivot>,
  chartType: ChartType,
  res: AggResult,
  theme: ReturnType<typeof getThemeColors>,
  labelMap: LabelMap,
  paletteId: PaletteId,
): Chart {
  const { mains, lookup } = pv;
  const labels = mains.map((m) => resolveValueLabel(res.type, res.question, m, labelMap));
  const data = mains.map((m) => lookup.get(`${m}\0GT`)?.pct ?? 0);
  const colors = mains.map((_, i) => getSeriesColor(i, paletteId));

  // Stacked bar: each option as a segment in one horizontal bar
  if (chartType === "obi") {
    const datasets = mains.map((m, i) => ({
      label: resolveValueLabel(res.type, res.question, m, labelMap),
      data: [lookup.get(`${m}\0GT`)?.pct ?? 0],
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
  pv: ReturnType<typeof pivot>,
  gtChartType: ChartType,
  res: AggResult,
  theme: ReturnType<typeof getThemeColors>,
  labelMap: LabelMap,
  crossCols: QuestionDef[],
  paletteId: PaletteId,
): Chart {
  const { mains, subs, lookup } = pv;
  const crossSubs = subs.filter((s) => s.label !== "GT");

  // Stacked bar: one bar per cross value
  if (gtChartType === "obi") {
    const subLabels = crossSubs.map((s) => resolveSubLabel(s.label, labelMap, crossCols));
    const datasets = mains.map((m, i) => ({
      label: resolveValueLabel(res.type, res.question, m, labelMap),
      data: crossSubs.map((sub) => {
        const cell = lookup.get(`${m}\0${sub.label}`);
        return cell?.pct ?? 0;
      }),
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

  // Clustered bar chart (direction matches GT selection)
  const isHorizontal = gtChartType === "bar-h";
  const labels = mains.map((m) => resolveValueLabel(res.type, res.question, m, labelMap));

  const datasets = crossSubs.map((sub, i) => ({
    label: resolveSubLabel(sub.label, labelMap, crossCols),
    data: mains.map((m) => {
      const cell = lookup.get(`${m}\0${sub.label}`);
      return cell?.pct ?? 0;
    }),
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

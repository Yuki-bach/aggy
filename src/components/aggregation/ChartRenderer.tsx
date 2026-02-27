/** Chart rendering component */

import { useRef, useEffect } from "preact/hooks";
import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { pivot } from "../../lib/agg/pivot";
import { Chart, getSeriesColor, getThemeColors } from "../../lib/chartConfig";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labels";
import { useAggregation } from "./AggregationContext";

import type { ChartConfiguration } from "chart.js";

export type GtChartType = "bar-h" | "bar-v" | "obi";

interface ChartCardProps {
  res: AggResult;
  gtChartType: GtChartType;
}

export function ChartCard({ res, gtChartType }: ChartCardProps) {
  const { layoutMeta, crossCols } = useAggregation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const pv = pivot(res.cells);
  const isCross = pv.subs.length > 1;
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
  const hasLabel = questionLabel !== res.question;
  const gtSub = pv.subs.find((s) => s.label === "GT")!;

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
        layoutMeta,
        crossCols,
      );
    } else {
      chartRef.current = buildGtChart(canvas, pv, gtChartType, res, theme, layoutMeta);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [res, gtChartType, layoutMeta, crossCols]);

  return (
    <div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div class="flex items-baseline gap-3 p-4 border-b border-border">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="font-bold text-sm text-accent">{questionLabel}</span>
          {hasLabel && <span class="text-xs text-muted tracking-[0.04em]">{res.question}</span>}
        </div>
        <span class="text-xs text-muted tracking-[0.04em]">{res.type}</span>
        <span class="ml-auto text-[0.8125rem] text-muted">n={gtSub.n.toLocaleString()}</span>
      </div>
      <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── Chart builders (pure logic, unchanged) ─────────────────

function buildGtChart(
  canvas: HTMLCanvasElement,
  pv: ReturnType<typeof pivot>,
  chartType: GtChartType,
  res: AggResult,
  theme: ReturnType<typeof getThemeColors>,
  layoutMeta: LayoutMeta,
): Chart {
  const { mains, lookup } = pv;
  const labels = mains.map((m) => resolveValueLabel(res.type, res.question, m, layoutMeta));
  const data = mains.map((m) => lookup.get(`${m}\0GT`)?.pct ?? 0);
  const colors = mains.map((_, i) => getSeriesColor(i));

  // Stacked bar: each option as a segment in one horizontal bar
  if (chartType === "obi") {
    const datasets = mains.map((m, i) => ({
      label: resolveValueLabel(res.type, res.question, m, layoutMeta),
      data: [lookup.get(`${m}\0GT`)?.pct ?? 0],
      backgroundColor: getSeriesColor(i),
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
  gtChartType: GtChartType,
  res: AggResult,
  theme: ReturnType<typeof getThemeColors>,
  layoutMeta: LayoutMeta,
  crossCols: QuestionDef[],
): Chart {
  const { mains, subs, lookup } = pv;
  const crossSubs = subs.filter((s) => s.label !== "GT");

  // Stacked bar: one bar per cross value
  if (gtChartType === "obi") {
    const subLabels = crossSubs.map((s) => resolveSubLabel(s.label, layoutMeta, crossCols));
    const datasets = mains.map((m, i) => ({
      label: resolveValueLabel(res.type, res.question, m, layoutMeta),
      data: crossSubs.map((sub) => {
        const cell = lookup.get(`${m}\0${sub.label}`);
        return cell?.pct ?? 0;
      }),
      backgroundColor: getSeriesColor(i),
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
  const labels = mains.map((m) => resolveValueLabel(res.type, res.question, m, layoutMeta));

  const datasets = crossSubs.map((sub, i) => ({
    label: resolveSubLabel(sub.label, layoutMeta, crossCols),
    data: mains.map((m) => {
      const cell = lookup.get(`${m}\0${sub.label}`);
      return cell?.pct ?? 0;
    }),
    backgroundColor: getSeriesColor(i),
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

/** Chart rendering component */

import type { AggResult, QuestionDef } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { pivot } from "../../lib/pivot";
import { Chart, getSeriesColor, getThemeColors } from "../../lib/chartConfig";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";

import type { ChartConfiguration } from "chart.js";

/** Track active Chart.js instances to prevent memory leaks */
const activeCharts: Chart[] = [];

export function destroyAllCharts(): void {
  for (const c of activeCharts) c.destroy();
  activeCharts.length = 0;
}

export type GtChartType = "bar-h" | "bar-v" | "obi";

export function renderChartCard(
  res: AggResult,
  gtChartType: GtChartType,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): HTMLDivElement {
  const pv = pivot(res.cells);
  const isCross = pv.subs.length > 1;

  const wrapper = document.createElement("div");
  wrapper.className = "chart-card";

  const head = document.createElement("div");
  head.className = "gt-table-head";
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
  const hasLabel = questionLabel !== res.question;
  const gtSub = pv.subs.find((s) => s.label === "GT")!;
  head.innerHTML = `
    <div class="q-header">
      <span class="q-label">${escHtml(questionLabel)}</span>
      ${hasLabel ? `<span class="q-key">${escHtml(res.question)}</span>` : ""}
    </div>
    <span class="q-type">${res.type}</span>
    <span class="q-n">n=${gtSub.n.toLocaleString()}</span>
  `;
  wrapper.appendChild(head);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  canvasWrap.appendChild(canvas);
  wrapper.appendChild(canvasWrap);

  const theme = getThemeColors();

  let chart: Chart;
  if (isCross) {
    chart = buildCrossChart(canvas, pv, gtChartType, res, theme, layoutMeta, crossCols);
  } else {
    chart = buildGtChart(canvas, pv, gtChartType, res, theme, layoutMeta);
  }
  activeCharts.push(chart);

  return wrapper;
}

function buildGtChart(
  canvas: HTMLCanvasElement,
  pv: ReturnType<typeof pivot>,
  chartType: GtChartType,
  res: AggResult,
  theme: ReturnType<typeof getThemeColors>,
  layoutMeta?: LayoutMeta,
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
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
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

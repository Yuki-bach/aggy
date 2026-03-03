/** Chart content: grid layout + individual chart cards */

import { useRef, useEffect } from "preact/hooks";
import type { Question, Tally } from "../../lib/agg/types";
import { NA_VALUE } from "../../lib/agg/sqlHelpers";
import { Chart, getSeriesColor, getThemeColors, type PaletteId } from "../../lib/chartConfig";
import { t } from "../../lib/i18n";
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
  const { tallies, questions, crossCols } = useAggregation();
  const hasCross = crossCols.length > 0;

  // Group tallies by question
  const questionCodes = [...new Set(tallies.map((t) => t.question))];

  return (
    <div
      class={
        hasCross
          ? "grid grid-cols-[1fr] gap-6"
          : "grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6"
      }
    >
      {questionCodes.map((qCode) => {
        const question = questions.find((q) => q.code === qCode)!;
        const gtTally = tallies.find((t) => t.question === qCode && t.by === "GT")!;
        const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== "GT");

        return (
          <ChartCard
            key={qCode}
            question={question}
            gtTally={gtTally}
            crossTallies={crossTallies}
            gtChartType={gtTally.type === "SA" ? saChartType : maChartType}
            paletteId={paletteId}
          />
        );
      })}
    </div>
  );
}

interface ChartCardProps {
  question: Question;
  gtTally: Tally;
  crossTallies: Tally[];
  gtChartType: ChartType;
  paletteId: PaletteId;
}

function ChartCard({ question, gtTally, crossTallies, gtChartType, paletteId }: ChartCardProps) {
  const { questions } = useAggregation();
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
        gtTally,
        crossTallies,
        gtChartType,
        question,
        theme,
        questions,
        paletteId,
      );
    } else {
      chartRef.current = buildGtChart(canvas, gtTally, gtChartType, question, theme, paletteId);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [gtTally, crossTallies, gtChartType, question, questions, paletteId]);

  return (
    <ResultCard tally={gtTally} question={question}>
      <div class={`p-4 ${isCross ? "h-[400px]" : "h-80"}`}>
        <canvas ref={canvasRef} />
      </div>
    </ResultCard>
  );
}

function resolveLabel(code: string, question: Question): string {
  if (code === NA_VALUE) return t("label.na");
  return question.labels[code] ?? code;
}

function buildGtChart(
  canvas: HTMLCanvasElement,
  tally: Tally,
  chartType: ChartType,
  question: Question,
  theme: ReturnType<typeof getThemeColors>,
  paletteId: PaletteId,
): Chart {
  const slice = tally.slices[0];
  const labels = tally.codes.map((code) => resolveLabel(code, question));
  const data = slice.cells.map((c) => c.pct);
  const colors = tally.codes.map((_, i) => getSeriesColor(i, paletteId));

  if (chartType === "obi") {
    const datasets = tally.codes.map((code, i) => ({
      label: resolveLabel(code, question),
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
  gtTally: Tally,
  crossTallies: Tally[],
  gtChartType: ChartType,
  question: Question,
  theme: ReturnType<typeof getThemeColors>,
  questions: Question[],
  paletteId: PaletteId,
): Chart {
  // Flatten all cross slices
  const allSlices = crossTallies.flatMap((ct) => {
    const crossQ = questions.find((q) => q.code === ct.by)!;
    return ct.slices.map((s) => ({
      slice: s,
      label: resolveLabel(s.code, crossQ),
    }));
  });

  if (gtChartType === "obi") {
    const subLabels = allSlices.map((s) => s.label);
    const datasets = gtTally.codes.map((code, i) => ({
      label: resolveLabel(code, question),
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

  const isHorizontal = gtChartType === "bar-h";
  const labels = gtTally.codes.map((code) => resolveLabel(code, question));

  const datasets = allSlices.map((s, i) => ({
    label: s.label,
    data: gtTally.codes.map((_, ci) => s.slice.cells[ci]?.pct ?? 0),
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

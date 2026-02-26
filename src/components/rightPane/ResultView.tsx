import { render } from "preact";
import { useState } from "preact/hooks";
import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel } from "../../lib/labelResolver";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { showAIBubble } from "./AIBubble";
import { ChartCard, type GtChartType } from "./ChartRenderer";

interface ResultViewProps {
  results: AggResult[];
  weightCol: string;
  rawN: number;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}

function ResultView({ results, weightCol, layoutMeta, crossCols }: ResultViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [saChartType, setSaChartType] = useState<GtChartType>("bar-h");
  const [maChartType, setMaChartType] = useState<GtChartType>("bar-h");
  const [pctDirection, setPctDirection] = useState<PctDirection>("vertical");

  const hasCross = results.some((r) => {
    const { subs } = pivot(r.cells);
    return subs.length > 1;
  });

  const callbacks = {
    onViewModeChange: setViewMode,
    onSaChartTypeChange: setSaChartType,
    onMaChartTypeChange: setMaChartType,
    onPctDirectionChange: setPctDirection,
  };

  const showViewOpts = viewMode === "chart" || (viewMode === "table" && hasCross);

  return (
    <>
      <Toolbar
        hasCross={hasCross}
        results={results}
        weightCol={weightCol}
        currentViewMode={viewMode}
        layoutMeta={layoutMeta}
        callbacks={callbacks}
      />
      {showViewOpts && (
        <ViewOpts
          currentViewMode={viewMode}
          hasCross={hasCross}
          currentPctDirection={pctDirection}
          saChartType={saChartType}
          maChartType={maChartType}
          callbacks={callbacks}
        />
      )}
      {viewMode === "chart" ? (
        <ChartContent
          results={results}
          hasCross={hasCross}
          saChartType={saChartType}
          maChartType={maChartType}
          layoutMeta={layoutMeta}
          crossCols={crossCols}
        />
      ) : (
        <TableContent
          results={results}
          weightCol={weightCol}
          hasCross={hasCross}
          pctDirection={pctDirection}
          layoutMeta={layoutMeta}
          crossCols={crossCols}
        />
      )}
    </>
  );
}

// --- Sub-components ---

function ChartContent({
  results,
  hasCross,
  saChartType,
  maChartType,
  layoutMeta,
  crossCols,
}: {
  results: AggResult[];
  hasCross: boolean;
  saChartType: GtChartType;
  maChartType: GtChartType;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}) {
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
          layoutMeta={layoutMeta}
          crossCols={crossCols}
        />
      ))}
    </div>
  );
}

function TableContent({
  results,
  weightCol,
  hasCross,
  pctDirection,
  layoutMeta,
  crossCols,
}: {
  results: AggResult[];
  weightCol: string;
  hasCross: boolean;
  pctDirection: PctDirection;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}) {
  const allGtCells = results.flatMap((r) => r.cells.filter((c) => c.sub === "GT"));
  const maxPct = Math.max(...allGtCells.map((c) => c.pct), 0);

  return (
    <div
      class={
        hasCross
          ? "grid grid-cols-[1fr] gap-6"
          : "grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6"
      }
    >
      {results.map((res) => {
        const pv = pivot(res.cells);
        const isCross = pv.subs.length > 1;

        const gtSub = pv.subs.find((s) => s.label === "GT")!;
        const nLabel = weightCol ? `n=${gtSub.n.toFixed(1)}` : `n=${gtSub.n.toLocaleString()}`;

        const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
        const hasLabel = questionLabel !== res.question;

        return (
          <div
            class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${isCross ? " overflow-x-auto" : ""}`}
            key={res.question}
          >
            <div class="flex items-baseline gap-3 border-b border-border p-4">
              <div class="flex min-w-0 flex-col gap-[2px]">
                <span class="text-[0.875rem] font-bold text-accent">{questionLabel}</span>
                {hasLabel && (
                  <span class="text-xs tracking-[0.04em] text-muted">{res.question}</span>
                )}
              </div>
              <span class="text-xs tracking-[0.04em] text-muted">{res.type}</span>
              <span class="ml-auto text-[0.8125rem] text-muted">{nLabel}</span>
            </div>
            {isCross ? (
              <CrossTable
                res={res}
                pv={pv}
                weightCol={weightCol}
                pctDir={pctDirection}
                layoutMeta={layoutMeta}
                crossCols={crossCols}
              />
            ) : (
              <GtTable
                res={res}
                pv={pv}
                weightCol={weightCol}
                maxPct={maxPct}
                layoutMeta={layoutMeta}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Theme change re-render ---

let reRenderRef: (() => void) | null = null;

const observer = new MutationObserver(() => {
  reRenderRef?.();
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// --- Bridge for imperative callers ---

export function renderResultView(
  results: AggResult[],
  weightCol: string,
  rawN: number,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  document.getElementById("empty-state")!.classList.add("hidden");
  const area = document.getElementById("results-area")!;
  area.classList.remove("hidden");

  reRenderRef = () => renderResultView(results, weightCol, rawN, layoutMeta, crossCols);

  render(
    <ResultView
      results={results}
      weightCol={weightCol}
      rawN={rawN}
      layoutMeta={layoutMeta}
      crossCols={crossCols}
    />,
    area,
  );

  showAIBubble(results, weightCol, layoutMeta);
}

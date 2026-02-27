import { useEffect, useState } from "preact/hooks";
import type { AggResult } from "../../lib/agg/aggregate";
import { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel } from "../../lib/labels";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { AIBubble } from "./AIBubble";
import { ChartCard, type GtChartType } from "./ChartRenderer";
import { useAggregation } from "./AggregationContext";

export interface ResultViewProps {
  results: AggResult[];
}

export default function ResultView({ results }: ResultViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [saChartType, setSaChartType] = useState<GtChartType>("bar-h");
  const [maChartType, setMaChartType] = useState<GtChartType>("bar-h");
  const [pctDirection, setPctDirection] = useState<PctDirection>("vertical");
  const [, setThemeTick] = useState(0);

  // Re-render on theme change (needed for canvas-based charts)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeTick((n) => n + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

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
        currentViewMode={viewMode}
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
        />
      ) : (
        <TableContent results={results} hasCross={hasCross} pctDirection={pctDirection} />
      )}
      <AIBubble results={results} />
    </>
  );
}

// --- Sub-components ---

function ChartContent({
  results,
  hasCross,
  saChartType,
  maChartType,
}: {
  results: AggResult[];
  hasCross: boolean;
  saChartType: GtChartType;
  maChartType: GtChartType;
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
        />
      ))}
    </div>
  );
}

function TableContent({
  results,
  hasCross,
  pctDirection,
}: {
  results: AggResult[];
  hasCross: boolean;
  pctDirection: PctDirection;
}) {
  const { layoutMeta, weightCol } = useAggregation();
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
              <CrossTable res={res} pv={pv} pctDir={pctDirection} />
            ) : (
              <GtTable res={res} pv={pv} maxPct={maxPct} />
            )}
          </div>
        );
      })}
    </div>
  );
}

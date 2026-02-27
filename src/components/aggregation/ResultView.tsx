import { useEffect, useState } from "preact/hooks";
import type { AggResult } from "../../lib/agg/aggregate";
import { pivot } from "../../lib/agg/pivot";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { AIBubble } from "./AIBubble";
import { ChartCard, type GtChartType } from "./ChartRenderer";
import { ResultCard } from "./ResultCard";

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

        return (
          <ResultCard
            key={res.question}
            res={res}
            extraClass={isCross ? "overflow-x-auto" : undefined}
          >
            {isCross ? (
              <CrossTable res={res} pv={pv} pctDir={pctDirection} />
            ) : (
              <GtTable res={res} pv={pv} maxPct={maxPct} />
            )}
          </ResultCard>
        );
      })}
    </div>
  );
}

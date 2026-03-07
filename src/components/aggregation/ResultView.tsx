import { useEffect, useState } from "preact/hooks";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { ChartCardBody, type ChartType } from "./ChartCardBody";
import { GtTable } from "./GtTable";
import { CrossTable } from "./CrossTable";
import { NaGtTable } from "./NaGtTable";
import { NaCrossTable } from "./NaCrossTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { ResultCard } from "./ResultCard";
import { AIBubble } from "./AIBubble";
import { useAggregation } from "./AggregationContext";
import { groupByQuestion, computeMaxPct } from "../../lib/agg/groupByQuestion";
import type { NumericTally } from "../../lib/agg/types";
import type { PaletteId } from "../../lib/chartConfig";

export default function ResultView() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [saChartType, setSaChartType] = useState<ChartType>("bar-h");
  const [maChartType, setMaChartType] = useState<ChartType>("bar-h");
  const [pctDirection, setPctDirection] = useState<PctDirection>("vertical");
  const [paletteId, setPaletteId] = useState<PaletteId>("default");
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

  const callbacks = {
    onViewModeChange: setViewMode,
    onSaChartTypeChange: setSaChartType,
    onMaChartTypeChange: setMaChartType,
    onPctDirectionChange: setPctDirection,
    onPaletteChange: setPaletteId,
  };

  const { tallies, weightCol } = useAggregation();
  const groups = groupByQuestion(tallies);
  const hasCross = tallies.some((t) => t.by !== null);
  const maxPct = computeMaxPct(tallies);

  const minWidth = viewMode === "chart" ? "400px" : "360px";
  const gridClass = hasCross
    ? "grid grid-cols-1 gap-6"
    : `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))] gap-6`;

  return (
    <>
      <Toolbar currentViewMode={viewMode} callbacks={callbacks} />
      <ViewOpts
        currentViewMode={viewMode}
        currentPctDirection={pctDirection}
        saChartType={saChartType}
        maChartType={maChartType}
        paletteId={paletteId}
        callbacks={callbacks}
      />
      <div class={gridClass}>
        {groups.map(({ questionCode, gtTally, crossTallies }) => (
          <ResultCard
            key={questionCode}
            tally={gtTally}
            extraClass={crossTallies.length > 0 ? "overflow-x-auto" : undefined}
          >
            {gtTally.type === "NA" ? (
              viewMode === "chart" ? (
                <NaChartCardBody
                  gtTally={gtTally}
                  crossTallies={crossTallies as NumericTally[]}
                  paletteId={paletteId}
                />
              ) : crossTallies.length > 0 ? (
                <NaCrossTable gtTally={gtTally} crossTallies={crossTallies as NumericTally[]} />
              ) : (
                <NaGtTable tally={gtTally} />
              )
            ) : viewMode === "chart" ? (
              <ChartCardBody
                gtTally={gtTally}
                crossTallies={crossTallies as (typeof gtTally)[]}
                gtChartType={gtTally.type === "SA" ? saChartType : maChartType}
                paletteId={paletteId}
              />
            ) : crossTallies.length > 0 ? (
              <CrossTable
                gtTally={gtTally}
                crossTallies={crossTallies as (typeof gtTally)[]}
                pctDir={pctDirection}
                weightCol={weightCol}
              />
            ) : (
              <GtTable tally={gtTally} maxPct={maxPct} weightCol={weightCol} />
            )}
          </ResultCard>
        ))}
      </div>
      <AIBubble />
    </>
  );
}

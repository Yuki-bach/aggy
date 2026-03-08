import { useEffect, useState } from "preact/hooks";
import { Toolbar, ViewOpts } from "./Toolbar";
import { ResultCard } from "./ResultCard";
import { AIBubble } from "./AIBubble";
import { useAggregation } from "./AggregationContext";
import { groupByQuestion, computeMaxPct } from "../../lib/agg/groupByQuestion";
import type { PctDirection, ViewMode } from "./viewTypes";
import type { ChartType } from "./ChartCardBody";
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

  const tableOpts = { pctDirection, maxPct: computeMaxPct(tallies) };
  const chartOpts = { saChartType, maChartType, paletteId };

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
        chartOpts={chartOpts}
        callbacks={callbacks}
      />
      <div class={gridClass}>
        {groups.map((group) => (
          <ResultCard
            key={group.questionCode}
            group={group}
            viewMode={viewMode}
            weightCol={weightCol}
            tableOpts={tableOpts}
            chartOpts={chartOpts}
          />
        ))}
      </div>
      <AIBubble />
    </>
  );
}

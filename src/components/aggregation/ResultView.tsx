import { useEffect, useState } from "preact/hooks";
import type { AggResult } from "../../lib/agg/aggregate";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { ChartContent, type GtChartType } from "./ChartContent";
import { TableContent } from "./TableContent";
import { AIBubble } from "./AIBubble";
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

  const { crossCols } = useAggregation();
  const hasCross = crossCols.length > 0;

  const callbacks = {
    onViewModeChange: setViewMode,
    onSaChartTypeChange: setSaChartType,
    onMaChartTypeChange: setMaChartType,
    onPctDirectionChange: setPctDirection,
  };

  const showViewOpts = viewMode === "chart" || (viewMode === "table" && hasCross);

  return (
    <>
      <Toolbar results={results} currentViewMode={viewMode} callbacks={callbacks} />
      {showViewOpts && (
        <ViewOpts
          currentViewMode={viewMode}
          currentPctDirection={pctDirection}
          saChartType={saChartType}
          maChartType={maChartType}
          callbacks={callbacks}
        />
      )}
      {viewMode === "chart" ? (
        <ChartContent results={results} saChartType={saChartType} maChartType={maChartType} />
      ) : (
        <TableContent results={results} pctDirection={pctDirection} />
      )}
      <AIBubble results={results} />
    </>
  );
}

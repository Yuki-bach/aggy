import { useEffect, useState } from "preact/hooks";
import { Toolbar, ViewOpts, type PctDirection, type ViewMode } from "./Toolbar";
import { ChartContent, type ChartType } from "./ChartContent";
import { TableContent } from "./TableContent";
import { AIBubble } from "./AIBubble";

export default function ResultView() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [saChartType, setSaChartType] = useState<ChartType>("bar-h");
  const [maChartType, setMaChartType] = useState<ChartType>("bar-h");
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

  const callbacks = {
    onViewModeChange: setViewMode,
    onSaChartTypeChange: setSaChartType,
    onMaChartTypeChange: setMaChartType,
    onPctDirectionChange: setPctDirection,
  };

  return (
    <>
      <Toolbar currentViewMode={viewMode} callbacks={callbacks} />
      <ViewOpts
        currentViewMode={viewMode}
        currentPctDirection={pctDirection}
        saChartType={saChartType}
        maChartType={maChartType}
        callbacks={callbacks}
      />
      {viewMode === "chart" ? (
        <ChartContent saChartType={saChartType} maChartType={maChartType} />
      ) : (
        <TableContent pctDirection={pctDirection} />
      )}
      <AIBubble />
    </>
  );
}

import { useEffect, useState } from "preact/hooks";
import type { Tally } from "../../lib/agg/types";
import { Toolbar, ViewOpts } from "./Toolbar";
import { ResultCard } from "./ResultCard";
import { AIBubble } from "./AIBubble";
import type { PctDirection, ViewMode } from "./viewTypes";
import type { ChartType } from "./ChartCardBody";
import type { PaletteId } from "../../lib/chartConfig";

interface ResultViewProps {
  tallies: Tally[];
  weightCol: string;
}

export default function ResultView({ tallies, weightCol }: ResultViewProps) {
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

  const questionCodes = [...new Set(tallies.map((t) => t.questionCode))];
  const hasCross = tallies.some((t) => t.by !== null);

  const maxPct = Math.max(
    ...tallies
      .filter((t) => t.by === null && t.type !== "NA")
      .flatMap((t) => t.slices[0]?.cells.map((c) => c.pct) ?? []),
    0,
  );
  const tableOpts = { pctDirection, maxPct };
  const chartOpts = { saChartType, maChartType, paletteId };

  const minWidth = viewMode === "chart" ? "400px" : "360px";
  const gridClass = hasCross
    ? "grid grid-cols-1 gap-6"
    : `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))] gap-6`;

  return (
    <>
      <Toolbar
        tallies={tallies}
        weightCol={weightCol}
        currentViewMode={viewMode}
        callbacks={callbacks}
      />
      <ViewOpts
        currentViewMode={viewMode}
        currentPctDirection={pctDirection}
        hasCross={hasCross}
        chartOpts={chartOpts}
        callbacks={callbacks}
      />
      <div class={gridClass}>
        {questionCodes.map((q) => (
          <ResultCard
            key={q}
            gtTally={tallies.find((t) => t.questionCode === q && t.by === null)!}
            crossTallies={tallies.filter((t) => t.questionCode === q && t.by !== null)}
            viewMode={viewMode}
            tableOpts={tableOpts}
            chartOpts={chartOpts}
          />
        ))}
      </div>
      <AIBubble tallies={tallies} weightCol={weightCol} />
    </>
  );
}

import { useEffect, useState } from "preact/hooks";
import type { Tally } from "../../lib/agg/types";
import { Toolbar, ViewOpts } from "./Toolbar";
import { TallyCard } from "./TallyCard";
import { AIBubble } from "./AIBubble";
import { t } from "../../lib/i18n";
import type { Basis, ChartType, ViewMode } from "./viewTypes";
import type { PaletteId } from "../../lib/chartConfig";

interface ResultPanelProps {
  tallies: Tally[] | null;
  weightCol: string;
}

export default function ResultPanel({ tallies, weightCol }: ResultPanelProps) {
  return (
    <div class="overflow-y-auto bg-bg p-6" role="region" aria-label={t("section.results")}>
      {tallies ? (
        <div aria-live="polite">
          <ResultContent tallies={tallies} weightCol={weightCol} />
        </div>
      ) : (
        <div class="flex h-full flex-col items-center justify-center gap-3 text-muted">
          <span class="text-4xl" aria-hidden="true">
            ⬛
          </span>
          <p class="text-base">{t("empty.text")}</p>
        </div>
      )}
    </div>
  );
}

function ResultContent({ tallies, weightCol }: { tallies: Tally[]; weightCol: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [saChartType, setSaChartType] = useState<ChartType>("bar-h");
  const [maChartType, setMaChartType] = useState<ChartType>("bar-h");
  const [basis, setBasis] = useState<Basis>("column");
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
    onBasisChange: setBasis,
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
  const tableOpts = { basis, maxPct };
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
        currentBasis={basis}
        hasCross={hasCross}
        chartOpts={chartOpts}
        callbacks={callbacks}
      />
      <div class={gridClass}>
        {questionCodes.map((q) => (
          <TallyCard
            key={q}
            grandTotalTally={tallies.find((t) => t.questionCode === q && t.by === null)!}
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

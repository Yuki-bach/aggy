import { useEffect, useState } from "preact/hooks";
import type { Tally } from "../../lib/agg/types";
import type { MatrixGroup } from "../../lib/layout";
import { Toolbar, ViewOpts } from "./Toolbar";
import { ResultCard } from "./ResultCard";
import { MatrixResultCard } from "./MatrixResultCard";
import { AIBubble } from "./AIBubble";
import type { ChartType, PctDirection, ViewMode } from "./viewTypes";
import type { PaletteId } from "../../lib/chartConfig";

interface ResultViewProps {
  tallies: Tally[];
  weightCol: string;
  matrixGroups: MatrixGroup[];
}

export default function ResultView({ tallies, weightCol, matrixGroups }: ResultViewProps) {
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

  // Build reverse map: questionCode → matrixKey
  const codeToMatrix = new Map<string, string>();
  for (const mg of matrixGroups) {
    for (const qc of mg.questionCodes) {
      codeToMatrix.set(qc, mg.matrixKey);
    }
  }

  // Build render items: group matrix children, preserve order
  type RenderItem =
    | { kind: "single"; questionCode: string }
    | { kind: "matrix"; group: MatrixGroup };
  const rendered = new Set<string>();
  const renderItems: RenderItem[] = [];

  for (const qc of questionCodes) {
    if (rendered.has(qc)) continue;
    const mk = codeToMatrix.get(qc);
    if (mk) {
      const group = matrixGroups.find((g) => g.matrixKey === mk)!;
      // Mark all children as rendered
      for (const c of group.questionCodes) rendered.add(c);
      renderItems.push({ kind: "matrix", group });
    } else {
      rendered.add(qc);
      renderItems.push({ kind: "single", questionCode: qc });
    }
  }

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
        {renderItems.map((item) => {
          if (item.kind === "matrix") {
            const { group } = item;
            const children = group.questionCodes
              .map((qc) => ({
                gtTally: tallies.find((t) => t.questionCode === qc && t.by === null)!,
                crossTallies: tallies.filter((t) => t.questionCode === qc && t.by !== null),
              }))
              .filter((c) => c.gtTally);
            return (
              <MatrixResultCard
                key={group.matrixKey}
                matrixKey={group.matrixKey}
                matrixLabel={group.matrixLabel}
                children={children}
                viewMode={viewMode}
                tableOpts={tableOpts}
                chartOpts={chartOpts}
              />
            );
          }
          const q = item.questionCode;
          return (
            <ResultCard
              key={q}
              gtTally={tallies.find((t) => t.questionCode === q && t.by === null)!}
              crossTallies={tallies.filter((t) => t.questionCode === q && t.by !== null)}
              viewMode={viewMode}
              tableOpts={tableOpts}
              chartOpts={chartOpts}
            />
          );
        })}
      </div>
      <AIBubble tallies={tallies} weightCol={weightCol} />
    </>
  );
}

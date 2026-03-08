import type { QuestionGroup } from "../../lib/agg/groupByQuestion";
import type { PaletteId } from "../../lib/chartConfig";
import type { ChartType } from "./ChartCardBody";
import type { PctDirection, ViewMode } from "./Toolbar";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { GtTable } from "./GtTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaGtTable } from "./NaGtTable";

interface ResultCardProps {
  group: QuestionGroup;
  viewMode: ViewMode;
  maxPct: number;
  weightCol: string;
  pctDirection: PctDirection;
  saChartType: ChartType;
  maChartType: ChartType;
  paletteId: PaletteId;
}

export function ResultCard({
  group,
  viewMode,
  maxPct,
  weightCol,
  pctDirection,
  saChartType,
  maChartType,
  paletteId,
}: ResultCardProps) {
  const { gtTally } = group;
  const hasCross = group.crossTallies.length > 0;

  const gtN =
    gtTally.type === "NA" ? (gtTally.slices[0]?.stats.n ?? 0) : (gtTally.slices[0]?.n ?? 0);
  const nLabel = weightCol ? `n=${gtN.toFixed(1)}` : `n=${gtN.toLocaleString()}`;
  const hasLabel = gtTally.label !== gtTally.question;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{gtTally.label}</span>
          {hasLabel && <span class="text-xs tracking-wide text-muted">{gtTally.question}</span>}
        </div>
        <span class="text-xs tracking-wide text-muted">{gtTally.type}</span>
        <span class="ml-auto text-xs text-muted">{nLabel}</span>
      </div>
      <CardBody
        group={group}
        viewMode={viewMode}
        maxPct={maxPct}
        weightCol={weightCol}
        pctDirection={pctDirection}
        saChartType={saChartType}
        maChartType={maChartType}
        paletteId={paletteId}
      />
    </div>
  );
}

function CardBody({
  group,
  viewMode,
  maxPct,
  weightCol,
  pctDirection,
  saChartType,
  maChartType,
  paletteId,
}: Omit<ResultCardProps, never>) {
  if (group.type === "NA") {
    if (viewMode === "chart") {
      return (
        <NaChartCardBody
          gtTally={group.gtTally}
          crossTallies={group.crossTallies}
          paletteId={paletteId}
        />
      );
    }
    if (group.crossTallies.length > 0) {
      return (
        <NaCrossTable
          gtTally={group.gtTally}
          crossTallies={group.crossTallies}
          weightCol={weightCol}
        />
      );
    }
    return <NaGtTable tally={group.gtTally} />;
  }

  if (viewMode === "chart") {
    return (
      <ChartCardBody
        gtTally={group.gtTally}
        crossTallies={group.crossTallies}
        gtChartType={group.gtTally.type === "SA" ? saChartType : maChartType}
        paletteId={paletteId}
      />
    );
  }
  if (group.crossTallies.length > 0) {
    return (
      <CrossTable
        gtTally={group.gtTally}
        crossTallies={group.crossTallies}
        pctDir={pctDirection}
        weightCol={weightCol}
      />
    );
  }
  return <GtTable tally={group.gtTally} maxPct={maxPct} weightCol={weightCol} />;
}

import type { TallyGroup } from "../../lib/agg/groupByQuestion";
import type { CategoricalTally, NumericTally } from "../../lib/agg/types";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { GtTable } from "./GtTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaGtTable } from "./NaGtTable";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";

interface ResultCardProps {
  group: TallyGroup;
  viewMode: ViewMode;
  weightCol: string;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function ResultCard({ group, viewMode, weightCol, tableOpts, chartOpts }: ResultCardProps) {
  const { gtTally } = group;
  const hasCross = group.crossTallies.length > 0;

  const gtN =
    gtTally.type === "NA" ? (gtTally.slices[0]?.stats.n ?? 0) : (gtTally.slices[0]?.n ?? 0);
  const nLabel = weightCol ? `n=${gtN.toFixed(1)}` : `n=${gtN.toLocaleString()}`;
  const hasLabel = gtTally.label !== gtTally.questionCode;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{gtTally.label}</span>
          {hasLabel && <span class="text-xs tracking-wide text-muted">{gtTally.questionCode}</span>}
        </div>
        <span class="text-xs tracking-wide text-muted">{gtTally.type}</span>
        <span class="ml-auto text-xs text-muted">{nLabel}</span>
      </div>
      <CardBody
        group={group}
        viewMode={viewMode}
        weightCol={weightCol}
        tableOpts={tableOpts}
        chartOpts={chartOpts}
      />
    </div>
  );
}

function CardBody({
  group,
  viewMode,
  weightCol,
  tableOpts,
  chartOpts,
}: Omit<ResultCardProps, never>) {
  const { gtTally, crossTallies } = group;

  if (gtTally.type === "NA") {
    // 同一設問内のtallyは同じtypeなのでキャスト安全
    const crossNa = crossTallies as NumericTally[];
    if (viewMode === "chart") {
      return (
        <NaChartCardBody gtTally={gtTally} crossTallies={crossNa} paletteId={chartOpts.paletteId} />
      );
    }
    if (crossNa.length > 0) {
      return <NaCrossTable gtTally={gtTally} crossTallies={crossNa} weightCol={weightCol} />;
    }
    return <NaGtTable tally={gtTally} />;
  }

  // SA | MA — 同一設問内のtallyは同じtypeなのでキャスト安全
  const crossCat = crossTallies as CategoricalTally[];
  if (viewMode === "chart") {
    const { saChartType, maChartType, paletteId } = chartOpts;
    return (
      <ChartCardBody
        gtTally={gtTally}
        crossTallies={crossCat}
        gtChartType={gtTally.type === "SA" ? saChartType : maChartType}
        paletteId={paletteId}
      />
    );
  }
  if (crossCat.length > 0) {
    return (
      <CrossTable
        gtTally={gtTally}
        crossTallies={crossCat}
        pctDir={tableOpts.pctDirection}
        weightCol={weightCol}
      />
    );
  }
  return <GtTable tally={gtTally} maxPct={tableOpts.maxPct} weightCol={weightCol} />;
}

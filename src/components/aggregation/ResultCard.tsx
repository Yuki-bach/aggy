import type { TallyGroup } from "../../lib/agg/groupByQuestion";
import type { CategoricalTally, NumericTally } from "../../lib/agg/types";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { GtTable } from "./GtTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaGtTable } from "./NaGtTable";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";
import { formatN } from "../../lib/format";

interface ResultCardProps {
  group: TallyGroup;
  viewMode: ViewMode;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function ResultCard({ group, viewMode, tableOpts, chartOpts }: ResultCardProps) {
  const { gtTally } = group;
  const hasCross = group.crossTallies.length > 0;

  const gtN =
    gtTally.type === "NA" ? (gtTally.slices[0]?.stats.n ?? 0) : (gtTally.slices[0]?.n ?? 0);

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{gtTally.label}</span>
          <span class="text-xs tracking-wide text-muted">{gtTally.questionCode}</span>
        </div>
        <span class="text-xs tracking-wide text-muted">{gtTally.type}</span>
        <span class="ml-auto text-xs text-muted">n={formatN(gtN)}</span>
      </div>
      <CardBody group={group} viewMode={viewMode} tableOpts={tableOpts} chartOpts={chartOpts} />
    </div>
  );
}

function CardBody({ group, viewMode, tableOpts, chartOpts }: ResultCardProps) {
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
      return <NaCrossTable gtTally={gtTally} crossTallies={crossNa} />;
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
    return <CrossTable gtTally={gtTally} crossTallies={crossCat} pctDir={tableOpts.pctDirection} />;
  }
  return <GtTable tally={gtTally} maxPct={tableOpts.maxPct} />;
}

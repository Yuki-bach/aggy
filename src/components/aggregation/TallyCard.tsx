import type { Tally } from "../../lib/agg/types";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { GtTable } from "./GtTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaGtTable } from "./NaGtTable";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";
import { formatN } from "../../lib/format";

interface TallyCardProps {
  gtTally: Tally;
  crossTallies: Tally[];
  viewMode: ViewMode;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function TallyCard({
  gtTally,
  crossTallies,
  viewMode,
  tableOpts,
  chartOpts,
}: TallyCardProps) {
  const hasCross = crossTallies.length > 0;

  const gtN = gtTally.slices[0]?.n ?? 0;

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
      <CardBody
        gtTally={gtTally}
        crossTallies={crossTallies}
        viewMode={viewMode}
        tableOpts={tableOpts}
        chartOpts={chartOpts}
      />
    </div>
  );
}

function CardBody({ gtTally, crossTallies, viewMode, tableOpts, chartOpts }: TallyCardProps) {
  if (gtTally.type === "NA") {
    if (viewMode === "chart") {
      return (
        <NaChartCardBody
          gtTally={gtTally}
          crossTallies={crossTallies}
          paletteId={chartOpts.paletteId}
        />
      );
    }
    if (crossTallies.length > 0) {
      return <NaCrossTable gtTally={gtTally} crossTallies={crossTallies} />;
    }
    return <NaGtTable tally={gtTally} />;
  }

  // SA | MA
  if (viewMode === "chart") {
    const { saChartType, maChartType, paletteId } = chartOpts;
    return (
      <ChartCardBody
        gtTally={gtTally}
        crossTallies={crossTallies}
        gtChartType={gtTally.type === "SA" ? saChartType : maChartType}
        paletteId={paletteId}
      />
    );
  }
  if (crossTallies.length > 0) {
    return (
      <CrossTable gtTally={gtTally} crossTallies={crossTallies} pctDir={tableOpts.pctDirection} />
    );
  }
  return <GtTable tally={gtTally} maxPct={tableOpts.maxPct} />;
}

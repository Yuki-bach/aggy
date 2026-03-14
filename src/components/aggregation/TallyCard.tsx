import type { Tally } from "../../lib/agg/types";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { GrandTotalTable } from "./GrandTotalTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaGrandTotalTable } from "./NaGrandTotalTable";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";
import { formatN } from "../../lib/format";

interface TallyCardProps {
  grandTotalTally: Tally;
  crossTallies: Tally[];
  viewMode: ViewMode;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function TallyCard({
  grandTotalTally,
  crossTallies,
  viewMode,
  tableOpts,
  chartOpts,
}: TallyCardProps) {
  const hasCross = crossTallies.length > 0;

  const grandTotalN = grandTotalTally.slices[0]?.n ?? 0;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{grandTotalTally.label}</span>
          <span class="text-xs tracking-wide text-muted">{grandTotalTally.questionCode}</span>
        </div>
        <span class="text-xs tracking-wide text-muted">{grandTotalTally.type}</span>
        <span class="ml-auto text-xs text-muted">n={formatN(grandTotalN)}</span>
      </div>
      <CardBody
        grandTotalTally={grandTotalTally}
        crossTallies={crossTallies}
        viewMode={viewMode}
        tableOpts={tableOpts}
        chartOpts={chartOpts}
      />
    </div>
  );
}

function CardBody({
  grandTotalTally,
  crossTallies,
  viewMode,
  tableOpts,
  chartOpts,
}: TallyCardProps) {
  if (grandTotalTally.type === "NA") {
    if (viewMode === "chart") {
      return (
        <NaChartCardBody
          grandTotalTally={grandTotalTally}
          crossTallies={crossTallies}
          paletteId={chartOpts.paletteId}
        />
      );
    }
    if (crossTallies.length > 0) {
      return <NaCrossTable grandTotalTally={grandTotalTally} crossTallies={crossTallies} />;
    }
    return <NaGrandTotalTable tally={grandTotalTally} />;
  }

  // SA | MA
  if (viewMode === "chart") {
    const { saChartType, maChartType, paletteId } = chartOpts;
    return (
      <ChartCardBody
        grandTotalTally={grandTotalTally}
        crossTallies={crossTallies}
        grandTotalChartType={grandTotalTally.type === "SA" ? saChartType : maChartType}
        paletteId={paletteId}
      />
    );
  }
  if (crossTallies.length > 0) {
    return (
      <CrossTable
        grandTotalTally={grandTotalTally}
        crossTallies={crossTallies}
        pctDir={tableOpts.pctDirection}
      />
    );
  }
  return <GrandTotalTable tally={grandTotalTally} maxPct={tableOpts.maxPct} />;
}

import type { Tab } from "../../lib/agg/types";
import { ChartCardBody } from "./ChartCardBody";
import { CrossTable } from "./CrossTable";
import { TabTable } from "./TabTable";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { NaTabTable } from "./NaTabTable";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";
import { formatN } from "../../lib/format";

interface TabCardProps {
  tab: Tab;
  crossTabs: Tab[];
  viewMode: ViewMode;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function TabCard({
  tab,
  crossTabs,
  viewMode,
  tableOpts,
  chartOpts,
}: TabCardProps) {
  const hasCross = crossTabs.length > 0;

  const tabN = tab.slices[0]?.n ?? 0;

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{tab.label}</span>
          <span class="text-xs tracking-wide text-muted">{tab.questionCode}</span>
        </div>
        <span class="text-xs tracking-wide text-muted">{tab.type}</span>
        <span class="ml-auto text-xs text-muted">n={formatN(tabN)}</span>
      </div>
      <CardBody
        tab={tab}
        crossTabs={crossTabs}
        viewMode={viewMode}
        tableOpts={tableOpts}
        chartOpts={chartOpts}
      />
    </div>
  );
}

function CardBody({
  tab,
  crossTabs,
  viewMode,
  tableOpts,
  chartOpts,
}: TabCardProps) {
  const isNA = tab.type === "NA";

  if (viewMode === "chart") {
    return isNA ? (
      <NaChartCardBody
        tab={tab}
        crossTabs={crossTabs}
        paletteId={chartOpts.paletteId}
      />
    ) : (
      <ChartCardBody
        tab={tab}
        crossTabs={crossTabs}
        tabChartType={
          tab.type === "SA" ? chartOpts.saChartType : chartOpts.maChartType
        }
        paletteId={chartOpts.paletteId}
      />
    );
  }

  return isNA ? (
    <NaTableCardBody tab={tab} crossTabs={crossTabs} />
  ) : (
    <TableCardBody
      tab={tab}
      crossTabs={crossTabs}
      tableOpts={tableOpts}
    />
  );
}

function TableCardBody({
  tab,
  crossTabs,
  tableOpts,
}: {
  tab: Tab;
  crossTabs: Tab[];
  tableOpts: TableOpts;
}) {
  if (crossTabs.length > 0) {
    return (
      <CrossTable
        tab={tab}
        crossTabs={crossTabs}
        basis={tableOpts.basis}
      />
    );
  }
  return <TabTable tab={tab} maxPct={tableOpts.maxPct} />;
}

function NaTableCardBody({
  tab,
  crossTabs,
}: {
  tab: Tab;
  crossTabs: Tab[];
}) {
  if (crossTabs.length > 0) {
    return <NaCrossTable tab={tab} crossTabs={crossTabs} />;
  }
  return <NaTabTable tab={tab} />;
}

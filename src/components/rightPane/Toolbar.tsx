import { render } from "preact";
import type { AggResult } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { downloadAllCSV } from "../../lib/agg/download";
import { t } from "../../lib/i18n";
import type { GtChartType } from "./ChartRenderer";

type ViewMode = "table" | "chart";
export type PctDirection = "vertical" | "horizontal";

interface ToolbarCallbacks {
  onViewModeChange: (mode: ViewMode) => void;
  onSaChartTypeChange: (type: GtChartType) => void;
  onMaChartTypeChange: (type: GtChartType) => void;
  onPctDirectionChange: (dir: PctDirection) => void;
}

interface ToolbarProps {
  hasCross: boolean;
  results: AggResult[];
  weightCol: string;
  currentViewMode: ViewMode;
  currentPctDirection: PctDirection;
  layoutMeta: LayoutMeta | undefined;
  callbacks: ToolbarCallbacks;
}

function Toolbar({
  hasCross,
  results,
  weightCol,
  currentViewMode,
  currentPctDirection,
  layoutMeta,
  callbacks,
}: ToolbarProps) {
  const weightText = weightCol
    ? t("result.weight.applied", { col: weightCol })
    : t("result.weight.none");

  return (
    <div class="results-header">
      <h2>{hasCross ? t("result.title.cross") : t("result.title.gt")}</h2>
      <span class="results-meta">
        {t("result.meta", { count: results.length, weight: weightText })}
      </span>

      {/* View mode toggle: table / chart */}
      <div class="view-toggle">
        <button
          class={`view-toggle-btn${currentViewMode === "table" ? " active" : ""}`}
          onClick={() => currentViewMode !== "table" && callbacks.onViewModeChange("table")}
        >
          {t("result.view.table")}
        </button>
        <button
          class={`view-toggle-btn${currentViewMode === "chart" ? " active" : ""}`}
          onClick={() => currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
        >
          {t("result.view.chart")}
        </button>
      </div>

      {/* Pct direction toggle (cross-tab table mode only) */}
      {hasCross && currentViewMode === "table" && (
        <div class="view-toggle">
          <button
            class={`view-toggle-btn${currentPctDirection === "vertical" ? " active" : ""}`}
            onClick={() =>
              currentPctDirection !== "vertical" && callbacks.onPctDirectionChange("vertical")
            }
          >
            {t("result.pct.vertical")}
          </button>
          <button
            class={`view-toggle-btn${currentPctDirection === "horizontal" ? " active" : ""}`}
            onClick={() =>
              currentPctDirection !== "horizontal" && callbacks.onPctDirectionChange("horizontal")
            }
          >
            {t("result.pct.horizontal")}
          </button>
        </div>
      )}

      {/* CSV export */}
      <button class="csv-export-btn" onClick={() => downloadAllCSV(results, weightCol, layoutMeta)}>
        {t("result.csv.export")}
      </button>
    </div>
  );
}

interface ChartOptsProps {
  saChartType: GtChartType;
  maChartType: GtChartType;
  callbacks: Pick<ToolbarCallbacks, "onSaChartTypeChange" | "onMaChartTypeChange">;
}

function ChartTypeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: GtChartType;
  onChange: (type: GtChartType) => void;
}) {
  return (
    <label>
      {label}{" "}
      <select
        class="chart-type-select"
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value as GtChartType)}
      >
        <option value="bar-h">{t("chart.barH")}</option>
        <option value="bar-v">{t("chart.barV")}</option>
        <option value="obi">{t("chart.obi")}</option>
      </select>
    </label>
  );
}

function ChartOpts({ saChartType, maChartType, callbacks }: ChartOptsProps) {
  return (
    <div class="chart-opts">
      <ChartTypeSelect label="SA:" value={saChartType} onChange={callbacks.onSaChartTypeChange} />
      <ChartTypeSelect label="MA:" value={maChartType} onChange={callbacks.onMaChartTypeChange} />
    </div>
  );
}

/** Bridge: render Toolbar into a container div for vanilla DOM callers */
export function buildToolbar(
  hasCross: boolean,
  results: AggResult[],
  weightCol: string,
  currentViewMode: ViewMode,
  currentPctDirection: PctDirection,
  layoutMeta: LayoutMeta | undefined,
  callbacks: ToolbarCallbacks,
): HTMLDivElement {
  const container = document.createElement("div");
  render(
    <Toolbar
      hasCross={hasCross}
      results={results}
      weightCol={weightCol}
      currentViewMode={currentViewMode}
      currentPctDirection={currentPctDirection}
      layoutMeta={layoutMeta}
      callbacks={callbacks}
    />,
    container,
  );
  return container;
}

/** Bridge: render ChartOpts into a container div for vanilla DOM callers */
export function buildChartOpts(
  saChartType: GtChartType,
  maChartType: GtChartType,
  callbacks: Pick<ToolbarCallbacks, "onSaChartTypeChange" | "onMaChartTypeChange">,
): HTMLDivElement {
  const container = document.createElement("div");
  render(
    <ChartOpts saChartType={saChartType} maChartType={maChartType} callbacks={callbacks} />,
    container,
  );
  return container;
}

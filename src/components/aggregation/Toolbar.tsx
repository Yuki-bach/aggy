import { downloadAllCSV } from "../../lib/agg/download";
import { t } from "../../lib/i18n";
import type { ChartType } from "./ChartContent";
import { ToggleButton, ToggleGroup } from "../shared/ToggleButton";
import { useAggregation } from "./AggregationContext";

export type ViewMode = "table" | "chart";
export type PctDirection = "vertical" | "horizontal";

export interface ToolbarCallbacks {
  onViewModeChange: (mode: ViewMode) => void;
  onSaChartTypeChange: (type: ChartType) => void;
  onMaChartTypeChange: (type: ChartType) => void;
  onPctDirectionChange: (dir: PctDirection) => void;
}

interface ToolbarProps {
  currentViewMode: ViewMode;
  callbacks: ToolbarCallbacks;
}

export function Toolbar({ currentViewMode, callbacks }: ToolbarProps) {
  const { results, weightCol, layoutMeta } = useAggregation();
  const weightText = weightCol
    ? t("result.weight.applied", { col: weightCol })
    : t("result.weight.none");

  return (
    <div class="mb-6 flex items-center gap-4">
      <h2 class="text-xl font-bold">{t("result.title.gt")}</h2>
      <span class="text-[0.8125rem] text-muted">
        {t("result.meta", { count: results.length, weight: weightText })}
      </span>

      {/* View mode toggle: table / chart */}
      <ToggleGroup class="ml-auto">
        <ToggleButton
          active={currentViewMode === "table"}
          onClick={() => currentViewMode !== "table" && callbacks.onViewModeChange("table")}
        >
          {t("result.view.table")}
        </ToggleButton>
        <ToggleButton
          active={currentViewMode === "chart"}
          onClick={() => currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
        >
          {t("result.view.chart")}
        </ToggleButton>
      </ToggleGroup>

      {/* CSV export */}
      <button
        class="m-0 min-h-9 w-auto cursor-pointer rounded-lg border border-accent bg-transparent px-4 py-2 text-[0.875rem] font-medium text-accent transition-[background] duration-150 hover:bg-accent-bg"
        onClick={() => downloadAllCSV(results, weightCol, layoutMeta)}
      >
        {t("result.csv.export")}
      </button>
    </div>
  );
}

interface ViewOptsProps {
  currentViewMode: ViewMode;
  currentPctDirection: PctDirection;
  saChartType: ChartType;
  maChartType: ChartType;
  callbacks: Pick<
    ToolbarCallbacks,
    "onSaChartTypeChange" | "onMaChartTypeChange" | "onPctDirectionChange"
  >;
}

function ChartTypeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  return (
    <label>
      {label}{" "}
      <select
        class="cursor-pointer rounded-sm border border-border bg-surface px-2 py-1 text-[0.8125rem] text-text"
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value as ChartType)}
      >
        <option value="bar-h">{t("chart.barH")}</option>
        <option value="bar-v">{t("chart.barV")}</option>
        <option value="obi">{t("chart.obi")}</option>
      </select>
    </label>
  );
}

export function ViewOpts({
  currentViewMode,
  currentPctDirection,
  saChartType,
  maChartType,
  callbacks,
}: ViewOptsProps) {
  const { hasCross } = useAggregation();

  const showChart = currentViewMode === "chart";
  const showPctToggle = currentViewMode === "table" && hasCross;

  if (!showChart && !showPctToggle) return null;

  return (
    <div class="mb-4 flex items-center justify-end gap-4 text-[0.8125rem] text-text-secondary">
      {showChart && (
        <>
          <ChartTypeSelect
            label="SA:"
            value={saChartType}
            onChange={callbacks.onSaChartTypeChange}
          />
          <ChartTypeSelect
            label="MA:"
            value={maChartType}
            onChange={callbacks.onMaChartTypeChange}
          />
        </>
      )}
      {showPctToggle && (
        <ToggleGroup class="ml-auto">
          <ToggleButton
            active={currentPctDirection === "vertical"}
            onClick={() =>
              currentPctDirection !== "vertical" && callbacks.onPctDirectionChange("vertical")
            }
          >
            {t("result.pct.vertical")}
          </ToggleButton>
          <ToggleButton
            active={currentPctDirection === "horizontal"}
            onClick={() =>
              currentPctDirection !== "horizontal" && callbacks.onPctDirectionChange("horizontal")
            }
          >
            {t("result.pct.horizontal")}
          </ToggleButton>
        </ToggleGroup>
      )}
    </div>
  );
}

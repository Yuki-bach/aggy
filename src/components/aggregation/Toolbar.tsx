import { t } from "../../lib/i18n";
import { PALETTE_BASES, PALETTE_IDS, type PaletteId } from "../../lib/chartConfig";
import type { ChartType } from "./ChartContent";
import { ToggleButton, ToggleGroup } from "../shared/ToggleButton";
import { useAggregation } from "./AggregationContext";
import { ExportMenu } from "./ExportMenu";
import { executeExport, type ExportAction } from "../../lib/export/export";

export type ViewMode = "table" | "chart";
export type PctDirection = "vertical" | "horizontal";

export interface ToolbarCallbacks {
  onViewModeChange: (mode: ViewMode) => void;
  onSaChartTypeChange: (type: ChartType) => void;
  onMaChartTypeChange: (type: ChartType) => void;
  onPctDirectionChange: (dir: PctDirection) => void;
  onPaletteChange: (id: PaletteId) => void;
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

      <ExportMenu
        onExport={(action: ExportAction) => executeExport(action, results, weightCol, layoutMeta)}
      />
    </div>
  );
}

interface ViewOptsProps {
  currentViewMode: ViewMode;
  currentPctDirection: PctDirection;
  saChartType: ChartType;
  maChartType: ChartType;
  paletteId: PaletteId;
  callbacks: Pick<
    ToolbarCallbacks,
    "onSaChartTypeChange" | "onMaChartTypeChange" | "onPctDirectionChange" | "onPaletteChange"
  >;
}

export function ViewOpts({
  currentViewMode,
  currentPctDirection,
  saChartType,
  maChartType,
  paletteId,
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
          <PaletteSelector current={paletteId} onChange={callbacks.onPaletteChange} />
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

// ─── Internal ───────────────────────────────────────────────

function PaletteSelector({
  current,
  onChange,
}: {
  current: PaletteId;
  onChange: (id: PaletteId) => void;
}) {
  return (
    <div class="flex items-center gap-1.5" role="radiogroup" aria-label={t("chart.palette")}>
      <span class="mr-0.5 text-muted">{t("chart.palette")}:</span>
      {PALETTE_IDS.map((id) => {
        const isActive = id === current;
        const base = id === "default" ? undefined : PALETTE_BASES[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={id}
            class={`h-5 w-5 cursor-pointer rounded-full border-2 transition-shadow ${isActive ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-border hover:border-muted"}`}
            style={
              base
                ? { backgroundColor: base }
                : {
                    background:
                      "conic-gradient(#0064d4, #0097a7, #1b7d3a, #e06500, #c62828, #6a1b9a, #0064d4)",
                  }
            }
            onClick={() => onChange(id)}
          />
        );
      })}
    </div>
  );
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

import type { AggResult } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { downloadAllCSV } from "../../lib/agg/download";
import { escHtml } from "../shared/escHtml";
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

export function buildToolbar(
  hasCross: boolean,
  results: AggResult[],
  weightCol: string,
  currentViewMode: ViewMode,
  currentPctDirection: PctDirection,
  layoutMeta: LayoutMeta | undefined,
  callbacks: ToolbarCallbacks,
): HTMLDivElement {
  const hdr = document.createElement("div");
  hdr.className = "results-header";
  const weightText = weightCol
    ? t("result.weight.applied", { col: escHtml(weightCol) })
    : t("result.weight.none");
  hdr.innerHTML = `
    <h2>${hasCross ? t("result.title.cross") : t("result.title.gt")}</h2>
    <span class="results-meta">
      ${t("result.meta", { count: results.length, weight: weightText })}
    </span>
  `;

  // Toggle: table / chart
  const toggle = document.createElement("div");
  toggle.className = "view-toggle";
  const btnTable = document.createElement("button");
  btnTable.className = `view-toggle-btn${currentViewMode === "table" ? " active" : ""}`;
  btnTable.dataset.mode = "table";
  btnTable.textContent = t("result.view.table");
  const btnChart = document.createElement("button");
  btnChart.className = `view-toggle-btn${currentViewMode === "chart" ? " active" : ""}`;
  btnChart.dataset.mode = "chart";
  btnChart.textContent = t("result.view.chart");
  toggle.appendChild(btnTable);
  toggle.appendChild(btnChart);

  toggle.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".view-toggle-btn");
    if (!btn || btn.dataset.mode === currentViewMode) return;
    callbacks.onViewModeChange(btn.dataset.mode as ViewMode);
  });
  hdr.appendChild(toggle);

  // Toggle: pct direction (only for cross-tab table mode)
  if (hasCross && currentViewMode === "table") {
    const pctToggle = document.createElement("div");
    pctToggle.className = "view-toggle";
    const btnVertical = document.createElement("button");
    btnVertical.className = `view-toggle-btn${currentPctDirection === "vertical" ? " active" : ""}`;
    btnVertical.dataset.dir = "vertical";
    btnVertical.textContent = t("result.pct.vertical");
    const btnHorizontal = document.createElement("button");
    btnHorizontal.className = `view-toggle-btn${currentPctDirection === "horizontal" ? " active" : ""}`;
    btnHorizontal.dataset.dir = "horizontal";
    btnHorizontal.textContent = t("result.pct.horizontal");
    pctToggle.appendChild(btnVertical);
    pctToggle.appendChild(btnHorizontal);

    pctToggle.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".view-toggle-btn");
      if (!btn || btn.dataset.dir === currentPctDirection) return;
      callbacks.onPctDirectionChange(btn.dataset.dir as PctDirection);
    });
    hdr.appendChild(pctToggle);
  }

  // CSV export button
  const csvBtn = document.createElement("button");
  csvBtn.className = "csv-export-btn";
  csvBtn.textContent = t("result.csv.export");
  csvBtn.addEventListener("click", () => downloadAllCSV(results, weightCol, layoutMeta));
  hdr.appendChild(csvBtn);

  return hdr;
}

export function buildChartOpts(
  saChartType: GtChartType,
  maChartType: GtChartType,
  callbacks: Pick<ToolbarCallbacks, "onSaChartTypeChange" | "onMaChartTypeChange">,
): HTMLDivElement {
  const chartOpts = document.createElement("div");
  chartOpts.className = "chart-opts";

  // SA chart type
  const saLabel = document.createElement("label");
  saLabel.textContent = "SA: ";
  const saSelect = document.createElement("select");
  saSelect.className = "chart-type-select";
  saSelect.innerHTML = `
    <option value="bar-h"${saChartType === "bar-h" ? " selected" : ""}>${t("chart.barH")}</option>
    <option value="bar-v"${saChartType === "bar-v" ? " selected" : ""}>${t("chart.barV")}</option>
    <option value="obi"${saChartType === "obi" ? " selected" : ""}>${t("chart.obi")}</option>
  `;
  saSelect.addEventListener("change", () => {
    callbacks.onSaChartTypeChange(saSelect.value as GtChartType);
  });
  saLabel.appendChild(saSelect);
  chartOpts.appendChild(saLabel);

  // MA chart type
  const maLabel = document.createElement("label");
  maLabel.textContent = "MA: ";
  const maSelect = document.createElement("select");
  maSelect.className = "chart-type-select";
  maSelect.innerHTML = `
    <option value="bar-h"${maChartType === "bar-h" ? " selected" : ""}>${t("chart.barH")}</option>
    <option value="bar-v"${maChartType === "bar-v" ? " selected" : ""}>${t("chart.barV")}</option>
    <option value="obi"${maChartType === "obi" ? " selected" : ""}>${t("chart.obi")}</option>
  `;
  maSelect.addEventListener("change", () => {
    callbacks.onMaChartTypeChange(maSelect.value as GtChartType);
  });
  maLabel.appendChild(maSelect);
  chartOpts.appendChild(maLabel);

  return chartOpts;
}

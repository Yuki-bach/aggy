import type { AggResult } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { downloadAllCSV } from "../../lib/download";
import { escHtml } from "../shared/escHtml";
import type { GtChartType } from "./ChartRenderer";

type ViewMode = "table" | "chart";

interface ToolbarCallbacks {
  onViewModeChange: (mode: ViewMode) => void;
  onSaChartTypeChange: (type: GtChartType) => void;
  onMaChartTypeChange: (type: GtChartType) => void;
}

export function buildToolbar(
  hasCross: boolean,
  results: AggResult[],
  weightCol: string,
  currentViewMode: ViewMode,
  layoutMeta: LayoutMeta | undefined,
  callbacks: ToolbarCallbacks,
): HTMLDivElement {
  const hdr = document.createElement("div");
  hdr.className = "results-header";
  hdr.innerHTML = `
    <h2>${hasCross ? "クロス集計結果" : "集計結果"}</h2>
    <span class="results-meta">
      ${results.length} 問  ／  ${weightCol ? "ウェイトバック適用: " + escHtml(weightCol) : "実数集計"}
    </span>
  `;

  // Toggle: table / chart
  const toggle = document.createElement("div");
  toggle.className = "view-toggle";
  const btnTable = document.createElement("button");
  btnTable.className = `view-toggle-btn${currentViewMode === "table" ? " active" : ""}`;
  btnTable.dataset.mode = "table";
  btnTable.textContent = "テーブル";
  const btnChart = document.createElement("button");
  btnChart.className = `view-toggle-btn${currentViewMode === "chart" ? " active" : ""}`;
  btnChart.dataset.mode = "chart";
  btnChart.textContent = "チャート";
  toggle.appendChild(btnTable);
  toggle.appendChild(btnChart);

  toggle.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".view-toggle-btn");
    if (!btn || btn.dataset.mode === currentViewMode) return;
    callbacks.onViewModeChange(btn.dataset.mode as ViewMode);
  });
  hdr.appendChild(toggle);

  // CSV export button
  const csvBtn = document.createElement("button");
  csvBtn.className = "csv-export-btn";
  csvBtn.textContent = "全件CSV出力";
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
    <option value="bar-h"${saChartType === "bar-h" ? " selected" : ""}>横棒</option>
    <option value="bar-v"${saChartType === "bar-v" ? " selected" : ""}>縦棒</option>
    <option value="obi"${saChartType === "obi" ? " selected" : ""}>帯</option>
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
    <option value="bar-h"${maChartType === "bar-h" ? " selected" : ""}>横棒</option>
    <option value="bar-v"${maChartType === "bar-v" ? " selected" : ""}>縦棒</option>
    <option value="obi"${maChartType === "obi" ? " selected" : ""}>帯</option>
  `;
  maSelect.addEventListener("change", () => {
    callbacks.onMaChartTypeChange(maSelect.value as GtChartType);
  });
  maLabel.appendChild(maSelect);
  chartOpts.appendChild(maLabel);

  return chartOpts;
}

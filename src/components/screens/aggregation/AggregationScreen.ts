import { escHtml } from "../../shared/escHtml";
import { t } from "../../../lib/i18n";

/** データ概要セクションを描画 */
export function renderDataSummary(
  csv: { fileName: string; rowCount: number; headers: string[] },
  layout: { fileName: string; colCount: number },
): void {
  const el = document.getElementById("data-summary")!;
  el.innerHTML = `
    <div class="data-summary-row">
      <span class="data-summary-label">${t("summary.rawdata")}</span>
      <span class="data-summary-value">${escHtml(csv.fileName)}</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label"></span>
      <span class="data-summary-value">${t("summary.rows", { rows: csv.rowCount.toLocaleString(), cols: csv.headers.length })}</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label">${t("summary.layout")}</span>
      <span class="data-summary-value">${escHtml(layout.fileName)}</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label"></span>
      <span class="data-summary-value">${t("summary.colDefs", { count: layout.colCount })}</span>
    </div>
  `;
}

/** ウェイト列情報を表示 */
export function renderWeightInfo(weightCol: string): void {
  const el = document.getElementById("weight-info")!;
  if (weightCol) {
    el.textContent = t("weight.label", { col: weightCol });
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

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

// Weight toggle state
let weightEnabled = true;

/** Get current weight toggle state */
export function getWeightEnabled(): boolean {
  return weightEnabled;
}

/** ウェイト列情報とON/OFFトグルを表示 */
export function renderWeightInfo(weightCol: string): void {
  const el = document.getElementById("weight-info")!;
  if (weightCol) {
    const label = document.getElementById("weight-label")!;
    label.textContent = t("weight.label", { col: weightCol });

    const toggle = document.getElementById("weight-toggle")!;
    toggle.innerHTML = "";

    const btnOn = document.createElement("button");
    btnOn.className = `view-toggle-btn${weightEnabled ? " active" : ""}`;
    btnOn.dataset.value = "on";
    btnOn.textContent = t("weight.on");

    const btnOff = document.createElement("button");
    btnOff.className = `view-toggle-btn${!weightEnabled ? " active" : ""}`;
    btnOff.dataset.value = "off";
    btnOff.textContent = t("weight.off");

    toggle.appendChild(btnOn);
    toggle.appendChild(btnOff);

    toggle.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".view-toggle-btn");
      if (!btn) return;
      const newEnabled = btn.dataset.value === "on";
      if (newEnabled === weightEnabled) return;
      weightEnabled = newEnabled;
      btnOn.classList.toggle("active", weightEnabled);
      btnOff.classList.toggle("active", !weightEnabled);
    });

    el.classList.remove("hidden");
  } else {
    weightEnabled = true;
    el.classList.add("hidden");
  }
}

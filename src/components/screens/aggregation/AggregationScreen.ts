import { escHtml } from "../../shared/escHtml";

/** データ概要セクションを描画 */
export function renderDataSummary(
  csv: { fileName: string; rowCount: number; headers: string[] },
  layout: { fileName: string; colCount: number },
): void {
  const el = document.getElementById("data-summary")!;
  el.innerHTML = `
    <div class="data-summary-row">
      <span class="data-summary-label">ローデータ</span>
      <span class="data-summary-value">${escHtml(csv.fileName)}</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label"></span>
      <span class="data-summary-value">${csv.rowCount.toLocaleString()} 行 / ${csv.headers.length} 列</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label">レイアウト</span>
      <span class="data-summary-value">${escHtml(layout.fileName)}</span>
    </div>
    <div class="data-summary-row">
      <span class="data-summary-label"></span>
      <span class="data-summary-value">${layout.colCount} 列定義</span>
    </div>
  `;
}

/** ウェイト列情報を表示 */
export function renderWeightInfo(weightCol: string): void {
  const el = document.getElementById("weight-info")!;
  if (weightCol) {
    el.textContent = `⚖ ウェイト列: ${weightCol}`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

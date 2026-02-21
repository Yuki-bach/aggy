import type { AggResult } from "../lib/aggregate";
import { downloadAllCSV } from "../lib/download";

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderResults(
  results: AggResult[],
  weightCol: string,
  _rawN: number
): void {
  document.getElementById("empty-state")!.classList.add("hidden");
  const area = document.getElementById("results-area")!;
  area.classList.remove("hidden");
  area.innerHTML = "";

  // ヘッダー
  const hdr = document.createElement("div");
  hdr.className = "results-header";
  hdr.innerHTML = `
    <h2>GT集計結果</h2>
    <span class="results-meta">
      ${results.length} 問  ／  ${weightCol ? "ウェイトバック適用: " + escHtml(weightCol) : "実数集計"}
    </span>
  `;

  const csvBtn = document.createElement("button");
  csvBtn.className = "run-btn";
  csvBtn.style.cssText =
    "margin:0;width:auto;padding:0.4rem 1rem;font-size:0.8rem;";
  csvBtn.textContent = "全件CSV出力";
  csvBtn.addEventListener("click", () => downloadAllCSV(results, weightCol));
  hdr.appendChild(csvBtn);

  area.appendChild(hdr);

  const grid = document.createElement("div");
  grid.className = "tables-grid";
  area.appendChild(grid);

  const maxPct = Math.max(...results.flatMap((r) => r.rows.map((row) => row.pct)));

  results.forEach((res) => {
    const card = document.createElement("div");
    card.className = "gt-table-card";

    const nLabel = weightCol
      ? `n=${res.n.toFixed(1)}（ウェイト後）`
      : `n=${res.n.toLocaleString()}`;

    card.innerHTML = `
      <div class="gt-table-head">
        <span class="q-label">${escHtml(res.col)}</span>
        <span class="q-type">${res.type}</span>
        <span class="q-n">${nLabel}</span>
      </div>
      <table class="gt">
        <thead>
          <tr>
            <th>選択肢</th>
            <th class="right">件数</th>
            <th class="right">%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${res.rows
            .map(
              (row) => `
            <tr>
              <td>${escHtml(row.label)}</td>
              <td class="num">${
                res.type === "SA" && !weightCol
                  ? row.count.toLocaleString()
                  : row.count.toFixed(1)
              }</td>
              <td class="pct">${row.pct.toFixed(1)}%</td>
              <td class="bar-cell">
                <div class="bar" style="width:${((row.pct / Math.max(maxPct, 1)) * 72).toFixed(1)}px"></div>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
    grid.appendChild(card);
  });
}

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

  const hasCross = results.some((r) => r.cross && r.cross.length > 0);

  // ヘッダー
  const hdr = document.createElement("div");
  hdr.className = "results-header";
  hdr.innerHTML = `
    <h2>${hasCross ? "クロス集計結果" : "GT集計結果"}</h2>
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
  grid.className = hasCross ? "tables-grid cross-mode" : "tables-grid";
  area.appendChild(grid);

  const maxPct = Math.max(...results.flatMap((r) => r.rows.map((row) => row.pct)));

  results.forEach((res) => {
    const card = document.createElement("div");
    card.className = res.cross ? "gt-table-card has-cross" : "gt-table-card";

    const nLabel = weightCol
      ? `n=${res.n.toFixed(1)}（ウェイト後）`
      : `n=${res.n.toLocaleString()}`;

    card.innerHTML = `
      <div class="gt-table-head">
        <span class="q-label">${escHtml(res.col)}</span>
        <span class="q-type">${res.type}</span>
        <span class="q-n">${nLabel}</span>
      </div>
    `;

    if (res.cross && res.cross.length > 0) {
      card.appendChild(buildCrossTable(res, weightCol, maxPct));
    } else {
      card.appendChild(buildGtTable(res, weightCol, maxPct));
    }

    grid.appendChild(card);
  });
}

function buildGtTable(
  res: AggResult,
  weightCol: string,
  maxPct: number
): HTMLTableElement {
  const table = document.createElement("table");
  table.className = "gt";
  table.innerHTML = `
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
  `;
  return table;
}

function buildCrossTable(
  res: AggResult,
  weightCol: string,
  _maxPct: number
): HTMLTableElement {
  const cross = res.cross!;
  const table = document.createElement("table");
  table.className = "gt cross-table";

  // ヘッダー行1: 全体 | クロス軸グループ...
  const tr1 = document.createElement("tr");

  const thLabel = document.createElement("th");
  thLabel.rowSpan = 2;
  thLabel.textContent = "選択肢";
  tr1.appendChild(thLabel);

  // 全体列グループ
  const thTotal = document.createElement("th");
  thTotal.colSpan = 2;
  thTotal.className = "cross-group-header gt-group";
  thTotal.innerHTML = `全体<br><span class="cross-n">n=${weightCol ? res.n.toFixed(1) : res.n.toLocaleString()}</span>`;
  tr1.appendChild(thTotal);

  // クロス軸ごとのグループヘッダー
  cross.forEach((section) => {
    const th = document.createElement("th");
    th.colSpan = section.headers.length;
    th.className = "cross-group-header";
    th.textContent = section.cross_col;
    tr1.appendChild(th);
  });

  // ヘッダー行2: 件数 | % | 各クロス値(n=X)...
  const tr2 = document.createElement("tr");

  const thCount = document.createElement("th");
  thCount.className = "right";
  thCount.textContent = "件数";
  tr2.appendChild(thCount);

  const thPct = document.createElement("th");
  thPct.className = "right";
  thPct.textContent = "%";
  tr2.appendChild(thPct);

  cross.forEach((section) => {
    section.headers.forEach((h) => {
      const th = document.createElement("th");
      th.className = "right cross-val-header";
      const nStr = weightCol ? h.n.toFixed(1) : h.n.toLocaleString();
      th.innerHTML = `${escHtml(h.label)}<br><span class="cross-n">n=${nStr}</span>`;
      tr2.appendChild(th);
    });
  });

  const thead = document.createElement("thead");
  thead.appendChild(tr1);
  thead.appendChild(tr2);
  table.appendChild(thead);

  // ボディ
  const tbody = document.createElement("tbody");
  res.rows.forEach((row, rowIdx) => {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.textContent = row.label;
    tr.appendChild(tdLabel);

    const tdCount = document.createElement("td");
    tdCount.className = "num";
    tdCount.textContent =
      res.type === "SA" && !weightCol
        ? row.count.toLocaleString()
        : row.count.toFixed(1);
    tr.appendChild(tdCount);

    const tdPct = document.createElement("td");
    tdPct.className = "pct";
    tdPct.textContent = row.pct.toFixed(1) + "%";
    tr.appendChild(tdPct);

    // クロスセル
    cross.forEach((section) => {
      const crossRow = section.rows[rowIdx];
      crossRow.cells.forEach((cell) => {
        const td = document.createElement("td");
        td.className = "pct cross-pct";
        td.textContent = cell.pct.toFixed(1) + "%";
        tr.appendChild(td);
      });
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

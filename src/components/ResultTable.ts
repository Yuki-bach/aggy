import type { AggResult, QuestionDef } from "../lib/aggregate";
import type { LayoutMeta } from "../lib/layout";
import { pivot } from "../lib/pivot";
import { downloadAllCSV } from "../lib/download";
import { isAIAvailable, generateComment } from "../lib/aiComment";
import {
  resolveQuestionLabel,
  resolveValueLabel,
  resolveSubLabel,
} from "../lib/labelResolver";
import {
  destroyAllCharts,
  renderChartCard,
  type GtChartType,
} from "./ChartRenderer";

function escHtml(str: string): string {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- 表示モード状態 ---
type ViewMode = "table" | "chart";
let currentViewMode: ViewMode = "table";
let saChartType: GtChartType = "bar-h";
let maChartType: GtChartType = "bar-h";

// --- 再描画用にデータをキャッシュ ---
let lastResults: AggResult[] | null = null;
let lastWeightCol = "";
let lastRawN = 0;
let lastLayoutMeta: LayoutMeta | undefined;
let lastCrossCols: QuestionDef[] | undefined;

export function renderResults(
  results: AggResult[],
  weightCol: string,
  rawN: number,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  // キャッシュ
  lastResults = results;
  lastWeightCol = weightCol;
  lastRawN = rawN;
  lastLayoutMeta = layoutMeta;
  lastCrossCols = crossCols;

  document.getElementById("empty-state")!.classList.add("hidden");
  const area = document.getElementById("results-area")!;
  area.classList.remove("hidden");
  area.innerHTML = "";

  const hasCross = results.some((r) => {
    const { subs } = pivot(r.cells);
    return subs.length > 1;
  });

  // ヘッダー
  const hdr = document.createElement("div");
  hdr.className = "results-header";
  hdr.innerHTML = `
    <h2>${hasCross ? "クロス集計結果" : "集計結果"}</h2>
    <span class="results-meta">
      ${results.length} 問  ／  ${weightCol ? "ウェイトバック適用: " + escHtml(weightCol) : "実数集計"}
    </span>
  `;

  // トグル: テーブル / チャート
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
    currentViewMode = btn.dataset.mode as ViewMode;
    reRender();
  });
  hdr.appendChild(toggle);

  // CSV出力ボタン
  const csvBtn = document.createElement("button");
  csvBtn.className = "csv-export-btn";
  csvBtn.textContent = "全件CSV出力";
  csvBtn.addEventListener("click", () => downloadAllCSV(results, weightCol, layoutMeta));
  hdr.appendChild(csvBtn);

  area.appendChild(hdr);

  // チャート種類セレクト（2行目）
  if (currentViewMode === "chart") {
    const chartOpts = document.createElement("div");
    chartOpts.className = "chart-opts";

    // SA用
    const saLabel = document.createElement("label");
    saLabel.textContent = "SA: ";
    const saSelect = document.createElement("select");
    saSelect.className = "chart-type-select";
    saSelect.innerHTML = `
      <option value="bar-h"${saChartType === "bar-h" ? " selected" : ""}>横棒</option>
      <option value="bar-v"${saChartType === "bar-v" ? " selected" : ""}>縦棒</option>
      <option value="pie"${saChartType === "pie" ? " selected" : ""}>円</option>
    `;
    saSelect.addEventListener("change", () => {
      saChartType = saSelect.value as GtChartType;
      reRender();
    });
    saLabel.appendChild(saSelect);
    chartOpts.appendChild(saLabel);

    // MA用
    const maLabel = document.createElement("label");
    maLabel.textContent = "MA: ";
    const maSelect = document.createElement("select");
    maSelect.className = "chart-type-select";
    maSelect.innerHTML = `
      <option value="bar-h"${maChartType === "bar-h" ? " selected" : ""}>横棒</option>
      <option value="bar-v"${maChartType === "bar-v" ? " selected" : ""}>縦棒</option>
    `;
    maSelect.addEventListener("change", () => {
      maChartType = maSelect.value as GtChartType;
      reRender();
    });
    maLabel.appendChild(maSelect);
    chartOpts.appendChild(maLabel);

    area.appendChild(chartOpts);
  }

  // コンテンツ描画
  const grid = document.createElement("div");
  area.appendChild(grid);

  if (currentViewMode === "chart") {
    renderChartContent(grid, results, hasCross, layoutMeta, crossCols);
  } else {
    renderTableContent(grid, results, weightCol, hasCross, layoutMeta, crossCols);
  }

  // AI分析コメントを自動生成（非同期、テーブル描画をブロックしない）
  showAIBubble(results, weightCol, layoutMeta);
}

function reRender(): void {
  if (!lastResults) return;
  renderResults(lastResults, lastWeightCol, lastRawN, lastLayoutMeta, lastCrossCols);
}

// テーマ変更時にチャート再描画
const observer = new MutationObserver(() => {
  if (currentViewMode === "chart" && lastResults) {
    reRender();
  }
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

function renderChartContent(
  grid: HTMLDivElement,
  results: AggResult[],
  hasCross: boolean,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  destroyAllCharts();
  grid.className = hasCross ? "charts-grid cross-mode" : "charts-grid";

  results.forEach((res) => {
    const gtType = res.type === "SA" ? saChartType : maChartType;
    const card = renderChartCard(res, gtType, layoutMeta, crossCols);
    grid.appendChild(card);
  });
}

function renderTableContent(
  grid: HTMLDivElement,
  results: AggResult[],
  weightCol: string,
  hasCross: boolean,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  destroyAllCharts();
  grid.className = hasCross ? "tables-grid cross-mode" : "tables-grid";

  const allGtCells = results.flatMap((r) => r.cells.filter((c) => c.sub === "GT"));
  const maxPct = Math.max(...allGtCells.map((c) => c.pct), 0);

  results.forEach((res) => {
    const pv = pivot(res.cells);
    const isCross = pv.subs.length > 1;

    const card = document.createElement("div");
    card.className = isCross ? "gt-table-card has-cross" : "gt-table-card";

    const gtSub = pv.subs.find((s) => s.label === "GT")!;
    const nLabel = weightCol
      ? `n=${gtSub.n.toFixed(1)}（ウェイト後）`
      : `n=${gtSub.n.toLocaleString()}`;

    const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
    const hasLabel = questionLabel !== res.question;

    card.innerHTML = `
      <div class="gt-table-head">
        <div class="q-header">
          <span class="q-label">${escHtml(questionLabel)}</span>
          ${hasLabel ? `<span class="q-key">${escHtml(res.question)}</span>` : ""}
        </div>
        <span class="q-type">${res.type}</span>
        <span class="q-n">${nLabel}</span>
      </div>
    `;

    if (isCross) {
      card.appendChild(buildCrossTable(res, pv, weightCol, layoutMeta, crossCols));
    } else {
      card.appendChild(buildGtTable(res, pv, weightCol, maxPct, layoutMeta));
    }

    grid.appendChild(card);
  });
}

async function showAIBubble(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): Promise<void> {
  if (!(await isAIAvailable())) return;

  // 既存の吹き出しがあれば除去
  document.querySelector(".ai-bubble")?.remove();

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.innerHTML = `
    <button class="ai-bubble-close" aria-label="閉じる">\u00d7</button>
    <div class="ai-bubble-header">\u2728 AI\u5206\u6790</div>
    <div class="ai-bubble-body ai-bubble-loading">\u5206\u6790\u4e2d...</div>
  `;
  document.body.appendChild(bubble);

  bubble.querySelector(".ai-bubble-close")!.addEventListener("click", () => bubble.remove());

  const comment = await generateComment(results, weightCol, layoutMeta);
  if (comment) {
    const body = bubble.querySelector(".ai-bubble-body")!;
    body.textContent = comment;
    body.classList.remove("ai-bubble-loading");
  } else {
    bubble.remove();
  }
}

function buildGtTable(
  res: AggResult,
  pv: ReturnType<typeof pivot>,
  weightCol: string,
  maxPct: number,
  layoutMeta?: LayoutMeta,
): HTMLTableElement {
  const { mains, lookup } = pv;

  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
  const table = document.createElement("table");
  table.className = "gt";
  table.innerHTML = `
    <caption class="visually-hidden">${escHtml(questionLabel)} の集計結果</caption>
    <thead>
      <tr>
        <th>選択肢</th>
        <th class="right">n</th>
        <th class="right">%</th>
        <th aria-hidden="true"><span class="visually-hidden">グラフ</span></th>
      </tr>
    </thead>
    <tbody>
      ${mains
        .map((main) => {
          const cell = lookup.get(`${main}\0GT`)!;
          return `
        <tr>
          <td>${escHtml(resolveValueLabel(res.type, res.question, main, layoutMeta))}</td>
          <td class="num">${
            res.type === "SA" && !weightCol ? cell.count.toLocaleString() : cell.count.toFixed(1)
          }</td>
          <td class="pct">${cell.pct.toFixed(1)}%</td>
          <td class="bar-cell" aria-hidden="true">
            <div class="bar" style="width:${((cell.pct / Math.max(maxPct, 1)) * 72).toFixed(1)}px"></div>
          </td>
        </tr>
      `;
        })
        .join("")}
    </tbody>
  `;
  return table;
}

function buildCrossTable(
  res: AggResult,
  pv: ReturnType<typeof pivot>,
  weightCol: string,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): HTMLTableElement {
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");

  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
  const table = document.createElement("table");
  table.className = "gt cross-table";

  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = `${questionLabel} のクロス集計結果`;
  table.appendChild(caption);

  // ヘッダー行1: 選択肢 | 全体 | クロス値...
  const tr1 = document.createElement("tr");

  const thLabel = document.createElement("th");
  thLabel.rowSpan = 2;
  thLabel.textContent = "選択肢";
  tr1.appendChild(thLabel);

  // 全体列グループ
  const thTotal = document.createElement("th");
  thTotal.colSpan = 2;
  thTotal.className = "cross-group-header gt-group";
  thTotal.innerHTML = `全体<br><span class="cross-n">n=${weightCol ? gtSub.n.toFixed(1) : gtSub.n.toLocaleString()}</span>`;
  tr1.appendChild(thTotal);

  // クロス値ヘッダー (1行にまとめて表示)
  const thCross = document.createElement("th");
  thCross.colSpan = crossSubs.length;
  thCross.className = "cross-group-header";
  // 複数のクロス軸がある場合もフラットに並ぶ
  thCross.textContent = "";
  tr1.appendChild(thCross);

  // ヘッダー行2: 件数 | % | 各クロス値(n=X)...
  const tr2 = document.createElement("tr");

  const thCount = document.createElement("th");
  thCount.className = "right";
  thCount.textContent = "n";
  tr2.appendChild(thCount);

  const thPct = document.createElement("th");
  thPct.className = "right";
  thPct.textContent = "%";
  tr2.appendChild(thPct);

  crossSubs.forEach((sub) => {
    const th = document.createElement("th");
    th.className = "right cross-val-header";
    const nStr = weightCol ? sub.n.toFixed(1) : sub.n.toLocaleString();
    th.innerHTML = `${escHtml(resolveSubLabel(sub.label, layoutMeta, crossCols))}<br><span class="cross-n">n=${nStr}</span>`;
    tr2.appendChild(th);
  });

  const thead = document.createElement("thead");
  thead.appendChild(tr1);
  thead.appendChild(tr2);
  table.appendChild(thead);

  // ボディ
  const tbody = document.createElement("tbody");
  mains.forEach((main) => {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.textContent = resolveValueLabel(res.type, res.question, main, layoutMeta);
    tr.appendChild(tdLabel);

    const gtCell = lookup.get(`${main}\0GT`)!;

    const tdCount = document.createElement("td");
    tdCount.className = "num";
    tdCount.textContent =
      res.type === "SA" && !weightCol ? gtCell.count.toLocaleString() : gtCell.count.toFixed(1);
    tr.appendChild(tdCount);

    const tdPct = document.createElement("td");
    tdPct.className = "pct";
    tdPct.textContent = gtCell.pct.toFixed(1) + "%";
    tr.appendChild(tdPct);

    // クロスセル
    crossSubs.forEach((sub) => {
      const cell = lookup.get(`${main}\0${sub.label}`);
      const td = document.createElement("td");
      td.className = "pct cross-pct";
      td.textContent = cell ? cell.pct.toFixed(1) + "%" : "-";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

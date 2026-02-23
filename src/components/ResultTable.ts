import type { AggResult, QuestionDef } from "../lib/aggregate";
import type { LayoutMeta } from "../lib/layout";
import { pivot } from "../lib/pivot";
import { downloadAllCSV } from "../lib/download";
import { isAIAvailable, generateComment } from "../lib/aiComment";

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 設問ラベルを解決する。なければ列名をそのまま返す */
function resolveQuestionLabel(col: string, meta?: LayoutMeta): string {
  return meta?.questionLabels[col] ?? col;
}

/** 選択肢ラベルを解決する
 *  SA: valueLabels[col][code]
 *  MA: valueLabels[colName]["1"]（colName = row.label）
 */
function resolveValueLabel(
  type: "SA" | "MA",
  col: string,
  rowLabel: string,
  meta?: LayoutMeta
): string {
  if (!meta) return rowLabel;
  if (type === "SA") {
    return meta.valueLabels[col]?.[rowLabel] ?? rowLabel;
  } else {
    // MA: rowLabel は個別列名（例 "q3_1"）。item.labelは "1" キーで保持
    return meta.valueLabels[rowLabel]?.["1"] ?? rowLabel;
  }
}

/** クロス軸ヘッダーのラベルを解決する。
 *  crossCols があれば SA クロス軸の値ラベルも解決する */
function resolveSubLabel(
  subLabel: string,
  meta?: LayoutMeta,
  crossCols?: QuestionDef[]
): string {
  if (!meta) return subLabel;
  // MAカラム名の場合: valueLabels[colName]["1"] にラベルがある
  const maLabel = meta.valueLabels[subLabel]?.["1"];
  if (maLabel) return maLabel;
  // SA クロス軸の値ラベルを解決
  if (crossCols) {
    for (const q of crossCols) {
      if (q.type === "SA") {
        const label = meta.valueLabels[q.column]?.[subLabel];
        if (label) return label;
      }
    }
  }
  return subLabel;
}

export function renderResults(
  results: AggResult[],
  weightCol: string,
  _rawN: number,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[]
): void {
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

  const csvBtn = document.createElement("button");
  csvBtn.className = "run-btn";
  csvBtn.style.cssText =
    "margin:0;width:auto;padding:0.4rem 1rem;font-size:0.8rem;";
  csvBtn.textContent = "全件CSV出力";
  csvBtn.addEventListener("click", () => downloadAllCSV(results, weightCol, layoutMeta));
  hdr.appendChild(csvBtn);

  area.appendChild(hdr);

  const grid = document.createElement("div");
  grid.className = hasCross ? "tables-grid cross-mode" : "tables-grid";
  area.appendChild(grid);

  const allGtCells = results.flatMap((r) =>
    r.cells.filter((c) => c.sub === "GT")
  );
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

  // AI分析コメントを自動生成（非同期、テーブル描画をブロックしない）
  showAIBubble(results, weightCol, layoutMeta);
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

  bubble
    .querySelector(".ai-bubble-close")!
    .addEventListener("click", () => bubble.remove());

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
  layoutMeta?: LayoutMeta
): HTMLTableElement {
  const { mains, lookup } = pv;

  const table = document.createElement("table");
  table.className = "gt";
  table.innerHTML = `
    <thead>
      <tr>
        <th>選択肢</th>
        <th class="right">n</th>
        <th class="right">%</th>
        <th></th>
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
            res.type === "SA" && !weightCol
              ? cell.count.toLocaleString()
              : cell.count.toFixed(1)
          }</td>
          <td class="pct">${cell.pct.toFixed(1)}%</td>
          <td class="bar-cell">
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
  crossCols?: QuestionDef[]
): HTMLTableElement {
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");

  const table = document.createElement("table");
  table.className = "gt cross-table";

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
      res.type === "SA" && !weightCol
        ? gtCell.count.toLocaleString()
        : gtCell.count.toFixed(1);
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

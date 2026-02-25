import type { AggResult, QuestionDef } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/pivot";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";

export function buildCrossTable(
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
  if (crossCols && crossCols.length > 0) {
    const crossLabels = crossCols.map((q) => {
      const col = q.type === "SA" ? q.column : q.prefix;
      return resolveQuestionLabel(col, layoutMeta);
    });
    thCross.textContent = crossLabels.join(" × ");
  }
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

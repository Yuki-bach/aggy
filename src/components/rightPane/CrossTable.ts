import type { AggResult, QuestionDef } from "../../lib/aggregate";
import { questionKey, parseCrossSub } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/pivot";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";

/** クロス軸ごとにsubsをグループ化する（プレフィックス付きsub値を利用） */
function groupSubsByCrossAxis(
  crossSubs: { label: string; n: number }[],
  crossCols: QuestionDef[],
  resType: "SA" | "MA",
): { crossCol: QuestionDef; subs: { label: string; n: number }[] }[] {
  // SA主軸: SA軸が先、MA軸が後。MA主軸: crossCols順
  const orderedCols =
    resType === "SA"
      ? [...crossCols.filter((q) => q.type === "SA"), ...crossCols.filter((q) => q.type === "MA")]
      : crossCols;

  // 軸キーごとにsubsを分類
  const axisMap = new Map<string, { label: string; n: number }[]>();
  for (const sub of crossSubs) {
    const parsed = parseCrossSub(sub.label);
    const key = parsed?.axisKey ?? "";
    let arr = axisMap.get(key);
    if (!arr) {
      arr = [];
      axisMap.set(key, arr);
    }
    arr.push(sub);
  }

  return orderedCols.map((crossCol) => ({
    crossCol,
    subs: axisMap.get(questionKey(crossCol)) ?? [],
  }));
}

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

  // クロス軸グループを構築
  const crossGroups =
    crossCols && crossCols.length > 0
      ? groupSubsByCrossAxis(crossSubs, crossCols, res.type)
      : [];
  const hasMultipleAxes = crossGroups.length > 1;

  // ヘッダー行1: 選択肢 | 全体 | クロス軸グループ...
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

  if (crossGroups.length > 0) {
    for (const group of crossGroups) {
      const col = group.crossCol.type === "SA" ? group.crossCol.column : group.crossCol.prefix;
      const label = resolveQuestionLabel(col, layoutMeta);
      const th = document.createElement("th");
      th.colSpan = group.subs.length;
      th.className = "cross-group-header" + (hasMultipleAxes ? " cross-axis-border" : "");
      th.textContent = label;
      tr1.appendChild(th);
    }
  } else {
    const thCross = document.createElement("th");
    thCross.colSpan = crossSubs.length;
    thCross.className = "cross-group-header";
    tr1.appendChild(thCross);
  }

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

  if (crossGroups.length > 0) {
    crossGroups.forEach((group, gi) => {
      group.subs.forEach((sub, si) => {
        const th = document.createElement("th");
        th.className = "right cross-val-header";
        if (hasMultipleAxes && si === 0 && gi > 0) {
          th.classList.add("cross-axis-first");
        }
        const nStr = weightCol ? sub.n.toFixed(1) : sub.n.toLocaleString();
        th.innerHTML = `${escHtml(resolveSubLabel(sub.label, layoutMeta, crossCols))}<br><span class="cross-n">n=${nStr}</span>`;
        tr2.appendChild(th);
      });
    });
  } else {
    crossSubs.forEach((sub) => {
      const th = document.createElement("th");
      th.className = "right cross-val-header";
      const nStr = weightCol ? sub.n.toFixed(1) : sub.n.toLocaleString();
      th.innerHTML = `${escHtml(resolveSubLabel(sub.label, layoutMeta, crossCols))}<br><span class="cross-n">n=${nStr}</span>`;
      tr2.appendChild(th);
    });
  }

  const thead = document.createElement("thead");
  thead.appendChild(tr1);
  thead.appendChild(tr2);
  table.appendChild(thead);

  // ボディ
  const tbody = document.createElement("tbody");

  // 軸グループ境界のインデックスを事前計算
  const axisBorderIndices = new Set<number>();
  if (hasMultipleAxes) {
    let offset = 0;
    for (let gi = 1; gi < crossGroups.length; gi++) {
      offset += crossGroups[gi - 1].subs.length;
      axisBorderIndices.add(offset);
    }
  }

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
    crossSubs.forEach((sub, i) => {
      const cell = lookup.get(`${main}\0${sub.label}`);
      const td = document.createElement("td");
      td.className = "pct cross-pct";
      if (axisBorderIndices.has(i)) {
        td.classList.add("cross-axis-first");
      }
      td.textContent = cell ? cell.pct.toFixed(1) + "%" : "-";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

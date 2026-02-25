import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import { questionKey, parseCrossSub } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./Toolbar";

/** Group subs by cross axis using prefixed sub values */
function groupSubsByCrossAxis(
  crossSubs: { label: string; n: number }[],
  crossCols: QuestionDef[],
  resType: "SA" | "MA",
): { crossCol: QuestionDef; subs: { label: string; n: number }[] }[] {
  // SA main: SA axes first, then MA. MA main: crossCols order
  const orderedCols =
    resType === "SA"
      ? [...crossCols.filter((q) => q.type === "SA"), ...crossCols.filter((q) => q.type === "MA")]
      : crossCols;

  // Classify subs by axis key
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
  pctDir: PctDirection,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): HTMLTableElement {
  if (pctDir === "horizontal") {
    return buildTransposedCrossTable(res, pv, weightCol, layoutMeta, crossCols);
  }
  return buildVerticalCrossTable(res, pv, weightCol, layoutMeta, crossCols);
}

/** 縦% (default): options as rows, cross values as columns */
function buildVerticalCrossTable(
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
  caption.textContent = t("table.caption.cross", { question: questionLabel });
  table.appendChild(caption);

  // Build cross-axis groups
  const crossGroups =
    crossCols && crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];
  const hasMultipleAxes = crossGroups.length > 1;

  // Header row 1: Option | Total | Cross axis groups...
  const tr1 = document.createElement("tr");

  const thLabel = document.createElement("th");
  thLabel.rowSpan = 2;
  tr1.appendChild(thLabel);

  // Total column group
  const thTotal = document.createElement("th");
  thTotal.colSpan = 2;
  thTotal.className = "cross-group-header gt-group";
  thTotal.innerHTML = `${t("table.total")}<br><span class="cross-n">n=${weightCol ? gtSub.n.toFixed(1) : gtSub.n.toLocaleString()}</span>`;
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

  // Header row 2: count | % | cross values (n=X)...
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

  // Body
  const tbody = document.createElement("tbody");

  // Precompute axis group boundary indices
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

    // Cross cells
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

/** 横% (transposed): cross values as rows, options as columns */
function buildTransposedCrossTable(
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
  caption.textContent = t("table.caption.cross", { question: questionLabel });
  table.appendChild(caption);

  // Precompute column denominators: for each main option, the GT count
  const mainGtCounts = new Map<string, number>();
  for (const main of mains) {
    const gtCell = lookup.get(`${main}\0GT`);
    mainGtCounts.set(main, gtCell?.count ?? 0);
  }

  // Header: empty | option1 | option2 | ...
  const thead = document.createElement("thead");
  const tr1 = document.createElement("tr");

  const thCorner = document.createElement("th");
  tr1.appendChild(thCorner);

  for (const main of mains) {
    const th = document.createElement("th");
    th.className = "right cross-val-header";
    const label = resolveValueLabel(res.type, res.question, main, layoutMeta);
    const gtCount = mainGtCounts.get(main) ?? 0;
    const nStr = weightCol ? gtCount.toFixed(1) : gtCount.toLocaleString();
    th.innerHTML = `${escHtml(label)}<br><span class="cross-n">n=${nStr}</span>`;
    tr1.appendChild(th);
  }

  thead.appendChild(tr1);
  table.appendChild(thead);

  // Body: one row per sub (GT first, then cross subs)
  const tbody = document.createElement("tbody");

  // GT row
  const gtRow = document.createElement("tr");
  const gtLabel = document.createElement("td");
  gtLabel.className = "transposed-row-label";
  const gtNStr = weightCol ? gtSub.n.toFixed(1) : gtSub.n.toLocaleString();
  gtLabel.innerHTML = `${t("table.total")}<br><span class="cross-n">n=${gtNStr}</span>`;
  gtRow.appendChild(gtLabel);

  for (const main of mains) {
    const cell = lookup.get(`${main}\0GT`);
    const td = document.createElement("td");
    td.className = "pct gt-col";
    if (cell) {
      // In transposed view, % = count / GT count for this option * 100
      // GT row: count equals GT count, so pct = 100%
      td.textContent = cell.pct.toFixed(1) + "%";
    } else {
      td.textContent = "-";
    }
    gtRow.appendChild(td);
  }
  tbody.appendChild(gtRow);

  // Cross sub rows
  // Build cross-axis groups for border rendering
  const crossGroups =
    crossCols && crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];

  // Flatten groups back with axis-first markers
  const subsWithBorders: { sub: { label: string; n: number }; isAxisFirst: boolean }[] = [];
  if (crossGroups.length > 1) {
    crossGroups.forEach((group, gi) => {
      group.subs.forEach((sub, si) => {
        subsWithBorders.push({ sub, isAxisFirst: gi > 0 && si === 0 });
      });
    });
  } else {
    for (const sub of crossSubs) {
      subsWithBorders.push({ sub, isAxisFirst: false });
    }
  }

  for (const { sub, isAxisFirst } of subsWithBorders) {
    const tr = document.createElement("tr");
    if (isAxisFirst) {
      tr.classList.add("cross-axis-first-row");
    }

    const tdLabel = document.createElement("td");
    tdLabel.className = "transposed-row-label";
    const nStr = weightCol ? sub.n.toFixed(1) : sub.n.toLocaleString();
    tdLabel.innerHTML = `${escHtml(resolveSubLabel(sub.label, layoutMeta, crossCols))}<br><span class="cross-n">n=${nStr}</span>`;
    tr.appendChild(tdLabel);

    for (const main of mains) {
      const cell = lookup.get(`${main}\0${sub.label}`);
      const td = document.createElement("td");
      td.className = "pct cross-pct";
      if (cell) {
        // % = count / GT count for this main option
        const denom = mainGtCounts.get(main) ?? 0;
        const pct = denom > 0 ? (cell.count / denom) * 100 : 0;
        td.textContent = pct.toFixed(1) + "%";
      } else {
        td.textContent = "-";
      }
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}

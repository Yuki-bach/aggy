import type { AggResult } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/pivot";
import { resolveQuestionLabel, resolveValueLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";
import { t } from "../../lib/i18n";

export function buildGtTable(
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
    <caption class="visually-hidden">${t("table.caption.gt", { question: escHtml(questionLabel) })}</caption>
    <thead>
      <tr>
        <th>${t("table.option")}</th>
        <th class="right">n</th>
        <th class="right">%</th>
        <th aria-hidden="true"><span class="visually-hidden">${t("table.graph")}</span></th>
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

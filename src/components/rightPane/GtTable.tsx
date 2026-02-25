import { render } from "preact";
import type { AggResult } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel, resolveValueLabel } from "../../lib/labelResolver";
import { t } from "../../lib/i18n";

interface GtTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
  weightCol: string;
  maxPct: number;
  layoutMeta?: LayoutMeta;
}

export function GtTable({ res, pv, weightCol, maxPct, layoutMeta }: GtTableProps) {
  const { mains, lookup } = pv;
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);

  return (
    <table class="gt">
      <caption class="sr-only">{t("table.caption.gt", { question: questionLabel })}</caption>
      <thead>
        <tr>
          <th>{t("table.option")}</th>
          <th class="right">n</th>
          <th class="right">%</th>
          <th aria-hidden="true">
            <span class="sr-only">{t("table.graph")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {mains.map((main) => {
          const cell = lookup.get(`${main}\0GT`)!;
          const label = resolveValueLabel(res.type, res.question, main, layoutMeta);
          const countStr =
            res.type === "SA" && !weightCol ? cell.count.toLocaleString() : cell.count.toFixed(1);
          const barWidth = ((cell.pct / Math.max(maxPct, 1)) * 72).toFixed(1);

          return (
            <tr key={main}>
              <td>{label}</td>
              <td class="num">{countStr}</td>
              <td class="pct">{cell.pct.toFixed(1)}%</td>
              <td class="bar-cell" aria-hidden="true">
                <div class="bar" style={{ width: `${barWidth}px` }} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Bridge: render GtTable into a container div for vanilla DOM callers */
export function buildGtTable(
  res: AggResult,
  pv: ReturnType<typeof pivot>,
  weightCol: string,
  maxPct: number,
  layoutMeta?: LayoutMeta,
): HTMLDivElement {
  const container = document.createElement("div");
  render(
    <GtTable res={res} pv={pv} weightCol={weightCol} maxPct={maxPct} layoutMeta={layoutMeta} />,
    container,
  );
  return container;
}

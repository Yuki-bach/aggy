import { render } from "preact";
import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import { questionKey, parseCrossSub } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import type { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labelResolver";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./Toolbar";

type SubInfo = { label: string; n: number };

/** Group subs by cross axis using prefixed sub values */
function groupSubsByCrossAxis(
  crossSubs: SubInfo[],
  crossCols: QuestionDef[],
  resType: "SA" | "MA",
): { crossCol: QuestionDef; subs: SubInfo[] }[] {
  const orderedCols =
    resType === "SA"
      ? [...crossCols.filter((q) => q.type === "SA"), ...crossCols.filter((q) => q.type === "MA")]
      : crossCols;

  const axisMap = new Map<string, SubInfo[]>();
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

function formatN(n: number, weightCol: string): string {
  return weightCol ? n.toFixed(1) : n.toLocaleString();
}

function crossColKey(col: QuestionDef): string {
  return col.type === "SA" ? col.column : col.prefix;
}

// ─── Vertical % Table ───────────────────────────────────────

interface VerticalCrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
  weightCol: string;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}

function VerticalCrossTable({
  res,
  pv,
  weightCol,
  layoutMeta,
  crossCols,
}: VerticalCrossTableProps) {
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);

  const crossGroups =
    crossCols && crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];
  const hasMultipleAxes = crossGroups.length > 1;

  // Precompute axis group boundary indices
  const axisBorderIndices = new Set<number>();
  if (hasMultipleAxes) {
    let offset = 0;
    for (let gi = 1; gi < crossGroups.length; gi++) {
      offset += crossGroups[gi - 1].subs.length;
      axisBorderIndices.add(offset);
    }
  }

  return (
    <table class="gt cross-table">
      <caption class="visually-hidden">
        {t("table.caption.cross", { question: questionLabel })}
      </caption>
      <thead>
        <tr>
          <th rowSpan={2} />
          <th colSpan={2} class="cross-group-header gt-group">
            {t("table.total")}
            <br />
            <span class="cross-n">n={formatN(gtSub.n, weightCol)}</span>
          </th>
          {crossGroups.length > 0 ? (
            crossGroups.map((group) => (
              <th
                key={crossColKey(group.crossCol)}
                colSpan={group.subs.length}
                class={"cross-group-header" + (hasMultipleAxes ? " cross-axis-border" : "")}
              >
                {resolveQuestionLabel(crossColKey(group.crossCol), layoutMeta)}
              </th>
            ))
          ) : (
            <th colSpan={crossSubs.length} class="cross-group-header" />
          )}
        </tr>
        <tr>
          <th class="right">n</th>
          <th class="right">%</th>
          {crossGroups.length > 0
            ? crossGroups.map((group, gi) =>
                group.subs.map((sub, si) => (
                  <th
                    key={sub.label}
                    class={
                      "right cross-val-header" +
                      (hasMultipleAxes && si === 0 && gi > 0 ? " cross-axis-first" : "")
                    }
                  >
                    {resolveSubLabel(sub.label, layoutMeta, crossCols)}
                    <br />
                    <span class="cross-n">n={formatN(sub.n, weightCol)}</span>
                  </th>
                )),
              )
            : crossSubs.map((sub) => (
                <th key={sub.label} class="right cross-val-header">
                  {resolveSubLabel(sub.label, layoutMeta, crossCols)}
                  <br />
                  <span class="cross-n">n={formatN(sub.n, weightCol)}</span>
                </th>
              ))}
        </tr>
      </thead>
      <tbody>
        {mains.map((main) => {
          const gtCell = lookup.get(`${main}\0GT`)!;
          return (
            <tr key={main}>
              <td>{resolveValueLabel(res.type, res.question, main, layoutMeta)}</td>
              <td class="num">
                {res.type === "SA" && !weightCol
                  ? gtCell.count.toLocaleString()
                  : gtCell.count.toFixed(1)}
              </td>
              <td class="pct">{gtCell.pct.toFixed(1)}%</td>
              {crossSubs.map((sub, i) => {
                const cell = lookup.get(`${main}\0${sub.label}`);
                return (
                  <td
                    key={sub.label}
                    class={"pct cross-pct" + (axisBorderIndices.has(i) ? " cross-axis-first" : "")}
                  >
                    {cell ? cell.pct.toFixed(1) + "%" : "-"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Transposed (Horizontal %) Table ────────────────────────

interface TransposedCrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
  weightCol: string;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}

function TransposedSubRow({
  sub,
  mains,
  lookup,
  mainGtCounts,
  weightCol,
  layoutMeta,
  crossCols,
}: {
  sub: SubInfo;
  mains: string[];
  lookup: Map<string, { count: number; pct: number }>;
  mainGtCounts: Map<string, number>;
  weightCol: string;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}) {
  return (
    <tr>
      <td class="transposed-row-label transposed-cross-label">
        {resolveSubLabel(sub.label, layoutMeta, crossCols)}
        <br />
        <span class="cross-n">n={formatN(sub.n, weightCol)}</span>
      </td>
      {mains.map((main) => {
        const cell = lookup.get(`${main}\0${sub.label}`);
        const denom = mainGtCounts.get(main) ?? 0;
        const pct = cell && denom > 0 ? (cell.count / denom) * 100 : 0;
        return (
          <td key={main} class="pct cross-pct">
            {cell ? pct.toFixed(1) + "%" : "-"}
          </td>
        );
      })}
    </tr>
  );
}

function TransposedCrossTable({
  res,
  pv,
  weightCol,
  layoutMeta,
  crossCols,
}: TransposedCrossTableProps) {
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);

  const mainGtCounts = new Map<string, number>();
  for (const main of mains) {
    const gtCell = lookup.get(`${main}\0GT`);
    mainGtCounts.set(main, gtCell?.count ?? 0);
  }

  const crossGroups =
    crossCols && crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];

  return (
    <table class="gt cross-table">
      <caption class="visually-hidden">
        {t("table.caption.cross", { question: questionLabel })}
      </caption>
      <thead>
        <tr>
          <th />
          {mains.map((main) => {
            const label = resolveValueLabel(res.type, res.question, main, layoutMeta);
            const gtCount = mainGtCounts.get(main) ?? 0;
            return (
              <th key={main} class="right cross-val-header">
                {label}
                <br />
                <span class="cross-n">n={formatN(gtCount, weightCol)}</span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {/* GT row */}
        <tr class="transposed-gt-row">
          <td class="transposed-row-label transposed-gt-label">
            {t("table.total")}
            <br />
            <span class="cross-n">n={formatN(gtSub.n, weightCol)}</span>
          </td>
          {mains.map((main) => {
            const cell = lookup.get(`${main}\0GT`);
            return (
              <td key={main} class="pct gt-col">
                {cell ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            );
          })}
        </tr>

        {/* Cross sub rows */}
        {crossGroups.length > 0
          ? crossGroups.map((group) => (
              <>
                <tr key={`hdr-${crossColKey(group.crossCol)}`} class="transposed-group-header-row">
                  <td colSpan={mains.length + 1} class="transposed-group-header">
                    {resolveQuestionLabel(crossColKey(group.crossCol), layoutMeta)}
                  </td>
                </tr>
                {group.subs.map((sub) => (
                  <TransposedSubRow
                    key={sub.label}
                    sub={sub}
                    mains={mains}
                    lookup={lookup}
                    mainGtCounts={mainGtCounts}
                    weightCol={weightCol}
                    layoutMeta={layoutMeta}
                    crossCols={crossCols}
                  />
                ))}
              </>
            ))
          : crossSubs.map((sub) => (
              <TransposedSubRow
                key={sub.label}
                sub={sub}
                mains={mains}
                lookup={lookup}
                mainGtCounts={mainGtCounts}
                weightCol={weightCol}
                layoutMeta={layoutMeta}
                crossCols={crossCols}
              />
            ))}
      </tbody>
    </table>
  );
}

// ─── Public API ─────────────────────────────────────────────

interface CrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
  weightCol: string;
  pctDir: PctDirection;
  layoutMeta?: LayoutMeta;
  crossCols?: QuestionDef[];
}

export function CrossTable({ res, pv, weightCol, pctDir, layoutMeta, crossCols }: CrossTableProps) {
  if (pctDir === "horizontal") {
    return (
      <TransposedCrossTable
        res={res}
        pv={pv}
        weightCol={weightCol}
        layoutMeta={layoutMeta}
        crossCols={crossCols}
      />
    );
  }
  return (
    <VerticalCrossTable
      res={res}
      pv={pv}
      weightCol={weightCol}
      layoutMeta={layoutMeta}
      crossCols={crossCols}
    />
  );
}

/** Bridge: render CrossTable into a container div for vanilla DOM callers */
export function buildCrossTable(
  res: AggResult,
  pv: ReturnType<typeof pivot>,
  weightCol: string,
  pctDir: PctDirection,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): HTMLDivElement {
  const container = document.createElement("div");
  render(
    <CrossTable
      res={res}
      pv={pv}
      weightCol={weightCol}
      pctDir={pctDir}
      layoutMeta={layoutMeta}
      crossCols={crossCols}
    />,
    container,
  );
  return container;
}

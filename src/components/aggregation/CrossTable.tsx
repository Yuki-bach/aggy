import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import { questionKey, parseCrossSub } from "../../lib/agg/aggregate";
import type { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel, resolveValueLabel, resolveSubLabel } from "../../lib/labels";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./Toolbar";
import { Th, Td } from "./TableCells";
import { useAggregation } from "./AggregationContext";

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

const TH_BASE =
  "py-3 px-4 text-[0.8125rem] font-bold tracking-[0.04em] border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

// ─── Vertical % Table ───────────────────────────────────────

interface VerticalCrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
}

function VerticalCrossTable({ res, pv }: VerticalCrossTableProps) {
  const { layoutMeta, weightCol, crossCols } = useAggregation();
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);

  const crossGroups =
    crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];
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
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: questionLabel })}</caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th colSpan={2} class={`${TH_BASE} text-center bg-gt-bg text-accent`}>
            {t("table.total")}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(gtSub.n, weightCol)}</span>
          </th>
          {crossGroups.length > 0 ? (
            crossGroups.map((group) => (
              <th
                key={crossColKey(group.crossCol)}
                colSpan={group.subs.length}
                class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {resolveQuestionLabel(crossColKey(group.crossCol), layoutMeta)}
              </th>
            ))
          ) : (
            <th
              colSpan={crossSubs.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2`}
            />
          )}
        </tr>
        <tr>
          <Th right>n</Th>
          <Th right>%</Th>
          {crossGroups.length > 0
            ? crossGroups.map((group, gi) =>
                group.subs.map((sub, si) => (
                  <th
                    key={sub.label}
                    class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
                  >
                    {resolveSubLabel(sub.label, layoutMeta, crossCols)}
                    <br />
                    <span class="text-muted text-xs font-normal">
                      n={formatN(sub.n, weightCol)}
                    </span>
                  </th>
                )),
              )
            : crossSubs.map((sub) => (
                <th
                  key={sub.label}
                  class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2`}
                >
                  {resolveSubLabel(sub.label, layoutMeta, crossCols)}
                  <br />
                  <span class="text-muted text-xs font-normal">n={formatN(sub.n, weightCol)}</span>
                </th>
              ))}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {mains.map((main) => {
          const gtCell = lookup.get(`${main}\0GT`)!;
          return (
            <tr key={main}>
              <Td>{resolveValueLabel(res.type, res.question, main, layoutMeta)}</Td>
              <Td right mono>
                {res.type === "SA" && !weightCol
                  ? gtCell.count.toLocaleString()
                  : gtCell.count.toFixed(1)}
              </Td>
              <Td right mono class="text-muted">
                {gtCell.pct.toFixed(1)}%
              </Td>
              {crossSubs.map((sub, i) => {
                const cell = lookup.get(`${main}\0${sub.label}`);
                return (
                  <td
                    key={sub.label}
                    class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border ${axisBorderIndices.has(i) ? "border-l-2 border-l-border-strong" : ""}`}
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

function TransposedSubRow({
  sub,
  mains,
  lookup,
}: {
  sub: SubInfo;
  mains: string[];
  lookup: Map<string, { count: number; pct: number }>;
}) {
  const { layoutMeta, weightCol, crossCols } = useAggregation();
  return (
    <tr>
      <td
        class={`${TD_BASE} text-left text-[0.8125rem] font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2`}
      >
        {resolveSubLabel(sub.label, layoutMeta, crossCols)}
        <br />
        <span class="text-muted text-xs font-normal">n={formatN(sub.n, weightCol)}</span>
      </td>
      {mains.map((main) => {
        const cell = lookup.get(`${main}\0${sub.label}`);
        return (
          <td key={main} class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border`}>
            {cell ? cell.pct.toFixed(1) + "%" : "-"}
          </td>
        );
      })}
    </tr>
  );
}

interface TransposedCrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
}

function TransposedCrossTable({ res, pv }: TransposedCrossTableProps) {
  const { layoutMeta, weightCol, crossCols } = useAggregation();
  const { mains, subs, lookup } = pv;
  const gtSub = subs.find((s) => s.label === "GT")!;
  const crossSubs = subs.filter((s) => s.label !== "GT");
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);

  const crossGroups =
    crossCols.length > 0 ? groupSubsByCrossAxis(crossSubs, crossCols, res.type) : [];

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: questionLabel })}</caption>
      <thead>
        <tr>
          <th class="py-3 px-4" />
          {mains.map((main) => {
            const label = resolveValueLabel(res.type, res.question, main, layoutMeta);
            const gtCell = lookup.get(`${main}\0GT`);
            return (
              <th
                key={main}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2`}
              >
                {label}
                <br />
                <span class="text-muted text-xs font-normal">
                  n={formatN(gtCell?.count ?? 0, weightCol)}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {/* GT row */}
        <tr class="[&_td]:border-b-2 [&_td]:border-border-strong">
          <td
            class={`${TD_BASE} text-left text-[0.8125rem] font-bold whitespace-nowrap border-r-2 border-r-border-strong bg-gt-bg text-accent`}
          >
            {t("table.total")}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(gtSub.n, weightCol)}</span>
          </td>
          {mains.map((main) => {
            const cell = lookup.get(`${main}\0GT`);
            return (
              <td key={main} class={`${TD_BASE} ${MONO} text-accent bg-gt-bg`}>
                {cell ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            );
          })}
        </tr>

        {/* Cross sub rows */}
        {crossGroups.length > 0
          ? crossGroups.map((group) => (
              <>
                <tr key={`hdr-${crossColKey(group.crossCol)}`}>
                  <td
                    colSpan={mains.length + 1}
                    class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-[0.8125rem] tracking-[0.04em] border-b-2 border-border-strong border-t-2 border-t-border-strong"
                  >
                    {resolveQuestionLabel(crossColKey(group.crossCol), layoutMeta)}
                  </td>
                </tr>
                {group.subs.map((sub) => (
                  <TransposedSubRow key={sub.label} sub={sub} mains={mains} lookup={lookup} />
                ))}
              </>
            ))
          : crossSubs.map((sub) => (
              <TransposedSubRow key={sub.label} sub={sub} mains={mains} lookup={lookup} />
            ))}
      </tbody>
    </table>
  );
}

// ─── Public API ─────────────────────────────────────────────

interface CrossTableProps {
  res: AggResult;
  pv: ReturnType<typeof pivot>;
  pctDir: PctDirection;
}

export function CrossTable({ res, pv, pctDir }: CrossTableProps) {
  if (pctDir === "horizontal") {
    return <TransposedCrossTable res={res} pv={pv} />;
  }
  return <VerticalCrossTable res={res} pv={pv} />;
}

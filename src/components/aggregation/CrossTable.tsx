import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import { questionKey } from "../../lib/agg/aggregate";
import type { PivotResult, CrossAxisInfo } from "../../lib/agg/pivot";
import { resolveQuestionLabel, resolveValueLabel } from "../../lib/labels";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./Toolbar";
import { Th, Td } from "./TableCells";
import { useAggregation } from "./AggregationContext";

interface CrossTableProps {
  res: AggResult;
  pv: PivotResult;
  pctDir: PctDirection;
}

export function CrossTable({ res, pv, pctDir }: CrossTableProps) {
  const data = useCrossTableData(res, pv);
  if (pctDir === "horizontal") {
    return <TransposedCrossTable data={data} res={res} pv={pv} />;
  }
  return <VerticalCrossTable data={data} res={res} pv={pv} />;
}

interface CrossGroup {
  crossCol: QuestionDef;
  axis: CrossAxisInfo;
}

function formatN(n: number, weightCol: string): string {
  return weightCol ? n.toFixed(1) : n.toLocaleString();
}

const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

interface CrossTableData {
  mains: string[];
  gtN: number;
  crossGroups: CrossGroup[];
  questionLabel: string;
  questionType: "SA" | "MA";
  weightCol: string;
}

function orderCrossAxes(
  crossAxes: CrossAxisInfo[],
  crossCols: QuestionDef[],
  resType: "SA" | "MA",
): CrossGroup[] {
  const orderedCols =
    resType === "SA"
      ? [...crossCols.filter((q) => q.type === "SA"), ...crossCols.filter((q) => q.type === "MA")]
      : crossCols;

  const axisMap = new Map<string, CrossAxisInfo>();
  for (const axis of crossAxes) {
    axisMap.set(axis.question, axis);
  }

  return orderedCols
    .map((crossCol) => {
      const axis = axisMap.get(questionKey(crossCol));
      return axis ? { crossCol, axis } : null;
    })
    .filter((g): g is CrossGroup => g !== null);
}

function useCrossTableData(res: AggResult, pv: PivotResult): CrossTableData {
  const { layoutMeta, weightCol, crossCols } = useAggregation();
  const { mains, crossAxes } = pv;
  const gtCell = pv.cell(mains[0]);
  const gtN = gtCell?.n ?? 0;
  const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
  const questionType = layoutMeta.questionTypes[res.question] ?? "SA";
  const crossGroups = orderCrossAxes(crossAxes, crossCols, questionType);

  return { mains, gtN, crossGroups, questionLabel, questionType, weightCol };
}

function VerticalCrossTable({
  data,
  res,
  pv,
}: {
  data: CrossTableData;
  res: AggResult;
  pv: PivotResult;
}) {
  const { layoutMeta } = useAggregation();
  const { mains, gtN, crossGroups, questionLabel, questionType, weightCol } = data;
  const hasMultipleAxes = crossGroups.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: questionLabel })}</caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th colSpan={2} class={`${TH_BASE} text-center bg-gt-bg text-accent`}>
            {t("table.total")}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(gtN, weightCol)}</span>
          </th>
          {crossGroups.map((group) => (
            <th
              key={group.axis.question}
              colSpan={group.axis.values.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {resolveQuestionLabel(group.axis.question, layoutMeta)}
            </th>
          ))}
        </tr>
        <tr>
          <Th right>n</Th>
          <Th right>%</Th>
          {crossGroups.map((group, gi) =>
            group.axis.values.map((v, vi) => (
              <th
                key={`${group.axis.question}-${v.value}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && vi === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {resolveValueLabel(group.axis.question, v.value, layoutMeta)}
                <br />
                <span class="text-muted text-xs font-normal">n={formatN(v.n, weightCol)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {mains.map((main) => {
          const gtCell = pv.cell(main)!;
          return (
            <tr key={main}>
              <Td>{resolveValueLabel(res.question, main, layoutMeta)}</Td>
              <Td right mono>
                {questionType === "SA" && !weightCol
                  ? gtCell.count.toLocaleString()
                  : gtCell.count.toFixed(1)}
              </Td>
              <Td right mono class="text-muted">
                {gtCell.pct.toFixed(1)}%
              </Td>
              {crossGroups.map((group, gi) =>
                group.axis.values.map((v, vi) => {
                  const cell = pv.cell(main, {
                    question: group.axis.question,
                    value: v.value,
                  });
                  return (
                    <td
                      key={`${group.axis.question}-${v.value}`}
                      class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border ${hasMultipleAxes && vi === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
                    >
                      {cell ? cell.pct.toFixed(1) + "%" : "-"}
                    </td>
                  );
                }),
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TransposedSubRow({
  axis,
  v,
  mains,
  pv,
}: {
  axis: CrossAxisInfo;
  v: { value: string; n: number };
  mains: string[];
  pv: PivotResult;
}) {
  const { layoutMeta, weightCol } = useAggregation();
  return (
    <tr>
      <td
        class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2`}
      >
        {resolveValueLabel(axis.question, v.value, layoutMeta)}
        <br />
        <span class="text-muted text-xs font-normal">n={formatN(v.n, weightCol)}</span>
      </td>
      {mains.map((main) => {
        const cell = pv.cell(main, { question: axis.question, value: v.value });
        return (
          <td key={main} class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border`}>
            {cell ? cell.pct.toFixed(1) + "%" : "-"}
          </td>
        );
      })}
    </tr>
  );
}

function TransposedCrossTable({
  data,
  res,
  pv,
}: {
  data: CrossTableData;
  res: AggResult;
  pv: PivotResult;
}) {
  const { layoutMeta } = useAggregation();
  const { mains, gtN, crossGroups, questionLabel, weightCol } = data;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: questionLabel })}</caption>
      <thead>
        <tr>
          <th class="py-3 px-4" />
          {mains.map((main) => {
            const gtCell = pv.cell(main);
            return (
              <th
                key={main}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2`}
              >
                {resolveValueLabel(res.question, main, layoutMeta)}
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
            class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong bg-gt-bg text-accent`}
          >
            {t("table.total")}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(gtN, weightCol)}</span>
          </td>
          {mains.map((main) => {
            const cell = pv.cell(main);
            return (
              <td key={main} class={`${TD_BASE} ${MONO} text-accent bg-gt-bg`}>
                {cell ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            );
          })}
        </tr>

        {/* Cross sub rows */}
        {crossGroups.map((group) => (
          <>
            <tr key={`hdr-${group.axis.question}`}>
              <td
                colSpan={mains.length + 1}
                class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-xs tracking-wide border-b-2 border-border-strong border-t-2 border-t-border-strong"
              >
                {resolveQuestionLabel(group.axis.question, layoutMeta)}
              </td>
            </tr>
            {group.axis.values.map((v) => (
              <TransposedSubRow
                key={`${group.axis.question}-${v.value}`}
                axis={group.axis}
                v={v}
                mains={mains}
                pv={pv}
              />
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
}

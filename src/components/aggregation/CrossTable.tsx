import type { Question, Tally, Slice } from "../../lib/agg/types";
import { NA_VALUE } from "../../lib/agg/sqlHelpers";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./Toolbar";
import { Th, Td } from "./TableCells";
import { useAggregation } from "./AggregationContext";

interface CrossTableProps {
  gtTally: Tally;
  crossTallies: Tally[];
  question: Question;
  pctDir: PctDirection;
}

export function CrossTable({ gtTally, crossTallies, question, pctDir }: CrossTableProps) {
  if (pctDir === "horizontal") {
    return (
      <TransposedCrossTable gtTally={gtTally} crossTallies={crossTallies} question={question} />
    );
  }
  return <VerticalCrossTable gtTally={gtTally} crossTallies={crossTallies} question={question} />;
}

function resolveLabel(code: string, question: Question): string {
  if (code === NA_VALUE) return t("label.na");
  return question.labels[code] ?? code;
}

function formatN(n: number, weightCol: string): string {
  return weightCol ? n.toFixed(1) : n.toLocaleString();
}

const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

interface CrossGroup {
  crossQuestion: Question;
  tally: Tally;
}

function VerticalCrossTable({
  gtTally,
  crossTallies,
  question,
}: {
  gtTally: Tally;
  crossTallies: Tally[];
  question: Question;
}) {
  const { weightCol, questions } = useAggregation();
  const gtSlice = gtTally.slices[0];
  const codes = gtTally.codes;

  const crossGroups: CrossGroup[] = crossTallies.map((ct) => ({
    crossQuestion: questions.find((q) => q.code === ct.by)!,
    tally: ct,
  }));
  const hasMultipleAxes = crossGroups.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: question.label })}</caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th colSpan={2} class={`${TH_BASE} text-center bg-gt-bg text-accent`}>
            {t("table.total")}
            <br />
            <span class="text-muted text-xs font-normal">n={formatN(gtSlice.n, weightCol)}</span>
          </th>
          {crossGroups.map((group) => (
            <th
              key={group.crossQuestion.code}
              colSpan={group.tally.slices.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {group.crossQuestion.label}
            </th>
          ))}
        </tr>
        <tr>
          <Th right>n</Th>
          <Th right>%</Th>
          {crossGroups.map((group, gi) =>
            group.tally.slices.map((slice, si) => (
              <th
                key={`${group.crossQuestion.code}-${slice.code}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {resolveLabel(slice.code, group.crossQuestion)}
                <br />
                <span class="text-muted text-xs font-normal">n={formatN(slice.n, weightCol)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {codes.map((code, i) => {
          const gtCell = gtSlice.cells[i];
          return (
            <tr key={code}>
              <Td>{resolveLabel(code, question)}</Td>
              <Td right mono>
                {gtTally.type === "SA" && !weightCol
                  ? gtCell.count.toLocaleString()
                  : gtCell.count.toFixed(1)}
              </Td>
              <Td right mono class="text-muted">
                {gtCell.pct.toFixed(1)}%
              </Td>
              {crossGroups.map((group, gi) =>
                group.tally.slices.map((slice, si) => {
                  const cell = slice.cells[i];
                  return (
                    <td
                      key={`${group.crossQuestion.code}-${slice.code}`}
                      class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
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

function TransposedCrossTable({
  gtTally,
  crossTallies,
  question,
}: {
  gtTally: Tally;
  crossTallies: Tally[];
  question: Question;
}) {
  const { weightCol, questions } = useAggregation();
  const gtSlice = gtTally.slices[0];
  const codes = gtTally.codes;

  const crossGroups: CrossGroup[] = crossTallies.map((ct) => ({
    crossQuestion: questions.find((q) => q.code === ct.by)!,
    tally: ct,
  }));

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: question.label })}</caption>
      <thead>
        <tr>
          <th class="py-3 px-4" />
          {codes.map((code, i) => {
            const gtCell = gtSlice.cells[i];
            return (
              <th
                key={code}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2`}
              >
                {resolveLabel(code, question)}
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
            <span class="text-muted text-xs font-normal">n={formatN(gtSlice.n, weightCol)}</span>
          </td>
          {codes.map((code, i) => {
            const cell = gtSlice.cells[i];
            return (
              <td key={code} class={`${TD_BASE} ${MONO} text-accent bg-gt-bg`}>
                {cell ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            );
          })}
        </tr>

        {/* Cross sub rows */}
        {crossGroups.map((group) => (
          <>
            <tr key={`hdr-${group.crossQuestion.code}`}>
              <td
                colSpan={codes.length + 1}
                class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-xs tracking-wide border-b-2 border-border-strong border-t-2 border-t-border-strong"
              >
                {group.crossQuestion.label}
              </td>
            </tr>
            {group.tally.slices.map((slice) => (
              <TransposedSubRow
                key={`${group.crossQuestion.code}-${slice.code}`}
                slice={slice}
                crossQuestion={group.crossQuestion}
                codes={codes}
              />
            ))}
          </>
        ))}
      </tbody>
    </table>
  );
}

function TransposedSubRow({
  slice,
  crossQuestion,
  codes,
}: {
  slice: Slice;
  crossQuestion: Question;
  codes: string[];
}) {
  const { weightCol } = useAggregation();
  return (
    <tr>
      <td
        class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2`}
      >
        {resolveLabel(slice.code, crossQuestion)}
        <br />
        <span class="text-muted text-xs font-normal">n={formatN(slice.n, weightCol)}</span>
      </td>
      {codes.map((_code, i) => {
        const cell = slice.cells[i];
        return (
          <td key={_code} class={`${TD_BASE} ${MONO} text-accent2 border-l border-l-row-border`}>
            {cell ? cell.pct.toFixed(1) + "%" : "-"}
          </td>
        );
      })}
    </tr>
  );
}

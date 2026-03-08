import type { CategoricalTally, Slice, Axis } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./viewTypes";
import { Th, Td } from "./TableCells";

interface CrossTableProps {
  gtTally: CategoricalTally;
  crossTallies: CategoricalTally[];
  pctDir: PctDirection;
  weightCol: string;
}

export function CrossTable({ gtTally, crossTallies, pctDir, weightCol }: CrossTableProps) {
  if (pctDir === "horizontal") {
    return (
      <TransposedCrossTable gtTally={gtTally} crossTallies={crossTallies} weightCol={weightCol} />
    );
  }
  return <VerticalCrossTable gtTally={gtTally} crossTallies={crossTallies} weightCol={weightCol} />;
}

function resolveAxisLabel(code: string, axis: Axis): string {
  return axis.labels[code];
}

function formatN(n: number, weightCol: string): string {
  return weightCol ? n.toFixed(1) : n.toLocaleString();
}

const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

interface CrossGroup {
  axis: Axis;
  tally: CategoricalTally;
}

function VerticalCrossTable({
  gtTally,
  crossTallies,
  weightCol,
}: {
  gtTally: CategoricalTally;
  crossTallies: CategoricalTally[];
  weightCol: string;
}) {
  const gtSlice = gtTally.slices[0];
  const codes = gtTally.codes;

  const crossGroups: CrossGroup[] = crossTallies.map((ct) => ({
    axis: ct.by!,
    tally: ct,
  }));
  const hasMultipleAxes = crossGroups.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: gtTally.label })}</caption>
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
              key={group.axis.code}
              colSpan={group.tally.slices.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {group.axis.label}
            </th>
          ))}
        </tr>
        <tr>
          <Th right>n</Th>
          <Th right>%</Th>
          {crossGroups.map((group, gi) =>
            group.tally.slices.map((slice, si) => (
              <th
                key={`${group.axis.code}-${slice.code}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {resolveAxisLabel(slice.code!, group.axis)}
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
              <Td>{gtTally.labels[code]}</Td>
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
                      key={`${group.axis.code}-${slice.code}`}
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
  weightCol,
}: {
  gtTally: CategoricalTally;
  crossTallies: CategoricalTally[];
  weightCol: string;
}) {
  const gtSlice = gtTally.slices[0];
  const codes = gtTally.codes;

  const crossGroups: CrossGroup[] = crossTallies.map((ct) => ({
    axis: ct.by!,
    tally: ct,
  }));

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">{t("table.caption.cross", { question: gtTally.label })}</caption>
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
                {gtTally.labels[code]}
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
            <tr key={`hdr-${group.axis.code}`}>
              <td
                colSpan={codes.length + 1}
                class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-xs tracking-wide border-b-2 border-border-strong border-t-2 border-t-border-strong"
              >
                {group.axis.label}
              </td>
            </tr>
            {group.tally.slices.map((slice) => (
              <TransposedSubRow
                key={`${group.axis.code}-${slice.code}`}
                slice={slice}
                axis={group.axis}
                codes={codes}
                weightCol={weightCol}
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
  axis,
  codes,
  weightCol,
}: {
  slice: Slice;
  axis: Axis;
  codes: string[];
  weightCol: string;
}) {
  return (
    <tr>
      <td
        class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2`}
      >
        {resolveAxisLabel(slice.code!, axis)}
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

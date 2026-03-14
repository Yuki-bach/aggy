import type { Tally, Slice } from "../../lib/agg/types";
import { t } from "../../lib/i18n";
import type { PctDirection } from "./viewTypes";
import { formatN } from "../../lib/format";
import { Th, Td } from "./TableCells";

interface CrossTableProps {
  grandTotalTally: Tally;
  crossTallies: Tally[];
  pctDir: PctDirection;
}

export function CrossTable({ grandTotalTally, crossTallies, pctDir }: CrossTableProps) {
  if (pctDir === "horizontal") {
    return <TransposedCrossTable grandTotalTally={grandTotalTally} crossTallies={crossTallies} />;
  }
  return <VerticalCrossTable grandTotalTally={grandTotalTally} crossTallies={crossTallies} />;
}

const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
const MONO = "text-right tabular-nums font-mono";

function VerticalCrossTable({
  grandTotalTally,
  crossTallies,
}: {
  grandTotalTally: Tally;
  crossTallies: Tally[];
}) {
  const grandTotalSlice = grandTotalTally.slices[0];
  const codes = grandTotalTally.codes;
  const hasMultipleAxes = crossTallies.length > 1;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">
        {t("table.caption.cross", { question: grandTotalTally.label })}
      </caption>
      <thead>
        <tr>
          <th rowSpan={2} class="py-3 px-4" />
          <th colSpan={2} class={`${TH_BASE} text-center bg-grandTotal-bg text-accent`}>
            {t("table.total")}
          </th>
          {crossTallies.map((ct) => (
            <th
              key={ct.by!.code}
              colSpan={ct.slices.length}
              class={`${TH_BASE} text-center bg-cross-bg border-l border-border text-accent2 ${hasMultipleAxes ? "border-l-2 border-l-border-strong" : ""}`}
            >
              {ct.by!.label}
            </th>
          ))}
        </tr>
        <tr>
          <Th right>n</Th>
          <Th right>%</Th>
          {crossTallies.map((ct, gi) =>
            ct.slices.map((slice, si) => (
              <th
                key={`${ct.by!.code}-${slice.code}`}
                class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2 ${hasMultipleAxes && si === 0 && gi > 0 ? "border-l-2 border-l-border-strong" : ""}`}
              >
                {ct.by!.labels[slice.code!]}
                <br />
                <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {codes.map((code, i) => {
          const grandTotalCell = grandTotalSlice.cells[i];
          return (
            <tr key={code}>
              <Td>{grandTotalTally.labels[code]}</Td>
              <Td right mono>
                {formatN(grandTotalCell.count)}
              </Td>
              <Td right mono class="text-muted">
                {grandTotalCell.pct.toFixed(1)}%
              </Td>
              {crossTallies.map((ct, gi) =>
                ct.slices.map((slice, si) => {
                  const cell = slice.cells[i];
                  return (
                    <td
                      key={`${ct.by!.code}-${slice.code}`}
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
  grandTotalTally,
  crossTallies,
}: {
  grandTotalTally: Tally;
  crossTallies: Tally[];
}) {
  const grandTotalSlice = grandTotalTally.slices[0];
  const codes = grandTotalTally.codes;

  return (
    <table class="w-full border-collapse text-sm tabular-nums min-w-[400px]">
      <caption class="sr-only">
        {t("table.caption.cross", { question: grandTotalTally.label })}
      </caption>
      <thead>
        <tr>
          <th class="py-3 px-4" />
          {codes.map((code) => (
            <th
              key={code}
              class={`${TH_BASE} text-right text-xs whitespace-nowrap border-l border-row-border bg-surface2`}
            >
              {grandTotalTally.labels[code]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Grand Total row */}
        <tr class="[&_td]:border-b-2 [&_td]:border-border-strong">
          <td
            class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong bg-grandTotal-bg text-accent`}
          >
            {t("table.total")}
          </td>
          {codes.map((code, i) => {
            const cell = grandTotalSlice.cells[i];
            return (
              <td key={code} class={`${TD_BASE} ${MONO} text-accent bg-grandTotal-bg`}>
                {cell ? cell.pct.toFixed(1) + "%" : "-"}
              </td>
            );
          })}
        </tr>

        {/* Cross sub rows */}
        {crossTallies.map((ct) => (
          <>
            <tr key={`hdr-${ct.by!.code}`}>
              <td
                colSpan={codes.length + 1}
                class="py-3 px-4 bg-cross-bg text-accent2 font-bold text-xs tracking-wide border-b-2 border-border-strong border-t-2 border-t-border-strong"
              >
                {ct.by!.label}
              </td>
            </tr>
            {ct.slices.map((slice) => (
              <TransposedSubRow
                key={`${ct.by!.code}-${slice.code}`}
                slice={slice}
                by={ct.by!}
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
  by,
  codes,
}: {
  slice: Slice;
  by: Tally["by"] & {};
  codes: string[];
}) {
  return (
    <tr>
      <td
        class={`${TD_BASE} text-left text-xs font-bold whitespace-nowrap border-r-2 border-r-border-strong text-accent2`}
      >
        {by.labels[slice.code!]}
        <br />
        <span class="text-muted text-xs font-normal">n={formatN(slice.n)}</span>
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

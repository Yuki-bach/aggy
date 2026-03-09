import type { Tally } from "../../lib/agg/types";
import { CrossTable } from "./CrossTable";
import { ChartCardBody } from "./ChartCardBody";
import { NaChartCardBody } from "./NaChartCardBody";
import { NaCrossTable } from "./NaCrossTable";
import { Th, Td } from "./TableCells";
import { formatN } from "../../lib/format";
import { t } from "../../lib/i18n";
import type { ChartOpts, TableOpts, ViewMode } from "./viewTypes";

interface MatrixChild {
  gtTally: Tally;
  crossTallies: Tally[];
}

interface MatrixResultCardProps {
  matrixKey: string;
  matrixLabel: string;
  items: MatrixChild[];
  viewMode: ViewMode;
  tableOpts: TableOpts;
  chartOpts: ChartOpts;
}

export function MatrixResultCard({
  matrixKey,
  matrixLabel,
  items,
  viewMode,
  tableOpts,
  chartOpts,
}: MatrixResultCardProps) {
  if (items.length === 0) return null;

  const firstType = items[0].gtTally.type;
  const hasCross = items.some((c) => c.crossTallies.length > 0);

  return (
    <div
      class={`overflow-hidden rounded-xl border border-border bg-surface shadow-sm${hasCross ? " overflow-x-auto" : ""}`}
    >
      <div class="flex items-baseline gap-3 border-b border-border p-4">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-bold text-accent">{matrixLabel}</span>
          <span class="text-xs tracking-wide text-muted">{matrixKey}</span>
        </div>
        <span class="text-xs tracking-wide text-muted">{firstType} MATRIX</span>
      </div>
      <MatrixCardBody
        items={items}
        viewMode={viewMode}
        tableOpts={tableOpts}
        chartOpts={chartOpts}
      />
    </div>
  );
}

function MatrixCardBody({
  items,
  viewMode,
  tableOpts,
  chartOpts,
}: Omit<MatrixResultCardProps, "matrixKey" | "matrixLabel">) {
  const firstType = items[0].gtTally.type;
  const hasCross = items.some((c) => c.crossTallies.length > 0);

  if (viewMode === "chart") {
    return <MatrixChartBody items={items} chartOpts={chartOpts} />;
  }

  if (hasCross) {
    return <MatrixCrossBody items={items} tableOpts={tableOpts} />;
  }

  // GT table mode
  if (firstType === "NA") {
    return <MatrixNaGtTable items={items} />;
  }
  return <MatrixCategoricalGtTable items={items} />;
}

// ─── GT: SA/MA matrix table ──────────────────────────────────

function MatrixCategoricalGtTable({ items }: { items: MatrixChild[] }) {
  // All children share the same codes/labels (common options)
  const firstTally = items[0].gtTally;
  const codes = firstTally.codes;

  return (
    <table class="w-full border-collapse text-sm tabular-nums">
      <thead>
        <tr>
          <Th></Th>
          <Th right>n</Th>
          {codes.map((code) => (
            <Th key={code} right>
              {firstTally.labels[code]}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {items.map(({ gtTally }) => {
          const slice = gtTally.slices[0];
          return (
            <tr key={gtTally.questionCode}>
              <Td>{gtTally.label}</Td>
              <Td right mono>
                {formatN(slice.n)}
              </Td>
              {codes.map((code, i) => {
                const cell = slice.cells[i];
                return (
                  <Td key={code} right mono class="text-muted">
                    {cell ? cell.pct.toFixed(1) + "%" : "-"}
                  </Td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── GT: NA matrix table ─────────────────────────────────────

const NA_STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

function MatrixNaGtTable({ items }: { items: MatrixChild[] }) {
  return (
    <table class="w-full border-collapse text-sm tabular-nums">
      <thead>
        <tr>
          <Th></Th>
          {NA_STAT_KEYS.map((key) => (
            <Th key={key} right>
              {t(`na.stat.${key}`)}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody class="[&_tr:hover_td]:bg-row-hover [&_tr:last-child_td]:border-b-0">
        {items.map(({ gtTally }) => {
          const stats = gtTally.slices[0].stats!;
          return (
            <tr key={gtTally.questionCode}>
              <Td>{gtTally.label}</Td>
              {NA_STAT_KEYS.map((key) => (
                <Td key={key} right mono>
                  {key === "n" ? stats.n.toLocaleString() : stats[key].toFixed(2)}
                </Td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Cross: per-child tables ─────────────────────────────────

function MatrixCrossBody({ items, tableOpts }: { items: MatrixChild[]; tableOpts: TableOpts }) {
  return (
    <div class="divide-y divide-border">
      {items.map(({ gtTally, crossTallies }) => (
        <div key={gtTally.questionCode}>
          <div class="bg-surface2 px-4 py-2 text-xs font-bold text-muted">
            {gtTally.label}
            <span class="ml-2 text-muted">({gtTally.questionCode})</span>
          </div>
          {gtTally.type === "NA" ? (
            <NaCrossTable gtTally={gtTally} crossTallies={crossTallies} />
          ) : (
            <CrossTable
              gtTally={gtTally}
              crossTallies={crossTallies}
              pctDir={tableOpts.pctDirection}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Chart: per-child charts ─────────────────────────────────

function MatrixChartBody({ items, chartOpts }: { items: MatrixChild[]; chartOpts: ChartOpts }) {
  return (
    <div class="divide-y divide-border">
      {items.map(({ gtTally, crossTallies }) => (
        <div key={gtTally.questionCode}>
          <div class="bg-surface2 px-4 py-2 text-xs font-bold text-muted">
            {gtTally.label}
            <span class="ml-2 text-muted">({gtTally.questionCode})</span>
          </div>
          {gtTally.type === "NA" ? (
            <NaChartCardBody
              gtTally={gtTally}
              crossTallies={crossTallies}
              paletteId={chartOpts.paletteId}
            />
          ) : (
            <ChartCardBody
              gtTally={gtTally}
              crossTallies={crossTallies}
              gtChartType={gtTally.type === "SA" ? chartOpts.saChartType : chartOpts.maChartType}
              paletteId={chartOpts.paletteId}
            />
          )}
        </div>
      ))}
    </div>
  );
}

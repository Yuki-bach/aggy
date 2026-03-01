import type { AggResult } from "../agg/aggregate";
import type { LayoutMeta } from "../layout";
import { NA_VALUE } from "../agg/sqlHelpers";
import { pivot } from "../agg/pivot";
import { resolveValueLabel } from "../labels";
import { t } from "../i18n";

export interface ExportGrid {
  question: string;
  type: "SA" | "MA";
  headers: string[][];
  rows: string[][];
}

export function buildExportGrids(results: AggResult[], layoutMeta: LayoutMeta): ExportGrid[] {
  const hasCross = results.some((r) => pivot(r.cells, r.question).crossAxes.length > 0);
  if (hasCross) {
    return buildCrossGrids(results, layoutMeta);
  }
  return results.map((res) => buildGtGrid(res, layoutMeta));
}

// ─── Internal ───────────────────────────────────────────────

export function resolveMainLabel(main: string): string {
  return main === NA_VALUE ? t("export.na") : main;
}

function getType(question: string, layoutMeta: LayoutMeta): "SA" | "MA" {
  return layoutMeta.questionTypes[question] ?? "SA";
}

function buildGtGrid(res: AggResult, layoutMeta: LayoutMeta): ExportGrid {
  const pv = pivot(res.cells, res.question);
  const { mains } = pv;
  const qType = getType(res.question, layoutMeta);
  const gtCell = pv.cell(mains[0]);
  const gtN = gtCell?.n ?? 0;
  const headers = [
    [
      t("export.header.variable"),
      t("export.header.type"),
      t("export.header.option"),
      t("export.header.n"),
      t("export.header.pct"),
    ],
  ];
  const rows: string[][] = [];

  for (const main of mains) {
    const cell = pv.cell(main)!;
    rows.push([
      res.question,
      qType,
      resolveMainLabel(main),
      cell.count.toFixed(1),
      cell.pct.toFixed(1),
    ]);
  }
  rows.push([res.question, qType, "n", gtN.toFixed(1), ""]);

  return { question: res.question, type: qType, headers, rows };
}

function buildCrossGrids(results: AggResult[], layoutMeta: LayoutMeta): ExportGrid[] {
  const firstResult = results.find((r) => pivot(r.cells, r.question).crossAxes.length > 0);
  if (!firstResult) return results.map((res) => buildGtGrid(res, layoutMeta));

  const firstPivot = pivot(firstResult.cells, firstResult.question);
  const allCrossValues = firstPivot.crossAxes.flatMap((axis) =>
    axis.values.map((v) => ({ question: axis.question, value: v.value, n: v.n })),
  );

  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("export.header.option"),
    t("export.header.total.n"),
    t("export.header.total.pct"),
  ];
  const headerRow2 = ["", "", "", "", ""];
  for (const cv of allCrossValues) {
    headerRow1.push("");
    const label = resolveValueLabel(cv.question, cv.value, layoutMeta);
    headerRow2.push(`${label}(n=${cv.n.toFixed(1)})`);
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return results.map((res) => {
    const pv = pivot(res.cells, res.question);
    const { mains, crossAxes } = pv;
    const qType = getType(res.question, layoutMeta);
    const resCrossValues = crossAxes.flatMap((axis) =>
      axis.values.map((v) => ({ question: axis.question, value: v.value, n: v.n })),
    );
    const gtCell = pv.cell(mains[0]);
    const gtN = gtCell?.n ?? 0;
    const rows: string[][] = [];

    for (const main of mains) {
      const gt = pv.cell(main)!;
      const dataRow = [
        res.question,
        qType,
        resolveMainLabel(main),
        gt.count.toFixed(1),
        gt.pct.toFixed(1),
      ];
      for (const cv of resCrossValues) {
        const cell = pv.cell(main, { question: cv.question, value: cv.value });
        dataRow.push(cell ? cell.pct.toFixed(1) : "");
      }
      rows.push(dataRow);
    }

    const nRow = [res.question, qType, "n", gtN.toFixed(1), ""];
    for (const cv of resCrossValues) {
      nRow.push(cv.n.toFixed(1));
    }
    rows.push(nRow);

    return { question: res.question, type: qType, headers: sharedHeaders, rows };
  });
}

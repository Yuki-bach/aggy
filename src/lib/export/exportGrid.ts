import type { AggResult } from "../agg/aggregate";
import type { LabelMap } from "../layout";
import { NA_VALUE } from "../agg/sqlHelpers";
import { pivot } from "../agg/pivot";
import { resolveSubLabel } from "../labels";
import { t } from "../i18n";

export interface ExportGrid {
  question: string;
  type: "SA" | "MA";
  headers: string[][];
  rows: string[][];
}

export function buildExportGrids(results: AggResult[], labelMap: LabelMap): ExportGrid[] {
  const hasCross = results.some((r) => pivot(r.cells, r.nBySubLabel).subs.length > 1);
  if (hasCross) {
    return buildCrossGrids(results, labelMap);
  }
  return results.map((res) => buildGtGrid(res));
}

// ─── Internal ───────────────────────────────────────────────

export function resolveMainLabel(main: string): string {
  return main === NA_VALUE ? t("label.na") : main;
}

function buildGtGrid(res: AggResult): ExportGrid {
  const { mains, subs, lookup } = pivot(res.cells, res.nBySubLabel);
  const gtSub = subs.find((s) => s.label === "GT")!;
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
    const cell = lookup.get(`${main}\0GT`)!;
    rows.push([
      res.question,
      res.type,
      resolveMainLabel(main),
      cell.count.toFixed(1),
      cell.pct.toFixed(1),
    ]);
  }
  rows.push([res.question, res.type, "n", gtSub.n.toFixed(1), ""]);

  return { question: res.question, type: res.type, headers, rows };
}

function buildCrossGrids(results: AggResult[], labelMap: LabelMap): ExportGrid[] {
  const firstResult = results.find((r) => pivot(r.cells, r.nBySubLabel).subs.length > 1);
  if (!firstResult) return results.map((res) => buildGtGrid(res));

  const firstPivot = pivot(firstResult.cells, firstResult.nBySubLabel);
  const crossSubs = firstPivot.subs.filter((s) => s.label !== "GT");

  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("export.header.option"),
    t("export.header.total.n"),
    t("export.header.total.pct"),
  ];
  const headerRow2 = ["", "", "", "", ""];
  for (const sub of crossSubs) {
    headerRow1.push("");
    headerRow2.push(`${resolveSubLabel(sub.label, labelMap)}(n=${sub.n.toFixed(1)})`);
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return results.map((res) => {
    const { mains, subs, lookup } = pivot(res.cells, res.nBySubLabel);
    const resCrossSubs = subs.filter((s) => s.label !== "GT");
    const gtSub = subs.find((s) => s.label === "GT")!;
    const rows: string[][] = [];

    for (const main of mains) {
      const gtCell = lookup.get(`${main}\0GT`)!;
      const dataRow = [
        res.question,
        res.type,
        resolveMainLabel(main),
        gtCell.count.toFixed(1),
        gtCell.pct.toFixed(1),
      ];
      for (const sub of resCrossSubs) {
        const cell = lookup.get(`${main}\0${sub.label}`);
        dataRow.push(cell ? cell.pct.toFixed(1) : "");
      }
      rows.push(dataRow);
    }

    const nRow = [res.question, res.type, "n", gtSub.n.toFixed(1), ""];
    for (const sub of resCrossSubs) {
      nRow.push(sub.n.toFixed(1));
    }
    rows.push(nRow);

    return { question: res.question, type: res.type, headers: sharedHeaders, rows };
  });
}

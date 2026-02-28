import type { AggResult } from "./aggregate";
import { parseCrossSub } from "./aggregate";
import type { LayoutMeta } from "../layout";
import { NA_VALUE } from "./sqlHelpers";
import { pivot } from "./pivot";

export interface ExportGrid {
  question: string;
  type: "SA" | "MA";
  headers: string[][];
  rows: string[][];
}

export function buildExportGrids(results: AggResult[], layoutMeta?: LayoutMeta): ExportGrid[] {
  const hasCross = results.some((r) => pivot(r.cells).subs.length > 1);
  if (hasCross) {
    return buildCrossGrids(results, layoutMeta);
  }
  return results.map((res) => buildGtGrid(res));
}

// ─── Internal ───────────────────────────────────────────────

export function resolveMainLabel(main: string): string {
  return main === NA_VALUE ? "無回答" : main;
}

export function resolveSubLabel(subLabel: string, meta?: LayoutMeta): string {
  if (subLabel === NA_VALUE) return "無回答";

  const parsed = parseCrossSub(subLabel);
  if (parsed) {
    const { axisKey, rawValue } = parsed;
    if (rawValue === NA_VALUE) return "無回答";
    if (!meta) return rawValue;
    const maLabel = meta.valueLabels[rawValue]?.["1"];
    if (maLabel) return maLabel;
    return meta.valueLabels[axisKey]?.[rawValue] ?? rawValue;
  }

  if (!meta) return subLabel;
  return meta.valueLabels[subLabel]?.["1"] ?? subLabel;
}

function buildGtGrid(res: AggResult): ExportGrid {
  const { mains, lookup } = pivot(res.cells);
  const gtSub = pivot(res.cells).subs.find((s) => s.label === "GT")!;
  const headers = [["変数名", "種別", "選択肢", "n", "%"]];
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

function buildCrossGrids(results: AggResult[], layoutMeta?: LayoutMeta): ExportGrid[] {
  const firstResult = results.find((r) => pivot(r.cells).subs.length > 1);
  if (!firstResult) return results.map((res) => buildGtGrid(res));

  const firstPivot = pivot(firstResult.cells);
  const crossSubs = firstPivot.subs.filter((s) => s.label !== "GT");

  const headerRow1 = ["変数名", "種別", "選択肢", "全体_n", "全体_%"];
  const headerRow2 = ["", "", "", "", ""];
  for (const sub of crossSubs) {
    headerRow1.push("");
    headerRow2.push(`${resolveSubLabel(sub.label, layoutMeta)}(n=${sub.n.toFixed(1)})`);
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return results.map((res) => {
    const { mains, subs, lookup } = pivot(res.cells);
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

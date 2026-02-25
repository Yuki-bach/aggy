import type { AggResult } from "./aggregate";
import { parseCrossSub } from "./aggregate";
import type { LayoutMeta } from "./layout";
import { NA_VALUE } from "./sqlHelpers";
import { pivot } from "./pivot";

/** Resolve cross sub value to label */
function resolveSubLabel(subLabel: string, meta?: LayoutMeta): string {
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

/** Resolve option label for CSV export */
function resolveMainLabel(main: string): string {
  return main === NA_VALUE ? "無回答" : main;
}

export function downloadAllCSV(
  results: AggResult[],
  _weightCol: string,
  layoutMeta?: LayoutMeta,
): void {
  const hasCross = results.some((r) => {
    const { subs } = pivot(r.cells);
    return subs.length > 1;
  });

  if (hasCross) {
    downloadCrossCSV(results, layoutMeta);
  } else {
    downloadGtCSV(results);
  }
}

function downloadGtCSV(results: AggResult[]): void {
  const rows: string[][] = [["変数名", "種別", "選択肢", "n", "%"]];

  results.forEach((res) => {
    const { mains, lookup } = pivot(res.cells);
    const gtSub = pivot(res.cells).subs.find((s) => s.label === "GT")!;

    mains.forEach((main) => {
      const cell = lookup.get(`${main}\0GT`)!;
      rows.push([
        res.question,
        res.type,
        resolveMainLabel(main),
        cell.count.toFixed(1),
        cell.pct.toFixed(1),
      ]);
    });
    rows.push([res.question, res.type, "n", gtSub.n.toFixed(1), ""]);
    rows.push([]);
  });

  exportCSV(rows, `gt_result_${today()}.csv`);
}

function downloadCrossCSV(results: AggResult[], layoutMeta?: LayoutMeta): void {
  // Get cross-axis structure from first result
  const firstResult = results.find((r) => {
    const { subs } = pivot(r.cells);
    return subs.length > 1;
  });
  if (!firstResult) {
    downloadGtCSV(results);
    return;
  }

  const firstPivot = pivot(firstResult.cells);
  const crossSubs = firstPivot.subs.filter((s) => s.label !== "GT");

  // Header rows
  const headerRow1 = ["変数名", "種別", "選択肢", "全体_n", "全体_%"];
  const headerRow2 = ["", "", "", "", ""];
  crossSubs.forEach((sub) => {
    headerRow1.push("");
    headerRow2.push(`${resolveSubLabel(sub.label, layoutMeta)}(n=${sub.n.toFixed(1)})`);
  });

  const rows: string[][] = [headerRow1, headerRow2];

  results.forEach((res) => {
    const { mains, subs, lookup } = pivot(res.cells);
    const resCrossSubs = subs.filter((s) => s.label !== "GT");
    const gtSub = subs.find((s) => s.label === "GT")!;

    mains.forEach((main) => {
      const gtCell = lookup.get(`${main}\0GT`)!;
      const dataRow = [
        res.question,
        res.type,
        resolveMainLabel(main),
        gtCell.count.toFixed(1),
        gtCell.pct.toFixed(1),
      ];
      resCrossSubs.forEach((sub) => {
        const cell = lookup.get(`${main}\0${sub.label}`);
        dataRow.push(cell ? cell.pct.toFixed(1) : "");
      });
      rows.push(dataRow);
    });

    // n row
    const nRow = [res.question, res.type, "n", gtSub.n.toFixed(1), ""];
    resCrossSubs.forEach((sub) => {
      nRow.push(sub.n.toFixed(1));
    });
    rows.push(nRow);
    rows.push([]);
  });

  exportCSV(rows, `cross_result_${today()}.csv`);
}

function exportCSV(rows: string[][], filename: string): void {
  const bom = "\uFEFF";
  const csv =
    bom +
    rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

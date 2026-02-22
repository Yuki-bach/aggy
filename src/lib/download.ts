import type { AggResult } from "./aggregator";
import { pivotCells } from "./aggregator";

export function downloadAllCSV(
  results: AggResult[],
  _weightCol: string
): void {
  const hasCross = results.some((r) => {
    const { subs } = pivotCells(r.cells);
    return subs.length > 1;
  });

  if (hasCross) {
    downloadCrossCSV(results);
  } else {
    downloadGtCSV(results);
  }
}

function downloadGtCSV(results: AggResult[]): void {
  const rows: string[][] = [["変数名", "種別", "選択肢", "件数", "%"]];

  results.forEach((res) => {
    const { mains, lookup } = pivotCells(res.cells);
    const gtSub = pivotCells(res.cells).subs.find((s) => s.label === "GT")!;

    mains.forEach((main) => {
      const cell = lookup.get(`${main}\0GT`)!;
      rows.push([
        res.question,
        res.type,
        main,
        cell.count.toFixed(1),
        cell.pct.toFixed(1),
      ]);
    });
    rows.push([res.question, res.type, "n", gtSub.n.toFixed(1), ""]);
    rows.push([]);
  });

  exportCSV(rows, `gt_result_${today()}.csv`);
}

function downloadCrossCSV(results: AggResult[]): void {
  // 最初の結果からクロス軸構造を取得
  const firstResult = results.find((r) => {
    const { subs } = pivotCells(r.cells);
    return subs.length > 1;
  });
  if (!firstResult) {
    downloadGtCSV(results);
    return;
  }

  const firstPivot = pivotCells(firstResult.cells);
  const crossSubs = firstPivot.subs.filter((s) => s.label !== "GT");

  // ヘッダー行
  const headerRow1 = ["変数名", "種別", "選択肢", "全体_件数", "全体_%"];
  const headerRow2 = ["", "", "", "", ""];
  crossSubs.forEach((sub) => {
    headerRow1.push("");
    headerRow2.push(`${sub.label}(n=${sub.n.toFixed(1)})`);
  });

  const rows: string[][] = [headerRow1, headerRow2];

  results.forEach((res) => {
    const { mains, subs, lookup } = pivotCells(res.cells);
    const resCrossSubs = subs.filter((s) => s.label !== "GT");
    const gtSub = subs.find((s) => s.label === "GT")!;

    mains.forEach((main) => {
      const gtCell = lookup.get(`${main}\0GT`)!;
      const dataRow = [
        res.question,
        res.type,
        main,
        gtCell.count.toFixed(1),
        gtCell.pct.toFixed(1),
      ];
      resCrossSubs.forEach((sub) => {
        const cell = lookup.get(`${main}\0${sub.label}`);
        dataRow.push(cell ? cell.pct.toFixed(1) : "");
      });
      rows.push(dataRow);
    });

    // n行
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
    rows
      .map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");
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

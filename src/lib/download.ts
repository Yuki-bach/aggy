import type { AggResult } from "./aggregator";

export function downloadAllCSV(
  results: AggResult[],
  _weightCol: string
): void {
  const hasCross = results.some((r) => r.cross && r.cross.length > 0);

  if (hasCross) {
    downloadCrossCSV(results);
  } else {
    downloadGtCSV(results);
  }
}

function downloadGtCSV(results: AggResult[]): void {
  const rows: string[][] = [["変数名", "種別", "選択肢", "件数", "%"]];

  results.forEach((res) => {
    res.rows.forEach((row) => {
      rows.push([
        res.col,
        res.type,
        row.label,
        row.count.toFixed(1),
        row.pct.toFixed(1),
      ]);
    });
    rows.push([res.col, res.type, "n", res.n.toFixed(1), ""]);
    rows.push([]);
  });

  exportCSV(rows, `gt_result_${today()}.csv`);
}

function downloadCrossCSV(results: AggResult[]): void {
  // クロス集計全体のヘッダーを動的に構築
  // 最初の cross 構造を使ってヘッダー行を作成
  const firstCross = results.find((r) => r.cross && r.cross.length > 0)?.cross;
  if (!firstCross) {
    downloadGtCSV(results);
    return;
  }

  // ヘッダー行1: 変数名 | 種別 | 選択肢 | 全体_件数 | 全体_% | [cross_col_val_pct...]
  const headerRow1 = ["変数名", "種別", "選択肢", "全体_件数", "全体_%"];
  const headerRow2 = ["", "", "", "", ""];
  firstCross.forEach((section) => {
    section.headers.forEach((h) => {
      headerRow1.push(section.cross_col);
      headerRow2.push(`${h.label}(n=${h.n.toFixed(1)})`);
    });
  });

  const rows: string[][] = [headerRow1, headerRow2];

  results.forEach((res) => {
    const cross = res.cross;
    res.rows.forEach((row, rowIdx) => {
      const dataRow = [
        res.col,
        res.type,
        row.label,
        row.count.toFixed(1),
        row.pct.toFixed(1),
      ];
      if (cross) {
        cross.forEach((section) => {
          const crossRow = section.rows[rowIdx];
          crossRow.cells.forEach((cell) => {
            dataRow.push(cell.pct.toFixed(1));
          });
        });
      }
      rows.push(dataRow);
    });
    // n行
    const nRow = [res.col, res.type, "n", res.n.toFixed(1), ""];
    if (res.cross) {
      res.cross.forEach((section) => {
        section.headers.forEach((h) => {
          nRow.push(h.n.toFixed(1));
        });
      });
    }
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

import type { AggResult } from "./aggregate";

export function downloadAllCSV(
  results: AggResult[],
  _weightCol: string
): void {
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
  a.download = `gt_result_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

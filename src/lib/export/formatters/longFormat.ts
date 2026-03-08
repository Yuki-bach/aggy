import type { Tally } from "../../agg/types";
import { t } from "../../i18n";

/**
 * Convert Tally[] to long-format rows (1 row = 1 cell).
 * Returns header row + data rows.
 */
export function talliesToLongRows(tallies: Tally[]): string[][] {
  const total = t("export.long.total");
  const header = [
    t("export.header.variable"),
    t("export.header.type"),
    t("export.header.option"),
    t("export.long.crossAxis"),
    t("export.long.crossValue"),
    t("export.header.n"),
    t("export.long.count"),
    t("export.header.pct"),
  ];
  const rows: string[][] = [header];

  for (const tally of tallies) {
    const crossAxis = tally.by === null ? total : tally.by.label;

    if (tally.type === "NA") {
      for (const slice of tally.slices) {
        const crossValue = tally.by === null ? total : tally.by.labels[slice.code!];
        const { stats, freq } = slice;
        for (const f of freq) {
          rows.push([
            tally.question,
            "NA",
            String(f.value),
            crossAxis,
            crossValue,
            String(stats.n),
            String(f.count),
            String(stats.n > 0 ? (f.count / stats.n) * 100 : 0),
          ]);
        }
      }
      continue;
    }

    for (const slice of tally.slices) {
      const crossValue = tally.by === null ? total : tally.by.labels[slice.code!];

      for (let i = 0; i < tally.codes.length; i++) {
        const code = tally.codes[i];
        const cell = slice.cells[i];
        rows.push([
          tally.question,
          tally.type,
          tally.labels[code],
          crossAxis,
          crossValue,
          String(slice.n),
          String(cell.count),
          String(cell.pct),
        ]);
      }
    }
  }

  return rows;
}

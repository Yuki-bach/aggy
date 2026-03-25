import type { Tab } from "../../agg/types";
import { t } from "../../i18n.svelte";

/**
 * Convert Tab[] to long-format rows (1 row = 1 cell).
 * Returns header row + data rows.
 */
export function tabsToLongRows(tabs: Tab[]): string[][] {
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

  for (const tab of tabs) {
    const crossAxis = tab.by === null ? total : tab.by.label;

    for (const slice of tab.slices) {
      const crossValue = tab.by === null ? total : tab.by.labels[slice.code!];

      for (let i = 0; i < tab.codes.length; i++) {
        const code = tab.codes[i];
        const cell = slice.cells[i];
        rows.push([
          tab.questionCode,
          tab.type,
          tab.labels[code],
          crossAxis,
          crossValue,
          String(slice.n),
          String(cell.count),
          cell.pct !== null ? String(cell.pct) : "",
        ]);
      }
    }
  }

  return rows;
}

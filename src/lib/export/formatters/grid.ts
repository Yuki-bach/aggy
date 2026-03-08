import type { Tally, CategoricalTally, NumericTally } from "../../agg/types";
import { t } from "../../i18n";

export interface ExportGrid {
  question: string;
  type: "SA" | "MA" | "NA";
  headers: string[][];
  rows: string[][];
}

const NA_STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function buildExportGrids(tallies: Tally[]): ExportGrid[] {
  const hasCross = tallies.some((t) => t.by !== null);
  if (hasCross) {
    return buildCrossGrids(tallies);
  }
  return tallies.filter((t) => t.by === null).map((tally) => buildGtGrid(tally));
}

// ─── Internal ───────────────────────────────────────────────

function resolveLabel(code: string, tally: CategoricalTally): string {
  return tally.labels[code];
}

function buildGtGrid(tally: Tally): ExportGrid {
  if (tally.type === "NA") return buildNaGtGrid(tally);
  return buildCategoricalGtGrid(tally);
}

function buildCategoricalGtGrid(tally: CategoricalTally): ExportGrid {
  const slice = tally.slices[0];
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

  for (let i = 0; i < tally.codes.length; i++) {
    const code = tally.codes[i];
    const cell = slice.cells[i];
    rows.push([
      tally.question,
      tally.type,
      resolveLabel(code, tally),
      cell.count.toFixed(1),
      cell.pct.toFixed(1),
    ]);
  }
  rows.push([tally.question, tally.type, "n", slice.n.toFixed(1), ""]);

  return { question: tally.question, type: tally.type, headers, rows };
}

function buildNaGtGrid(tally: NumericTally): ExportGrid {
  const { stats } = tally.slices[0];
  const headers = [[t("export.header.variable"), t("export.header.type"), t("table.option"), ""]];
  const rows: string[][] = NA_STAT_KEYS.map((key) => [
    tally.question,
    "NA",
    t(`na.stat.${key}`),
    key === "n" ? stats.n.toFixed(1) : stats[key].toFixed(2),
  ]);
  return { question: tally.question, type: "NA", headers, rows };
}

function buildCrossGrids(tallies: Tally[]): ExportGrid[] {
  const firstCross = tallies.find((t) => t.by !== null);
  if (!firstCross) {
    return tallies.filter((t) => t.by === null).map((tally) => buildGtGrid(tally));
  }

  const questionCodes = [...new Set(tallies.map((t) => t.question))];

  // Find first categorical question for shared headers
  const firstCatQCode = questionCodes.find((qc) => {
    const gt = tallies.find((t) => t.question === qc && t.by === null);
    return gt && gt.type !== "NA";
  });

  const crossTalliesForFirst = firstCatQCode
    ? tallies.filter((t) => t.question === firstCatQCode && t.by !== null)
    : [];

  // Build shared 2-row headers for categorical
  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("export.header.option"),
    t("export.header.total.n"),
    t("export.header.total.pct"),
  ];
  const headerRow2 = ["", "", "", "", ""];

  for (const crossTally of crossTalliesForFirst) {
    if (crossTally.type === "NA") continue;
    const axis = crossTally.by!;
    for (const slice of crossTally.slices) {
      headerRow1.push("");
      const sliceLabel = axis.labels[slice.code!];
      headerRow2.push(`${sliceLabel}(n=${slice.n.toFixed(1)})`);
    }
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return questionCodes.map((qCode) => {
    const gtTally = tallies.find((t) => t.question === qCode && t.by === null)!;
    const qCrossTallies = tallies.filter((t) => t.question === qCode && t.by !== null);

    if (gtTally.type === "NA") {
      return buildNaCrossGrid(gtTally, qCrossTallies as NumericTally[]);
    }

    const gtSlice = gtTally.slices[0];
    const rows: string[][] = [];

    for (let i = 0; i < gtTally.codes.length; i++) {
      const code = gtTally.codes[i];
      const gtCell = gtSlice.cells[i];
      const dataRow = [
        gtTally.question,
        gtTally.type,
        resolveLabel(code, gtTally),
        gtCell.count.toFixed(1),
        gtCell.pct.toFixed(1),
      ];
      for (const crossTally of qCrossTallies) {
        if (crossTally.type === "NA") continue;
        for (const slice of crossTally.slices) {
          const cell = slice.cells[i];
          dataRow.push(cell ? cell.pct.toFixed(1) : "");
        }
      }
      rows.push(dataRow);
    }

    const nRow = [gtTally.question, gtTally.type, "n", gtSlice.n.toFixed(1), ""];
    for (const crossTally of qCrossTallies) {
      if (crossTally.type === "NA") continue;
      for (const slice of crossTally.slices) {
        nRow.push(slice.n.toFixed(1));
      }
    }
    rows.push(nRow);

    return { question: gtTally.question, type: gtTally.type, headers: sharedHeaders, rows };
  });
}

function buildNaCrossGrid(gtTally: NumericTally, crossTallies: NumericTally[]): ExportGrid {
  const gtStats = gtTally.slices[0].stats;

  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("table.option"),
    t("table.total"),
  ];
  const headerRow2 = ["", "", "", ""];

  for (const ct of crossTallies) {
    const axis = ct.by!;
    for (const slice of ct.slices) {
      headerRow1.push("");
      headerRow2.push(axis.labels[slice.code!]);
    }
  }

  const rows: string[][] = NA_STAT_KEYS.map((key) => {
    const row = [
      gtTally.question,
      "NA",
      t(`na.stat.${key}`),
      key === "n" ? gtStats.n.toFixed(1) : gtStats[key].toFixed(2),
    ];
    for (const ct of crossTallies) {
      for (const slice of ct.slices) {
        row.push(key === "n" ? slice.stats.n.toFixed(1) : slice.stats[key].toFixed(2));
      }
    }
    return row;
  });

  return { question: gtTally.question, type: "NA", headers: [headerRow1, headerRow2], rows };
}

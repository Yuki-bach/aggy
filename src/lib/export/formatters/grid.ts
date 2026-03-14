import type { QuestionType, Tally } from "../../agg/types";
import { t } from "../../i18n";

export interface ExportGrid {
  questionCode: string;
  type: QuestionType;
  headers: string[][];
  rows: string[][];
}

const NA_STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function buildExportGrids(tallies: Tally[]): ExportGrid[] {
  const hasCross = tallies.some((t) => t.by !== null);
  if (hasCross) {
    return buildCrossGrids(tallies);
  }
  return tallies.filter((t) => t.by === null).map((tally) => buildGrandTotalGrid(tally));
}

// ─── Internal ───────────────────────────────────────────────

function resolveLabel(code: string, tally: Tally): string {
  return tally.labels[code];
}

function buildGrandTotalGrid(tally: Tally): ExportGrid {
  if (tally.type === "NA") return buildNaGrandTotalGrid(tally);
  return buildCategoricalGrandTotalGrid(tally);
}

function buildCategoricalGrandTotalGrid(tally: Tally): ExportGrid {
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
      tally.questionCode,
      tally.type,
      resolveLabel(code, tally),
      cell.count.toFixed(1),
      cell.pct.toFixed(1),
    ]);
  }
  rows.push([tally.questionCode, tally.type, "n", slice.n.toFixed(1), ""]);

  return { questionCode: tally.questionCode, type: tally.type, headers, rows };
}

function buildNaGrandTotalGrid(tally: Tally): ExportGrid {
  const stats = tally.slices[0].stats!;
  const headers = [[t("export.header.variable"), t("export.header.type"), t("table.option"), ""]];
  const rows: string[][] = NA_STAT_KEYS.map((key) => [
    tally.questionCode,
    "NA",
    t(`na.stat.${key}`),
    key === "n" ? stats.n.toFixed(1) : stats[key].toFixed(2),
  ]);
  return { questionCode: tally.questionCode, type: "NA", headers, rows };
}

function buildCrossGrids(tallies: Tally[]): ExportGrid[] {
  const firstCross = tallies.find((t) => t.by !== null);
  if (!firstCross) {
    return tallies.filter((t) => t.by === null).map((tally) => buildGrandTotalGrid(tally));
  }

  const questionCodes = [...new Set(tallies.map((t) => t.questionCode))];

  // Find first categorical question for shared headers
  const firstCatQCode = questionCodes.find((qc) => {
    const grandTotal = tallies.find((t) => t.questionCode === qc && t.by === null);
    return grandTotal && grandTotal.type !== "NA";
  });

  const crossTalliesForFirst = firstCatQCode
    ? tallies.filter((t) => t.questionCode === firstCatQCode && t.by !== null)
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
    const grandTotalTally = tallies.find((t) => t.questionCode === qCode && t.by === null)!;
    const qCrossTallies = tallies.filter((t) => t.questionCode === qCode && t.by !== null);

    if (grandTotalTally.type === "NA") {
      return buildNaGrandTotalCrossGrid(grandTotalTally, qCrossTallies);
    }

    const grandTotalSlice = grandTotalTally.slices[0];
    const rows: string[][] = [];

    for (let i = 0; i < grandTotalTally.codes.length; i++) {
      const code = grandTotalTally.codes[i];
      const grandTotalCell = grandTotalSlice.cells[i];
      const dataRow = [
        grandTotalTally.questionCode,
        grandTotalTally.type,
        resolveLabel(code, grandTotalTally),
        grandTotalCell.count.toFixed(1),
        grandTotalCell.pct.toFixed(1),
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

    const nRow = [
      grandTotalTally.questionCode,
      grandTotalTally.type,
      "n",
      grandTotalSlice.n.toFixed(1),
      "",
    ];
    for (const crossTally of qCrossTallies) {
      if (crossTally.type === "NA") continue;
      for (const slice of crossTally.slices) {
        nRow.push(slice.n.toFixed(1));
      }
    }
    rows.push(nRow);

    return {
      questionCode: grandTotalTally.questionCode,
      type: grandTotalTally.type,
      headers: sharedHeaders,
      rows,
    };
  });
}

function buildNaGrandTotalCrossGrid(grandTotalTally: Tally, crossTallies: Tally[]): ExportGrid {
  const grandTotalStats = grandTotalTally.slices[0].stats!;

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
      grandTotalTally.questionCode,
      "NA",
      t(`na.stat.${key}`),
      key === "n" ? grandTotalStats.n.toFixed(1) : grandTotalStats[key].toFixed(2),
    ];
    for (const ct of crossTallies) {
      for (const slice of ct.slices) {
        row.push(key === "n" ? slice.stats!.n.toFixed(1) : slice.stats![key].toFixed(2));
      }
    }
    return row;
  });

  return {
    questionCode: grandTotalTally.questionCode,
    type: "NA",
    headers: [headerRow1, headerRow2],
    rows,
  };
}

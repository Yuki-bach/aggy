import type { QuestionType, Tally } from "../../agg/types";
import type { MatrixGroup } from "../../layout";
import { t } from "../../i18n";

export interface ExportGrid {
  questionCode: string;
  type: QuestionType;
  headers: string[][];
  rows: string[][];
}

const NA_STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function buildExportGrids(tallies: Tally[], matrixGroups: MatrixGroup[] = []): ExportGrid[] {
  const hasCross = tallies.some((t) => t.by !== null);
  if (hasCross) {
    return buildCrossGrids(tallies);
  }
  return buildGtGrids(tallies, matrixGroups);
}

function buildGtGrids(tallies: Tally[], matrixGroups: MatrixGroup[]): ExportGrid[] {
  const gtTallies = tallies.filter((t) => t.by === null);
  const rendered = new Set<string>();
  const grids: ExportGrid[] = [];

  for (const tally of gtTallies) {
    if (rendered.has(tally.questionCode)) continue;

    const mg = matrixGroups.find((g) => g.questionCodes.includes(tally.questionCode));
    if (mg) {
      for (const qc of mg.questionCodes) rendered.add(qc);
      const childTallies = mg.questionCodes
        .map((qc) => gtTallies.find((t) => t.questionCode === qc))
        .filter((t): t is Tally => t !== undefined);
      grids.push(buildMatrixGtGrid(mg, childTallies));
    } else {
      rendered.add(tally.questionCode);
      grids.push(buildGtGrid(tally));
    }
  }
  return grids;
}

function buildMatrixGtGrid(mg: MatrixGroup, tallies: Tally[]): ExportGrid {
  if (tallies[0].type === "NA") return buildMatrixNaGtGrid(mg, tallies);
  return buildMatrixCategoricalGtGrid(mg, tallies);
}

function buildMatrixCategoricalGtGrid(mg: MatrixGroup, tallies: Tally[]): ExportGrid {
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

  for (const tally of tallies) {
    const slice = tally.slices[0];
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
  }

  return { questionCode: mg.matrixKey, type: tallies[0].type, headers, rows };
}

function buildMatrixNaGtGrid(mg: MatrixGroup, tallies: Tally[]): ExportGrid {
  const headers = [[t("export.header.variable"), t("export.header.type"), t("table.option"), ""]];
  const rows: string[][] = [];

  for (const tally of tallies) {
    const stats = tally.slices[0].stats!;
    for (const key of NA_STAT_KEYS) {
      rows.push([
        tally.questionCode,
        "NA",
        t(`na.stat.${key}`),
        key === "n" ? stats.n.toFixed(1) : stats[key].toFixed(2),
      ]);
    }
  }

  return { questionCode: mg.matrixKey, type: "NA", headers, rows };
}

// ─── Internal ───────────────────────────────────────────────

function resolveLabel(code: string, tally: Tally): string {
  return tally.labels[code];
}

function buildGtGrid(tally: Tally): ExportGrid {
  if (tally.type === "NA") return buildNaGtGrid(tally);
  return buildCategoricalGtGrid(tally);
}

function buildCategoricalGtGrid(tally: Tally): ExportGrid {
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

function buildNaGtGrid(tally: Tally): ExportGrid {
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
    return tallies.filter((t) => t.by === null).map((tally) => buildGtGrid(tally));
  }

  const questionCodes = [...new Set(tallies.map((t) => t.questionCode))];

  // Find first categorical question for shared headers
  const firstCatQCode = questionCodes.find((qc) => {
    const gt = tallies.find((t) => t.questionCode === qc && t.by === null);
    return gt && gt.type !== "NA";
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
    const gtTally = tallies.find((t) => t.questionCode === qCode && t.by === null)!;
    const qCrossTallies = tallies.filter((t) => t.questionCode === qCode && t.by !== null);

    if (gtTally.type === "NA") {
      return buildNaCrossGrid(gtTally, qCrossTallies);
    }

    const gtSlice = gtTally.slices[0];
    const rows: string[][] = [];

    for (let i = 0; i < gtTally.codes.length; i++) {
      const code = gtTally.codes[i];
      const gtCell = gtSlice.cells[i];
      const dataRow = [
        gtTally.questionCode,
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

    const nRow = [gtTally.questionCode, gtTally.type, "n", gtSlice.n.toFixed(1), ""];
    for (const crossTally of qCrossTallies) {
      if (crossTally.type === "NA") continue;
      for (const slice of crossTally.slices) {
        nRow.push(slice.n.toFixed(1));
      }
    }
    rows.push(nRow);

    return { questionCode: gtTally.questionCode, type: gtTally.type, headers: sharedHeaders, rows };
  });
}

function buildNaCrossGrid(gtTally: Tally, crossTallies: Tally[]): ExportGrid {
  const gtStats = gtTally.slices[0].stats!;

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
      gtTally.questionCode,
      "NA",
      t(`na.stat.${key}`),
      key === "n" ? gtStats.n.toFixed(1) : gtStats[key].toFixed(2),
    ];
    for (const ct of crossTallies) {
      for (const slice of ct.slices) {
        row.push(key === "n" ? slice.stats!.n.toFixed(1) : slice.stats![key].toFixed(2));
      }
    }
    return row;
  });

  return {
    questionCode: gtTally.questionCode,
    type: "NA",
    headers: [headerRow1, headerRow2],
    rows,
  };
}

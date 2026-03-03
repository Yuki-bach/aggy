import type { Question, Tally } from "../agg/types";
import { NA_VALUE } from "../agg/sqlHelpers";
import { t } from "../i18n";

export interface ExportGrid {
  question: string;
  type: "SA" | "MA";
  headers: string[][];
  rows: string[][];
}

export function buildExportGrids(tallies: Tally[], questions: Question[]): ExportGrid[] {
  const hasCross = tallies.some((t) => t.by !== "GT");
  if (hasCross) {
    return buildCrossGrids(tallies, questions);
  }
  return tallies.filter((t) => t.by === "GT").map((tally) => buildGtGrid(tally, questions));
}

// ─── Internal ───────────────────────────────────────────────

export function resolveMainLabel(code: string, question: Question): string {
  if (code === NA_VALUE) return t("label.na");
  return question.labels[code] ?? code;
}

function buildGtGrid(tally: Tally, questions: Question[]): ExportGrid {
  const question = questions.find((q) => q.code === tally.question);
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
      resolveMainLabel(code, question!),
      cell.count.toFixed(1),
      cell.pct.toFixed(1),
    ]);
  }
  rows.push([tally.question, tally.type, "n", slice.n.toFixed(1), ""]);

  return { question: tally.question, type: tally.type, headers, rows };
}

function buildCrossGrids(tallies: Tally[], questions: Question[]): ExportGrid[] {
  // Find the first cross tally to build shared headers
  const firstCross = tallies.find((t) => t.by !== "GT");
  if (!firstCross) {
    return tallies.filter((t) => t.by === "GT").map((tally) => buildGtGrid(tally, questions));
  }

  // Collect all cross tallies for header generation
  const questionCodes = [...new Set(tallies.map((t) => t.question))];
  const firstQCode = questionCodes[0];
  const crossTalliesForFirst = tallies.filter((t) => t.question === firstQCode && t.by !== "GT");

  // Build shared 2-row headers
  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("export.header.option"),
    t("export.header.total.n"),
    t("export.header.total.pct"),
  ];
  const headerRow2 = ["", "", "", "", ""];

  for (const crossTally of crossTalliesForFirst) {
    const crossQ = questions.find((q) => q.code === crossTally.by);
    for (const slice of crossTally.slices) {
      headerRow1.push("");
      const sliceLabel = crossQ ? resolveMainLabel(slice.code, crossQ) : slice.code;
      headerRow2.push(`${sliceLabel}(n=${slice.n.toFixed(1)})`);
    }
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return questionCodes.map((qCode) => {
    const question = questions.find((q) => q.code === qCode)!;
    const gtTally = tallies.find((t) => t.question === qCode && t.by === "GT")!;
    const crossTallies = tallies.filter((t) => t.question === qCode && t.by !== "GT");
    const gtSlice = gtTally.slices[0];
    const rows: string[][] = [];

    for (let i = 0; i < gtTally.codes.length; i++) {
      const code = gtTally.codes[i];
      const gtCell = gtSlice.cells[i];
      const dataRow = [
        gtTally.question,
        gtTally.type,
        resolveMainLabel(code, question),
        gtCell.count.toFixed(1),
        gtCell.pct.toFixed(1),
      ];
      for (const crossTally of crossTallies) {
        for (const slice of crossTally.slices) {
          const cell = slice.cells[i];
          dataRow.push(cell ? cell.pct.toFixed(1) : "");
        }
      }
      rows.push(dataRow);
    }

    const nRow = [gtTally.question, gtTally.type, "n", gtSlice.n.toFixed(1), ""];
    for (const crossTally of crossTallies) {
      for (const slice of crossTally.slices) {
        nRow.push(slice.n.toFixed(1));
      }
    }
    rows.push(nRow);

    return { question: gtTally.question, type: gtTally.type, headers: sharedHeaders, rows };
  });
}

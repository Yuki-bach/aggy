import type { QuestionType, Tab } from "../../agg/types";
import { t } from "../../i18n";

export interface ExportGrid {
  questionCode: string;
  type: QuestionType;
  headers: string[][];
  rows: string[][];
}

const NA_STAT_KEYS = ["n", "mean", "median", "sd", "min", "max"] as const;

export function buildExportGrids(tabs: Tab[]): ExportGrid[] {
  const hasCross = tabs.some((tab) => tab.by !== null);
  if (hasCross) {
    return buildCrossGrids(tabs);
  }
  return tabs.filter((tab) => tab.by === null).map((tab) => buildTabGrid(tab));
}

// ─── Internal ───────────────────────────────────────────────

function buildTabGrid(tab: Tab): ExportGrid {
  if (tab.type === "NA") return buildNaTabGrid(tab);
  return buildCategoricalTabGrid(tab);
}

function buildCategoricalTabGrid(tab: Tab): ExportGrid {
  const slice = tab.slices[0];
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

  for (let i = 0; i < tab.codes.length; i++) {
    const code = tab.codes[i];
    const cell = slice.cells[i];
    rows.push([
      tab.questionCode,
      tab.type,
      tab.labels[code],
      cell.count.toFixed(1),
      cell.pct !== null ? cell.pct.toFixed(1) : "",
    ]);
  }
  rows.push([tab.questionCode, tab.type, "n", slice.n.toFixed(1), ""]);

  return { questionCode: tab.questionCode, type: tab.type, headers, rows };
}

function buildNaTabGrid(tab: Tab): ExportGrid {
  const stats = tab.slices[0].stats!;
  const headers = [[t("export.header.variable"), t("export.header.type"), t("table.option"), ""]];
  const rows: string[][] = NA_STAT_KEYS.map((key) => [
    tab.questionCode,
    "NA",
    t(`na.stat.${key}`),
    key === "n" ? stats.n.toFixed(1) : stats[key].toFixed(2),
  ]);
  return { questionCode: tab.questionCode, type: "NA", headers, rows };
}

function buildCrossGrids(tabs: Tab[]): ExportGrid[] {
  const firstCross = tabs.find((tab) => tab.by !== null);
  if (!firstCross) {
    return tabs.filter((tab) => tab.by === null).map((tab) => buildTabGrid(tab));
  }

  const questionCodes = [...new Set(tabs.map((tab) => tab.questionCode))];

  // Find first categorical question for shared headers
  const firstCatQCode = questionCodes.find((qc) => {
    const tabResult = tabs.find((tab) => tab.questionCode === qc && tab.by === null);
    return tabResult && tabResult.type !== "NA";
  });

  const crossTabsForFirst = firstCatQCode
    ? tabs.filter((tab) => tab.questionCode === firstCatQCode && tab.by !== null)
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

  for (const crossTab of crossTabsForFirst) {
    if (crossTab.type === "NA") continue;
    const axis = crossTab.by!;
    for (const slice of crossTab.slices) {
      headerRow1.push("");
      const sliceLabel = axis.labels[slice.code!];
      headerRow2.push(`${sliceLabel}(n=${slice.n.toFixed(1)})`);
    }
  }
  const sharedHeaders = [headerRow1, headerRow2];

  return questionCodes.map((qCode) => {
    const tabResult = tabs.find((tab) => tab.questionCode === qCode && tab.by === null)!;
    const qCrossTabs = tabs.filter((tab) => tab.questionCode === qCode && tab.by !== null);

    if (tabResult.type === "NA") {
      return buildNaTabCrossGrid(tabResult, qCrossTabs);
    }

    const tabSlice = tabResult.slices[0];
    const rows: string[][] = [];

    for (let i = 0; i < tabResult.codes.length; i++) {
      const code = tabResult.codes[i];
      const tabCell = tabSlice.cells[i];
      const dataRow = [
        tabResult.questionCode,
        tabResult.type,
        tabResult.labels[code],
        tabCell.count.toFixed(1),
        tabCell.pct !== null ? tabCell.pct.toFixed(1) : "",
      ];
      for (const crossTab of qCrossTabs) {
        if (crossTab.type === "NA") continue;
        for (const slice of crossTab.slices) {
          const cell = slice.cells[i];
          dataRow.push(cell?.pct !== null ? cell.pct.toFixed(1) : "");
        }
      }
      rows.push(dataRow);
    }

    const nRow = [tabResult.questionCode, tabResult.type, "n", tabSlice.n.toFixed(1), ""];
    for (const crossTab of qCrossTabs) {
      if (crossTab.type === "NA") continue;
      for (const slice of crossTab.slices) {
        nRow.push(slice.n.toFixed(1));
      }
    }
    rows.push(nRow);

    return {
      questionCode: tabResult.questionCode,
      type: tabResult.type,
      headers: sharedHeaders,
      rows,
    };
  });
}

function buildNaTabCrossGrid(tab: Tab, crossTabs: Tab[]): ExportGrid {
  const tabStats = tab.slices[0].stats!;

  const headerRow1 = [
    t("export.header.variable"),
    t("export.header.type"),
    t("table.option"),
    t("table.total"),
  ];
  const headerRow2 = ["", "", "", ""];

  for (const ct of crossTabs) {
    const axis = ct.by!;
    for (const slice of ct.slices) {
      headerRow1.push("");
      headerRow2.push(axis.labels[slice.code!]);
    }
  }

  const rows: string[][] = NA_STAT_KEYS.map((key) => {
    const row = [
      tab.questionCode,
      "NA",
      t(`na.stat.${key}`),
      key === "n" ? tabStats.n.toFixed(1) : tabStats[key].toFixed(2),
    ];
    for (const ct of crossTabs) {
      for (const slice of ct.slices) {
        row.push(key === "n" ? slice.stats!.n.toFixed(1) : slice.stats![key].toFixed(2));
      }
    }
    return row;
  });

  return {
    questionCode: tab.questionCode,
    type: "NA",
    headers: [headerRow1, headerRow2],
    rows,
  };
}

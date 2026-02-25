import type { AggResult, QuestionDef } from "../../lib/agg/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { pivot } from "../../lib/agg/pivot";
import { resolveQuestionLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";
import { t } from "../../lib/i18n";
import { buildToolbar, buildChartOpts } from "./Toolbar";
import { buildGtTable } from "./GtTable";
import { buildCrossTable } from "./CrossTable";
import { showAIBubble } from "./AIBubble";
import { destroyAllCharts, renderChartCard, type GtChartType } from "./ChartRenderer";

// View mode state
type ViewMode = "table" | "chart";
let currentViewMode: ViewMode = "table";
let saChartType: GtChartType = "bar-h";
let maChartType: GtChartType = "bar-h";

// Cached data for re-rendering
let lastResults: AggResult[] | null = null;
let lastWeightCol = "";
let lastRawN = 0;
let lastLayoutMeta: LayoutMeta | undefined;
let lastCrossCols: QuestionDef[] | undefined;

export function renderResults(
  results: AggResult[],
  weightCol: string,
  rawN: number,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  lastResults = results;
  lastWeightCol = weightCol;
  lastRawN = rawN;
  lastLayoutMeta = layoutMeta;
  lastCrossCols = crossCols;

  document.getElementById("empty-state")!.classList.add("hidden");
  const area = document.getElementById("results-area")!;
  area.classList.remove("hidden");
  area.innerHTML = "";

  const hasCross = results.some((r) => {
    const { subs } = pivot(r.cells);
    return subs.length > 1;
  });

  const hdr = buildToolbar(hasCross, results, weightCol, currentViewMode, layoutMeta, {
    onViewModeChange: (mode) => {
      currentViewMode = mode;
      reRender();
    },
    onSaChartTypeChange: (type) => {
      saChartType = type;
      reRender();
    },
    onMaChartTypeChange: (type) => {
      maChartType = type;
      reRender();
    },
  });
  area.appendChild(hdr);

  // Chart type selector (2nd row)
  if (currentViewMode === "chart") {
    const chartOpts = buildChartOpts(saChartType, maChartType, {
      onSaChartTypeChange: (type) => {
        saChartType = type;
        reRender();
      },
      onMaChartTypeChange: (type) => {
        maChartType = type;
        reRender();
      },
    });
    area.appendChild(chartOpts);
  }

  // Render content
  const grid = document.createElement("div");
  area.appendChild(grid);

  if (currentViewMode === "chart") {
    renderChartContent(grid, results, hasCross, layoutMeta, crossCols);
  } else {
    renderTableContent(grid, results, weightCol, hasCross, layoutMeta, crossCols);
  }

  // Generate AI analysis comment asynchronously (non-blocking)
  showAIBubble(results, weightCol, layoutMeta);
}

function reRender(): void {
  if (!lastResults) return;
  renderResults(lastResults, lastWeightCol, lastRawN, lastLayoutMeta, lastCrossCols);
}

// Re-render charts on theme change
const observer = new MutationObserver(() => {
  if (currentViewMode === "chart" && lastResults) {
    reRender();
  }
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

function renderChartContent(
  grid: HTMLDivElement,
  results: AggResult[],
  hasCross: boolean,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  destroyAllCharts();
  grid.className = hasCross ? "charts-grid cross-mode" : "charts-grid";

  results.forEach((res) => {
    const gtType = res.type === "SA" ? saChartType : maChartType;
    const card = renderChartCard(res, gtType, layoutMeta, crossCols);
    grid.appendChild(card);
  });
}

function renderTableContent(
  grid: HTMLDivElement,
  results: AggResult[],
  weightCol: string,
  hasCross: boolean,
  layoutMeta?: LayoutMeta,
  crossCols?: QuestionDef[],
): void {
  destroyAllCharts();
  grid.className = hasCross ? "tables-grid cross-mode" : "tables-grid";

  const allGtCells = results.flatMap((r) => r.cells.filter((c) => c.sub === "GT"));
  const maxPct = Math.max(...allGtCells.map((c) => c.pct), 0);

  results.forEach((res) => {
    const pv = pivot(res.cells);
    const isCross = pv.subs.length > 1;

    const card = document.createElement("div");
    card.className = isCross ? "gt-table-card has-cross" : "gt-table-card";

    const gtSub = pv.subs.find((s) => s.label === "GT")!;
    const nLabel = weightCol
      ? `n=${gtSub.n.toFixed(1)}${t("n.weighted")}`
      : `n=${gtSub.n.toLocaleString()}`;

    const questionLabel = resolveQuestionLabel(res.question, layoutMeta);
    const hasLabel = questionLabel !== res.question;

    card.innerHTML = `
      <div class="gt-table-head">
        <div class="q-header">
          <span class="q-label">${escHtml(questionLabel)}</span>
          ${hasLabel ? `<span class="q-key">${escHtml(res.question)}</span>` : ""}
        </div>
        <span class="q-type">${res.type}</span>
        <span class="q-n">${nLabel}</span>
      </div>
    `;

    if (isCross) {
      card.appendChild(buildCrossTable(res, pv, weightCol, layoutMeta, crossCols));
    } else {
      card.appendChild(buildGtTable(res, pv, weightCol, maxPct, layoutMeta));
    }

    grid.appendChild(card);
  });
}

import { initCsvInput, initLayoutInput } from "./components/leftPane/FileInput";
import { initCrossConfig, getCrossColsSelected } from "./components/leftPane/CrossConfig";
import { renderResults } from "./components/rightPane/ResultView";
import { initDuckDB, loadCSV, runDuckDBAggregation } from "./lib/duckdbBridge";
import {
  parseLayout,
  buildLayoutMeta,
  buildQuestionDefs,
  type Layout,
  type LayoutMeta,
} from "./lib/layout";
import { saveData, loadSaved } from "./lib/opfs";
import { initSavedFiles, refreshList } from "./components/leftPane/SavedFiles";
import { initGettingStarted } from "./components/shared/GettingStarted";
import { initSettings } from "./components/shared/SettingsModal";
import { showProceedButton } from "./components/screens/import/ImportScreen";
import {
  renderDataSummary,
  renderWeightInfo,
} from "./components/screens/aggregation/AggregationScreen";
import { initI18n, onLocaleChange, t } from "./lib/i18n";

// Initialize i18n first (before any UI rendering)
initI18n();

// Currently loaded CSV / Layout data
let currentCsv: { text: string; fileName: string; headers: string[]; rowCount: number } | null =
  null;
let currentLayout: { json: string; fileName: string; meta: LayoutMeta } | null = null;

function switchScreen(screen: "import" | "aggregation"): void {
  const main = document.querySelector("main")!;
  main.dataset.screen = screen;

  const backBtn = document.getElementById("back-btn")!;
  backBtn.classList.toggle("hidden", screen === "import");
}

initSettings();
initGettingStarted();

// Start DuckDB Wasm initialization in the background
initDuckDB().catch(() => {
  // Error already displayed in UI by duckdbBridge
});

// Initialize UI when both CSV and layout are loaded
function initAfterBothLoaded(): void {
  if (!currentCsv || !currentLayout) return;

  const crossCandidates = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
  initCrossConfig(crossCandidates, currentLayout.meta.questionLabels);

  document.getElementById("cross-config-section")!.classList.remove("hidden");
  document.getElementById("run-btn")!.classList.remove("hidden");
  (document.getElementById("run-btn") as HTMLButtonElement).disabled = false;

  showProceedButton();

  updateLoadedInfo();

  renderDataSummary(
    {
      fileName: currentCsv.fileName,
      rowCount: currentCsv.rowCount,
      headers: currentCsv.headers,
    },
    {
      fileName: currentLayout.fileName,
      colCount: Object.keys(currentLayout.meta.colTypes).length,
    },
  );

  const weightCol =
    Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  renderWeightInfo(weightCol);
}

function updateLoadedInfo(): void {
  const el = document.getElementById("loaded-data-info")!;
  if (!currentCsv && !currentLayout) {
    el.classList.add("hidden");
    return;
  }
  const lines: string[] = [];
  if (currentCsv) {
    lines.push(
      t("loaded.csv", {
        name: currentCsv.fileName,
        rows: currentCsv.rowCount.toLocaleString(),
        cols: currentCsv.headers.length,
      }),
    );
  }
  if (currentLayout) {
    lines.push(
      t("loaded.layout", {
        name: currentLayout.fileName,
        count: Object.keys(currentLayout.meta.colTypes).length,
      }),
    );
  }
  el.textContent = lines.join("\n");
  el.classList.remove("hidden");
}

// Re-render locale-sensitive parts when language changes
onLocaleChange(() => {
  updateLoadedInfo();
  if (currentCsv && currentLayout) {
    renderDataSummary(
      {
        fileName: currentCsv.fileName,
        rowCount: currentCsv.rowCount,
        headers: currentCsv.headers,
      },
      {
        fileName: currentLayout.fileName,
        colCount: Object.keys(currentLayout.meta.colTypes).length,
      },
    );
    const weightCol =
      Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
    renderWeightInfo(weightCol);
  }
});

// Auto-save to OPFS when both CSV and layout are loaded
async function trySaveToOPFS(): Promise<void> {
  if (!currentCsv || !currentLayout) return;
  try {
    await saveData(
      currentCsv.fileName,
      currentCsv.text,
      currentLayout.fileName,
      currentLayout.json,
    );
    refreshList();
  } catch (e) {
    console.warn("OPFS save failed:", e);
  }
}

// CSV load handler: load into DuckDB and get headers/rowCount
async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
  try {
    const result = await loadCSV(csvText);
    currentCsv = { text: csvText, fileName, headers: result.headers, rowCount: result.rowCount };

    updateLoadedInfo();
    initAfterBothLoaded();
    trySaveToOPFS();
  } catch (e) {
    showError(t("error.csv.load", { msg: (e as Error).message }));
  }
}

// Layout load handler
function onLayoutLoaded(
  _layout: Layout,
  meta: LayoutMeta,
  fileName: string,
  rawText: string,
): void {
  currentLayout = { json: rawText, fileName, meta };

  updateLoadedInfo();
  initAfterBothLoaded();
  trySaveToOPFS();
}

// Load from saved data (skip OPFS re-save)
async function loadFromSaved(folderId: string): Promise<void> {
  try {
    const { csvText, csvName, layoutJson, layoutName } = await loadSaved(folderId);
    const layout = parseLayout(layoutJson);
    const meta = buildLayoutMeta(layout);
    const result = await loadCSV(csvText);

    currentCsv = {
      text: csvText,
      fileName: csvName,
      headers: result.headers,
      rowCount: result.rowCount,
    };
    currentLayout = { json: layoutJson, fileName: layoutName, meta };

    updateLoadedInfo();
    initAfterBothLoaded();
  } catch (e) {
    showError(t("error.saved.load", { msg: (e as Error).message }));
  }
}

function showError(msg: string): void {
  const el = document.getElementById("error-msg")!;
  if (msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

// Run aggregation
async function runAggregation(): Promise<void> {
  if (!currentCsv || !currentLayout) return;
  showError("");

  // Weight column auto-determined from layout
  const weightCol =
    Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
  const crossCols = getCrossColsSelected();

  try {
    const questions = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
    const results = await runDuckDBAggregation({
      questions,
      weight_col: weightCol,
      cross_cols: crossCols,
    });
    renderResults(results, weightCol, currentCsv.rowCount, currentLayout.meta, crossCols);
  } catch (e) {
    showError(t("error.aggregation", { msg: (e as Error).message }));
    console.error(e);
  }
}

// Tab switching
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".load-tab"));

function activateTab(tab: HTMLButtonElement): void {
  for (const t of tabs) {
    const isActive = t === tab;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", String(isActive));
    t.tabIndex = isActive ? 0 : -1;
  }
  const target = tab.dataset.tab!;
  document.getElementById("tab-file")!.classList.toggle("hidden", target !== "file");
  document.getElementById("tab-saved")!.classList.toggle("hidden", target !== "saved");
  tab.focus();
}

// Set inactive tabs to tabIndex=-1
for (const t of tabs) {
  if (!t.classList.contains("active")) t.tabIndex = -1;
}

for (const tab of tabs) {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (e: KeyboardEvent) => {
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      activateTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      activateTab(tabs[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      activateTab(tabs[tabs.length - 1]);
    }
  });
}

// Event binding
initCsvInput(onCSVLoaded, (msg) => showError(msg));
initLayoutInput(onLayoutLoaded, (msg) => showError(msg));
initSavedFiles(loadFromSaved);

document.getElementById("run-btn")!.addEventListener("click", () => {
  runAggregation().catch((e) => showError(t("error.aggregation", { msg: (e as Error).message })));
});

document.getElementById("proceed-btn")!.addEventListener("click", () => {
  switchScreen("aggregation");
});

document.getElementById("back-btn")!.addEventListener("click", () => {
  switchScreen("import");
});

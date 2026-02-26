import { useEffect, useState } from "preact/hooks";
import { initCsvInput, initLayoutInput } from "./components/leftPane/FileInput";
import { initCrossConfig, getCrossColsSelected } from "./components/leftPane/CrossConfig";
import { renderResultView } from "./components/rightPane/ResultView";
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
  getWeightEnabled,
} from "./components/screens/aggregation/AggregationScreen";
import { onLocaleChange, t } from "./lib/i18n";
import { mountStatusDot } from "./components/shared/StatusDot";

type CsvData = { text: string; fileName: string; headers: string[]; rowCount: number };
type LayoutData = { json: string; fileName: string; meta: LayoutMeta };

// Module-level state (will be converted to useState in later phases)
let currentCsv: CsvData | null = null;
let currentLayout: LayoutData | null = null;

export default function App() {
  const [screen, setScreen] = useState<"import" | "aggregation">("import");
  const [, setTick] = useState(0);

  const isImport = screen === "import";

  // Re-render on locale change
  useEffect(() => {
    onLocaleChange(() => setTick((n) => n + 1));
  }, []);

  // Imperative initialization (runs once after mount)
  useEffect(() => {
    mountStatusDot(document.getElementById("wasm-dot")!);
    initSettings();
    initGettingStarted();

    initDuckDB().catch(() => {});

    function showError(msg: string): void {
      const el = document.getElementById("error-msg")!;
      if (msg) {
        el.textContent = msg;
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }

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
      if (currentCsv) lines.push(currentCsv.fileName);
      if (currentLayout) lines.push(currentLayout.fileName);
      if (currentCsv) {
        lines.push(
          t("summary.rows", {
            rows: currentCsv.rowCount.toLocaleString(),
            cols: currentCsv.headers.length,
          }),
        );
      }
      el.textContent = lines.join("\n");
      el.classList.remove("hidden");
    }

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

    async function onCSVLoaded(csvText: string, fileName: string): Promise<void> {
      try {
        const result = await loadCSV(csvText);
        currentCsv = {
          text: csvText,
          fileName,
          headers: result.headers,
          rowCount: result.rowCount,
        };
        updateLoadedInfo();
        initAfterBothLoaded();
        trySaveToOPFS();
      } catch (e) {
        showError(t("error.csv.load", { msg: (e as Error).message }));
      }
    }

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

    async function runAggregation(): Promise<void> {
      if (!currentCsv || !currentLayout) return;
      showError("");

      const actualWeightCol =
        Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
      const weightCol = getWeightEnabled() ? actualWeightCol : "";
      const crossCols = getCrossColsSelected();

      try {
        const questions = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
        const results = await runDuckDBAggregation({
          questions,
          weight_col: weightCol,
          cross_cols: crossCols,
        });
        renderResultView(results, weightCol, currentCsv.rowCount, currentLayout.meta, crossCols);
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
        t.dataset.active = String(isActive);
        t.setAttribute("aria-selected", String(isActive));
        t.tabIndex = isActive ? 0 : -1;
      }
      const target = tab.dataset.tab!;
      document.getElementById("tab-file")!.classList.toggle("hidden", target !== "file");
      document.getElementById("tab-saved")!.classList.toggle("hidden", target !== "saved");
      tab.focus();
    }

    for (const t of tabs) {
      if (t.dataset.active !== "true") t.tabIndex = -1;
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
      runAggregation().catch((e) =>
        showError(t("error.aggregation", { msg: (e as Error).message })),
      );
    });
  }, []);

  return (
    <div class="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header class="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
        {!isImport && (
          <button
            class="shrink-0 cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-base leading-none text-text-secondary transition-[background,border-color] duration-150 hover:border-border-strong hover:bg-surface2"
            aria-label={t("header.back")}
            onClick={() => setScreen("import")}
          >
            ←
          </button>
        )}
        <h1 class="text-lg font-bold text-text">Aggy</h1>
        <span class="text-xs tracking-[0.08em] text-muted">{t("header.subtitle")}</span>
        <div class="ml-auto flex items-center gap-3">
          <div
            class="flex min-w-40 items-center justify-end gap-2 text-[0.8125rem] text-muted"
            role="status"
            aria-live="polite"
          >
            <div id="wasm-dot"></div>
            <span id="wasm-label" data-i18n="wasm.loading">
              {t("wasm.loading")}
            </span>
          </div>
          <div id="settings-wrapper"></div>
        </div>
      </header>

      {/* Main */}
      <main
        class="grid min-h-0 flex-1 grid-rows-[1fr]"
        style={{ gridTemplateColumns: isImport ? "1fr" : "360px 1fr" }}
      >
        {/* Import Screen */}
        <div
          id="import-screen"
          class={`flex items-center justify-center p-6${isImport ? "" : " hidden"}`}
        >
          <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
            <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>
            <div class="mb-3 flex" role="tablist" aria-label={t("import.tab.label")}>
              <button
                class="load-tab flex-1 cursor-pointer border border-border bg-surface px-0 py-2 text-[0.875rem] font-medium text-text-secondary transition-[background,color,border-color] duration-150 first:rounded-l-sm last:rounded-r-sm last:border-l-0 data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-accent-contrast"
                role="tab"
                aria-selected="true"
                aria-controls="tab-file"
                id="tab-btn-file"
                data-tab="file"
                data-active="true"
              >
                {t("import.tab.file")}
              </button>
              <button
                class="load-tab flex-1 cursor-pointer border border-border bg-surface px-0 py-2 text-[0.875rem] font-medium text-text-secondary transition-[background,color,border-color] duration-150 first:rounded-l-sm last:rounded-r-sm last:border-l-0 data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-accent-contrast"
                role="tab"
                aria-selected="false"
                aria-controls="tab-saved"
                id="tab-btn-saved"
                data-tab="saved"
                data-active="false"
              >
                {t("import.tab.saved")}
              </button>
            </div>
            <div
              class="h-[250px] overflow-y-auto"
              id="tab-file"
              role="tabpanel"
              aria-labelledby="tab-btn-file"
            >
              <div
                class="relative cursor-pointer rounded-lg border-2 border-dashed border-border-strong px-4 py-5 text-center transition-[border-color,background] duration-150 hover:border-accent hover:bg-accent-bg"
                id="csv-dropzone"
                data-accept=".csv"
              >
                <input
                  type="file"
                  id="file-input"
                  accept=".csv"
                  class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div class="dropzone-content pointer-events-none flex flex-col items-center gap-1">
                  <span class="rounded-sm bg-accent-light px-3 py-1 text-[0.8125rem] font-bold tracking-[0.04em] text-accent">
                    {t("dropzone.csv.icon")}
                  </span>
                  <span class="text-[0.875rem] font-medium text-text-secondary">
                    {t("dropzone.csv.text")}
                  </span>
                  <span class="text-xs text-muted">{t("dropzone.csv.hint")}</span>
                </div>
                <div
                  class="dropzone-loaded hidden pointer-events-none flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--color-success-700)]"
                  id="csv-dropzone-loaded"
                ></div>
              </div>
              <div
                class="relative mt-3 cursor-pointer rounded-lg border-2 border-dashed border-border-strong px-4 py-5 text-center transition-[border-color,background] duration-150 hover:border-accent hover:bg-accent-bg"
                id="layout-dropzone"
                data-accept=".json"
              >
                <input
                  type="file"
                  id="layout-file-input"
                  accept=".json"
                  class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div class="dropzone-content pointer-events-none flex flex-col items-center gap-1">
                  <span class="rounded-sm bg-accent-light px-3 py-1 text-[0.8125rem] font-bold tracking-[0.04em] text-accent">
                    {t("dropzone.layout.icon")}
                  </span>
                  <span class="text-[0.875rem] font-medium text-text-secondary">
                    {t("dropzone.layout.text")}
                  </span>
                  <span class="text-xs text-muted">{t("dropzone.layout.hint")}</span>
                </div>
                <div
                  class="dropzone-loaded hidden pointer-events-none flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--color-success-700)]"
                  id="layout-dropzone-loaded"
                ></div>
              </div>
            </div>
            <div
              class="hidden h-[250px] overflow-y-auto"
              id="tab-saved"
              role="tabpanel"
              aria-labelledby="tab-btn-saved"
            >
              <div id="saved-files-list" class="flex flex-col gap-2"></div>
            </div>
            <div
              id="loaded-data-info"
              class="hidden mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-[0.875rem] leading-normal text-text-secondary"
              aria-live="polite"
            ></div>
            <button
              class="hidden mt-5 min-h-12 w-full cursor-pointer rounded-lg border-none bg-accent px-4 py-3 text-base font-bold tracking-[0.02em] text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)]"
              id="proceed-btn"
              onClick={() => setScreen("aggregation")}
            >
              {t("import.proceed")}
            </button>
          </div>
        </div>

        {/* Aggregation: Left Panel */}
        <div
          class={`flex flex-col overflow-hidden border-r border-border bg-surface max-md:max-h-[50vh] max-md:border-b max-md:border-r-0${isImport ? " hidden" : ""}`}
          role="region"
          aria-label={t("section.settings")}
        >
          <section class="shrink-0 border-b border-border p-4" id="data-summary-section">
            <h2 class="mb-3 text-[0.8125rem] font-bold tracking-[0.04em] text-muted">
              {t("section.summary")}
            </h2>
            <div
              id="data-summary"
              class="text-[0.875rem] leading-relaxed text-text-secondary"
            ></div>
          </section>

          <section
            class="hidden flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-4"
            id="cross-config-section"
          >
            <h2 class="mb-3 text-[0.8125rem] font-bold tracking-[0.04em] text-muted">
              {t("section.cross")}
            </h2>
            <div
              class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
              id="cross-col-list"
              role="group"
              aria-label={t("section.cross.label")}
            ></div>
          </section>

          <div
            id="weight-info"
            class="hidden flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 text-[0.875rem] text-text"
          >
            <span id="weight-label"></span>
            <div id="weight-toggle" class="ml-auto flex"></div>
          </div>

          <div
            id="error-msg"
            class="hidden mx-4 shrink-0 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm leading-normal text-danger"
            role="alert"
            aria-live="assertive"
          ></div>

          <button
            class="hidden mx-4 my-4 min-h-12 w-[calc(100%-32px)] shrink-0 cursor-pointer rounded-lg border-none bg-accent text-base font-bold tracking-[0.02em] text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)] disabled:cursor-not-allowed disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-600)]"
            id="run-btn"
            disabled
          >
            {t("run.button")}
          </button>
        </div>

        {/* Aggregation: Right Panel */}
        <div
          class={`overflow-y-auto bg-bg p-6${isImport ? " hidden" : ""}`}
          id="panel-right"
          role="region"
          aria-label={t("section.results")}
        >
          <div
            class="flex h-full flex-col items-center justify-center gap-3 text-muted"
            id="empty-state"
          >
            <span class="text-[2.5rem]" aria-hidden="true">
              ⬛
            </span>
            <p class="text-base">{t("empty.text")}</p>
          </div>
          <div class="hidden" id="results-area" aria-live="polite"></div>
        </div>
      </main>

      {/* Help Button */}
      {isImport && (
        <button
          id="help-btn"
          class="fixed bottom-5 left-5 z-900 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-border-strong bg-surface text-base font-bold text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[background,color,transform] duration-150 hover:scale-[1.08] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
          aria-label={t("help.label")}
        >
          ?
        </button>
      )}

      {/* Getting Started Modal */}
      <div id="getting-started-modal"></div>
    </div>
  );
}

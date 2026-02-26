import { useCallback, useEffect, useState } from "preact/hooks";
import CrossConfig from "./components/leftPane/CrossConfig";
import { renderResultView } from "./components/rightPane/ResultView";
import { initDuckDB, loadCSV, runDuckDBAggregation } from "./lib/duckdbBridge";
import {
  parseLayout,
  buildLayoutMeta,
  buildQuestionDefs,
  type Layout,
  type LayoutMeta,
} from "./lib/layout";
import { questionKey, type QuestionDef } from "./lib/agg/aggregate";
import { saveData, loadSaved } from "./lib/opfs";
import { triggerSavedFilesRefresh } from "./components/leftPane/SavedFiles";
import { initGettingStarted } from "./components/shared/GettingStarted";
import { initSettings } from "./components/shared/SettingsModal";
import ImportScreen from "./components/screens/import/ImportScreen";
import { DataSummary, WeightInfo } from "./components/screens/aggregation/AggregationScreen";
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
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [showProceed, setShowProceed] = useState(false);
  const [loadedInfo, setLoadedInfo] = useState<string | null>(null);

  // Aggregation left panel state
  const [crossQuestions, setCrossQuestions] = useState<QuestionDef[]>([]);
  const [crossLabels, setCrossLabels] = useState<Record<string, string>>({});
  const [crossSelected, setCrossSelected] = useState<Record<string, boolean>>({});
  const [weightCol, setWeightCol] = useState("");
  const [weightEnabled, setWeightEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [dataReady, setDataReady] = useState(false);

  const isImport = screen === "import";

  // Re-render on locale change
  useEffect(() => {
    onLocaleChange(() => setTick((n) => n + 1));
  }, []);

  function updateLoadedInfo(): void {
    if (!currentCsv && !currentLayout) {
      setLoadedInfo(null);
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
    setLoadedInfo(lines.join("\n"));
  }

  function initAfterBothLoaded(): void {
    if (!currentCsv || !currentLayout) return;

    const questions = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
    setCrossQuestions(questions);
    setCrossLabels(currentLayout.meta.questionLabels);
    const selected: Record<string, boolean> = {};
    questions.forEach((q) => (selected[questionKey(q)] = false));
    setCrossSelected(selected);

    const wCol =
      Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
    setWeightCol(wCol);
    if (!wCol) setWeightEnabled(true);

    setDataReady(true);
    setShowProceed(true);
    updateLoadedInfo();
  }

  async function trySaveToOPFS(): Promise<void> {
    if (!currentCsv || !currentLayout) return;
    try {
      await saveData(
        currentCsv.fileName,
        currentCsv.text,
        currentLayout.fileName,
        currentLayout.json,
      );
      triggerSavedFilesRefresh();
    } catch (e) {
      console.warn("OPFS save failed:", e);
    }
  }

  async function runAggregation(): Promise<void> {
    if (!currentCsv || !currentLayout) return;
    setErrorMsg("");

    const actualWeightCol =
      Object.entries(currentLayout.meta.colTypes).find(([, t]) => t === "weight")?.[0] ?? "";
    const wCol = weightEnabled ? actualWeightCol : "";
    const crossCols = crossQuestions.filter((q) => crossSelected[questionKey(q)]);

    try {
      const questions = buildQuestionDefs(currentCsv.headers, currentLayout.meta.colTypes);
      const results = await runDuckDBAggregation({
        questions,
        weight_col: wCol,
        cross_cols: crossCols,
      });
      renderResultView(results, wCol, currentCsv.rowCount, currentLayout.meta, crossCols);
    } catch (e) {
      setErrorMsg(t("error.aggregation", { msg: (e as Error).message }));
      console.error(e);
    }
  }

  const onCsvFile = useCallback(async (csvText: string, fileName: string) => {
    try {
      const result = await loadCSV(csvText);
      currentCsv = {
        text: csvText,
        fileName,
        headers: result.headers,
        rowCount: result.rowCount,
      };
      setCsvFileName(fileName);
      updateLoadedInfo();
      initAfterBothLoaded();
      trySaveToOPFS();
    } catch (e) {
      setErrorMsg(t("error.csv.load", { msg: (e as Error).message }));
    }
  }, []);

  const onLayoutFile = useCallback(
    (_layout: Layout, meta: LayoutMeta, fileName: string, rawText: string) => {
      currentLayout = { json: rawText, fileName, meta };
      setLayoutFileName(fileName);
      updateLoadedInfo();
      initAfterBothLoaded();
      trySaveToOPFS();
    },
    [],
  );

  const onLoadFromSaved = useCallback(async (folderId: string) => {
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

      setCsvFileName(csvName);
      setLayoutFileName(layoutName);
      updateLoadedInfo();
      initAfterBothLoaded();
    } catch (e) {
      setErrorMsg(t("error.saved.load", { msg: (e as Error).message }));
    }
  }, []);

  // Imperative initialization (runs once after mount)
  useEffect(() => {
    mountStatusDot(document.getElementById("wasm-dot")!);
    initSettings();
    initGettingStarted();
    initDuckDB().catch(() => {});
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
        {isImport ? (
          <ImportScreen
            csvFileName={csvFileName}
            layoutFileName={layoutFileName}
            showProceed={showProceed}
            loadedInfo={loadedInfo}
            onCsvFile={onCsvFile}
            onLayoutFile={onLayoutFile}
            onLoadFromSaved={onLoadFromSaved}
            onProceed={() => setScreen("aggregation")}
          />
        ) : (
          <>
            {/* Aggregation: Left Panel */}
            <div
              class="flex flex-col overflow-hidden border-r border-border bg-surface max-md:max-h-[50vh] max-md:border-b max-md:border-r-0"
              role="region"
              aria-label={t("section.settings")}
            >
              {/* Data Summary */}
              {currentCsv && currentLayout && (
                <section class="shrink-0 border-b border-border p-4">
                  <h2 class="mb-3 text-[0.8125rem] font-bold tracking-[0.04em] text-muted">
                    {t("section.summary")}
                  </h2>
                  <div class="text-[0.875rem] leading-relaxed text-text-secondary">
                    <DataSummary
                      csv={{
                        fileName: currentCsv.fileName,
                        rowCount: currentCsv.rowCount,
                        headers: currentCsv.headers,
                      }}
                      layout={{
                        fileName: currentLayout.fileName,
                        colCount: Object.keys(currentLayout.meta.colTypes).length,
                      }}
                    />
                  </div>
                </section>
              )}

              {/* Cross Config */}
              {dataReady && (
                <section class="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-4">
                  <h2 class="mb-3 text-[0.8125rem] font-bold tracking-[0.04em] text-muted">
                    {t("section.cross")}
                  </h2>
                  <div
                    class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
                    role="group"
                    aria-label={t("section.cross.label")}
                  >
                    <CrossConfig
                      questions={crossQuestions}
                      questionLabels={crossLabels}
                      crossSelected={crossSelected}
                      onToggle={(key, checked) =>
                        setCrossSelected((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                </section>
              )}

              {/* Weight Info */}
              {weightCol && (
                <WeightInfo
                  weightCol={weightCol}
                  enabled={weightEnabled}
                  onToggle={setWeightEnabled}
                />
              )}

              {/* Error Message */}
              {errorMsg && (
                <div
                  class="mx-4 shrink-0 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm leading-normal text-danger"
                  role="alert"
                  aria-live="assertive"
                >
                  {errorMsg}
                </div>
              )}

              {/* Run Button */}
              {dataReady && (
                <button
                  class="mx-4 my-4 min-h-12 w-[calc(100%-32px)] shrink-0 cursor-pointer rounded-lg border-none bg-accent text-base font-bold tracking-[0.02em] text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)]"
                  onClick={() => runAggregation()}
                >
                  {t("run.button")}
                </button>
              )}
            </div>

            {/* Aggregation: Right Panel */}
            <div
              class="overflow-y-auto bg-bg p-6"
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
          </>
        )}
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

import { useCallback, useEffect, useState } from "preact/hooks";
import { initDuckDB, loadCSV } from "./lib/duckdbBridge";
import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "./lib/layout";
import { saveData, loadSaved } from "./lib/opfs";
import { triggerSavedFilesRefresh } from "./components/import/SavedFiles";
import { initGettingStarted } from "./components/import/GettingStarted";
import { initSettings } from "./components/header/SettingsModal";
import ImportScreen from "./components/import/ImportScreen";
import AggregationScreen from "./components/aggregation/AggregationScreen";
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

  function checkBothLoaded(): void {
    if (!currentCsv || !currentLayout) return;
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
      checkBothLoaded();
      trySaveToOPFS();
    } catch (e) {
      console.error("CSV load failed:", e);
    }
  }, []);

  const onLayoutFile = useCallback(
    (_layout: Layout, meta: LayoutMeta, fileName: string, rawText: string) => {
      currentLayout = { json: rawText, fileName, meta };
      setLayoutFileName(fileName);
      updateLoadedInfo();
      checkBothLoaded();
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
      checkBothLoaded();
    } catch (e) {
      console.error("Saved data load failed:", e);
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
          currentCsv &&
          currentLayout && <AggregationScreen csv={currentCsv} layout={currentLayout} />
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

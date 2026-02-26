import { useCallback, useEffect, useState } from "preact/hooks";
import { initDuckDB } from "./lib/duckdbBridge";
import { initGettingStarted } from "./components/import/GettingStarted";
import { initTheme } from "./components/header/SettingsModal";
import Header from "./components/Header";
import ImportScreen from "./components/ImportScreen";
import AggregationScreen from "./components/AggregationScreen";
import { onLocaleChange, t } from "./lib/i18n";
import type { CsvData, LayoutData } from "./lib/types";

export default function App() {
  const [screen, setScreen] = useState<"import" | "aggregation">("import");
  const [, setTick] = useState(0);
  const [loadedData, setLoadedData] = useState<{ csv: CsvData; layout: LayoutData } | null>(null);
  const isImport = screen === "import";

  // Re-render on locale change
  useEffect(() => {
    onLocaleChange(() => setTick((n) => n + 1));
  }, []);

  const handleComplete = useCallback((csv: CsvData, layout: LayoutData) => {
    setLoadedData({ csv, layout });
    setScreen("aggregation");
  }, []);

  // Imperative initialization (runs once after mount)
  useEffect(() => {
    initTheme();
    initGettingStarted();
    initDuckDB().catch(() => {});
  }, []);

  return (
    <div class="flex h-screen flex-col overflow-hidden">
      <Header isImport={isImport} onBack={() => setScreen("import")} />

      {/* Main */}
      <main
        class="grid min-h-0 flex-1 grid-rows-[1fr]"
        style={{ gridTemplateColumns: isImport ? "1fr" : "360px 1fr" }}
      >
        {isImport ? (
          <ImportScreen onComplete={handleComplete} />
        ) : (
          loadedData && <AggregationScreen csv={loadedData.csv} layout={loadedData.layout} />
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

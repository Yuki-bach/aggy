import { useCallback, useEffect, useState } from "preact/hooks";
import { initDuckDB } from "./lib/duckdb";
import { initTheme } from "./components/header/SettingsModal";
import Header from "./components/Header";
import ImportScreen from "./components/ImportScreen";
import AggregationScreen from "./components/AggregationScreen";
import { onLocaleChange } from "./lib/i18n";
import type { CsvData, LayoutData } from "./lib/types";

export default function App() {
  const [screen, setScreen] = useState<"import" | "aggregation">("import");
  const [, setTick] = useState(0);
  const [loadedData, setLoadedData] = useState<{
    csv: CsvData;
    layout: LayoutData;
    dateWarnings: string[];
  } | null>(null);
  const isImport = screen === "import";

  // Re-render on locale change
  useEffect(() => {
    onLocaleChange(() => setTick((n) => n + 1));
  }, []);

  const handleComplete = useCallback((csv: CsvData, layout: LayoutData, dateWarnings: string[]) => {
    setLoadedData({ csv, layout, dateWarnings });
    setScreen("aggregation");
  }, []);

  // Imperative initialization (runs once after mount)
  useEffect(() => {
    initTheme();
    initDuckDB().catch(() => {});
  }, []);

  return (
    <div class="flex h-screen flex-col overflow-hidden">
      <Header isImport={isImport} onBack={() => setScreen("import")} />

      {/* Main */}
      <main
        class="grid min-h-0 flex-1 grid-rows-1"
        style={{ gridTemplateColumns: isImport ? "1fr" : "360px 1fr" }}
      >
        {isImport ? (
          <ImportScreen onComplete={handleComplete} />
        ) : (
          loadedData && (
            <AggregationScreen
              csv={loadedData.csv}
              layout={loadedData.layout}
              dateWarnings={loadedData.dateWarnings}
            />
          )
        )}
      </main>
    </div>
  );
}

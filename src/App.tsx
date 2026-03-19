import { useCallback, useEffect, useState } from "preact/hooks";
import { initDuckDB } from "./lib/duckdb";
import { initTheme } from "./components/header/SettingsModal";
import Header from "./components/Header";
import ImportScreen from "./components/ImportScreen";
import AggregationScreen from "./components/AggregationScreen";
import { useLocaleRerender } from "./lib/hooks";
import type { Layout } from "./lib/layout";
import type { RawData, LayoutData } from "./lib/types";

export default function App() {
  const [screen, setScreen] = useState<"import" | "aggregation">("import");
  const [loadedData, setLoadedData] = useState<{
    rawData: RawData;
    layout: LayoutData;
    preparedLayout: Layout;
    dateWarnings: string[];
  } | null>(null);
  const isImport = screen === "import";

  useLocaleRerender();

  const handleComplete = useCallback(
    (rawData: RawData, layout: LayoutData, dateWarnings: string[], preparedLayout: Layout) => {
      setLoadedData({ rawData, layout, preparedLayout, dateWarnings });
      setScreen("aggregation");
    },
    [],
  );

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
              rawData={loadedData.rawData}
              layout={loadedData.layout}
              preparedLayout={loadedData.preparedLayout}
              dateWarnings={loadedData.dateWarnings}
            />
          )
        )}
      </main>
    </div>
  );
}

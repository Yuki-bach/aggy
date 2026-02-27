import { useCallback, useRef, useState } from "preact/hooks";
import { parseLayout, buildLayoutMeta } from "../lib/layout";
import { loadCSV } from "../lib/duckdbBridge";
import { saveData, loadSaved } from "../lib/opfs";
import { t } from "../lib/i18n";

import { TabBar } from "./import/TabBar";
import { FileUploadPanel } from "./import/FileUploadPanel";
import { SavedFilesList, triggerSavedFilesRefresh, useSavedFiles } from "./import/SavedFiles";
import { GettingStartedModal } from "./import/GettingStarted";
import type { CsvData, LayoutData } from "../lib/types";

type Tab = "file" | "saved";

interface ImportScreenProps {
  onComplete: (csv: CsvData, layout: LayoutData) => void;
}

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "file", labelKey: "import.tab.file" },
  { key: "saved", labelKey: "import.tab.saved" },
];

function LoadedInfo({ info }: { info: string | null }) {
  if (!info) return null;

  return (
    <div
      class="mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-[0.875rem] leading-normal text-text-secondary"
      aria-live="polite"
    >
      {info}
    </div>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      class="fixed bottom-5 left-5 z-900 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-border-strong bg-surface text-base font-bold text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[background,color,transform] duration-150 hover:scale-[1.08] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
      aria-label={t("help.label")}
      onClick={onClick}
    >
      ?
    </button>
  );
}

export default function ImportScreen({ onComplete }: ImportScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [showProceed, setShowProceed] = useState(false);
  const [loadedInfo, setLoadedInfo] = useState<string | null>(null);
  const [gsOpen, setGsOpen] = useState(false);

  const csvRef = useRef<CsvData | null>(null);
  const layoutRef = useRef<LayoutData | null>(null);

  const { entries, deleteEntry } = useSavedFiles();

  function updateLoadedInfo(): void {
    const csv = csvRef.current;
    const layout = layoutRef.current;
    if (!csv && !layout) {
      setLoadedInfo(null);
      return;
    }
    const lines: string[] = [];
    if (csv) lines.push(csv.fileName);
    if (layout) lines.push(layout.fileName);
    if (csv) {
      lines.push(
        t("summary.rows", {
          rows: csv.rowCount.toLocaleString(),
          cols: csv.headers.length,
        }),
      );
    }
    setLoadedInfo(lines.join("\n"));
  }

  function checkBothLoaded(): void {
    if (!csvRef.current || !layoutRef.current) return;
    setShowProceed(true);
    updateLoadedInfo();
  }

  async function trySaveToOPFS(): Promise<void> {
    const csv = csvRef.current;
    const layout = layoutRef.current;
    if (!csv || !layout) return;
    try {
      await saveData(csv.fileName, csv.text, layout.fileName, layout.json);
      triggerSavedFilesRefresh();
    } catch (e) {
      console.warn("OPFS save failed:", e);
    }
  }

  const handleCsvFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const result = await loadCSV(text);
      csvRef.current = {
        text,
        fileName: file.name,
        headers: result.headers,
        rowCount: result.rowCount,
      };
      setCsvFileName(file.name);
      updateLoadedInfo();
      checkBothLoaded();
      trySaveToOPFS();
    } catch (e) {
      console.error("CSV load failed:", e);
    }
  }, []);

  const handleLayoutFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const layout = parseLayout(text);
      const meta = buildLayoutMeta(layout);
      layoutRef.current = { json: text, fileName: file.name, meta };
      setLayoutFileName(file.name);
      updateLoadedInfo();
      checkBothLoaded();
      trySaveToOPFS();
    } catch (e) {
      console.error("Layout load failed:", e);
    }
  }, []);

  const handleLoadFromSaved = useCallback(async (folderId: string) => {
    try {
      const { csvText, csvName, layoutJson, layoutName } = await loadSaved(folderId);
      const layout = parseLayout(layoutJson);
      const meta = buildLayoutMeta(layout);
      const result = await loadCSV(csvText);

      csvRef.current = {
        text: csvText,
        fileName: csvName,
        headers: result.headers,
        rowCount: result.rowCount,
      };
      layoutRef.current = { json: layoutJson, fileName: layoutName, meta };

      setCsvFileName(csvName);
      setLayoutFileName(layoutName);
      updateLoadedInfo();
      checkBothLoaded();
    } catch (e) {
      console.error("Saved data load failed:", e);
    }
  }, []);

  function handleProceed(): void {
    if (csvRef.current && layoutRef.current) {
      onComplete(csvRef.current, layoutRef.current);
    }
  }

  return (
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
        <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>

        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as Tab)} />

        {/* File Tab */}
        <div
          class={`h-[250px] overflow-y-auto${activeTab !== "file" ? " hidden" : ""}`}
          id="tab-file"
          role="tabpanel"
          aria-labelledby="tab-btn-file"
        >
          <FileUploadPanel
            csvFileName={csvFileName}
            layoutFileName={layoutFileName}
            onCsvFile={handleCsvFile}
            onLayoutFile={handleLayoutFile}
          />
        </div>

        {/* Saved Tab */}
        <div
          class={`h-[250px] overflow-y-auto${activeTab !== "saved" ? " hidden" : ""}`}
          id="tab-saved"
          role="tabpanel"
          aria-labelledby="tab-btn-saved"
        >
          <div class="flex flex-col gap-2">
            <SavedFilesList
              entries={entries}
              onSelectEntry={handleLoadFromSaved}
              onDeleteEntry={deleteEntry}
            />
          </div>
        </div>

        <LoadedInfo info={loadedInfo} />

        {/* Proceed button */}
        {showProceed && (
          <button
            class="mt-5 min-h-12 w-full cursor-pointer rounded-lg border-none bg-accent px-4 py-3 text-base font-bold tracking-[0.02em] text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)]"
            onClick={handleProceed}
          >
            {t("import.proceed")}
          </button>
        )}
      </div>

      <HelpButton onClick={() => setGsOpen(true)} />

      {/* Getting Started Modal */}
      <GettingStartedModal open={gsOpen} onClose={() => setGsOpen(false)} />
    </div>
  );
}

import { useCallback, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { parseLayout, buildLayoutMeta } from "../../../lib/layout";
import { loadCSV } from "../../../lib/duckdbBridge";
import { saveData, loadSaved } from "../../../lib/opfs";
import { t } from "../../../lib/i18n";
import { Dropzone } from "./Dropzone";
import { SavedFilesList, triggerSavedFilesRefresh, useSavedFiles } from "../../leftPane/SavedFiles";
import type { CsvData, LayoutData } from "../../../lib/types";

type Tab = "file" | "saved";

interface ImportScreenProps {
  onComplete: (csv: CsvData, layout: LayoutData) => void;
}

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "file", labelKey: "import.tab.file" },
  { key: "saved", labelKey: "import.tab.saved" },
];

export default function ImportScreen({ onComplete }: ImportScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [showProceed, setShowProceed] = useState(false);
  const [loadedInfo, setLoadedInfo] = useState<string | null>(null);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  function activateTab(idx: number) {
    setActiveTab(TABS[idx].key);
    tabRefs.current[idx]?.focus();
  }

  function handleTabKeyDown(e: JSX.TargetedKeyboardEvent<HTMLButtonElement>, idx: number) {
    const len = TABS.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      activateTab((idx + 1) % len);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      activateTab((idx - 1 + len) % len);
    } else if (e.key === "Home") {
      e.preventDefault();
      activateTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      activateTab(len - 1);
    }
  }

  return (
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
        <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>

        {/* Tabs */}
        <div class="mb-3 flex" role="tablist" aria-label={t("import.tab.label")}>
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                class="flex-1 cursor-pointer border border-border bg-surface px-0 py-2 text-[0.875rem] font-medium text-text-secondary transition-[background,color,border-color] duration-150 first:rounded-l-sm last:rounded-r-sm last:border-l-0 data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-accent-contrast"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-${tab.key}`}
                data-active={String(isActive)}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* File Tab */}
        <div
          class={`h-[250px] overflow-y-auto${activeTab !== "file" ? " hidden" : ""}`}
          id="tab-file"
          role="tabpanel"
          aria-labelledby="tab-btn-file"
        >
          <Dropzone
            accept=".csv"
            icon={t("dropzone.csv.icon")}
            text={t("dropzone.csv.text")}
            hint={t("dropzone.csv.hint")}
            loadedFileName={csvFileName}
            onFile={handleCsvFile}
          />
          <div class="mt-3">
            <Dropzone
              accept=".json"
              icon={t("dropzone.layout.icon")}
              text={t("dropzone.layout.text")}
              hint={t("dropzone.layout.hint")}
              loadedFileName={layoutFileName}
              onFile={handleLayoutFile}
            />
          </div>
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

        {/* Loaded data info */}
        {loadedInfo && (
          <div
            class="mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-[0.875rem] leading-normal text-text-secondary"
            aria-live="polite"
          >
            {loadedInfo}
          </div>
        )}

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
    </div>
  );
}

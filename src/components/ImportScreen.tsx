import { useCallback, useRef, useState } from "preact/hooks";
import { parseLayout, buildLayoutMeta } from "../lib/layout";
import { loadCSV } from "../lib/duckdbBridge";
import { saveData, loadSaved } from "../lib/opfs";
import { t } from "../lib/i18n";

import { FileUploadPanel } from "./import/FileUploadPanel";
import { SavedFilesList, triggerSavedFilesRefresh, useSavedFiles } from "./import/SavedFiles";
import { GettingStartedModal } from "./import/GettingStarted";
import type { CsvData, LayoutData } from "../lib/types";

interface ImportScreenProps {
  onComplete: (csv: CsvData, layout: LayoutData) => void;
}

const STEPS = [
  { num: 1, labelKey: "import.step.select" },
  { num: 2, labelKey: "import.step.proceed" },
] as const;

function StepIndicator({ bothLoaded }: { bothLoaded: boolean }) {
  return (
    <div class="mb-6 flex items-center justify-center">
      {STEPS.map((step, i) => {
        const isDone = step.num === 1 && bothLoaded;
        const isActive = step.num === 1 ? !bothLoaded : bothLoaded;
        return (
          <div key={step.num} class="flex items-center">
            {i > 0 && <div class={`mx-2 h-px w-8 ${bothLoaded ? "bg-accent" : "bg-border"}`} />}
            <div class="flex items-center gap-2">
              <span
                class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? "bg-accent text-accent-contrast"
                    : isActive
                      ? "border-2 border-accent bg-surface text-accent"
                      : "border-2 border-border bg-surface text-muted"
                }`}
              >
                {isDone ? "\u2713" : step.num}
              </span>
              <span
                class={`text-[0.8125rem] font-medium ${
                  isActive ? "text-text" : isDone ? "text-accent" : "text-muted"
                }`}
              >
                {t(step.labelKey)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadedInfo({ info }: { info: string | null }) {
  if (!info) return null;

  return (
    <div
      class="mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-sm text-text-secondary"
      aria-live="polite"
    >
      {info}
    </div>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      class="fixed bottom-5 left-5 z-900 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-surface font-bold text-text-secondary hover:text-accent"
      aria-label={t("help.label")}
      onClick={onClick}
    >
      ?
    </button>
  );
}

export default function ImportScreen({ onComplete }: ImportScreenProps) {
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [bothLoaded, setBothLoaded] = useState(false);
  const [loadedInfo, setLoadedInfo] = useState<string | null>(null);
  const [gsOpen, setGsOpen] = useState(false);

  const csvRef = useRef<CsvData | null>(null);
  const layoutRef = useRef<LayoutData | null>(null);
  const loadedFromSavedRef = useRef(false);

  const { entries, deleteEntry } = useSavedFiles();

  function updateLoadedInfo(): void {
    const csv = csvRef.current;
    if (csv) {
      setLoadedInfo(
        t("summary.rows", {
          rows: csv.rowCount.toLocaleString(),
          cols: csv.headers.length,
        }),
      );
    } else {
      setLoadedInfo(null);
    }
  }

  function checkBothLoaded(): void {
    if (!csvRef.current || !layoutRef.current) return;
    setBothLoaded(true);
    updateLoadedInfo();
  }

  async function saveToOPFS(): Promise<void> {
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
      loadedFromSavedRef.current = false;
      setCsvFileName(file.name);
      updateLoadedInfo();
      checkBothLoaded();
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
      loadedFromSavedRef.current = false;
      setLayoutFileName(file.name);
      updateLoadedInfo();
      checkBothLoaded();
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

      loadedFromSavedRef.current = true;
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
      if (!loadedFromSavedRef.current) saveToOPFS();
      onComplete(csvRef.current, layoutRef.current);
    }
  }

  return (
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
        <h2 class="mb-5 text-xl font-bold">{t("import.title")}</h2>

        <StepIndicator bothLoaded={bothLoaded} />

        <FileUploadPanel
          csvFileName={csvFileName}
          layoutFileName={layoutFileName}
          onCsvFile={handleCsvFile}
          onLayoutFile={handleLayoutFile}
        />

        <div class="mt-5 border-t border-border pt-4">
          <h3 class="mb-3 text-sm font-bold tracking-[0.04em] text-muted">{t("import.history")}</h3>
          <div class="flex max-h-[160px] flex-col gap-2 overflow-y-auto">
            <SavedFilesList
              entries={entries}
              onSelectEntry={handleLoadFromSaved}
              onDeleteEntry={deleteEntry}
            />
          </div>
        </div>

        <LoadedInfo info={loadedInfo} />

        {bothLoaded && (
          <button
            class="mt-5 w-full cursor-pointer rounded-lg bg-accent px-4 py-3 font-bold text-accent-contrast hover:bg-accent-hover"
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

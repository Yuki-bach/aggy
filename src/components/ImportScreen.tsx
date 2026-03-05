import { lazy, Suspense } from "preact/compat";
import { useCallback, useRef, useState } from "preact/hooks";
import { parseLayout } from "../lib/layout";
import { loadCSV } from "../lib/duckdbBridge";
import { saveData, loadSaved } from "../lib/opfs";
import { t } from "../lib/i18n";

import { FileUploadPanel } from "./import/FileUploadPanel";
import { SavedFilesList, triggerSavedFilesRefresh, useSavedFiles } from "./import/SavedFiles";
import { ValidationStep } from "./import/ValidationStep";
import type { CsvData, LayoutData } from "../lib/types";

const GettingStartedModal = lazy(() =>
  import("./import/GettingStarted").then((m) => ({ default: m.GettingStartedModal })),
);

function formatLoadedInfo(csv: CsvData | null): string | null {
  if (!csv) return null;
  return t("summary.rows", {
    rows: csv.rowCount.toLocaleString(),
    cols: csv.headers.length,
  });
}

interface ImportScreenProps {
  onComplete: (csv: CsvData, layout: LayoutData) => void;
}

const STEPS = [
  { num: 1, labelKey: "import.step.select" },
  { num: 2, labelKey: "import.step.validate" },
  { num: 3, labelKey: "import.step.proceed" },
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div class="mb-6 flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = step.num < currentStep;
        const isActive = step.num === currentStep;
        return (
          <div key={step.num} class="flex items-center">
            {i > 0 && (
              <div
                class={`mx-2 h-px w-8 transition-colors duration-300 ${step.num <= currentStep ? "bg-accent" : "bg-border"}`}
              />
            )}
            <div class="flex items-center gap-2">
              <span
                class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
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
                class={`text-sm font-medium transition-colors duration-300 ${
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
      class="mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-sm leading-normal text-text-secondary"
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
  const [csv, setCsv] = useState<CsvData | null>(null);
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [step, setStep] = useState(1);
  const [gsOpen, setGsOpen] = useState(false);

  const loadedFromSavedRef = useRef(false);
  const opfsPayloadRef = useRef<{
    csvText?: string;
    csvFileName?: string;
    layoutJson?: string;
    layoutFileName?: string;
  }>({});

  const { entries, deleteEntry } = useSavedFiles();

  const bothLoaded = csv !== null && layout !== null;
  const loadedInfo = formatLoadedInfo(csv);

  const handleCsvFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const result = await loadCSV(text);
      opfsPayloadRef.current = { ...opfsPayloadRef.current, csvText: text, csvFileName: file.name };
      setCsv({
        fileName: file.name,
        headers: result.headers,
        rowCount: result.rowCount,
      });
      loadedFromSavedRef.current = false;
    } catch (e) {
      console.error("CSV load failed:", e);
    }
  }, []);

  const handleLayoutFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseLayout(text);
      opfsPayloadRef.current = {
        ...opfsPayloadRef.current,
        layoutJson: text,
        layoutFileName: file.name,
      };
      setLayout({ fileName: file.name, layout: parsed });
      loadedFromSavedRef.current = false;
    } catch (e) {
      console.error("Layout load failed:", e);
    }
  }, []);

  const handleLoadFromSaved = useCallback(async (folderId: string) => {
    try {
      const { csvText, csvName, layoutJson, layoutName } = await loadSaved(folderId);
      const parsed = parseLayout(layoutJson);
      const result = await loadCSV(csvText);

      opfsPayloadRef.current = {
        csvText,
        csvFileName: csvName,
        layoutJson,
        layoutFileName: layoutName,
      };
      setCsv({
        fileName: csvName,
        headers: result.headers,
        rowCount: result.rowCount,
      });
      setLayout({ fileName: layoutName, layout: parsed });
      loadedFromSavedRef.current = true;
    } catch (e) {
      console.error("Saved data load failed:", e);
    }
  }, []);

  function handleGoToValidation(): void {
    if (bothLoaded) setStep(2);
  }

  function handleBackToUpload(): void {
    setStep(1);
  }

  async function handleProceed(): Promise<void> {
    if (!csv || !layout) return;
    const payload = opfsPayloadRef.current;
    if (!loadedFromSavedRef.current && payload.csvText && payload.layoutJson) {
      try {
        await saveData(
          payload.csvFileName!,
          payload.csvText,
          payload.layoutFileName!,
          payload.layoutJson,
        );
        triggerSavedFilesRefresh();
      } catch (e) {
        console.warn("OPFS save failed:", e);
      }
    }
    onComplete(csv, layout);
  }

  return (
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
        <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>

        <StepIndicator currentStep={step} />

        {step === 1 && (
          <>
            <FileUploadPanel
              csvFileName={csv?.fileName ?? null}
              layoutFileName={layout?.fileName ?? null}
              onCsvFile={handleCsvFile}
              onLayoutFile={handleLayoutFile}
            />

            <div class="mt-5 border-t border-border pt-4">
              <h3 class="mb-3 text-sm font-bold tracking-wider text-muted">
                {t("import.history")}
              </h3>
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
                class="mt-5 min-h-12 w-full cursor-pointer rounded-lg border-none bg-accent px-4 py-3 text-base font-bold tracking-wide text-accent-contrast transition-[background] duration-150 hover:bg-accent-hover active:bg-[var(--color-primary-900)]"
                onClick={handleGoToValidation}
              >
                {t("import.step.validate")} →
              </button>
            )}
          </>
        )}

        {step === 2 && csv && layout && (
          <ValidationStep
            csv={csv}
            layout={layout}
            onProceed={handleProceed}
            onBack={handleBackToUpload}
          />
        )}
      </div>

      <HelpButton onClick={() => setGsOpen(true)} />

      {/* Getting Started Modal (lazy-loaded) */}
      {gsOpen && (
        <Suspense fallback={null}>
          <GettingStartedModal open={gsOpen} onClose={() => setGsOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

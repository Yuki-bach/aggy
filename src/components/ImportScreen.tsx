import { lazy, Suspense } from "preact/compat";
import { useCallback, useRef, useState } from "preact/hooks";
import { parseLayoutJson, buildValidLayout, filterLayout } from "../lib/layout";
import { loadCSV, prepareDateLayout } from "../lib/duckdb";
import { saveData, loadSaved } from "../lib/opfs";
import { t } from "../lib/i18n";

import { FileUploadPanel } from "./import/FileUploadPanel";
import { SavedFilesList, triggerSavedFilesRefresh, useSavedFiles } from "./import/SavedFiles";
import { ValidationStep } from "./import/ValidationStep";
import { Button } from "./shared/Button";
import { SectionTitle } from "./shared/SectionTitle";
import { Alert } from "./shared/Alert";
import type { RawData, LayoutData } from "../lib/types";

const GettingStartedModal = lazy(() =>
  import("./import/GettingStarted").then((m) => ({ default: m.GettingStartedModal })),
);

function formatLoadedInfo(rawData: RawData): string {
  return t("summary.rows", {
    rows: rawData.rowCount.toLocaleString(),
    cols: rawData.headers.length,
  });
}

interface ImportScreenProps {
  onComplete: (
    rawData: RawData,
    layout: LayoutData,
    dateWarnings: string[],
    preparedLayout: import("../lib/layout").Layout,
  ) => void;
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
    <Alert variant="info" role="status" class="mt-3 whitespace-pre-line">
      {info}
    </Alert>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      class="fixed bottom-5 left-5 z-900 flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-border-strong bg-surface px-3.5 text-sm font-semibold text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[background,color,transform] duration-150 hover:scale-[1.03] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
      aria-label={t("help.label")}
      onClick={onClick}
    >
      <span class="text-base leading-none">?</span>
      {t("help.button")}
    </button>
  );
}

export default function ImportScreen({ onComplete }: ImportScreenProps) {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [step, setStep] = useState(1);
  const [gsOpen, setGsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadedFromSavedRef = useRef(false);
  const opfsPayloadRef = useRef<{
    rawDataText?: string;
    rawDataFileName?: string;
    layoutJson?: string;
    layoutFileName?: string;
  }>({});

  const { entries, deleteEntry } = useSavedFiles();

  const bothLoaded = rawData !== null && layout !== null;
  const loadedInfo = rawData ? formatLoadedInfo(rawData) : null;

  const handleRawDataFile = useCallback(async (file: File) => {
    try {
      setLoadError(null);
      const text = await file.text();
      const result = await loadCSV(text);
      opfsPayloadRef.current = {
        ...opfsPayloadRef.current,
        rawDataText: text,
        rawDataFileName: file.name,
      };
      setRawData({
        fileName: file.name,
        headers: result.headers,
        rowCount: result.rowCount,
      });
      loadedFromSavedRef.current = false;
    } catch (e) {
      setLoadError(t("error.csv.load", { msg: (e as Error).message }));
    }
  }, []);

  const handleLayoutFile = useCallback(async (file: File) => {
    try {
      setLoadError(null);
      const text = await file.text();
      const rawJson = parseLayoutJson(text);
      opfsPayloadRef.current = {
        ...opfsPayloadRef.current,
        layoutJson: text,
        layoutFileName: file.name,
      };
      setLayout({ fileName: file.name, rawJson });
      loadedFromSavedRef.current = false;
    } catch (e) {
      setLoadError(t("error.layout.load", { msg: (e as Error).message }));
    }
  }, []);

  const handleLoadFromSaved = useCallback(async (folderId: string) => {
    try {
      setLoadError(null);
      const { rawDataText, rawDataName, layoutJson, layoutName } = await loadSaved(folderId);
      const rawJson = parseLayoutJson(layoutJson);
      const result = await loadCSV(rawDataText);

      opfsPayloadRef.current = {
        rawDataText,
        rawDataFileName: rawDataName,
        layoutJson,
        layoutFileName: layoutName,
      };
      setRawData({
        fileName: rawDataName,
        headers: result.headers,
        rowCount: result.rowCount,
      });
      setLayout({ fileName: layoutName, rawJson });
      loadedFromSavedRef.current = true;
    } catch (e) {
      setLoadError(t("error.saved.load", { msg: (e as Error).message }));
    }
  }, []);

  function handleGoToValidation(): void {
    if (bothLoaded) setStep(2);
  }

  function handleBackToUpload(): void {
    setStep(1);
  }

  async function handleProceed(): Promise<void> {
    if (!rawData || !layout) return;
    const payload = opfsPayloadRef.current;
    if (!loadedFromSavedRef.current && payload.rawDataText && payload.layoutJson) {
      try {
        await saveData(
          payload.rawDataFileName!,
          payload.rawDataText,
          payload.layoutFileName!,
          payload.layoutJson,
        );
        triggerSavedFilesRefresh();
      } catch {
        // OPFS save is best-effort
      }
    }
    const validLayout = buildValidLayout(layout.rawJson);
    const filtered = filterLayout(rawData.headers, validLayout);
    const { layout: prepared, warnings } = await prepareDateLayout(filtered);
    onComplete(rawData, layout, warnings, prepared);
  }

  return (
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
        <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>

        <StepIndicator currentStep={step} />

        {step === 1 && (
          <>
            <FileUploadPanel
              rawDataFileName={rawData?.fileName ?? null}
              layoutFileName={layout?.fileName ?? null}
              onRawDataFile={handleRawDataFile}
              onLayoutFile={handleLayoutFile}
            />

            <div class="mt-5 border-t border-border pt-4">
              <SectionTitle>{t("import.history")}</SectionTitle>
              <div class="flex max-h-[160px] flex-col gap-2 overflow-y-auto">
                <SavedFilesList
                  entries={entries}
                  onSelectEntry={handleLoadFromSaved}
                  onDeleteEntry={deleteEntry}
                />
              </div>
            </div>

            <LoadedInfo info={loadedInfo} />

            {loadError && (
              <Alert variant="error" class="mt-3">
                {loadError}
              </Alert>
            )}

            {bothLoaded && (
              <div class="mt-5 w-full">
                <Button variant="primary" size="lg" onClick={handleGoToValidation}>
                  {t("import.step.validate")} →
                </Button>
              </div>
            )}
          </>
        )}

        {step === 2 && rawData && layout && (
          <ValidationStep
            rawData={rawData}
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

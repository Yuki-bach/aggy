import { useCallback, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "../../lib/layout";
import { t } from "../../lib/i18n";
import { Dropzone } from "./Dropzone";
import { SavedFilesList, useSavedFiles } from "./SavedFiles";

type Tab = "file" | "saved";

interface ImportScreenProps {
  csvFileName: string | null;
  layoutFileName: string | null;
  showProceed: boolean;
  loadedInfo: string | null;
  onCsvFile: (csvText: string, fileName: string) => void;
  onLayoutFile: (layout: Layout, meta: LayoutMeta, fileName: string, rawText: string) => void;
  onLoadFromSaved: (folderId: string) => void;
  onProceed: () => void;
}

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "file", labelKey: "import.tab.file" },
  { key: "saved", labelKey: "import.tab.saved" },
];

export default function ImportScreen({
  csvFileName,
  layoutFileName,
  showProceed,
  loadedInfo,
  onCsvFile,
  onLayoutFile,
  onLoadFromSaved,
  onProceed,
}: ImportScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("file");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { entries, deleteEntry } = useSavedFiles();

  const handleCsvFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      onCsvFile(text, file.name);
    },
    [onCsvFile],
  );

  const handleLayoutFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const layout = parseLayout(text);
      const meta = buildLayoutMeta(layout);
      onLayoutFile(layout, meta, file.name, text);
    },
    [onLayoutFile],
  );

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
              onSelectEntry={onLoadFromSaved}
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
            onClick={onProceed}
          >
            {t("import.proceed")}
          </button>
        )}
      </div>
    </div>
  );
}

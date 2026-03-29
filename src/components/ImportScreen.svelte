<script lang="ts">
  import { onMount } from "svelte";
  import { parseLayoutJson, buildValidLayout, filterLayout } from "../lib/layout";
  import { loadCSV, prepareDateLayout, runValidation } from "../lib/duckdb";
  import { saveData, loadSaved } from "../lib/opfs";
  import { t } from "../lib/i18n.svelte";
  import {
    getSavedEntries,
    refreshSavedFiles,
    deleteSavedEntry,
  } from "../lib/savedFilesStore.svelte";

  import FileUploadPanel from "./import/FileUploadPanel.svelte";
  import SavedFiles from "./import/SavedFiles.svelte";
  import ValidationStep from "./import/ValidationStep.svelte";
  import Button from "./shared/Button.svelte";
  import SectionTitle from "./shared/SectionTitle.svelte";
  import Alert from "./shared/Alert.svelte";
  import type { RawData, LayoutData } from "../lib/types";
  import type { Layout } from "../lib/layout";
  import type { Diagnostic } from "../lib/validateRawData";

  interface Props {
    onComplete: (
      rawData: RawData,
      layout: LayoutData,
      dateWarnings: string[],
      preparedLayout: Layout,
    ) => void;
  }

  let { onComplete }: Props = $props();

  let rawData = $state<RawData | null>(null);
  let layout = $state<LayoutData | null>(null);
  let step = $state(1);
  let gsOpen = $state(false);
  let loadError = $state<string | null>(null);
  let validating = $state(false);
  let validationResult = $state<Diagnostic[] | null>(null);
  let validationError = $state<string | null>(null);

  let loadedFromSaved = false;
  let opfsPayload: {
    rawDataText?: string;
    rawDataFileName?: string;
    layoutJson?: string;
    layoutFileName?: string;
  } = {};

  let entries = $derived(getSavedEntries());
  let bothLoaded = $derived(rawData !== null && layout !== null);
  let loadedInfo = $derived(
    rawData
      ? t("summary.rows", {
          rows: rawData.rowCount,
          cols: rawData.headers.length,
        })
      : null,
  );

  onMount(() => {
    void refreshSavedFiles();
  });

  const STEPS = [
    { num: 1, labelKey: "import.step.select" },
    { num: 2, labelKey: "import.step.proceed" },
  ] as const;

  async function handleRawDataFile(file: File) {
    try {
      loadError = null;
      const text = await file.text();
      const result = await loadCSV(text);
      opfsPayload = { ...opfsPayload, rawDataText: text, rawDataFileName: file.name };
      rawData = {
        fileName: file.name,
        headers: result.headers,
        rowCount: result.rowCount,
      };
      loadedFromSaved = false;
    } catch (e) {
      loadError = t("error.csv.load", { msg: (e as Error).message });
    }
  }

  async function handleLayoutFile(file: File) {
    try {
      loadError = null;
      const text = await file.text();
      const rawJson = parseLayoutJson(text);
      opfsPayload = { ...opfsPayload, layoutJson: text, layoutFileName: file.name };
      layout = { fileName: file.name, rawJson };
      loadedFromSaved = false;
    } catch (e) {
      loadError = t("error.layout.load", { msg: (e as Error).message });
    }
  }

  async function handleLoadFromSaved(folderId: string) {
    try {
      loadError = null;
      const data = await loadSaved(folderId);
      const rawJson = parseLayoutJson(data.layoutJson);
      const result = await loadCSV(data.rawDataText);

      opfsPayload = {
        rawDataText: data.rawDataText,
        rawDataFileName: data.rawDataName,
        layoutJson: data.layoutJson,
        layoutFileName: data.layoutName,
      };
      rawData = {
        fileName: data.rawDataName,
        headers: result.headers,
        rowCount: result.rowCount,
      };
      layout = { fileName: data.layoutName, rawJson };
      loadedFromSaved = true;
    } catch (e) {
      loadError = t("error.saved.load", { msg: (e as Error).message });
    }
  }

  async function handleStart() {
    if (!rawData || !layout) return;
    validating = true;
    validationResult = null;
    validationError = null;
    try {
      const diags = await runValidation(layout.rawJson, rawData.headers);
      if (diags.length === 0) {
        await handleProceed();
      } else {
        validationResult = diags;
        step = 2;
      }
    } catch (e) {
      validationError = (e as Error).message;
      step = 2;
    } finally {
      validating = false;
    }
  }

  function handleBackToUpload() {
    step = 1;
  }

  async function handleProceed() {
    if (!rawData || !layout) return;
    if (!loadedFromSaved && opfsPayload.rawDataText && opfsPayload.layoutJson) {
      try {
        await saveData(
          opfsPayload.rawDataFileName!,
          opfsPayload.rawDataText,
          opfsPayload.layoutFileName!,
          opfsPayload.layoutJson,
        );
        await refreshSavedFiles();
      } catch {
        // OPFS save is best-effort
      }
    }
    const validLayout = buildValidLayout(layout.rawJson);
    const filtered = filterLayout(rawData.headers, validLayout);
    const { layout: prepared, warnings } = await prepareDateLayout(filtered);
    onComplete(rawData, layout, warnings, prepared);
  }
</script>

{#snippet StepIndicator(currentStep: number)}
  <div class="mb-6 flex items-center justify-center gap-0">
    {#each STEPS as s, i (s.num)}
      {@const isDone = s.num < currentStep}
      {@const isActive = s.num === currentStep}
      <div class="flex items-center">
        {#if i > 0}
          <div
            class="mx-2 h-px w-8 transition-colors duration-300 {s.num <= currentStep
              ? 'bg-accent'
              : 'bg-border'}"
          ></div>
        {/if}
        <div class="flex items-center gap-2">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 {isDone
              ? 'bg-accent text-accent-contrast'
              : isActive
                ? 'border-2 border-accent bg-surface text-accent'
                : 'border-2 border-border bg-surface text-muted'}"
          >
            {isDone ? "\u2713" : s.num}
          </span>
          <span
            class="text-sm font-medium transition-colors duration-300 {isActive
              ? 'text-text'
              : isDone
                ? 'text-accent'
                : 'text-muted'}"
          >
            {t(s.labelKey)}
          </span>
        </div>
      </div>
    {/each}
  </div>
{/snippet}

<div class="flex items-center justify-center p-6">
  <div class="w-full max-w-[480px] rounded-xl border border-border bg-surface p-8 shadow-md">
    <h2 class="mb-5 text-xl font-bold text-text">{t("import.title")}</h2>

    {@render StepIndicator(step)}

    {#if step === 1}
      <FileUploadPanel
        rawDataFileName={rawData?.fileName ?? null}
        layoutFileName={layout?.fileName ?? null}
        onRawDataFile={handleRawDataFile}
        onLayoutFile={handleLayoutFile}
      />

      <div class="mt-5 border-t border-border pt-4">
        <SectionTitle>{t("import.history")}</SectionTitle>
        <div class="flex max-h-[160px] flex-col gap-2 overflow-y-auto">
          <SavedFiles
            {entries}
            onSelectEntry={handleLoadFromSaved}
            onDeleteEntry={deleteSavedEntry}
          />
        </div>
      </div>

      {#if loadedInfo}
        <Alert variant="info" role="status" class="mt-3 whitespace-pre-line">
          {loadedInfo}
        </Alert>
      {/if}

      {#if loadError}
        <Alert variant="error" class="mt-3">
          {loadError}
        </Alert>
      {/if}

      {#if bothLoaded}
        <div class="mt-5 w-full">
          <Button variant="primary" size="lg" onclick={handleStart} disabled={validating}>
            {#if validating}
              {t("validation.running")}
            {:else}
              {t("import.start")} &rarr;
            {/if}
          </Button>
        </div>
      {/if}
    {:else if step === 2 && rawData && layout}
      <ValidationStep
        {rawData}
        {layout}
        diagnostics={validationResult}
        error={validationError}
        onProceed={handleProceed}
        onBack={handleBackToUpload}
      />
    {/if}
  </div>

  <!-- Help Button -->
  <button
    class="fixed bottom-5 left-5 z-900 flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-border-strong bg-surface px-3.5 text-sm font-semibold text-text-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[background,color,transform] duration-150 hover:scale-[1.03] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
    aria-label={t("help.label")}
    onclick={() => (gsOpen = true)}
  >
    <span class="text-base leading-none">?</span>
    {t("help.button")}
  </button>

  <!-- Getting Started Modal -->
  {#if gsOpen}
    {#await import("./import/GettingStarted.svelte") then { default: GettingStartedModal }}
      <GettingStartedModal open={gsOpen} onClose={() => (gsOpen = false)} />
    {/await}
  {/if}
</div>

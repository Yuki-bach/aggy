<script lang="ts">
  import type { Question, Tab } from "../../lib/agg/types";
  import { t } from "../../lib/i18n.svelte";
  import { clickOutside } from "../../lib/dismiss";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import Alert from "../shared/Alert.svelte";
  import ExportMenu from "./ExportMenu.svelte";
  import { executeExport, type ExportAction } from "../../lib/export/export";
  import type { ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";

  interface Props {
    tabs: Tab[];
    weightCol: string;
    currentViewMode: ViewMode;
    callbacks: ToolbarCallbacks;
    questions: Question[];
    crossSelected: Record<string, boolean>;
    onCrossToggle: (key: string, checked: boolean) => void;
    activeWeightCol: string;
    weightEnabled: boolean;
    onWeightToggle: (on: boolean) => void;
    dateWarnings: string[];
    errorMsg: string;
  }

  let {
    tabs,
    weightCol,
    currentViewMode,
    callbacks,
    questions,
    crossSelected,
    onCrossToggle,
    activeWeightCol,
    weightEnabled,
    onWeightToggle,
    dateWarnings,
    errorMsg,
  }: Props = $props();

  let crossOpen = $state(false);

  let samaQuestions = $derived(questions.filter((q) => q.type !== "NA"));
  let crossCount = $derived(Object.values(crossSelected).filter(Boolean).length);
  let questionCount = $derived(new Set(tabs.map((tab) => tab.questionCode)).size);
  let weightText = $derived(
    activeWeightCol
      ? t("result.weight.applied", { col: activeWeightCol })
      : t("result.weight.none"),
  );
</script>

<div class="mb-4 space-y-3">
  <!-- Main toolbar row -->
  <div class="flex flex-wrap items-center gap-3">
    <h2 class="text-xl font-bold">{t("result.title.tab")}</h2>
    <span class="text-xs text-muted">
      {t("result.meta", { count: questionCount, weight: weightText })}
    </span>

    <div class="ml-auto flex items-center gap-3">
      <!-- Cross-axis dropdown -->
      <div class="relative" {@attach clickOutside({ onClose: () => (crossOpen = false) })}>
        <button
          class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text transition-colors hover:border-accent"
          onclick={() => (crossOpen = !crossOpen)}
        >
          {t("toolbar.crossAxis")}
          {#if crossCount > 0}
            <span
              class="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
            >
              {crossCount}
            </span>
          {/if}
        </button>

        {#if crossOpen}
          <div
            class="absolute right-0 z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg"
          >
            <div class="px-2 pb-2 text-xs font-medium text-muted">
              {t("section.cross.label")}
            </div>
            {#each samaQuestions as q (q.code)}
              {@const typeTag = q.type === "MA" ? " [MA]" : ""}
              {@const hasLabel = q.label !== q.code}
              {@const displayText = hasLabel
                ? `${q.code}: ${q.label}${typeTag}`
                : `${q.code}${typeTag}`}
              <label
                class="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-xs transition-colors hover:bg-surface2"
              >
                <input
                  type="checkbox"
                  class="size-4 cursor-pointer accent-accent"
                  checked={crossSelected[q.code] ?? false}
                  onchange={(e) => {
                    onCrossToggle(q.code, (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="truncate">{displayText}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Weight toggle -->
      {#if weightCol}
        <div class="flex items-center gap-2 text-xs text-text">
          <span class="text-muted">{t("weight.label", { col: weightCol })}</span>
          <ToggleGroup>
            <ToggleButton active={weightEnabled} onclick={() => onWeightToggle(true)}>
              {t("weight.on")}
            </ToggleButton>
            <ToggleButton active={!weightEnabled} onclick={() => onWeightToggle(false)}>
              {t("weight.off")}
            </ToggleButton>
          </ToggleGroup>
        </div>
      {/if}

      <!-- View mode toggle -->
      <ToggleGroup>
        <ToggleButton
          active={currentViewMode === "table"}
          onclick={() => currentViewMode !== "table" && callbacks.onViewModeChange("table")}
        >
          {t("result.view.table")}
        </ToggleButton>
        <ToggleButton
          active={currentViewMode === "chart"}
          onclick={() => currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
        >
          {t("result.view.chart")}
        </ToggleButton>
      </ToggleGroup>

      <!-- Export -->
      <ExportMenu onExport={(action: ExportAction) => executeExport(action, tabs, weightCol)} />
    </div>
  </div>

  <!-- Warnings and errors -->
  {#if dateWarnings.length > 0}
    <Alert variant="warning" role="status">
      {#each dateWarnings as w (w)}
        {@const parts = w.split(":")}
        <p class="text-xs">{t("warn.date.cast", { col: parts[0], count: parts[1] })}</p>
      {/each}
    </Alert>
  {/if}

  {#if errorMsg}
    <Alert variant="error">
      <p class="text-xs">{errorMsg}</p>
    </Alert>
  {/if}
</div>

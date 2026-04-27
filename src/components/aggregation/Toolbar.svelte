<script lang="ts">
  import type { Question, Tab } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import ExportMenu from "./ExportMenu.svelte";
  import AggSettingsPopover from "./AggSettingsPopover.svelte";
  import ViewSettingsPopover from "./ViewSettingsPopover.svelte";
  import { executeExport, type ExportAction } from "../../lib/export/export";
  import type { Basis, ChartOpts, ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";

  interface Props {
    tabs: Tab[];
    weightCol: string;
    currentViewMode: ViewMode;
    currentBasis: Basis;
    hasCross: boolean;
    chartOpts: ChartOpts;
    callbacks: ToolbarCallbacks;
    questions: Question[];
    crossSelected: Record<string, boolean>;
    onCrossToggle: (key: string, checked: boolean) => void;
    weightColumnName: string;
    weightEnabled: boolean;
    onWeightToggle: (on: boolean) => void;
  }

  let {
    tabs,
    weightCol,
    currentViewMode,
    currentBasis,
    hasCross,
    chartOpts,
    callbacks,
    questions,
    crossSelected,
    onCrossToggle,
    weightColumnName,
    weightEnabled,
    onWeightToggle,
  }: Props = $props();

  let questionCount = $derived(new Set(tabs.map((tab) => tab.questionCode)).size);

  let selectedCrossNames = $derived.by(() => {
    const samaQuestions = questions.filter((q) => q.type !== "NA");
    const selected = samaQuestions.filter((q) => crossSelected[q.code]);
    if (selected.length === 0) return "";
    const names = selected.map((q) => (q.label === q.code ? q.code : q.label));
    if (names.length <= 2) return names.join(", ");
    return t("cross.summary", { names: names.slice(0, 2).join(", "), rest: names.length - 2 });
  });

  let weightText = $derived(
    weightColumnName === ""
      ? ""
      : weightCol
        ? t("result.weight.applied")
        : t("result.weight.none"),
  );

  let metaText = $derived.by(() => {
    const parts = [t("result.meta.count", { count: questionCount })];
    if (selectedCrossNames) parts.push(t("result.meta.cross", { names: selectedCrossNames }));
    if (weightText) parts.push(weightText);
    return parts.join(" ・ ");
  });
</script>

<div class="mb-6 flex items-start gap-4">
  <div class="min-w-0 flex-1">
    <h2 class="text-xl font-bold">{t("result.title.tab")}</h2>
    <p class="mt-0.5 text-xs text-muted">{metaText}</p>
  </div>

  <div class="flex shrink-0 items-center gap-2">
    <AggSettingsPopover
      {questions}
      {crossSelected}
      {onCrossToggle}
      {weightColumnName}
      {weightEnabled}
      {onWeightToggle}
    />
    <ViewSettingsPopover
      {currentViewMode}
      {currentBasis}
      {hasCross}
      {chartOpts}
      {callbacks}
    />
    <ExportMenu onExport={(action: ExportAction) => executeExport(action, tabs, weightCol)} />
  </div>
</div>
